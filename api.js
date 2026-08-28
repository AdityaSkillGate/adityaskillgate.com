/**
 * Google Apps Script Integration for Kurunji Fun World
 * This file handles all fetching and data pushing to the Google Sheets backend.
 */

// Replace this with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbycVRW_d0nUU1gEDIAnJPwZKsILI0bdRQ7R0ym_zyEjdW44EjgZEolpl3hy2l_YUj2R/exec";

// ==========================================
// AUTHENTICATION
// ==========================================

function getAuthToken() {
    return sessionStorage.getItem('adminToken') || '';
}

async function adminLogin(email, password) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => setTimeout(() => {
            if(email.includes('admin')) {
                resolve({ status: 'success', token: 'mock-token-123', role: 'SUPER_ADMIN', email: email });
            } else {
                resolve({ status: 'error', message: 'Invalid credentials' });
            }
        }, 1000));
    }
    
    const response = await fetch(APPS_SCRIPT_URL + '?action=loginAdmin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    
    const clone = response.clone();
    try {
        return await response.json();
    } catch (e) {
        const text = await clone.text();
        console.error("HTML Response received instead of JSON:", text);
        throw new Error("Server returned an HTML error page. Check console for details.");
    }
}

async function logoutAdmin() {
    const token = getAuthToken();
    if(token) {
        if (APPS_SCRIPT_URL !== "YOUR_APPS_SCRIPT_URL_HERE") {
            try {
                await fetch(APPS_SCRIPT_URL + '?action=logoutAdmin', {
                    method: 'POST',
                    body: JSON.stringify({ token }),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                });
            } catch(e) {}
        }
    }
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminRole');
    sessionStorage.removeItem('adminEmail');
}

async function validateAdminSession() {
    const token = getAuthToken();
    if(!token) return { status: 'error' };

    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success', role: sessionStorage.getItem('adminRole') || 'SUPER_ADMIN', email: sessionStorage.getItem('adminEmail') }), 500));
    }
    
    try {
        const queryParams = new URLSearchParams({ action: 'validateAdminSession', token }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        return await response.json();
    } catch (e) {
        return { status: 'error' };
    }
}

async function requestResetOTP(email) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 1000));
    }
    
    const response = await fetch(APPS_SCRIPT_URL + '?action=requestOTP', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    let res = await response.json(); return res;
}

async function resetPasswordWithOTP(email, otp, newPassword) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 1000));
    }
    
    const response = await fetch(APPS_SCRIPT_URL + '?action=resetPassword', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    let res = await response.json(); return res;
}


// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

async function submitFeedback(feedbackData) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        console.warn("Using mock API for submitFeedback.");
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 1500));
    }
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=submitFeedback', {
            method: 'POST',
            body: JSON.stringify(feedbackData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        if (!response.ok) throw new Error("Network response was not ok");
        let res = await response.json(); return res;
    } catch (error) {
        console.error("Error submitting feedback:", error);
        throw error;
    }
}

async function submitEnquiry(enquiryData) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        console.warn("Using mock API for submitEnquiry.");
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 1000));
    }
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=submitEnquiry', {
            method: 'POST',
            body: JSON.stringify(enquiryData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        if (!response.ok) throw new Error("Network response was not ok");
        let res = await response.json(); return res;
    } catch (error) {
        console.error("Error submitting enquiry:", error);
        throw error;
    }
}

async function fetchPublicFeedbacks() {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({ feedbacks: [
                    { guest: "Ananya R.", rating: 5, comments: "Absolutely the best thing to do in Kodai with kids! We spent 4 hours here and still didn't finish everything. The zip-line is surprisingly thrilling.", date: "Oct 24, 2024" },
                    { guest: "Vikram S.", rating: 5, comments: "Great escape from the rain. The VR arena is top-notch. Clean, professional staff, and very well maintained indoor environment.", date: "Oct 23, 2024" }
                ]});
            }, 500);
        });
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchPublicFeedbacks' }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        let res = await response.json(); return res;
    } catch (error) {
        console.error('Error fetching public feedbacks:', error);
        return { feedbacks: [] };
    }
}

async function fetchReviews(filters = {}, page = 1) {
    // Kept for backward compatibility if used anywhere on public pages
    return fetchPublicFeedbacks(); 
}


// ==========================================
// PROTECTED ADMIN ENDPOINTS
// ==========================================

