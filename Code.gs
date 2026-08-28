// ==========================================
// KURUNJI FUN WORLD - APPS SCRIPT BACKEND
// ==========================================

var SHEET_ID = "1vTdluh04bE1RauMaIzyafInvY51ZEs7P1-d4vq5CwBk";

function sendResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeaders(sheet, expectedHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    return;
  }
  var firstRow = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  if (String(firstRow[0]).indexOf("#") === 0 || firstRow[0] === "") {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function getOrCreateSheet(sheetName, headers) {
  var ss;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch(e) {}
  if (!ss) ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  if (headers && headers.length > 0) ensureHeaders(sheet, headers);
  return sheet;
}

// ------------------------------------------
// SECURITY UTILITIES
// ------------------------------------------
function generateHash(text) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateId(prefix) {
  return prefix + "-" + Math.floor(1000 + Math.random() * 9000);
}

function generateToken() {
  return Utilities.getUuid();
}

function logAdminAction(email, role, action, details) {
  try {
    var sheet = getOrCreateSheet("AdminLogs", ["Timestamp", "Email", "Role", "Action", "Details"]);
    sheet.appendRow([new Date().toISOString(), email, role, action, details]);
  } catch(e) {}
}

function validateToken(token) {
  if (!token) return null;
  var cache = CacheService.getScriptCache();
  var sessionStr = cache.get("SESSION_" + token);
  if (sessionStr) {
    return JSON.parse(sessionStr);
  }
  return null;
}

function checkPermission(role, action) {
  if (role === "SUPER_ADMIN") return true;
  
  if (role === "COUNTER_STAFF" || role === "MANAGER") {
    var allowedPosActions = ["fetchRechargePackages", "processRecharge", "fetchProducts", "fetchWalletDetails", "fetchGroundFloorAttractions", "processMultiGameUsage", "fetchFirstFloorPricing", "processFirstFloorBilling", "fetchOutdoorPricing", "processOutdoorBilling", "fetchCustomerByPhone", "fetchAddons", "processAddonsBilling", "fetchTransactionHistory", "processRefund", "validateQR", "processCheckIn"];
    if (allowedPosActions.indexOf(action) !== -1) return true;
  }
  
  // View-only access
  var readActions = ["fetchWalletHistory", "fetchAdminCoupons", "fetchPointAnalytics", "fetchAdminAnalytics", "fetchAdminFeedbacks", "fetchAdminEnquiries", "fetchStatistics", "fetchCMS", "fetchAttractions", "fetchVRThemes"];

  if (role === "OWNER" && readActions.indexOf(action) !== -1) return true;
  if (role === "OWNER") return false; // OWNER cannot write
  
  // Manager access
  if (role === "MANAGER") {
    var forbidden = ["deleteAttraction", "deleteVRTheme", "updateCMS"]; // Example restrictions
    if (forbidden.indexOf(action) !== -1) return false;
    return true; 
  }
  return false;
}


// ------------------------------------------
// UNIFIED CUSTOMER & ORDER HELPERS
// ------------------------------------------
function findOrCreateCustomer(name, phone, email, city) {
  if (!phone) return ""; // Require phone for matching
  var sheet = getOrCreateSheet("Customers");
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === String(phone)) {
      return rows[i][0]; // Return existing CustomerID
    }
  }
  
  // Not found, create new
  var customerId = "CUST-" + new Date().getTime();
  var timestamp = new Date().toISOString();
  sheet.appendRow([customerId, name || "Walk-in", phone, email || "", city || "", timestamp]);
  return customerId;
}

function createUnifiedOrder(orderData) {
  var timestamp = new Date().toISOString();
  var dateStr = new Date().toLocaleDateString('en-US');
  var timeStr = new Date().toLocaleTimeString('en-US');
  var orderId = orderData.orderPrefix + "-" + new Date().getTime();
  
  var billsSheet = getOrCreateSheet("Bills");
  // "BillID", "BookingID", "Date", "Time", "StaffID", "CustomerID", "Subtotal", "Discount", "CouponCode", "Tax", "Total", "PaymentMethod", "PaymentStatus", "BookingStatus"
  billsSheet.appendRow([
     orderId, 
     orderData.bookingId || "", 
     dateStr, 
     timeStr, 
     orderData.staffId, 
     orderData.customerId, 
     orderData.subtotal, 
     orderData.discount || 0, 
     orderData.coupon || "", 
     0, // Tax
     orderData.total, 
     orderData.paymentMethod, 
     orderData.paymentStatus || "SUCCESS", 
     orderData.bookingStatus || "COMPLETED",
     orderData.adultCount || 0,
     orderData.childCount || 0
  ]);
  
  var billItemsSheet = getOrCreateSheet("BillItems");
  // "BillItemID", "BillID", "ProductID", "ProductName", "Zone", "Floor", "VisitorType", "Quantity", "UnitPrice", "Total"
  for (var i = 0; i < orderData.items.length; i++) {
     var item = orderData.items[i];
     billItemsSheet.appendRow([
        orderId + "-" + (i+1), 
        orderId, 
        item.id, 
        item.name, 
        item.zone, 
        item.zone, 
        item.visitorType || "Mixed", 
        item.qty, 
        item.price, 
        item.total
     ]);
  }
  
  // Record Payment if not points
  if (orderData.paymentMethod !== "WALLET_POINTS" && orderData.total > 0) {
      var paySheet = getOrCreateSheet("Payments");
      var paymentId = "PAY-" + new Date().getTime();
      paySheet.appendRow([paymentId, orderId, orderData.total, orderData.paymentMethod, timestamp, "SUCCESS"]);
  }
  
  return orderId;
}

// ------------------------------------------
// INITIALIZATION
// ------------------------------------------
function initializeSetup() {
  var usersSheet = getOrCreateSheet("AdminUsers", ["Email", "PasswordHash", "Role", "Status", "ResetOTP", "OTPExpiry"]);
  if (usersSheet.getLastRow() <= 1) {
    var defaultHash = generateHash("Admin@2026");
    usersSheet.appendRow(["admin@exmail.com", defaultHash, "SUPER_ADMIN", "ACTIVE", "", ""]);
    usersSheet.appendRow(["owner@exmail.com", defaultHash, "OWNER", "ACTIVE", "", ""]);
    usersSheet.appendRow(["manager@exmail.com", defaultHash, "MANAGER", "ACTIVE", "", ""]);
  }
  getOrCreateSheet("AdminLogs", ["Timestamp", "Email", "Role", "Action", "Details"]);

  getOrCreateSheet("Feedbacks", ["ID", "Date", "Guest Name", "Phone", "Email", "Rating", "Comments", "Status", "VisitType", "Hours", "IndoorRating", "OutdoorRating", "VRRating", "CleanlinessRating", "StaffRating", "ValueRating", "Favorites"]);
  getOrCreateSheet("Enquiries", ["ID", "Date", "Name", "Phone", "Email", "Type", "Message", "Status"]);
  getOrCreateSheet("UpcomingInterest", ["ID", "Date", "Name", "Phone", "Email", "Attraction", "Status"]);
  getOrCreateSheet("Attractions", ["ID", "Name", "Slug", "Type", "Floor", "Category", "Description", "Image", "Video", "Panorama", "Status", "Featured", "DisplayOrder"]);
  getOrCreateSheet("VRThemes", ["ID", "Name", "Image", "Status", "DisplayOrder"]);
  getOrCreateSheet("AdminLogs", ["Timestamp", "Email", "Role", "Action", "Details"]);
  
  var usersSheet = getOrCreateSheet("AdminUsers", ["Email", "PasswordHash", "Role", "Status", "ResetOTP", "OTPExpiry"]);
  if (usersSheet.getLastRow() <= 1) {
    var defaultHash = generateHash("Admin@2026");
    usersSheet.appendRow(["admin@exmail.com", defaultHash, "SUPER_ADMIN", "ACTIVE", "", ""]);
    usersSheet.appendRow(["owner@exmail.com", defaultHash, "OWNER", "ACTIVE", "", ""]);
    usersSheet.appendRow(["manager@exmail.com", defaultHash, "MANAGER", "ACTIVE", "", ""]);
  }


  
  // --- PHASE 1: POS / BILLING / BOOKING ARCHITECTURE ---
  
  var rechargeSheet = getOrCreateSheet("RechargePackages", ["PackageID", "PayAmount", "BasePoints", "BonusPoints", "TotalPoints", "Status", "DisplayOrder", "ValidFrom", "ValidUntil"]);
  if (rechargeSheet.getLastRow() <= 1) {
    var defaultRecharges = [
      ["RP-01", 1000, 1000, 0, 1000, "ACTIVE", 1, "", ""],
      ["RP-02", 1500, 1500, 300, 1800, "ACTIVE", 2, "", ""],
      ["RP-03", 2000, 2000, 500, 2500, "ACTIVE", 3, "", ""],
      ["RP-04", 2500, 2500, 500, 3000, "ACTIVE", 4, "", ""],
      ["RP-05", 3000, 3000, 3000, 6000, "ACTIVE", 5, "", ""],
      ["RP-06", 3500, 3500, 3000, 6500, "ACTIVE", 6, "", ""],
      ["RP-07", 4000, 4000, 4000, 8000, "ACTIVE", 7, "", ""],
      ["RP-08", 5000, 5000, 4500, 9500, "ACTIVE", 8, "", ""],
      ["RP-09", 6000, 6000, 6000, 12000, "ACTIVE", 9, "", ""],
      ["RP-10", 10000, 10000, 10000, 20000, "ACTIVE", 10, "", ""]
    ];
    for (var i = 0; i < defaultRecharges.length; i++) rechargeSheet.appendRow(defaultRecharges[i]);
  }

  var gfSheet = getOrCreateSheet("GroundFloorPricing", ["AttractionID", "Name", "PointsPerPerson", "Status", "Floor", "Type"]);
  if (gfSheet.getLastRow() <= 1) {
    var gfGames = [
      ["GF-01", "VR 360", 200, "ACTIVE", "Ground", "VR"],
      ["GF-02", "Boxer", 100, "ACTIVE", "Ground", "Arcade"],
      ["GF-03", "Massage Chair", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-04", "Play With Me", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-05", "Down the Clown", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-06", "Basketball", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-07", "Pink Love", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-08", "Space Catcher", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-09", "Snail Times", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-10", "Big Boss", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-11", "Passion Blasting", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-12", "Rescue", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-13", "Crazy Ball", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-14", "Wave Riders", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-15", "VR 4 Seater", "", "ACTIVE", "Ground", "VR"],
      ["GF-16", "Ace Shooter", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-17", "Crusin Blast", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-18", "Super Moto", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-19", "Power Hockey", "", "ACTIVE", "Ground", "Arcade"],
      ["GF-20", "Horse Ride", "", "ACTIVE", "Ground", "Arcade"]
    ];
    for (var i = 0; i < gfGames.length; i++) gfSheet.appendRow(gfGames[i]);
  }

  var ffSheet = getOrCreateSheet("FirstFloorPricing", ["PackageID", "Name", "ChildPrice", "AdultPrice", "IncludedActivities", "Status"]);
  if (ffSheet.getLastRow() <= 1) {
    ffSheet.appendRow(["FF-PKG-01", "First Floor Access", 599, 899, "Ball Pool, Trampoline, Ninja", "ACTIVE"]);
  }

  var outdoorSheet = getOrCreateSheet("OutdoorPricing", ["AttractionID", "Name", "Price", "Status"]);
  if (outdoorSheet.getLastRow() <= 1) {
    var outdoorGames = [
      ["OUT-01", "Crazy Roller", "", "ACTIVE"],
      ["OUT-02", "360 Cycle Ride", "", "ACTIVE"],
      ["OUT-03", "Human Gyro 360", "", "ACTIVE"],
      ["OUT-04", "Bull Ride", "", "ACTIVE"],
      ["OUT-05", "Bungee Trampoline", "", "ACTIVE"],
      ["OUT-06", "Zero Gravity", "", "ACTIVE"],
      ["OUT-07", "Rocket Ejecter", "", "ACTIVE"],
      ["OUT-08", "MeltDown", "", "ACTIVE"]
    ];
    for (var i = 0; i < outdoorGames.length; i++) outdoorSheet.appendRow(outdoorGames[i]);
  }

  getOrCreateSheet("Wallets", ["WalletID", "CardNumber", "CustomerID", "BalancePoints", "Status", "CreatedAt", "UpdatedAt"]);
  getOrCreateSheet("WalletTransactions", ["TransactionID", "WalletID", "Type", "ReferenceID", "PointsIn", "PointsOut", "BalanceAfter", "StaffID", "Timestamp", "Notes", "AdultCount", "ChildCount"]);
  
  getOrCreateSheet("Customers", ["CustomerID", "Name", "Mobile", "Email", "City", "CreatedAt"]);
  getOrCreateSheet("Bills", ["BillID", "BookingID", "Date", "Time", "StaffID", "CustomerID", "Subtotal", "Discount", "CouponCode", "Tax", "Total", "PaymentMethod", "PaymentStatus", "BookingStatus"]);
  getOrCreateSheet("BillItems", ["BillItemID", "BillID", "ProductID", "ProductName", "Zone", "Floor", "VisitorType", "Quantity", "UnitPrice", "Total"]);
  getOrCreateSheet("Payments", ["PaymentID", "BillID", "Amount", "Method", "Date", "Status"]);
  
  getOrCreateSheet("Bookings", ["BookingID", "CreatedAt", "VisitDate", "TimeSlot", "CustomerName", "Phone", "Email", "Adults", "Children", "TotalVisitors", "Package", "SelectedExperiences", "SelectedVRThemes", "Coupon", "Amount", "PaymentStatus", "BookingStatus", "QRCode", "Notes"]);
  
  getOrCreateSheet("Coupons", ["CouponCode", "DiscountType", "DiscountValue", "MinOrder", "ValidFrom", "ValidUntil", "MaxUses", "PerCustomer", "ApplicableTo", "CustomerType", "Status"]);
  getOrCreateSheet("CouponRedemptions", ["RedemptionID", "CouponCode", "BookingID", "CustomerID", "DiscountAmount", "Date", "StaffID"]);
  
  getOrCreateSheet("CheckIns", ["CheckInID", "BookingID", "Date", "Time", "StaffID"]);
  getOrCreateSheet("Staff", ["StaffID", "Name", "Role", "Status"]);
  getOrCreateSheet("Shifts", ["ShiftID", "StaffID", "OpenedAt", "ClosedAt", "OpeningCash", "ExpectedCash", "ActualCash", "Difference", "Status"]);


  var cmsSheet = getOrCreateSheet("CMS", ["Key", "Value"]);
  if (cmsSheet.getLastRow() <= 1) {
    var defaultCMS = [
      ["heroTitle", "Experience the Magic of Kurunji"],
      ["heroSubtitle", "Unforgettable adventures await at Kodaikanal's premier amusement park."],
      ["alertBanner", "Special Monsoon Offer: Get 20% off on all online bookings!"],
      ["seoTitle", "Kurunji Fun World | Kodaikanal"],
      ["seoDesc", "The best amusement park in Kodaikanal featuring VR arenas, 4D simulators, and family rides."],
      ["aboutIntro", "Kurunji Fun World brings cutting-edge entertainment to the serene hills of Kodaikanal."],
      ["hours", "Open Daily: 9:00 AM - 8:00 PM"]
    ];
    for (var i = 0; i < defaultCMS.length; i++) {
      cmsSheet.appendRow(defaultCMS[i]);
    }
  }

  var statsSheet = getOrCreateSheet("Statistics", ["Key", "Value"]);
  if (statsSheet.getLastRow() <= 1) {
    statsSheet.appendRow(["visitorsToday", 342]);
    statsSheet.appendRow(["visitorsMonthly", 8450]);
    statsSheet.appendRow(["averageRating", 4.8]);
    statsSheet.appendRow(["totalReviews", 1254]);
    statsSheet.appendRow(["averageHoursSpent", "3.5"]);
    statsSheet.appendRow(["repeatVisitorRate", 28]);
    statsSheet.appendRow(["mostLovedCategory", "VR Arena"]);
  }
}

// ------------------------------------------
// POST HANDLER (Writes)
// ------------------------------------------
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = e.parameter.action;
    if (action === "loginAdmin") {
      var email = data.email;
      var password = data.password;
      var sheet = getOrCreateSheet("AdminUsers", ["Email", "PasswordHash", "Role", "Status", "ResetOTP", "OTPExpiry"]);
      
      // Auto-provision default accounts if empty
      if (sheet.getLastRow() <= 1) {
         var defaultHash = generateHash("Admin@2026");
         sheet.appendRow(["admin@exmail.com", defaultHash, "SUPER_ADMIN", "ACTIVE", "", ""]);
         sheet.appendRow(["manager@exmail.com", defaultHash, "MANAGER", "ACTIVE", "", ""]);
         sheet.appendRow(["staff@exmail.com", defaultHash, "COUNTER_STAFF", "ACTIVE", "", ""]);
      }
      
      // Allow raw password match for staff if they manually added "1234" to the sheet
      var rows = sheet.getDataRange().getValues();
      var hashedPass = generateHash(password);
      
      for (var i = 1; i < rows.length; i++) {
        var rowEmail = rows[i][0];
        var rowPass = rows[i][1];
        var role = rows[i][2];
        var status = rows[i][3];
        
        if (rowEmail === email && status === "ACTIVE") {
           // Allow raw match or hash match
           if (rowPass === hashedPass || rowPass === password) {
               var token = "TKN-" + new Date().getTime() + "-" + Math.floor(Math.random() * 10000);
               var sessionData = { email: email, role: role };
               CacheService.getScriptCache().put("SESSION_" + token, JSON.stringify(sessionData), 21600);
               logAdminAction(email, role, "LOGIN_SUCCESS", "Logged in successfully");
               return sendResponse({ status: "success", token: token, role: role, email: email });
           }
        }
      }
      
      logAdminAction(email || "Unknown", "UNKNOWN", "LOGIN_FAILED", "Invalid credentials");
      return sendResponse({ status: "error", message: "Invalid credentials or inactive account" });
    }

    if (action === "requestOTP") {
      var email = data.email;
      var sheet = getOrCreateSheet("AdminUsers");
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === email) {
          var otp = Math.floor(100000 + Math.random() * 900000).toString();
          var expiry = new Date();
          expiry.setMinutes(expiry.getMinutes() + 15);
          
          sheet.getRange(i + 1, 5).setValue(otp);
          sheet.getRange(i + 1, 6).setValue(expiry.toISOString());
          
          MailApp.sendEmail({
            to: email,
            subject: "Kurunji Fun World - Password Reset OTP",
            body: "Your OTP for password reset is: " + otp + "\n\nThis OTP is valid for 15 minutes."
          });
          logAdminAction(email, rows[i][2], "OTP_REQUESTED", "Password reset OTP sent");
          return sendResponse({ status: "success", message: "OTP sent to email" });
        }
      }
      return sendResponse({ status: "error", message: "Email not found" });
    }

    if (action === "resetPassword") {
      var email = data.email;
      var otp = data.otp;
      var newPassword = data.newPassword;
      var sheet = getOrCreateSheet("AdminUsers");
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === email) {
          var storedOTP = rows[i][4];
          var expiry = new Date(rows[i][5]);
          if (storedOTP == otp && new Date() < expiry) {
            var newHash = generateHash(newPassword);
            sheet.getRange(i + 1, 2).setValue(newHash);
            sheet.getRange(i + 1, 5).setValue(""); // clear OTP
            logAdminAction(email, rows[i][2], "PASSWORD_RESET", "Password successfully reset");
            return sendResponse({ status: "success", message: "Password updated successfully" });
          } else {
            return sendResponse({ status: "error", message: "Invalid or expired OTP" });
          }
        }
      }
      return sendResponse({ status: "error", message: "Email not found" });
    }

    if (action === "logoutAdmin") {
       if (data.token) {
           CacheService.getScriptCache().remove("SESSION_" + data.token);
           return sendResponse({ status: "success" });
       }
    }


    if (action === "processRecharge") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var pkg = data.package;
      var cardNumber = data.cardNumber;
      var timestamp = new Date().toISOString();
      
      var walletsSheet = getOrCreateSheet("Wallets");
      var wRows = walletsSheet.getDataRange().getValues();
      var walletId = null;
      var customerId = null;
      var currentBalance = 0;
      var rowIndex = -1;
      
      for (var i=1; i<wRows.length; i++) {
        if (wRows[i][1] === cardNumber) {
          walletId = wRows[i][0];
          customerId = wRows[i][2];
          currentBalance = parseFloat(wRows[i][3]) || 0;
          rowIndex = i + 1;
          break;
        }
      }
      
      if (!walletId) {
        customerId = findOrCreateCustomer(data.customerName, data.phone, data.email, data.city);
        walletId = "WAL-" + new Date().getTime();
        currentBalance = pkg.TotalPoints;
        walletsSheet.appendRow([walletId, cardNumber, customerId, currentBalance, "ACTIVE", timestamp, timestamp]);
      } else {
        currentBalance += pkg.TotalPoints;
        walletsSheet.getRange(rowIndex, 4).setValue(currentBalance);
        walletsSheet.getRange(rowIndex, 7).setValue(timestamp);
      }
      
      var transId = "TXN-" + new Date().getTime();
      var transSheet = getOrCreateSheet("WalletTransactions");
      transSheet.appendRow([transId, walletId, "RECHARGE", pkg.PackageID, pkg.TotalPoints, 0, currentBalance, session.email, timestamp, "Payment: " + data.paymentMethod, data.adultCount || 0, data.childCount || 0]);
      
      logAdminAction(session.email, session.role, "RECHARGE_CARD", "Card: " + cardNumber + " Amount: " + pkg.PayAmount);
      
      return sendResponse({ 
          status: "success", 
          transaction: transId, 
          balance: currentBalance,
          cardNumber: cardNumber
      });
    }


    if (action === "processMultiGameUsage") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var cardNumber = data.cardNumber;
      var customerId = data.customerId;
      var items = data.items || [];
      
      if (items.length === 0) return sendResponse({ status: "error", message: "No items selected." });
      
      var timestamp = new Date().toISOString();
      var dateStr = new Date().toLocaleDateString('en-US');
      var timeStr = new Date().toLocaleTimeString('en-US');
      
      // Fetch fresh pricing
      var gfSheet = getOrCreateSheet("GroundFloorPricing");
      var gfRows = gfSheet.getDataRange().getValues();
      var validPrices = {};
      for (var i=1; i<gfRows.length; i++) {
        if (gfRows[i][3] === "ACTIVE") {
          validPrices[gfRows[i][0]] = { name: gfRows[i][1], price: parseFloat(gfRows[i][2]) };
        }
      }
      
      var totalCost = 0;
      var validatedItems = [];
      
      for (var i=0; i<items.length; i++) {
         var item = items[i];
         var attrId = item.attractionId;
         var qty = parseInt(item.quantity);
         if (qty <= 0) continue;
         
         var serverPriceInfo = validPrices[attrId];
         if (!serverPriceInfo || isNaN(serverPriceInfo.price)) {
            return sendResponse({ status: "error", message: "Attraction " + (item.name || attrId) + " is not configured." });
         }
         
         var itemCost = serverPriceInfo.price * qty;
         totalCost += itemCost;
         validatedItems.push({
            id: attrId,
            name: serverPriceInfo.name,
            qty: qty,
            price: serverPriceInfo.price,
            total: itemCost
         });
      }
      
      if (totalCost <= 0) return sendResponse({ status: "error", message: "Invalid total cost." });
      
      // Verify Wallet
      var walletsSheet = getOrCreateSheet("Wallets");
      var wRows = walletsSheet.getDataRange().getValues();
      var walletId = null;
      var currentBalance = 0;
      var rowIndex = -1;
      
      for (var i=1; i<wRows.length; i++) {
        if (wRows[i][1] === cardNumber) {
          walletId = wRows[i][0];
          currentBalance = parseFloat(wRows[i][3]) || 0;
          if (wRows[i][4] !== "ACTIVE") return sendResponse({ status: "error", message: "Wallet inactive." });
          rowIndex = i + 1;
          break;
        }
      }
      
      if (!walletId) return sendResponse({ status: "error", message: "Wallet not found." });
      
      if (currentBalance < totalCost) {
         return sendResponse({ 
             status: "error", 
             code: "INSUFFICIENT_FUNDS",
             message: "Insufficient Points", 
             required: totalCost, 
             available: currentBalance 
         });
      }
      
      // Deduct Points
      currentBalance -= totalCost;
      walletsSheet.getRange(rowIndex, 4).setValue(currentBalance);
      walletsSheet.getRange(rowIndex, 7).setValue(timestamp);
      
      // Record Wallet Transaction (Parent)
      var transId = "TXN-" + new Date().getTime();
      var transSheet = getOrCreateSheet("WalletTransactions");
      transSheet.appendRow([transId, walletId, "MULTI_GAME_USAGE", "BILL-LINK", 0, totalCost, currentBalance, session.email, timestamp, validatedItems.length + " games played", data.adultCount || 0, data.childCount || 0]);
      
      // Map validated items for unified order
      for(var i=0; i<validatedItems.length; i++) validatedItems[i].zone = "Ground";
      
      var billId = createUnifiedOrder({
         orderPrefix: "B-GF",
         staffId: session.email,
         customerId: customerId,
         subtotal: totalCost,
         total: totalCost,
         paymentMethod: "WALLET_POINTS",
         items: validatedItems,
         adultCount: data.adultCount || 0,
         childCount: data.childCount || 0
      });
      
      logAdminAction(session.email, session.role, "MULTI_GAME_USAGE", "Bill " + billId + " for " + totalCost + " pts");
      
      return sendResponse({ 
          status: "success", 
          billId: billId,
          transaction: transId,
          balance: currentBalance,
          cost: totalCost
      });
    }


    if (action === "processFirstFloorBilling") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var childQty = parseInt(data.childQty) || 0;
      var adultQty = parseInt(data.adultQty) || 0;
      var paymentMethod = data.paymentMethod || "Cash";
      var customerName = data.customerName || "Walk-in Customer";
      var phone = data.phone || "";
      
      if (childQty <= 0 && adultQty <= 0) {
        return sendResponse({ status: "error", message: "No tickets selected." });
      }
      
      var timestamp = new Date().toISOString();
      var dateStr = new Date().toLocaleDateString('en-US');
      var timeStr = new Date().toLocaleTimeString('en-US');
      
      // Fetch Pricing
      var ffSheet = getOrCreateSheet("FirstFloorPricing");
      var ffRows = ffSheet.getDataRange().getValues();
      var pkgId = "FF-PKG-01", pkgName = "First Floor Access", cPrice = 599, aPrice = 899;
      
      for (var i=1; i<ffRows.length; i++) {
        if (ffRows[i][5] === "ACTIVE") {
          pkgId = ffRows[i][0] || pkgId;
          pkgName = ffRows[i][1] || pkgName;
          cPrice = parseFloat(ffRows[i][2]) || cPrice;
          aPrice = parseFloat(ffRows[i][3]) || aPrice;
          break;
        }
      }
      
      var childTotal = childQty * cPrice;
      var adultTotal = adultQty * aPrice;
      var grandTotal = childTotal + adultTotal;
      
      var customerId = findOrCreateCustomer(customerName, phone, "", "");
      var items = [];
      if (childQty > 0) items.push({ id: pkgId, name: pkgName, zone: "First Floor", visitorType: "Child", qty: childQty, price: cPrice, total: childTotal });
      if (adultQty > 0) items.push({ id: pkgId, name: pkgName, zone: "First Floor", visitorType: "Adult", qty: adultQty, price: aPrice, total: adultTotal });
      
      var billId = createUnifiedOrder({
         orderPrefix: "B-FF",
         staffId: session.email,
         customerId: customerId,
         subtotal: grandTotal,
         total: grandTotal,
         paymentMethod: paymentMethod,
         items: items
      });
      
      logAdminAction(session.email, session.role, "FF_BILLING", "Bill " + billId + " for " + grandTotal + " INR");
      
      return sendResponse({ 
          status: "success", 
          billId: billId,
          total: grandTotal,
          childTotal: childTotal,
          adultTotal: adultTotal
      });
    }


    if (action === "processOutdoorBilling") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var items = data.items || [];
      var paymentMethod = data.paymentMethod || "Cash";
      var customerName = data.customerName || "Walk-in Customer";
      var phone = data.phone || "";
      
      if (items.length === 0) return sendResponse({ status: "error", message: "No items selected." });
      
      var timestamp = new Date().toISOString();
      var dateStr = new Date().toLocaleDateString('en-US');
      var timeStr = new Date().toLocaleTimeString('en-US');
      
      // Fetch fresh pricing
      var outdoorSheet = getOrCreateSheet("OutdoorPricing");
      var oRows = outdoorSheet.getDataRange().getValues();
      var validPrices = {};
      for (var i=1; i<oRows.length; i++) {
        if (oRows[i][3] === "ACTIVE") {
          validPrices[oRows[i][0]] = { name: oRows[i][1], price: parseFloat(oRows[i][2]) };
        }
      }
      
      var totalCost = 0;
      var validatedItems = [];
      
      for (var i=0; i<items.length; i++) {
         var item = items[i];
         var attrId = item.id;
         var qty = parseInt(item.qty);
         if (qty <= 0) continue;
         
         var serverPriceInfo = validPrices[attrId];
         if (!serverPriceInfo || isNaN(serverPriceInfo.price)) {
            return sendResponse({ status: "error", message: "Attraction " + (item.name || attrId) + " is not configured." });
         }
         
         var itemCost = serverPriceInfo.price * qty;
         totalCost += itemCost;
         validatedItems.push({
            id: attrId,
            name: serverPriceInfo.name,
            qty: qty,
            price: serverPriceInfo.price,
            total: itemCost
         });
      }
      
      if (totalCost <= 0) return sendResponse({ status: "error", message: "Invalid total cost." });
      
      var customerId = findOrCreateCustomer(customerName, phone, "", "");
      for(var i=0; i<validatedItems.length; i++) validatedItems[i].zone = "Outdoor";
      
      var billId = createUnifiedOrder({
         orderPrefix: "B-OUT",
         staffId: session.email,
         customerId: customerId,
         subtotal: totalCost,
         total: totalCost,
         paymentMethod: paymentMethod,
         items: validatedItems
      });
      
      logAdminAction(session.email, session.role, "OUTDOOR_BILLING", "Bill " + billId + " for " + totalCost + " INR");
      
      return sendResponse({ 
          status: "success", 
          billId: billId,
          total: totalCost,
          items: validatedItems
      });
    }


    if (action === "processAddonsBilling") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var items = data.items || [];
      var paymentMethod = data.paymentMethod || "Cash";
      var customerName = data.customerName || "Walk-in Customer";
      var phone = data.phone || "";
      
      if (items.length === 0) return sendResponse({ status: "error", message: "No items selected." });
      
      var timestamp = new Date().toISOString();
      var dateStr = new Date().toLocaleDateString('en-US');
      var timeStr = new Date().toLocaleTimeString('en-US');
      
      // Fetch fresh pricing
      var prodSheet = getOrCreateSheet("Products");
      var pRows = prodSheet.getDataRange().getValues();
      var validPrices = {};
      for (var i=1; i<pRows.length; i++) {
        if (pRows[i][5] === "ACTIVE") {
          validPrices[pRows[i][0]] = { name: pRows[i][1], price: parseFloat(pRows[i][3]), taxRate: parseFloat(pRows[i][4]) || 0 };
        }
      }
      
      var subtotal = 0;
      var taxTotal = 0;
      var validatedItems = [];
      
      for (var i=0; i<items.length; i++) {
         var item = items[i];
         var prodId = item.id;
         var qty = parseInt(item.qty);
         if (qty <= 0) continue;
         
         var serverProd = validPrices[prodId];
         if (!serverProd || isNaN(serverProd.price)) {
            return sendResponse({ status: "error", message: "Add-on " + (item.name || prodId) + " is not configured." });
         }
         
         var itemCost = serverProd.price * qty;
         var itemTax = (itemCost * serverProd.taxRate) / 100;
         subtotal += itemCost;
         taxTotal += itemTax;
         
         validatedItems.push({
            id: prodId,
            name: serverProd.name,
            qty: qty,
            price: serverProd.price,
            total: itemCost + itemTax,
            zone: "Add-ons"
         });
      }
      
      var grandTotal = subtotal + taxTotal;
      if (grandTotal <= 0) return sendResponse({ status: "error", message: "Invalid total cost." });
      
      var customerId = findOrCreateCustomer(customerName, phone, "", "");
      
      var billId = createUnifiedOrder({
         orderPrefix: "B-ADD",
         staffId: session.email,
         customerId: customerId,
         subtotal: subtotal,
         total: grandTotal,
         paymentMethod: paymentMethod,
         items: validatedItems
      });
      
      logAdminAction(session.email, session.role, "ADDONS_BILLING", "Bill " + billId + " for " + grandTotal + " INR");
      
      return sendResponse({ 
          status: "success", 
          billId: billId,
          total: grandTotal,
          items: validatedItems
      });
    }


    if (action === "validateQR") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var qr = String(data.qr || "").trim();
      if (!qr) return sendResponse({ status: "error", message: "No QR data provided" });
      
      // Check if it's a Wallet Card
      if (qr.startsWith("WAL-") || qr.length === 10) {
         var wSheet = getOrCreateSheet("Wallets");
         var wRows = wSheet.getDataRange().getValues();
         for (var i = 1; i < wRows.length; i++) {
            if (wRows[i][0] === qr || wRows[i][1] === qr) {
                return sendResponse({
                   status: "success",
                   type: "WALLET",
                   data: {
                      id: wRows[i][0],
                      cardNumber: wRows[i][1],
                      balance: wRows[i][3],
                      walletStatus: wRows[i][4]
                   }
                });
            }
         }
         return sendResponse({ status: "error", message: "Invalid wallet QR" });
      }
      
      // Else it's an Order/Booking (B-FF-, B-OUT-, B-ADD-, BK-)
      var bSheet = getOrCreateSheet("Bills");
      var bRows = bSheet.getDataRange().getValues();
      var orderFound = null;
      var cId = "";
      
      for (var i = 1; i < bRows.length; i++) {
         if (bRows[i][0] === qr) {
            orderFound = {
               orderId: bRows[i][0],
               date: bRows[i][2],
               time: bRows[i][3],
               status: bRows[i][13],
               total: bRows[i][10]
            };
            cId = bRows[i][5];
            break;
         }
      }
      
      if (!orderFound) return sendResponse({ status: "error", message: "Invalid QR Code or Booking not found" });
      
      // Get Items
      var items = [];
      var biSheet = getOrCreateSheet("BillItems");
      var biRows = biSheet.getDataRange().getValues();
      for (var i = 1; i < biRows.length; i++) {
         if (biRows[i][1] === qr) {
            items.push({
               name: biRows[i][3],
                 visitorType: biRows[i][6],
                 qty: biRows[i][7],
                 zone: biRows[i][4]
            });
         }
      }
      
      // Get Customer Name
      var customerName = "Guest";
      if (cId) {
         var cSheet = getOrCreateSheet("Customers");
         var cRows = cSheet.getDataRange().getValues();
         for (var i=1; i<cRows.length; i++) {
             if (cRows[i][0] === cId) { customerName = cRows[i][1]; break; }
         }
      }
      
      orderFound.items = items;
      orderFound.customer = customerName;
      
      return sendResponse({
         status: "success",
         type: "BOOKING",
         data: orderFound
      });
    }
    
    if (action === "processCheckIn") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var orderId = data.orderId;
      var bSheet = getOrCreateSheet("Bills");
      var bRows = bSheet.getDataRange().getValues();
      var rowIndex = -1;
      
      for (var i = 1; i < bRows.length; i++) {
         if (bRows[i][0] === orderId) {
            rowIndex = i + 1;
            break;
         }
      }
      
      if (rowIndex === -1) return sendResponse({ status: "error", message: "Order not found" });
      
      bSheet.getRange(rowIndex, 14).setValue("CHECKED_IN");
      
      var checkInSheet = getOrCreateSheet("CheckIns");
      var cid = "CHK-" + new Date().getTime();
      checkInSheet.appendRow([cid, orderId, new Date().toLocaleDateString('en-US'), new Date().toLocaleTimeString('en-US'), session.email]);
      
      logAdminAction(session.email, session.role, "CHECK_IN", "Checked in Order " + orderId);
      
      return sendResponse({ status: "success", checkInId: cid });
    }


    if (action === "processRefund") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var txnId = data.transactionId;
      var reason = data.reason;
      var authEmail = data.authEmail;
      var authPass = data.authPass;
      
      if (!txnId || !reason || !authEmail || !authPass) {
         return sendResponse({ status: "error", message: "Missing required fields" });
      }
      
      // Validate Admin/Manager Credentials
      var staffSheet = getOrCreateSheet("Staff");
      var staffRows = staffSheet.getDataRange().getValues();
      var isAuthorized = false;
      for (var i = 1; i < staffRows.length; i++) {
         if (staffRows[i][2] === authEmail && staffRows[i][3] === authPass) {
             var role = staffRows[i][4].toUpperCase();
             if (role === "ADMIN" || role === "MANAGER") {
                 isAuthorized = true;
                 break;
             }
         }
      }
      if (!isAuthorized) return sendResponse({ status: "error", message: "Invalid Manager/Admin credentials." });
      
      var refundSheet = getOrCreateSheet("Refunds");
      var d = new Date();
      var rDate = d.toLocaleDateString('en-US');
      var rTime = d.toLocaleTimeString('en-US');
      var refundId = "REF-" + d.getTime();
      
      if (txnId.indexOf("TXN-") === 0) {
          // WalletTransaction
          var wtSheet = getOrCreateSheet("WalletTransactions");
          var wtRows = wtSheet.getDataRange().getValues();
          var foundIndex = -1;
          for (var i = 1; i < wtRows.length; i++) {
             if (wtRows[i][0] === txnId) {
                 foundIndex = i;
                 break;
             }
          }
          if (foundIndex === -1) return sendResponse({ status: "error", message: "Transaction not found." });
          
          var walletId = wtRows[foundIndex][1];
          var pointsUsed = parseFloat(wtRows[foundIndex][5]);
          
          // Re-credit the wallet
          var wSheet = getOrCreateSheet("Wallets");
          var wRows = wSheet.getDataRange().getValues();
          for (var i = 1; i < wRows.length; i++) {
             if (wRows[i][0] === walletId) {
                 var currentBalance = parseFloat(wRows[i][3]) || 0;
                 wSheet.getRange(i + 1, 4).setValue(currentBalance + pointsUsed);
                 break;
             }
          }
          
          // Mark Original as Refunded
          // (Wait, WalletTransactions doesn't have a status column. Let's add it dynamically or just log the refund)
          // We can't safely edit the row if we don't have a status column, but we CAN add a POINT_REVERSAL row.
          
          var revId = "REV-" + d.getTime();
          wtSheet.appendRow([revId, walletId, "POINT_REVERSAL", "", "", -pointsUsed, currentBalance + pointsUsed, authEmail, d.toISOString()]);
          
          refundSheet.appendRow([refundId, rDate, rTime, txnId, 0, pointsUsed, reason, authEmail, session.email]);
          
          return sendResponse({ status: "success", message: "Point reversal processed." });
          
      } else {
          // Bills (First Floor, Outdoor, Addons, Recharges)
          var bSheet = getOrCreateSheet("Bills");
          var bRows = bSheet.getDataRange().getValues();
          var foundIndex = -1;
          for (var i = 1; i < bRows.length; i++) {
             if (bRows[i][0] === txnId) {
                 foundIndex = i + 1;
                 break;
             }
          }
          if (foundIndex === -1) return sendResponse({ status: "error", message: "Transaction not found." });
          
          if (bRows[foundIndex - 1][13] === "REFUNDED") {
              return sendResponse({ status: "error", message: "Already refunded." });
          }
          
          var amt = bRows[foundIndex - 1][10];
          
          // Mark as Refunded
          bSheet.getRange(foundIndex, 14).setValue("REFUNDED");
          
          // If it was a recharge, ideally we should debit the wallet, but typically cash refunds on wallets are messy. 
          // For now, we just mark the bill as refunded and log it.
          
          refundSheet.appendRow([refundId, rDate, rTime, txnId, amt, 0, reason, authEmail, session.email]);
          
          return sendResponse({ status: "success", message: "Refund processed." });
      }
    }


    if (action === "getShiftStatus") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var sSheet = getOrCreateSheet("Shifts");
      var sRows = sSheet.getDataRange().getValues();
      var activeShift = null;
      var activeRowIndex = -1;
      
      for (var i = sRows.length - 1; i > 0; i--) {
          if (sRows[i][1] === session.email && sRows[i][10] === "OPEN") {
              activeShift = {
                  id: sRows[i][0],
                  staff: sRows[i][1],
                  startTime: sRows[i][2],
                  openingCash: parseFloat(sRows[i][4]) || 0
              };
              activeRowIndex = i + 1;
              break;
          }
      }
      
      if (!activeShift) {
          return sendResponse({ status: "success", shift: null });
      }
      
      // Calculate live totals
      var bSheet = getOrCreateSheet("Bills");
      var bRows = bSheet.getDataRange().getValues();
      
      var totals = {
          cash: 0,
          upi: 0,
          card: 0,
          recharges: 0,
          directSales: 0,
          refunds: 0,
          coupons: 0
      };
      
      var shiftStartMs = new Date(activeShift.startTime).getTime();
      
      for (var i = 1; i < bRows.length; i++) {
          var bStaff = bRows[i][4];
          if (bStaff !== session.email) continue;
          
          var bDateStr = bRows[i][2] + " " + bRows[i][3]; // Date + Time
          var bTimeMs = new Date(bDateStr).getTime();
          if (bTimeMs < shiftStartMs) continue;
          
          var amt = parseFloat(bRows[i][10]) || 0;
          var pMethod = bRows[i][12];
          var status = bRows[i][13];
          var type = String(bRows[i][0]).split('-')[0]; // B, TXN, BK
          
          if (status === "COMPLETED") {
              if (pMethod === "Cash") totals.cash += amt;
              else if (pMethod === "UPI") totals.upi += amt;
              else if (pMethod === "Card") totals.card += amt;
              
              if (type === "TXN") totals.recharges += amt;
              else if (type === "B") totals.directSales += amt;
              
              var discount = parseFloat(bRows[i][8]) || 0;
              totals.coupons += discount;
          } else if (status === "REFUNDED") {
              totals.refunds += amt;
          }
      }
      
      totals.expectedCash = activeShift.openingCash + totals.cash - totals.refunds; // Assuming all refunds are cash for simplicity unless specified
      
      activeShift.liveTotals = totals;
      
      return sendResponse({ status: "success", shift: activeShift });
    }
    
    if (action === "openShift") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var sSheet = getOrCreateSheet("Shifts");
      var sRows = sSheet.getDataRange().getValues();
      
      for (var i = 1; i < sRows.length; i++) {
          if (sRows[i][1] === session.email && sRows[i][10] === "OPEN") {
              return sendResponse({ status: "error", message: "You already have an open shift." });
          }
      }
      
      var shiftId = "SHF-" + new Date().getTime();
      var startTime = new Date().toISOString();
      var openingCash = parseFloat(data.openingCash) || 0;
      
      sSheet.appendRow([shiftId, session.email, startTime, "", openingCash, "", "", "", "", "", "OPEN"]);
      
      logAdminAction(session.email, session.role, "OPEN_SHIFT", "Opened shift " + shiftId);
      
      return sendResponse({ status: "success", shiftId: shiftId });
    }
    
    if (action === "closeShift") {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized." });
      
      var actualCash = parseFloat(data.actualCash) || 0;
      
      var sSheet = getOrCreateSheet("Shifts");
      var sRows = sSheet.getDataRange().getValues();
      var activeRowIndex = -1;
      var activeShiftId = "";
      var openingCash = 0;
      var startTimeMs = 0;
      
      for (var i = sRows.length - 1; i > 0; i--) {
          if (sRows[i][1] === session.email && sRows[i][10] === "OPEN") {
              activeRowIndex = i + 1;
              activeShiftId = sRows[i][0];
              openingCash = parseFloat(sRows[i][4]) || 0;
              startTimeMs = new Date(sRows[i][2]).getTime();
              break;
          }
      }
      
      if (activeRowIndex === -1) return sendResponse({ status: "error", message: "No active shift found." });
      
      // Recalculate finals
      var bSheet = getOrCreateSheet("Bills");
      var bRows = bSheet.getDataRange().getValues();
      var cashCollected = 0;
      var refunds = 0;
      var upi = 0;
      var card = 0;
      
      for (var i = 1; i < bRows.length; i++) {
          if (bRows[i][4] !== session.email) continue;
          var bTimeMs = new Date(bRows[i][2] + " " + bRows[i][3]).getTime();
          if (bTimeMs < startTimeMs) continue;
          
          var amt = parseFloat(bRows[i][10]) || 0;
          var pMethod = bRows[i][12];
          var status = bRows[i][13];
          
          if (status === "COMPLETED") {
              if (pMethod === "Cash") cashCollected += amt;
              else if (pMethod === "UPI") upi += amt;
              else if (pMethod === "Card") card += amt;
          } else if (status === "REFUNDED") {
              refunds += amt;
          }
      }
      
      var expectedCash = openingCash + cashCollected - refunds;
      var difference = actualCash - expectedCash;
      
      var endTime = new Date().toISOString();
      
      sSheet.getRange(activeRowIndex, 4).setValue(endTime);
      sSheet.getRange(activeRowIndex, 6).setValue(expectedCash);
      sSheet.getRange(activeRowIndex, 7).setValue(actualCash);
      sSheet.getRange(activeRowIndex, 8).setValue(difference);
      sSheet.getRange(activeRowIndex, 9).setValue(upi);
      sSheet.getRange(activeRowIndex, 10).setValue(card);
      sSheet.getRange(activeRowIndex, 11).setValue("CLOSED");
      
      logAdminAction(session.email, session.role, "CLOSE_SHIFT", "Closed shift " + activeShiftId + " Diff: " + difference);
      
      return sendResponse({ status: "success", difference: difference });
    }

    // AUTHENTICATION CHECK FOR PROTECTED POST ROUTES





    var publicActions = ["submitFeedback", "submitEnquiry", "submitInterest", "processOnlineBooking"];
    if (publicActions.indexOf(action) === -1) {
      var session = validateToken(data.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized. Token invalid or expired." });
      if (!checkPermission(session.role, action)) {
         logAdminAction(session.email, session.role, "UNAUTHORIZED_ACTION", action);
         return sendResponse({ status: "error", message: "Forbidden. Insufficient permissions." });
      }
      logAdminAction(session.email, session.role, action, "Triggered POST action");
    }


    // --- AUTHENTICATION ENDPOINTS (Public) ---
    if (action === "loginAdmin") {
      var email = data.email;
      var password = data.password;
      var sheet = getOrCreateSheet("AdminUsers", ["Email", "PasswordHash", "Role", "Status", "ResetOTP", "OTPExpiry"]);
      
      // Auto-provision default accounts if empty
      if (sheet.getLastRow() <= 1) {
         var defaultHash = generateHash("Admin@2026");
         sheet.appendRow(["admin@exmail.com", defaultHash, "SUPER_ADMIN", "ACTIVE", "", ""]);
         sheet.appendRow(["manager@exmail.com", defaultHash, "MANAGER", "ACTIVE", "", ""]);
         sheet.appendRow(["staff@exmail.com", defaultHash, "COUNTER_STAFF", "ACTIVE", "", ""]);
      }
      
      // Allow raw password match for staff if they manually added "1234" to the sheet
      var rows = sheet.getDataRange().getValues();
      var hashedPass = generateHash(password);
      
      for (var i = 1; i < rows.length; i++) {
        var rowEmail = rows[i][0];
        var rowPass = rows[i][1];
        var role = rows[i][2];
        var status = rows[i][3];
        
        if (rowEmail === email && status === "ACTIVE") {
           // Allow raw match or hash match
           if (rowPass === hashedPass || rowPass === password) {
               var token = "TKN-" + new Date().getTime() + "-" + Math.floor(Math.random() * 10000);
               var sessionData = { email: email, role: role };
               CacheService.getScriptCache().put("SESSION_" + token, JSON.stringify(sessionData), 21600);
               logAdminAction(email, role, "LOGIN_SUCCESS", "Logged in successfully");
               return sendResponse({ status: "success", token: token, role: role, email: email });
           }
        }
      }
      
      logAdminAction(email || "Unknown", "UNKNOWN", "LOGIN_FAILED", "Invalid credentials");
      return sendResponse({ status: "error", message: "Invalid credentials or inactive account" });
    }

    if (action === "logoutAdmin") {
      if (data.token) {
        var session = validateToken(data.token);
        if (session) logAdminAction(session.email, session.role, "LOGOUT", "Admin logged out");
        CacheService.getScriptCache().remove("SESSION_" + data.token);
      }
      return sendResponse({ status: "success" });
    }

    if (action === "requestOTP") {
      var email = data.email;
      var sheet = getOrCreateSheet("AdminUsers");
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === email && rows[i][3] === "ACTIVE") {
          var otp = generateOTP();
          var expiry = new Date(new Date().getTime() + 15*60000).toISOString(); // 15 mins
          sheet.getRange(i+1, 5).setValue(otp);
          sheet.getRange(i+1, 6).setValue(expiry);
          
          MailApp.sendEmail({
            to: email,
            subject: "Kurunji Fun World - Admin Password Reset",
            body: "Your OTP for password reset is: " + otp + "\nThis OTP is valid for 15 minutes."
          });
          
          logAdminAction(email, rows[i][2], "OTP_REQUESTED", "Password reset OTP requested");
          return sendResponse({ status: "success", message: "OTP sent to email" });
        }
      }
      return sendResponse({ status: "error", message: "Email not found or inactive" });
    }

    if (action === "resetPassword") {
      var email = data.email;
      var otp = data.otp;
      var newPassword = data.newPassword;
      var sheet = getOrCreateSheet("AdminUsers");
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === email) {
          var storedOTP = rows[i][4];
          var expiry = new Date(rows[i][5]);
          if (storedOTP == otp && new Date() < expiry) {
            sheet.getRange(i+1, 2).setValue(generateHash(newPassword));
            sheet.getRange(i+1, 5).setValue(""); // Clear OTP
            sheet.getRange(i+1, 6).setValue("");
            logAdminAction(email, rows[i][2], "PASSWORD_RESET", "Password successfully reset");
            return sendResponse({ status: "success", message: "Password reset successful" });
          } else {
            return sendResponse({ status: "error", message: "Invalid or expired OTP" });
          }
        }
      }
      return sendResponse({ status: "error", message: "Email not found" });
    }

    // --- PUBLIC DATA ENDPOINTS ---
    if (action === "submitFeedback") {
      var sheet = getOrCreateSheet("Feedbacks");
      var id = generateId("#F");
      var dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      var avgRating = 5;
      if (data.ratings && Object.keys(data.ratings).length > 0) {
        var sum = 0, count = 0;
        for (var k in data.ratings) { sum += parseInt(data.ratings[k]); count++; }
        if (count > 0) avgRating = Math.round(sum / count);
      } else if (data.rating) {
        avgRating = data.rating;
      }
      var comments = (data.suggestions && data.comments) ? "Suggestions: " + data.suggestions + "\n\nReview: " + data.comments : (data.suggestions || data.comments || "");
      
      sheet.appendRow([id, dateStr, data.name || data.guestName || "", data.phone || "", data.email || "", avgRating, comments, "PENDING", data.visitType || "", data.hoursSpent || "", data.ratings ? (data.ratings['Indoor Attractions'] || "") : "", data.ratings ? (data.ratings['Outdoor Attractions'] || "") : "", data.ratings ? (data.ratings['VR Experience'] || "") : "", data.ratings ? (data.ratings['Cleanliness'] || "") : "", data.ratings ? (data.ratings['Staff Behaviour'] || "") : "", data.ratings ? (data.ratings['Value for Money'] || "") : "", data.favorites ? data.favorites.join(', ') : ""]);
      return sendResponse({ status: "success" });
    }
    
    if (action === "submitEnquiry") {
      var sheet = getOrCreateSheet("Enquiries");
      var id = generateId("#E");
      var dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      sheet.appendRow([id, dateStr, data.name || "", data.phone || "", data.email || "", data.type || "", data.message || "", "NEW"]);
      return sendResponse({ status: "success" });
    }
    
    
    if (action === "processOnlineBooking") {
      // Create unified architecture entry point for future website integrations
      
      // 1. Identify/Create Customer
      var custId = findOrCreateCustomer(data.customerName, data.phone, data.email, data.city);
      
      var visitDate = data.visitDate;
      var timeSlot = data.timeSlot;
      var couponCode = data.couponCode || "";
      var subtotal = 0;
      var validatedItems = [];
      
      // 2. Process First Floor Items
      if (data.firstFloorItems && data.firstFloorItems.length > 0) {
          var ffSheet = getOrCreateSheet("FirstFloorPricing");
          var ffRows = ffSheet.getDataRange().getValues();
          for (var i = 0; i < data.firstFloorItems.length; i++) {
             var item = data.firstFloorItems[i]; // { name: "Adult Pass", qty: 2 }
             for (var j = 1; j < ffRows.length; j++) {
                 if (ffRows[j][0] === item.name) {
                     var price = parseFloat(ffRows[j][1]) || 0;
                     var lineTotal = price * item.qty;
                     subtotal += lineTotal;
                     validatedItems.push({
                         id: "FF-" + j,
                         name: item.name + " (" + visitDate + " " + timeSlot + ")",
                         zone: "First Floor",
                         floor: "1",
                         visitorType: item.name.indexOf("Adult") !== -1 ? "Adult" : "Child",
                         qty: item.qty,
                         unitPrice: price,
                         total: lineTotal
                     });
                     break;
                 }
             }
          }
      }
      
      // 3. Process Outdoor Items
      if (data.outdoorItems && data.outdoorItems.length > 0) {
          var oSheet = getOrCreateSheet("OutdoorPricing");
          var oRows = oSheet.getDataRange().getValues();
          for (var i = 0; i < data.outdoorItems.length; i++) {
             var item = data.outdoorItems[i]; 
             for (var j = 1; j < oRows.length; j++) {
                 if (oRows[j][0] === item.name) {
                     var price = parseFloat(oRows[j][1]) || 0;
                     var lineTotal = price * item.qty;
                     subtotal += lineTotal;
                     validatedItems.push({
                         id: "OUT-" + j,
                         name: item.name + " (" + visitDate + ")",
                         zone: "Outdoor",
                         floor: "0",
                         visitorType: "Any",
                         qty: item.qty,
                         unitPrice: price,
                         total: lineTotal
                     });
                     break;
                 }
             }
          }
      }
      
      // 4. Process Add-ons
      if (data.addons && data.addons.length > 0) {
          var aSheet = getOrCreateSheet("Addons");
          var aRows = aSheet.getDataRange().getValues();
          for (var i = 0; i < data.addons.length; i++) {
             var item = data.addons[i]; 
             for (var j = 1; j < aRows.length; j++) {
                 if (aRows[j][0] === item.name) {
                     var price = parseFloat(aRows[j][1]) || 0;
                     var lineTotal = price * item.qty;
                     subtotal += lineTotal;
                     validatedItems.push({
                         id: "ADD-" + j,
                         name: item.name,
                         zone: "Addons",
                         floor: "N/A",
                         visitorType: "N/A",
                         qty: item.qty,
                         unitPrice: price,
                         total: lineTotal
                     });
                     break;
                 }
             }
          }
      }
      
      // 5. Coupon Engine
      var discount = 0;
      if (couponCode) {
          // 'ALL' zone used as generic proxy for multi-zone online cart
          var cpnRes = processCouponEngine(couponCode, subtotal, "ALL", "ALL", custId, false);
          if (!cpnRes.valid) return sendResponse({ status: "error", message: "Coupon error: " + cpnRes.message });
          discount = cpnRes.discount;
      }
      
      var total = subtotal - discount;
      if (total < 0) total = 0;
      
      // Note: Payment Gateway integration would happen here
      var paymentMethod = data.paymentMethod || "ONLINE_GATEWAY";
      
      // 6. Unified Order Creation
      var orderId = createUnifiedOrder({
          orderPrefix: "BK-WEB",
          staffId: "SYSTEM",
          customerId: custId,
          subtotal: subtotal,
          discount: discount,
          coupon: couponCode,
          total: total,
          paymentMethod: paymentMethod,
          paymentStatus: "SUCCESS",
          bookingStatus: "BOOKED",
          items: validatedItems
      });
      
      // 7. QR Generation (Same mechanism as Phase 12 QR Tickets)
      var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(orderId);
      
      return sendResponse({
          status: "success",
          bookingId: orderId,
          qrUrl: qrUrl,
          totalPaid: total,
          message: "Online Booking Architecture Connected"
      });
    }

      if (action === "submitInterest") {
      var sheet = getOrCreateSheet("UpcomingInterest");
      var id = generateId("#U");
      var dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      sheet.appendRow([id, dateStr, data.name || "", data.phone || "", data.email || "", data.attraction || "", "NEW"]);
      return sendResponse({ status: "success" });
    }

    // --- PROTECTED DATA ENDPOINTS ---
    var token = data.token || e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    if (!checkPermission(session.role, action)) {
      logAdminAction(session.email, session.role, "FORBIDDEN", "Attempted " + action);
      return sendResponse({ status: "error", message: "FORBIDDEN" });
    }

    if (action === "updateFeedbackStatus") {
      var sheet = getOrCreateSheet("Feedbacks");
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.id) {
          sheet.getRange(i + 1, 8).setValue(data.status);
          logAdminAction(session.email, session.role, "UPDATE_FEEDBACK", data.id + " -> " + data.status);
          return sendResponse({ success: true });
        }
      }
      return sendResponse({ success: false, message: "ID not found" });
    }

    if (action === "updateEnquiryStatus") {
      var sheet = getOrCreateSheet("Enquiries");
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.id) {
          sheet.getRange(i + 1, 8).setValue(data.status);
          logAdminAction(session.email, session.role, "UPDATE_ENQUIRY", data.id + " -> " + data.status);
          return sendResponse({ success: true });
        }
      }
      return sendResponse({ success: false, message: "ID not found" });
    }
    
    
    
    if (action === "fetchWalletHistory") {
      var query = String(data.query || "").trim().toLowerCase();
      if (!query) return sendResponse({ status: "error", message: "Empty search query." });
      
      var cSheet = getOrCreateSheet("Customers");
      var cRows = cSheet.getDataRange().getValues();
      var cMap = {}; // phone -> { id, name, phone }
      var idMap = {}; // id -> { id, name, phone }
      for (var i = 1; i < cRows.length; i++) {
         cMap[String(cRows[i][2])] = { id: cRows[i][0], name: cRows[i][1], phone: cRows[i][2] };
         idMap[cRows[i][0]] = { id: cRows[i][0], name: cRows[i][1], phone: cRows[i][2] };
      }
      
      var wSheet = getOrCreateSheet("Wallets");
      var wRows = wSheet.getDataRange().getValues();
      var targetWallet = null;
      var targetCustomer = null;
      
      for (var i = 1; i < wRows.length; i++) {
         var card = String(wRows[i][1]).toLowerCase();
         var cId = wRows[i][2];
         var cust = idMap[cId];
         
         if (card === query || (cust && String(cust.phone) === query) || (cust && String(cust.name).toLowerCase().indexOf(query) !== -1)) {
            targetWallet = {
                id: wRows[i][0],
                cardNumber: wRows[i][1],
                balance: parseFloat(wRows[i][3]) || 0,
                status: wRows[i][4]
            };
            targetCustomer = cust;
            break;
         }
      }
      
      if (!targetWallet) return sendResponse({ status: "error", message: "No wallet found matching query." });
      
      // Get Recharge Packages to map ID -> Money Paid
      var rpSheet = getOrCreateSheet("RechargePackages");
      var rpRows = rpSheet.getDataRange().getValues();
      var rpMap = {};
      for (var i = 1; i < rpRows.length; i++) {
         rpMap[rpRows[i][0]] = {
             payAmount: parseFloat(rpRows[i][2]) || 0,
             totalPoints: parseFloat(rpRows[i][3]) || 0
         };
      }
      
      // Look up Bills in case we need direct Money Paid from Bills. 
      // Bills -> CustomerID matching.
      var bSheet = getOrCreateSheet("Bills");
      var bRows = bSheet.getDataRange().getValues();
      var billMap = {};
      for (var i = 1; i < bRows.length; i++) {
         billMap[bRows[i][0]] = parseFloat(bRows[i][10]) || 0; // OrderID -> Amount
      }
      
      var wtSheet = getOrCreateSheet("WalletTransactions");
      var wtRows = wtSheet.getDataRange().getValues();
      
      var history = [];
      
      for (var i = wtRows.length - 1; i > 0; i--) {
          if (wtRows[i][1] === targetWallet.id) {
              var txnId = wtRows[i][0];
              var type = wtRows[i][2];
              var ref = wtRows[i][3];
              var ptsCr = parseFloat(wtRows[i][4]) || 0;
              var ptsDb = parseFloat(wtRows[i][5]) || 0;
              var balAfter = parseFloat(wtRows[i][6]) || 0;
              var timestamp = wtRows[i][8];
              
              var moneyPaid = 0;
              var desc = "";
              
              if (type === "RECHARGE") {
                  if (rpMap[ref]) {
                     moneyPaid = rpMap[ref].payAmount;
                  }
                  if (billMap[txnId]) { // If txnId matches bill ID
                     moneyPaid = billMap[txnId];
                  }
                  desc = "Recharge";
              } else if (type === "USAGE" || type === "MULTI_GAME_USAGE") {
                  desc = ref || "Game Usage";
              } else if (type === "POINT_REVERSAL") {
                  desc = "Reversal / Refund";
              } else {
                  desc = type;
              }
              
              history.push({
                 id: txnId,
                 type: type,
                 description: desc,
                 moneyPaid: moneyPaid,
                 pointsCredited: ptsCr,
                 pointsDebited: ptsDb,
                 balanceAfter: balAfter,
                 timestamp: timestamp
              });
          }
      }
      
      logAdminAction(session.email, session.role, "LOOKUP_WALLET", "Searched wallet: " + query);
      return sendResponse({ 
          status: "success", 
          wallet: targetWallet, 
          customer: targetCustomer, 
          history: history 
      });
    }

    if (action === "fetchAdminCoupons") {
      var cSheet = getOrCreateSheet("Coupons", ["couponId", "code", "description", "type", "value", "minimumOrder", "maximumDiscount", "validFrom", "validUntil", "maxUses", "perCustomerLimit", "applicableZone", "applicableProduct", "newCustomerOnly", "status"]);
      var cRows = cSheet.getDataRange().getValues();
      
      var crSheet = getOrCreateSheet("CouponRedemptions");
      var crRows = crSheet.getDataRange().getValues();
      
      var redemptions = {};
      var revenueMap = {}; // by code
      var discountMap = {};
      var bonusMap = {};
      
      // Calculate from redemptions
      for (var i = 1; i < crRows.length; i++) {
         var code = String(crRows[i][0]).toUpperCase();
         var orderId = String(crRows[i][1]);
         var disc = parseFloat(crRows[i][3]) || 0;
         var bonus = parseFloat(crRows[i][4]) || 0;
         
         if (!redemptions[code]) redemptions[code] = 0;
         if (!discountMap[code]) discountMap[code] = 0;
         if (!bonusMap[code]) bonusMap[code] = 0;
         
         redemptions[code]++;
         discountMap[code] += disc;
         bonusMap[code] += bonus;
         
         // Revenue mapping: we'd need to cross ref Bills for orderId, but for now we can fetch Bills quickly
      }
      
      var bSheet = getOrCreateSheet("Bills");
      var bRows = bSheet.getDataRange().getValues();
      var billRev = {};
      for (var i = 1; i < bRows.length; i++) {
          if (bRows[i][13] === "COMPLETED" || bRows[i][13] === "CHECKED_IN") {
             billRev[String(bRows[i][0])] = parseFloat(bRows[i][10]) || 0;
          }
      }
      
      var revMap = {};
      for (var i = 1; i < crRows.length; i++) {
         var code = String(crRows[i][0]).toUpperCase();
         var orderId = String(crRows[i][1]);
         if (!revMap[code]) revMap[code] = 0;
         if (billRev[orderId]) revMap[code] += billRev[orderId];
      }
      
      var coupons = [];
      for (var i = 1; i < cRows.length; i++) {
          var code = String(cRows[i][1]).toUpperCase();
          coupons.push({
             couponId: cRows[i][0],
             code: code,
             description: cRows[i][2],
             type: cRows[i][3],
             value: cRows[i][4],
             minimumOrder: cRows[i][5],
             maximumDiscount: cRows[i][6],
             validFrom: cRows[i][7],
             validUntil: cRows[i][8],
             maxUses: cRows[i][9],
             perCustomerLimit: cRows[i][10],
             applicableZone: cRows[i][11],
             applicableProduct: cRows[i][12],
             newCustomerOnly: cRows[i][13],
             status: cRows[i][14],
             usage: redemptions[code] || 0,
             revenueGenerated: revMap[code] || 0,
             discountGiven: discountMap[code] || 0,
             bonusGiven: bonusMap[code] || 0
          });
      }
      
      logAdminAction(session.email, session.role, "READ_COUPONS", "Fetched coupons");
      return sendResponse({ status: "success", coupons: coupons });
    }
    
    if (action === "saveAdminCoupon") {
      // Create or Edit
      var cSheet = getOrCreateSheet("Coupons");
      var cRows = cSheet.getDataRange().getValues();
      var isEdit = data.couponId ? true : false;
      var foundIndex = -1;
      
      var code = String(data.code).toUpperCase().trim();
      
      if (isEdit) {
         for (var i = 1; i < cRows.length; i++) {
            if (cRows[i][0] === data.couponId) {
               foundIndex = i + 1;
               break;
            }
         }
      } else {
         // Check if code exists
         for (var i = 1; i < cRows.length; i++) {
            if (String(cRows[i][1]).toUpperCase() === code) {
                return sendResponse({ status: "error", message: "Coupon code already exists." });
            }
         }
      }
      
      var couponId = data.couponId || "CPN-" + new Date().getTime();
      var rowData = [
          couponId,
          code,
          data.description || "",
          data.type || "PERCENTAGE",
          parseFloat(data.value) || 0,
          parseFloat(data.minimumOrder) || 0,
          parseFloat(data.maximumDiscount) || 0,
          data.validFrom || "",
          data.validUntil || "",
          parseInt(data.maxUses) || 0,
          parseInt(data.perCustomerLimit) || 1,
          data.applicableZone || "ALL",
          data.applicableProduct || "ALL",
          data.newCustomerOnly ? true : false,
          data.status || "ACTIVE"
      ];
      
      if (isEdit && foundIndex !== -1) {
          cSheet.getRange(foundIndex, 1, 1, rowData.length).setValues([rowData]);
          logAdminAction(session.email, session.role, "EDIT_COUPON", "Edited coupon " + code);
      } else {
          cSheet.appendRow(rowData);
          logAdminAction(session.email, session.role, "CREATE_COUPON", "Created coupon " + code);
      }
      
      return sendResponse({ status: "success", message: "Coupon saved." });
    }
    
    if (action === "updateAdminCouponStatus") {
      var cSheet = getOrCreateSheet("Coupons");
      var cRows = cSheet.getDataRange().getValues();
      for (var i = 1; i < cRows.length; i++) {
         if (cRows[i][0] === data.couponId) {
            cSheet.getRange(i + 1, 15).setValue(data.status); // Status is col 15
            logAdminAction(session.email, session.role, "UPDATE_COUPON_STATUS", "Set coupon " + data.couponId + " to " + data.status);
            return sendResponse({ status: "success" });
         }
      }
      return sendResponse({ status: "error", message: "Coupon not found." });
    }

      if (action === "updateCMS") {
      var sheet = getOrCreateSheet("CMS");
      var rows = sheet.getDataRange().getValues();
      var keysInSheet = {};
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0]) keysInSheet[rows[i][0]] = i + 1;
      }
      
      for (var key in data.payload) { // Assuming data.payload holds the CMS keys now to separate from token
        if (keysInSheet[key]) {
          sheet.getRange(keysInSheet[key], 2).setValue(data.payload[key]);
        } else {
          sheet.appendRow([key, data.payload[key]]);
        }
      }
      logAdminAction(session.email, session.role, "UPDATE_CMS", "Updated website text");
      return sendResponse({ success: true });
    }

    return sendResponse({ status: "error", message: "Unknown action" });
  } catch(err) {
    return sendResponse({ status: "error", message: err.toString() });
  }
}