async function fetchStatistics() {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    visitorsToday: 342, visitorsMonthly: 8450, averageRating: 4.8,
                    totalReviews: 1254, averageHoursSpent: "3.5", repeatVisitorRate: 28,
                    mostLovedCategory: "VR Arena",
                    demographics: { families: 45, tourists: 30, schoolGroups: 15, corporate: 10 },
                    historicalVisitors: [5000, 5200, 6100, 5800, 7200, 8450]
                });
            }, 600);
        });
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchStatistics', token: getAuthToken() }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchAdminFeedbacks(filters = {}, page = 1) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => {
            setTimeout(() => {
                const mockData = [
                    { id: "#F-9021", date: "Oct 24, 2024", guest: "Ravi Kumar", phone: "+91 98765 43210", rating: 5, comments: "Amazing experience at the roller coaster...", status: "PENDING" },
                    { id: "#F-9020", date: "Oct 23, 2024", guest: "Ananya S.", phone: "+91 99887 76655", rating: 4, comments: "The cafe menu could be more varied, but good...", status: "APPROVED" }
                ];
                let filtered = [...mockData];
                if (filters.status && filters.status !== 'All') filtered = filtered.filter(r => r.status === filters.status.toUpperCase());
                resolve({ feedbacks: filtered, total: filtered.length, hasMore: false });
            }, 600);
        });
    }

    try {
        const queryParams = new URLSearchParams({ action: 'fetchAdminFeedbacks', token: getAuthToken(), page, ...filters }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function updateFeedbackStatus(id, newStatus) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=updateFeedbackStatus', {
            method: 'POST',
            body: JSON.stringify({ id, status: newStatus, token: getAuthToken() }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchAdminEnquiries(filters = {}, page = 1) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => {
            setTimeout(() => {
                const mockData = [
                    { id: "#E-105", date: "Oct 24, 2024", name: "TechCorp India", phone: "+91 98888 11111", email: "hr@techcorp.in", type: "Corporate Outing", message: "Looking to book for 50 employees.", status: "NEW" },
                ];
                let filtered = [...mockData];
                if (filters.status && filters.status !== 'All') filtered = filtered.filter(r => r.status === filters.status.toUpperCase());
                resolve({ enquiries: filtered, total: filtered.length, hasMore: false });
            }, 600);
        });
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchAdminEnquiries', token: getAuthToken(), page, ...filters }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function updateEnquiryStatus(id, newStatus) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=updateEnquiryStatus', {
            method: 'POST',
            body: JSON.stringify({ id, status: newStatus, token: getAuthToken() }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchCMSData() {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => {
            setTimeout(() => {
                const stored = localStorage.getItem('mockCMSData');
                if(stored) return resolve(JSON.parse(stored));
                resolve({
                    heroTitle: "Experience the Magic of Kurunji",
                    heroSubtitle: "Unforgettable adventures await at Kodaikanal's premier amusement park.",
                    alertBanner: "Special Monsoon Offer: Get 20% off on all online bookings!",
                    seoTitle: "Kurunji Fun World | Kodaikanal",
                    seoDesc: "The best amusement park in Kodaikanal featuring VR arenas, 4D simulators, and family rides.",
                    aboutIntro: "Kurunji Fun World brings cutting-edge entertainment to the serene hills of Kodaikanal.",
                    hours: "Open Daily: 9:00 AM - 8:00 PM"
                });
            }, 600);
        });
    }
    try {
        // Technically fetchCMS is public so token isn't strictly required, but sending it doesn't hurt.
        const response = await fetch(APPS_SCRIPT_URL + '?action=fetchCMS', { cache: 'no-store' });
        let res = await response.json(); return res;
    } catch (error) {
        throw error;
    }
}

async function updateCMSContent(payload) {
    if (APPS_SCRIPT_URL === "YOUR_APPS_SCRIPT_URL_HERE") {
        return new Promise(resolve => {
            setTimeout(() => {
                localStorage.setItem('mockCMSData', JSON.stringify(payload));
                resolve({ success: true });
            }, 600);
        });
    }
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=updateCMS', {
            method: 'POST',
            body: JSON.stringify({ payload, token: getAuthToken() }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

// ------------------------------------------
// ATTRACTIONS & VR (Keeping for completeness)
// ------------------------------------------
async function fetchAttractions() {
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=fetchAttractions', { cache: 'no-store' });
        let res = await response.json(); return res;
    } catch (error) { return { attractions: [] }; }
}
async function fetchVRThemes() {
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=fetchVRThemes', { cache: 'no-store' });
        let res = await response.json(); return res;
    } catch (error) { return { themes: [] }; }
}
async function fetchProducts() {
    try {
        const response = await fetch(APPS_SCRIPT_URL + '?action=fetchProducts', { cache: 'no-store' });
        let res = await response.json(); return res;
    } catch (error) { return { products: [] }; }
}

// ==========================================
// POS SPECIFIC ENDPOINTS
// ==========================================

async function fetchRechargePackages() {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ packages: [
                { PackageID: 'RP-01', PayAmount: 1000, BasePoints: 1000, BonusPoints: 0, TotalPoints: 1000 },
                { PackageID: 'RP-02', PayAmount: 1500, BasePoints: 1500, BonusPoints: 300, TotalPoints: 1800 },
                { PackageID: 'RP-03', PayAmount: 2000, BasePoints: 2000, BonusPoints: 500, TotalPoints: 2500 }
            ]});
        }, 500));
    }
    
    try {
        const queryParams = new URLSearchParams({ action: 'fetchRechargePackages', token: getAuthToken() }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function processRecharge(rechargeData) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', transaction: 'TXN-9999', balance: rechargeData.package.TotalPoints, cardNumber: rechargeData.cardNumber });
        }, 1000));
    }
    
    try {
        rechargeData.token = getAuthToken();
        const response = await fetch(APPS_SCRIPT_URL + '?action=processRecharge', {
            method: 'POST',
            body: JSON.stringify(rechargeData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchWalletDetails(cardNumber) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', walletId: 'WAL-123', cardNumber, balance: 6000, statusText: 'ACTIVE' });
        }, 500));
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchWalletDetails', token: getAuthToken(), cardNumber }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchGroundFloorAttractions() {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ attractions: [
                { AttractionID: 'GF-01', Name: 'VR 360', PointsPerPerson: 200, Status: 'ACTIVE' },
                { AttractionID: 'GF-02', Name: 'Boxer', PointsPerPerson: 100, Status: 'ACTIVE' },
                { AttractionID: 'GF-03', Name: 'Massage Chair', PointsPerPerson: '', Status: 'ACTIVE' }
            ]});
        }, 500));
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchGroundFloorAttractions', token: getAuthToken() }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function processMultiGameUsage(usageData) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise((resolve, reject) => setTimeout(() => {
            if (usageData.items.reduce((sum, i) => sum + (i.price * i.quantity), 0) > 6000) {
                reject(new Error(JSON.stringify({ status: 'error', code: 'INSUFFICIENT_FUNDS', message: 'Insufficient Points', required: usageData.cost, available: 6000 })));
            } else {
                resolve({ status: 'success', transaction: 'TXN-888', balance: 6000 - usageData.cost, cost: usageData.cost });
            }
        }, 1000));
    }
    try {
        usageData.token = getAuthToken();
        const response = await fetch(APPS_SCRIPT_URL + '?action=processMultiGameUsage', {
            method: 'POST',
            body: JSON.stringify(usageData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if(data.status === 'error') {
            if (data.code === 'INSUFFICIENT_FUNDS') throw new Error(JSON.stringify(data));
            throw new Error(data.message);
        }
        return data;
    } catch (error) {
        throw error;
    }
}



async function fetchFirstFloorPricing() {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', pricing: { childPrice: 599, adultPrice: 899, name: 'First Floor Access', activities: 'Ball Pool, Trampoline, Ninja' } });
        }, 500));
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchFirstFloorPricing', token: getAuthToken() }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function processFirstFloorBilling(billData) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', billId: 'B-FF-999', total: (billData.childQty * 599) + (billData.adultQty * 899), childTotal: billData.childQty * 599, adultTotal: billData.adultQty * 899 });
        }, 1000));
    }
    try {
        billData.token = getAuthToken();
        const response = await fetch(APPS_SCRIPT_URL + '?action=processFirstFloorBilling', {
            method: 'POST',
            body: JSON.stringify(billData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchOutdoorPricing() {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', attractions: [
                { AttractionID: 'OUT-01', Name: 'Crazy Roller', Price: 200, Status: 'ACTIVE' },
                { AttractionID: 'OUT-02', Name: '360 Cycle Ride', Price: 150, Status: 'ACTIVE' },
                { AttractionID: 'OUT-03', Name: 'Human Gyro 360', Price: '', Status: 'ACTIVE' }
            ] });
        }, 500));
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchOutdoorPricing', token: getAuthToken() }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function processOutdoorBilling(billData) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            const total = billData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
            resolve({ status: 'success', billId: 'B-OUT-999', total: total, items: billData.items });
        }, 1000));
    }
    try {
        billData.token = getAuthToken();
        const response = await fetch(APPS_SCRIPT_URL + '?action=processOutdoorBilling', {
            method: 'POST',
            body: JSON.stringify(billData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchCustomerByPhone(phone) {
    if (!phone) return null;
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            if (phone === '9999999999') {
                resolve({ status: 'success', customer: { name: 'John Doe', phone: '9999999999', email: 'john@example.com', city: 'Bangalore' } });
            } else {
                resolve({ status: 'not_found' });
            }
        }, 500));
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchCustomerByPhone', token: getAuthToken(), phone: phone }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

async function fetchAddons() {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', addons: [
                { ProductID: 'PROD-01', Name: 'Grip Socks', Category: 'Merchandise', Price: 100, TaxRate: 5, Status: 'ACTIVE' },
                { ProductID: 'PROD-02', Name: 'Water Bottle', Category: 'F&B', Price: 50, TaxRate: 0, Status: 'ACTIVE' }
            ] });
        }, 500));
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchAddons', token: getAuthToken() }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function processAddonsBilling(billData) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            const total = billData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
            resolve({ status: 'success', billId: 'B-ADD-999', total: total, items: billData.items });
        }, 1000));
    }
    try {
        billData.token = getAuthToken();
        const response = await fetch(APPS_SCRIPT_URL + '?action=processAddonsBilling', {
            method: 'POST',
            body: JSON.stringify(billData),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        if(data.status === 'error') throw new Error(data.message);
        return data;
    } catch (error) {
        throw error;
    }
}

async function validateCoupon(code, subtotal, zone, productId, customerId, isNewCustomer) {
    if (!code) return null;
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            if (code === 'TEST10') {
                resolve({ status: 'success', coupon: { valid: true, type: 'PERCENTAGE', discount: subtotal * 0.1, code: 'TEST10' } });
            } else {
                resolve({ status: 'error', message: 'Invalid coupon' });
            }
        }, 500));
    }
    try {
        const payload = {
            token: getAuthToken(),
            code: code,
            subtotal: subtotal,
            zone: zone,
            productId: productId,
            customerId: customerId,
            isNewCustomer: isNewCustomer
        };
        const response = await fetch(APPS_SCRIPT_URL + '?action=validateCoupon', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

async function validateQR(qrData) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', type: 'BOOKING', data: { orderId: qrData, status: 'COMPLETED', customer: 'Test User', items: [{name: 'Test Pass', qty: 2}] } });
        }, 500));
    }
    try {
        const payload = { token: getAuthToken(), qr: qrData };
        const response = await fetch(APPS_SCRIPT_URL + '?action=validateQR', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function processCheckIn(orderId) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', checkInId: 'CHK-999' });
        }, 500));
    }
    try {
        const payload = { token: getAuthToken(), orderId: orderId };
        const response = await fetch(APPS_SCRIPT_URL + '?action=processCheckIn', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function fetchTransactionHistory() {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', history: [
                {id: 'B-FF-1234', date: '8/26/2026', time: '10:00 AM', customerName: 'John Doe', customerPhone: '9998887776', type: 'First Floor', amount: 1498, points: 0, staff: 'staff@example.com', status: 'COMPLETED'},
                {id: 'TXN-9876', date: '8/26/2026', time: '11:30 AM', customerName: 'Jane Smith', customerPhone: '9876543210', type: 'Ground Floor Game Usage', amount: 0, points: 200, staff: 'staff@example.com', status: 'COMPLETED'},
                {id: 'TXN-5555', cardNumber: '1000000001', date: '8/25/2026', time: '09:00 AM', customerName: 'Alice', customerPhone: '', type: 'Ground Floor Recharge', amount: 3000, points: 0, staff: 'admin@example.com', status: 'COMPLETED'}
            ] });
        }, 500));
    }
    try {
        const queryParams = new URLSearchParams({ action: 'fetchTransactionHistory', token: getAuthToken() }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function processRefundRequest(data) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success' });
        }, 800));
    }
    try {
        const payload = { token: getAuthToken(), action: 'processRefund', ...data };
        const response = await fetch(APPS_SCRIPT_URL + '?action=processRefund', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function getShiftStatus() {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', shift: null }); // Test: change to object to test active shift
        }, 500));
    }
    try {
        const queryParams = new URLSearchParams({ action: 'getShiftStatus', token: getAuthToken() }).toString();
        const response = await fetch(APPS_SCRIPT_URL + '?' + queryParams, { cache: 'no-store' });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function openShift(openingCash) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 500));
    }
    try {
        const payload = { token: getAuthToken(), action: 'openShift', openingCash: openingCash };
        const response = await fetch(APPS_SCRIPT_URL + '?action=openShift', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function closeShift(actualCash) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success', difference: 0 }), 500));
    }
    try {
        const payload = { token: getAuthToken(), action: 'closeShift', actualCash: actualCash };
        const response = await fetch(APPS_SCRIPT_URL + '?action=closeShift', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function fetchAdminAnalytics(startDate, endDate) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', stats: {
                visitors: { total: 450, adults: 200, children: 250 },
                transactions: 120,
                revenue: { gf: 25000, ff: 45000, out: 30000, total: 100000 },
                payments: { cash: 60000, upi: 35000, card: 5000 },
                wallet: { issued: 40000, used: 32000, outstanding: 120000 },
                discounts: { total: 2500, coupons: 5 },
                refunds: { total: 1200 },
                games: { 
                    gf: { 'VR 360': 45, 'Boxer': 20 }, 
                    ff: { 'Child Pass': 250, 'Adult Pass': 200 }, 
                    out: { 'Bull Ride': 60, 'MeltDown': 40 }, 
                    vrPlays: 50 
                },
                staff: { 'staff1@test.com': {count: 50, revenue: 40000} }
            }});
        }, 800));
    }
    try {
        const payload = { token: getAuthToken(), action: 'fetchAdminAnalytics', startDate, endDate };
        const response = await fetch(APPS_SCRIPT_URL + '?action=fetchAdminAnalytics', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function fetchPointAnalytics(startDate, endDate) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', stats: {
                inrRecharge: 25000, pointsIssued: 40000, bonusIssued: 15000,
                pointsConsumed: 32000, pointsRemaining: 120000,
                numberOfCards: 800, avgRecharge: 500,
                games: {
                    'VR 360': { plays: 45, pointsConsumed: 9000, configuredRate: 200 },
                    'Boxer': { plays: 20, pointsConsumed: 2000, configuredRate: 100 },
                    'Human Gyro': { plays: 10, pointsConsumed: 1500, configuredRate: 150 }
                }
            }});
        }, 800));
    }
    try {
        const payload = { token: getAuthToken(), action: 'fetchPointAnalytics', startDate, endDate };
        const response = await fetch(APPS_SCRIPT_URL + '?action=fetchPointAnalytics', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function fetchAdminCoupons() {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', coupons: [
                { couponId: 'C1', code: 'WELCOME10', type: 'PERCENTAGE', value: 10, status: 'ACTIVE', usage: 15, revenueGenerated: 15000, discountGiven: 1500, validUntil: '2026-12-31' },
                { couponId: 'C2', code: 'BONUS500', type: 'BONUS_POINTS', value: 500, status: 'EXPIRED', usage: 40, revenueGenerated: 0, discountGiven: 0, bonusGiven: 20000, validUntil: '2026-05-01' }
            ] });
        }, 800));
    }
    try {
        const payload = { token: getAuthToken(), action: 'fetchAdminCoupons' };
        const response = await fetch(APPS_SCRIPT_URL + '?action=fetchAdminCoupons', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function saveAdminCoupon(data) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 800));
    }
    try {
        const payload = { token: getAuthToken(), action: 'saveAdminCoupon', ...data };
        const response = await fetch(APPS_SCRIPT_URL + '?action=saveAdminCoupon', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function updateAdminCouponStatus(couponId, status) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 800));
    }
    try {
        const payload = { token: getAuthToken(), action: 'updateAdminCouponStatus', couponId, status };
        const response = await fetch(APPS_SCRIPT_URL + '?action=updateAdminCouponStatus', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}

async function fetchWalletHistory(query) {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
        return new Promise(resolve => setTimeout(() => {
            resolve({ status: 'success', wallet: { cardNumber: 'C-123', balance: 5500 }, customer: { name: 'John Doe', phone: '9876543210' }, history: [
                { type: 'USAGE', description: 'Boxer', pointsDebited: 100, balanceAfter: 5500, timestamp: new Date().toISOString() },
                { type: 'USAGE', description: 'VR 360', pointsDebited: 400, balanceAfter: 5600, timestamp: new Date().toISOString() },
                { type: 'RECHARGE', description: 'Recharge', moneyPaid: 3000, pointsCredited: 6000, balanceAfter: 6000, timestamp: new Date().toISOString() }
            ] });
        }, 800));
    }
    try {
        const payload = { token: getAuthToken(), action: 'fetchWalletHistory', query: query };
        const response = await fetch(APPS_SCRIPT_URL + '?action=fetchWalletHistory', {
            method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        let res = await response.json(); return res;
    } catch (error) { throw error; }
}