// ------------------------------------------
// GET HANDLER (Reads)
// ------------------------------------------
function doGet(e) {
  var action = e.parameter.action;
  var publicActions = ["fetchPublicFeedbacks", "fetchCMS", "fetchAttractions", "fetchVRThemes", "fetchProducts"];
  if (publicActions.indexOf(action) === -1) {
      var session = validateToken(e.parameter.token);
      if (!session) return sendResponse({ status: "error", message: "Unauthorized. Token invalid or expired." });
      if (action === "validateAdminSession") {
         return sendResponse({ status: "success", email: session.email, role: session.role });
      }
      if (!checkPermission(session.role, action)) {
         return sendResponse({ status: "error", message: "Forbidden. Insufficient permissions." });
      }
  }

  
  // --- PUBLIC READS ---
  if (action === "fetchPublicFeedbacks") {
    var sheet = getOrCreateSheet("Feedbacks");
    var rows = sheet.getDataRange().getValues();
    var feedbacks = [];
    for (var i = rows.length - 1; i > 0; i--) { 
      if ((rows[i][1] || rows[i][2] || rows[i][6]) && String(rows[i][7]).trim().toUpperCase() === "APPROVED") {
        feedbacks.push({ date: rows[i][1] || "", guest: rows[i][2] || "Anonymous", rating: rows[i][5] || "", comments: rows[i][6] || "" });
      }
    }
    return sendResponse({ feedbacks: feedbacks });
  }
  
  if (action === "fetchCMS") {
    var sheet = getOrCreateSheet("CMS");
    var rows = sheet.getDataRange().getValues();
    var cmsData = {};
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0]) cmsData[rows[i][0]] = rows[i][1];
    }
    return sendResponse(cmsData);
  }
  

  if (action === "fetchProducts") {
    var sheet = getOrCreateSheet("Products");
    var rows = sheet.getDataRange().getValues();
    var products = [];
    var headers = rows[0] || [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        var product = {};
        for (var j = 0; j < headers.length; j++) product[String(headers[j])] = rows[i][j];
        products.push(product);
      }
    }
    return sendResponse({ products: products });
  }
  if (action === "fetchAttractions") {
    var sheet = getOrCreateSheet("Attractions");
    var rows = sheet.getDataRange().getValues();
    var attractions = [];
    var headers = rows[0] || [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        var attraction = {};
        for (var j = 0; j < headers.length; j++) attraction[String(headers[j]).toLowerCase()] = rows[i][j];
        attractions.push(attraction);
      }
    }
    return sendResponse({ attractions: attractions });
  }

  if (action === "fetchVRThemes") {
    var sheet = getOrCreateSheet("VRThemes");
    var rows = sheet.getDataRange().getValues();
    var themes = [];
    var headers = rows[0] || [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0]) {
        var theme = {};
        for (var j = 0; j < headers.length; j++) theme[String(headers[j]).toLowerCase()] = rows[i][j];
        themes.push(theme);
      }
    }
    return sendResponse({ themes: themes });
  }



  // --- PROTECTED READS ---
  if (action === "fetchWalletDetails") {
    var token = e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    var cardNumber = e.parameter.cardNumber;
    var sheet = getOrCreateSheet("Wallets");
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][1] === cardNumber) {
        return sendResponse({ 
            status: "success", 
            walletId: rows[i][0],
            cardNumber: rows[i][1],
            balance: rows[i][3],
            statusText: rows[i][4]
        });
      }
    }
    return sendResponse({ status: "error", message: "Card not found" });
  }

  if (action === "fetchGroundFloorAttractions") {
    var token = e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    var sheet = getOrCreateSheet("GroundFloorPricing");
    var rows = sheet.getDataRange().getValues();
    var attractions = [];
    var headers = rows[0] || [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][3] === "ACTIVE") {
        var attr = {};
        for (var j = 0; j < headers.length; j++) attr[String(headers[j])] = rows[i][j];
        attractions.push(attr);
      }
    }
    return sendResponse({ attractions: attractions });
  }



  if (action === "fetchOutdoorPricing") {
    var token = e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    var sheet = getOrCreateSheet("OutdoorPricing");
    var rows = sheet.getDataRange().getValues();
    var attractions = [];
    var headers = rows[0] || [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][3] === "ACTIVE") {
        var attr = {};
        for (var j = 0; j < headers.length; j++) attr[String(headers[j])] = rows[i][j];
        attractions.push(attr);
      }
    }
    return sendResponse({ status: "success", attractions: attractions });
  }


  if (action === "fetchCustomerByPhone") {
    var token = e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    var phone = String(e.parameter.phone || "").trim();
    if (!phone) return sendResponse({ status: "error", message: "Phone required" });
    
    var sheet = getOrCreateSheet("Customers");
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][2]) === phone) {
        return sendResponse({ 
            status: "success", 
            customer: {
                id: rows[i][0],
                name: rows[i][1],
                phone: rows[i][2],
                email: rows[i][3],
                city: rows[i][4]
            }
        });
      }
    }
    return sendResponse({ status: "not_found" });
  }


  if (action === "fetchAddons") {
    var token = e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    var sheet = getOrCreateSheet("Products");
    var rows = sheet.getDataRange().getValues();
    var addons = [];
    var headers = rows[0] || [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][5] === "ACTIVE") {
        var attr = {};
        for (var j = 0; j < headers.length; j++) attr[String(headers[j])] = rows[i][j];
        addons.push(attr);
      }
    }
    return sendResponse({ status: "success", addons: addons });
  }


  if (action === "fetchTransactionHistory") {
    var token = e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    // Load Customers mapping for quick lookup
    var cSheet = getOrCreateSheet("Customers");
    var cRows = cSheet.getDataRange().getValues();
    var custMap = {};
    for (var i = 1; i < cRows.length; i++) {
        custMap[cRows[i][0]] = { name: cRows[i][1], phone: cRows[i][2] };
    }
    
    var history = [];
    
    // Load Bills
    var bSheet = getOrCreateSheet("Bills");
    var bRows = bSheet.getDataRange().getValues();
    for (var i = bRows.length - 1; i > 0; i--) {
        if (!bRows[i][0]) continue;
        var orderId = String(bRows[i][0]);
        var cId = bRows[i][5];
        var cName = "Guest";
        var cPhone = "";
        if (cId && custMap[cId]) {
            cName = custMap[cId].name;
            cPhone = custMap[cId].phone;
        }
        var type = "Other";
        if (orderId.indexOf("B-FF") === 0) type = "First Floor";
        else if (orderId.indexOf("B-OUT") === 0) type = "Outdoor";
        else if (orderId.indexOf("B-ADD") === 0) type = "Add-ons";
        else if (orderId.indexOf("B-GF") === 0 || orderId.indexOf("TXN-") === 0) type = "Ground Floor Recharge";
        else if (orderId.indexOf("BK-") === 0) type = "Booking";
        
        history.push({
            id: orderId,
            date: bRows[i][2],
            time: bRows[i][3],
            customerName: cName,
            customerPhone: cPhone,
            type: type,
            amount: parseFloat(bRows[i][10]) || 0,
            points: 0,
            staff: bRows[i][4],
            status: bRows[i][13]
        });
    }
    
    // Load WalletTransactions
    var wSheet = getOrCreateSheet("Wallets");
    var wRows = wSheet.getDataRange().getValues();
    var walletMap = {}; // walletId -> { cardNumber, customerId }
    for (var i = 1; i < wRows.length; i++) {
        walletMap[wRows[i][0]] = { cardNumber: wRows[i][1], customerId: wRows[i][2] };
    }
    
    var wtSheet = getOrCreateSheet("WalletTransactions");
    var wtRows = wtSheet.getDataRange().getValues();
    for (var i = wtRows.length - 1; i > 0; i--) {
        if (!wtRows[i][0]) continue;
        var txnType = wtRows[i][2]; // RECHARGE or USAGE
        if (txnType === "RECHARGE") continue; // Handled in Bills above to avoid duplication of amount/points view. Wait, actually we should let WalletTransactions handle it for points transparency, but if we do, we need to merge or separate them. Let's include USAGE explicitly.
        
        var wId = wtRows[i][1];
        var wInfo = walletMap[wId];
        var cName = "Guest";
        var cPhone = "";
        var cardNo = "";
        if (wInfo) {
            cardNo = wInfo.cardNumber;
            var cId = wInfo.customerId;
            if (cId && custMap[cId]) {
                cName = custMap[cId].name;
                cPhone = custMap[cId].phone;
            }
        }
        
        var dObj = new Date(wtRows[i][8]);
        
        history.push({
            id: wtRows[i][0],
            cardNumber: cardNo,
            date: dObj.toLocaleDateString('en-US'),
            time: dObj.toLocaleTimeString('en-US'),
            customerName: cName,
            customerPhone: cPhone,
            type: "Ground Floor Game Usage",
            amount: 0,
            points: parseFloat(wtRows[i][5]) || 0, // points deducted
            staff: wtRows[i][7],
            status: "COMPLETED"
        });
    }
    
    // Sort by descending time loosely
    history.sort(function(a, b) {
        var da = new Date(a.date + " " + a.time).getTime();
        var db = new Date(b.date + " " + b.time).getTime();
        return db - da;
    });
    
    return sendResponse({ status: "success", history: history });
  }

  if (action === "fetchFirstFloorPricing") {



    var token = e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    var sheet = getOrCreateSheet("FirstFloorPricing");
    var rows = sheet.getDataRange().getValues();
    var pricing = { childPrice: 599, adultPrice: 899, name: "First Floor Access", activities: "Ball Pool, Trampoline, Ninja" };
    
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][5] === "ACTIVE") {
         pricing.name = rows[i][1];
         pricing.childPrice = parseFloat(rows[i][2]);
         pricing.adultPrice = parseFloat(rows[i][3]);
         pricing.activities = rows[i][4];
         break;
      }
    }
    return sendResponse({ status: "success", pricing: pricing });
  }

  if (action === "fetchRechargePackages") {


    var token = e.parameter.token;
    var session = validateToken(token);
    if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
    
    var sheet = getOrCreateSheet("RechargePackages");
    var rows = sheet.getDataRange().getValues();
    var packages = [];
    var headers = rows[0] || [];
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] && rows[i][5] === "ACTIVE") {
        var pkg = {};
        for (var j = 0; j < headers.length; j++) pkg[String(headers[j])] = rows[i][j];
        packages.push(pkg);
      }
    }
    return sendResponse({ packages: packages });
  }

  var token = e.parameter.token;

  if(action === "validateAdminSession") {
    var session = validateToken(token);
    if(session) return sendResponse({ status: "success", role: session.role, email: session.email });
    return sendResponse({ status: "error", message: "UNAUTHORIZED" });
  }

  var session = validateToken(token);
  if (!session) return sendResponse({ status: "error", message: "UNAUTHORIZED" });
  
  if (!checkPermission(session.role, action)) {
    logAdminAction(session.email, session.role, "FORBIDDEN", "Attempted " + action);
    return sendResponse({ status: "error", message: "FORBIDDEN" });
  }

  if (action === "fetchAdminFeedbacks") {
    var sheet = getOrCreateSheet("Feedbacks");
    var rows = sheet.getDataRange().getValues();
    var feedbacks = [];
    for (var i = rows.length - 1; i > 0; i--) { 
      if (rows[i][1] || rows[i][2] || rows[i][6]) {
        feedbacks.push({
          id: rows[i][0] || ("Row-" + (i+1)), date: rows[i][1] || "", guest: rows[i][2] || "Anonymous",
          phone: rows[i][3] || "", email: rows[i][4] || "", rating: rows[i][5] || "", comments: rows[i][6] || "",
          status: rows[i][7] || "NEW", visitType: rows[i][8] || "", hours: rows[i][9] || "", indoorRating: rows[i][10] || "",
          outdoorRating: rows[i][11] || "", vrRating: rows[i][12] || "", cleanlinessRating: rows[i][13] || "",
          staffRating: rows[i][14] || "", valueRating: rows[i][15] || "", favorites: rows[i][16] || ""
        });
      }
    }
    logAdminAction(session.email, session.role, "READ_FEEDBACKS", "Fetched feedback data");
    return sendResponse({ feedbacks: feedbacks, total: feedbacks.length, hasMore: false });
  }
  
  if (action === "fetchAdminEnquiries") {
    var sheet = getOrCreateSheet("Enquiries");
    var rows = sheet.getDataRange().getValues();
    var enquiries = [];
    for (var i = rows.length - 1; i >= 0; i--) {
      if (rows[i][0] && String(rows[i][0]).startsWith("#E")) {
        enquiries.push({
          id: rows[i][0], date: rows[i][1], name: rows[i][2], phone: rows[i][3],
          email: rows[i][4], type: rows[i][5], message: rows[i][6], status: rows[i][7]
        });
      }
    }
    logAdminAction(session.email, session.role, "READ_ENQUIRIES", "Fetched enquiries data");
    return sendResponse({ enquiries: enquiries, total: enquiries.length, hasMore: false });
  }



  if (action === "fetchPointAnalytics") {
      var startDateStr = data.startDate || e.parameter.startDate;
      var endDateStr = data.endDate || e.parameter.endDate;
      
      var startMs = 0;
      var endMs = new Date().getTime(); 
      
      if (startDateStr) startMs = new Date(startDateStr).setHours(0,0,0,0);
      if (endDateStr) endMs = new Date(endDateStr).setHours(23,59,59,999);
      
      var stats = {
          inrRecharge: 0,
          pointsIssued: 0,
          bonusIssued: 0,
          pointsConsumed: 0,
          pointsRemaining: 0,
          numberOfCards: 0,
          rechargeCount: 0,
          games: {} // { "Game Name": { plays: 0, pointsConsumed: 0, configuredRate: 0 } }
      };
      
      // Get configured rates
      var aSheet = getOrCreateSheet("Attractions");
      var aRows = aSheet.getDataRange().getValues();
      for (var i = 1; i < aRows.length; i++) {
          if (aRows[i][2] === "Ground Floor") {
              stats.games[aRows[i][1]] = { plays: 0, pointsConsumed: 0, configuredRate: parseFloat(aRows[i][4]) || 0 };
          }
      }
      
      // Global Wallets
      var wSheet = getOrCreateSheet("Wallets");
      var wRows = wSheet.getDataRange().getValues();
      for (var i = 1; i < wRows.length; i++) {
          if (wRows[i][4] === "ACTIVE") {
              stats.numberOfCards++;
              stats.pointsRemaining += parseFloat(wRows[i][3]) || 0;
          }
      }
      
      // WalletTransactions (Usage and Points Issued)
      var wtSheet = getOrCreateSheet("WalletTransactions");
      var wtRows = wtSheet.getDataRange().getValues();
      
      // We need INR mapping. In WalletTransactions, we only have points.
      // But we can get INR from Bills
      var bSheet = getOrCreateSheet("Bills");
      var bRows = bSheet.getDataRange().getValues();
      var billAmounts = {}; // OrderId -> INR paid
      
      for (var i = 1; i < bRows.length; i++) {
          var bTimeStr = bRows[i][2] + " " + bRows[i][3];
          var bMs = new Date(bTimeStr).getTime();
          if (bMs >= startMs && bMs <= endMs && String(bRows[i][0]).indexOf("TXN-") === 0 && bRows[i][13] === "COMPLETED") {
              stats.inrRecharge += parseFloat(bRows[i][10]) || 0;
              stats.rechargeCount++;
              billAmounts[bRows[i][0]] = parseFloat(bRows[i][10]) || 0;
          }
      }
      
      for (var i = 1; i < wtRows.length; i++) {
          if (!wtRows[i][0]) continue;
          var wtMs = new Date(wtRows[i][8]).getTime();
          if (wtMs < startMs || wtMs > endMs) continue;
          
          var type = wtRows[i][2]; // RECHARGE, USAGE
          var gameName = wtRows[i][3];
          var ptsCr = parseFloat(wtRows[i][4]) || 0;
          var ptsDb = parseFloat(wtRows[i][5]) || 0;
          var refId = wtRows[i][0]; // For recharge this is often the TXN ID if linked, wait, WT uses a generated WT ID.
          // Wait, WT does not strictly store the TXN- id in ref column, but we can assume total bonus = pointsIssued - inrRecharge globally or per period.
          
          if (type === "RECHARGE") {
              stats.pointsIssued += ptsCr;
          } else if (type === "USAGE") {
              stats.pointsConsumed += ptsDb;
              if (gameName) {
                  if (!stats.games[gameName]) stats.games[gameName] = { plays: 0, pointsConsumed: 0, configuredRate: 0 };
                  stats.games[gameName].plays++;
                  stats.games[gameName].pointsConsumed += ptsDb;
              }
          }
      }
      
      // Calculate bonus
      stats.bonusIssued = stats.pointsIssued - stats.inrRecharge;
      if (stats.bonusIssued < 0) stats.bonusIssued = 0; // fallback
      
      stats.avgRecharge = stats.rechargeCount > 0 ? (stats.inrRecharge / stats.rechargeCount).toFixed(2) : 0;
      
      logAdminAction(session.email, session.role, "READ_POINT_ANALYTICS", "Fetched Point analytics");
      return sendResponse({ status: "success", stats: stats });
  }

  if (action === "fetchAdminAnalytics") {
      var startDateStr = data.startDate || e.parameter.startDate;
      var endDateStr = data.endDate || e.parameter.endDate;
      
      var startMs = 0;
      var endMs = new Date().getTime(); // default now
      
      if (startDateStr) startMs = new Date(startDateStr).setHours(0,0,0,0);
      if (endDateStr) endMs = new Date(endDateStr).setHours(23,59,59,999);
      
      var stats = {
          visitors: { total: 0, adults: 0, children: 0 },
          transactions: 0,
          revenue: { gf: 0, ff: 0, out: 0, total: 0 },
          payments: { cash: 0, upi: 0, card: 0 },
          wallet: { issued: 0, used: 0, outstanding: 0 },
          discounts: { total: 0, coupons: 0 },
          refunds: { total: 0 },
          games: { gf: {}, ff: {}, out: {}, vrPlays: 0 },
          staff: {}
      };
      
      // 1. BILLS
      var bSheet = getOrCreateSheet("Bills");
      var bRows = bSheet.getDataRange().getValues();
      for (var i = 1; i < bRows.length; i++) {
          var bTimeStr = bRows[i][2] + " " + bRows[i][3];
          var bMs = new Date(bTimeStr).getTime();
          
          if (bMs < startMs || bMs > endMs) continue; // Time filter
          
          var id = String(bRows[i][0]);
          var staff = bRows[i][4];
          var amt = parseFloat(bRows[i][10]) || 0;
          var disc = parseFloat(bRows[i][8]) || 0;
          var payMethod = bRows[i][12];
          var status = bRows[i][13];
          
          if (status === "COMPLETED" || status === "CHECKED_IN") {
              stats.transactions++;
              stats.discounts.total += disc;
              if (bRows[i][7]) stats.discounts.coupons++; // If coupon applied
              
              if (payMethod === "Cash") stats.payments.cash += amt;
              else if (payMethod === "UPI") stats.payments.upi += amt;
              else if (payMethod === "Card") stats.payments.card += amt;
              
              stats.revenue.total += amt;
              if (id.indexOf("TXN-") === 0) stats.revenue.gf += amt; // GF Recharge
              else if (id.indexOf("B-FF-") === 0) stats.revenue.ff += amt; // First Floor
              else if (id.indexOf("B-OUT-") === 0) stats.revenue.out += amt; // Outdoor
              
              // Staff sales
              if (!stats.staff[staff]) stats.staff[staff] = { count: 0, revenue: 0 };
              stats.staff[staff].count++;
              stats.staff[staff].revenue += amt;
          }
      }
      
      // 2. REFUNDS
      var rSheet = getOrCreateSheet("Refunds");
      var rRows = rSheet.getDataRange().getValues();
      for (var i = 1; i < rRows.length; i++) {
          var rMs = new Date(rRows[i][1] + " " + rRows[i][2]).getTime();
          if (rMs >= startMs && rMs <= endMs) {
              stats.refunds.total += (parseFloat(rRows[i][4]) || 0); // Amount
          }
      }
      
      // 3. BILL ITEMS (for games popularity and visitors)
      var biSheet = getOrCreateSheet("BillItems");
      var biRows = biSheet.getDataRange().getValues();
      var processedBillsForItems = {};
      
      for (var i = 1; i < bRows.length; i++) { // Map bill statuses
          var bTimeStr = bRows[i][2] + " " + bRows[i][3];
          var bMs = new Date(bTimeStr).getTime();
          if (bMs >= startMs && bMs <= endMs && (bRows[i][13] === "COMPLETED" || bRows[i][13] === "CHECKED_IN")) {
              processedBillsForItems[bRows[i][0]] = true;
          }
      }
      
      for (var i = 1; i < biRows.length; i++) {
          var billId = biRows[i][1];
          if (!processedBillsForItems[billId]) continue;
          
          var itemName = biRows[i][3];
          var qty = parseInt(biRows[i][4]) || 0;
          var zone = biRows[i][7];
          
          if (itemName.toLowerCase().indexOf("vr") !== -1) {
              stats.games.vrPlays += qty;
          }
          
          if (zone === "First Floor") {
              stats.games.ff[itemName] = (stats.games.ff[itemName] || 0) + qty;
              if (itemName.toLowerCase().indexOf("adult") !== -1) stats.visitors.adults += qty;
              else if (itemName.toLowerCase().indexOf("child") !== -1) stats.visitors.children += qty;
              else stats.visitors.total += qty; // Generic visitor
          } else if (zone === "Outdoor") {
              stats.games.out[itemName] = (stats.games.out[itemName] || 0) + qty;
              stats.visitors.total += qty; // Assume 1 qty = 1 visitor
          }
      }
      stats.visitors.total += stats.visitors.adults + stats.visitors.children;
      
      // 4. WALLET TRANSACTIONS (GF Usage, Recharge points)
      var wtSheet = getOrCreateSheet("WalletTransactions");
      var wtRows = wtSheet.getDataRange().getValues();
      for (var i = 1; i < wtRows.length; i++) {
          if (!wtRows[i][0]) continue;
          var wtMs = new Date(wtRows[i][8]).getTime();
          if (wtMs < startMs || wtMs > endMs) continue;
          
          var type = wtRows[i][2]; // RECHARGE, USAGE, POINT_REVERSAL
          var ptsCr = parseFloat(wtRows[i][4]) || 0;
          var ptsDb = parseFloat(wtRows[i][5]) || 0;
          var game = wtRows[i][3];
          
          if (type === "RECHARGE") {
              stats.wallet.issued += ptsCr;
          } else if (type === "USAGE") {
              stats.wallet.used += ptsDb;
              if (game) {
                  stats.games.gf[game] = (stats.games.gf[game] || 0) + 1; // Count plays
                  if (game.toLowerCase().indexOf("vr") !== -1) stats.games.vrPlays++;
                  stats.visitors.total++; // Estimate GF usage as visitor activity
              }
          }
      }
      
      // 5. WALLET OUTSTANDING (Global, not time filtered)
      var wSheet = getOrCreateSheet("Wallets");
      var wRows = wSheet.getDataRange().getValues();
      for (var i = 1; i < wRows.length; i++) {
          if (wRows[i][4] === "ACTIVE") {
              stats.wallet.outstanding += (parseFloat(wRows[i][3]) || 0);
          }
      }
      
      logAdminAction(session.email, session.role, "READ_ANALYTICS", "Fetched billing analytics");
      return sendResponse({ status: "success", stats: stats });
  }

  if (action === "fetchStatistics") {
    var sheet = getOrCreateSheet("Statistics");
    var rows = sheet.getDataRange().getValues();
    var stats = {};
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0]) stats[rows[i][0]] = rows[i][1];
    }
    stats.demographics = { families: 45, tourists: 30, schoolGroups: 15, corporate: 10 };
    stats.historicalVisitors = [5000, 5200, 6100, 5800, 7200, 8450];
    
    logAdminAction(session.email, session.role, "READ_STATS", "Fetched statistics");
    return sendResponse(stats);
  }

  return sendResponse({ status: "success", message: "API is active. Invalid protected action." });
}








