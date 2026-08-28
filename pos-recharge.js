let adultQty = 0;
let childQty = 0;

function updateDemographics(type, change) {
    if (type === 'adult') {
        let n = adultQty + change;
        if (n >= 0) adultQty = n;
        document.getElementById('adult-count').value = adultQty;
    } else {
        let n = childQty + change;
        if (n >= 0) childQty = n;
        document.getElementById('child-count').value = childQty;
    }
}

function validateDemographics() {
    let a = parseInt(document.getElementById('adult-count').value) || 0;
    let c = parseInt(document.getElementById('child-count').value) || 0;
    adultQty = a < 0 ? 0 : a;
    childQty = c < 0 ? 0 : c;
    document.getElementById('adult-count').value = adultQty;
    document.getElementById('child-count').value = childQty;
}
/**
 * pos-recharge.js
 * Logic for Ground Floor Wallet Recharge POS Module
 */

let selectedPackage = null;
let appliedCoupon = null;
let appliedDiscount = 0;
let appliedBonus = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Enforce Auth
    const session = await requireStaffAuth();
    if (!session) return;
    
    document.getElementById('app-body').classList.remove('hidden');

    // 2. Load Packages
    loadPackages();

    // 3. UI Handlers
    document.getElementById('generate-card-btn').addEventListener('click', () => {
        document.getElementById('card-number').value = "KF-" + Math.floor(100000 + Math.random() * 900000);
    });

    document.getElementById('complete-btn').addEventListener('click', handleRechargeSubmit);
    document.getElementById('review-cancel-btn').addEventListener('click', () => document.getElementById('review-modal').classList.add('hidden'));
    document.getElementById('review-confirm-btn').addEventListener('click', executeOrder);
    
    document.getElementById('print-btn').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('new-txn-btn').addEventListener('click', () => {
        window.location.reload();
    });


    const applyBtn = document.getElementById('apply-coupon-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', async () => {
            const codeInput = document.getElementById('coupon-code');
            const msgBox = document.getElementById('coupon-msg');
            const code = codeInput.value.trim().toUpperCase();
            
            if (!code) {
                msgBox.textContent = "Enter a code";
                msgBox.className = "text-xs font-bold mt-1 text-red-600";
                msgBox.classList.remove('hidden');
                appliedCoupon = null;
                appliedDiscount = 0;
                appliedBonus = 0;
                if(typeof updateTotals === 'function') updateTotals();
                if(typeof updateCartUI === 'function') updateCartUI();
                return;
            }
            
            msgBox.textContent = "Checking...";
            msgBox.className = "text-xs font-bold mt-1 text-slate-500";
            msgBox.classList.remove('hidden');
            
            // Try to figure out current subtotal and zone
            let currentSubtotal = 0;
            let zone = "ALL";
            if (typeof grandTotal !== 'undefined') currentSubtotal = grandTotal;
            else if (typeof childQty !== 'undefined' && typeof childPrice !== 'undefined') currentSubtotal = (childQty * childPrice) + (adultQty * adultPrice);
            else if (typeof cart !== 'undefined') currentSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
            
            if (window.location.pathname.includes('-ff')) zone = "FIRST_FLOOR";
            else if (window.location.pathname.includes('-outdoor')) zone = "OUTDOOR";
            else if (window.location.pathname.includes('-addons')) zone = "SPECIFIC_PRODUCT";
            else if (window.location.pathname.includes('-recharge')) {
                zone = "GROUND_FLOOR_RECHARGE";
                // Get subtotal from selected package
                const activePkg = document.querySelector('.border-primary[onclick]');
                if (activePkg) {
                    const priceText = activePkg.querySelector('.text-xl').textContent;
                    currentSubtotal = parseFloat(priceText.replace('₹', ''));
                }
            }
            
            try {
                const res = await validateCoupon(code, currentSubtotal, zone, "ALL", "", false);
                if (res && res.status === 'success' && res.coupon && res.coupon.valid) {
                    appliedCoupon = res.coupon;
                    appliedDiscount = res.coupon.discount || 0;
                    appliedBonus = res.coupon.bonusPoints || 0;
                    
                    let msg = "Applied!";
                    if (appliedDiscount > 0) msg += ` -₹${appliedDiscount}`;
                    if (appliedBonus > 0) msg += ` +${appliedBonus} pts`;
                    
                    msgBox.textContent = msg;
                    msgBox.className = "text-xs font-bold mt-1 text-green-600";
                    
                    if(typeof updateTotals === 'function') updateTotals();
                    if(typeof updateCartUI === 'function') updateCartUI();
                } else {
                    appliedCoupon = null;
                    appliedDiscount = 0;
                    appliedBonus = 0;
                    msgBox.textContent = res.message || "Invalid coupon";
                    msgBox.className = "text-xs font-bold mt-1 text-red-600";
                    if(typeof updateTotals === 'function') updateTotals();
                    if(typeof updateCartUI === 'function') updateCartUI();
                }
            } catch (e) {
                msgBox.textContent = "Error validating";
                msgBox.className = "text-xs font-bold mt-1 text-red-600";
            }
        });
    }

    // Customer Lookup Logic
    const phoneInput = document.getElementById('cust-phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', async () => {
            const phone = phoneInput.value.trim();
            if (phone.length >= 10) {
                try {
                    const res = await fetchCustomerByPhone(phone);
                    if (res && res.status === 'success' && res.customer) {
                        const nameInput = document.getElementById('cust-name');
                        if (nameInput && !nameInput.value) {
                            nameInput.value = res.customer.name;
                        }
                        const emailInput = document.getElementById('cust-email');
                        if (emailInput && !emailInput.value && res.customer.email) {
                            emailInput.value = res.customer.email;
                        }
                        const badge = document.getElementById('existing-cust-badge');
                        if (badge) badge.classList.remove('hidden');
                    } else {
                        const badge = document.getElementById('existing-cust-badge');
                        if (badge) badge.classList.add('hidden');
                    }
                } catch (e) {
                    console.error("Customer lookup failed", e);
                }
            }
        });
        
        phoneInput.addEventListener('input', () => {
            const badge = document.getElementById('existing-cust-badge');
            if (badge) badge.classList.add('hidden');
        });
    }

});

async function loadPackages() {
    const grid = document.getElementById('package-grid');
    const loading = document.getElementById('loading-packages');
    
    try {
        const response = await fetchRechargePackages();
        loading.classList.add('hidden');
        
        if (response.packages && response.packages.length > 0) {
            // Sort by amount
            response.packages.sort((a, b) => a.PayAmount - b.PayAmount);
            
            response.packages.forEach(pkg => {
                const card = document.createElement('div');
                card.className = "bg-white border-2 border-slate-200 rounded-xl p-5 cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col justify-between group";
                card.onclick = () => selectPackage(pkg, card);
                
                card.innerHTML = `
                    <div class="mb-4">
                        <div class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Pay</div>
                        <div class="text-3xl font-bold text-slate-800">₹${pkg.PayAmount}</div>
                    </div>
                    <div class="bg-blue-50 rounded-lg p-3 group-hover:bg-blue-100 transition-colors">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm font-semibold text-slate-600">Credit</span>
                            <span class="text-lg font-bold text-primary">${pkg.TotalPoints} pts</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-slate-500">Bonus</span>
                            <span class="font-semibold text-green-600">+${pkg.BonusPoints} pts</span>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = `<div class="col-span-full text-slate-500">No recharge packages configured in the system.</div>`;
        }
    } catch (e) {
        console.error(e);
        loading.textContent = "Error loading packages. Please check connection.";
    }
}

function selectPackage(pkg, cardElement) {
    selectedPackage = pkg;
    
    // UI Selection state
    document.querySelectorAll('#package-grid > div').forEach(el => {
        el.classList.remove('border-primary', 'bg-blue-50/30', 'ring-2', 'ring-primary/20');
        el.classList.add('border-slate-200');
    });
    
    cardElement.classList.remove('border-slate-200');
    cardElement.classList.add('border-primary', 'bg-blue-50/30', 'ring-2', 'ring-primary/20');
    
    // Update Summary
    const summary = document.getElementById('selection-summary');
    document.getElementById('summary-pay').textContent = `₹${pkg.PayAmount}`;
    document.getElementById('summary-points').textContent = `${pkg.TotalPoints} pts`;
    summary.classList.remove('hidden');
    
    // Clear error
    document.getElementById('error-msg').classList.add('hidden');
}

async function executeOrder() {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.classList.add('hidden');
    
    if (!selectedPackage) {
        errorMsg.textContent = "Please select a recharge package first.";
        errorMsg.classList.remove('hidden');
        return;
    }
    
    const cardNumber = document.getElementById('card-number').value.trim();
    const customerName = document.getElementById('cust-name').value.trim();
    const mobile = document.getElementById('cust-phone').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    if (!cardNumber || !customerName || !mobile) {
        errorMsg.textContent = "Please fill in all required customer details.";
        errorMsg.classList.remove('hidden');
        return;
    }
    
    const btn = document.getElementById('review-confirm-btn');
    const spinner = document.getElementById('processing-spinner');
    
    btn.disabled = true;
    spinner.classList.remove('hidden');
    spinner.classList.add('animate-spin');
    
    try {
        const payload = {
            package: selectedPackage,
            cardNumber,
            customerName,
            couponCode: document.getElementById("coupon-code") ? document.getElementById("coupon-code").value.trim().toUpperCase() : "",
            phone: mobile,
            email,
            paymentMethod,
            adultCount: parseInt(document.getElementById('adult-count')?.value || 0),
            childCount: parseInt(document.getElementById('child-count')?.value || 0)
        };
        
        const response = await processRecharge(payload);
        
        if (response.status === 'success') {
            document.getElementById('review-modal').classList.add('hidden');
            showReceipt(response, payload);
        } else {
            throw new Error(response.message || "Transaction failed");
        }
        
    } catch (e) {
        errorMsg.textContent = e.message;
        errorMsg.classList.remove('hidden');
        btn.disabled = false;
    } finally {
        spinner.classList.add('hidden');
        spinner.classList.remove('animate-spin');
    }
}

function showReceipt(response, payload) {
    // Set QR Code
    let qrTarget = response.billId || response.transaction || "UNKNOWN";
    if (window.location.pathname.includes('-recharge')) {
        qrTarget = response.cardNumber || qrTarget;
        const txt = document.getElementById('receipt-qr-text');
        if (txt) txt.textContent = "Wallet Card No: " + qrTarget;
    }
    const qrImg = document.getElementById('receipt-qr');
    if(qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrTarget)}`;

    document.getElementById('receipt-date').textContent = new Date().toLocaleString('en-US');
    document.getElementById('receipt-txn').textContent = response.transaction;
    document.getElementById('receipt-card').textContent = response.cardNumber;
    document.getElementById('receipt-pay').textContent = `₹${payload.package.PayAmount}`;
    document.getElementById('receipt-mode').textContent = payload.paymentMethod;
    document.getElementById('receipt-added').textContent = `${payload.package.TotalPoints} pts`;
    document.getElementById('receipt-balance').textContent = `${response.balance} pts`;
    
    document.getElementById('receipt-modal').classList.remove('hidden');
}



function handleRechargeSubmit() {

    if (!selectedPackage) {
        document.getElementById('error-msg').textContent = "Please select a package";
        document.getElementById('error-msg').classList.remove('hidden');
        return;
    }
    
    const errBox = document.getElementById('error-msg');
    errBox.classList.add('hidden');
    
    const payAmount = parseFloat(selectedPackage.PayAmount);
    let totalPoints = parseFloat(selectedPackage.TotalPoints);
    
    let subtotalDisplay = payAmount;
    let finalPay = payAmount;
    let finalPoints = totalPoints;
    let discountBlock = '';
    
    if (appliedDiscount > 0) {
        finalPay -= appliedDiscount;
        discountBlock = `<div class="flex justify-between text-green-600 font-semibold mb-2 text-sm"><span>Coupon Discount</span><span>-₹${appliedDiscount}</span></div>`;
    }
    if (appliedBonus > 0) {
        finalPoints += appliedBonus;
        discountBlock += `<div class="flex justify-between text-green-600 font-semibold mb-2 text-sm"><span>Bonus Points</span><span>+●${appliedBonus}</span></div>`;
    }
    
    const content = `
        <div class="space-y-4">
            <div class="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                <div class="text-sm font-bold text-blue-800 mb-1">Ground Floor Recharge</div>
                <div class="flex justify-between text-slate-700 font-medium mb-1">
                    <span>Base Amount</span>
                    <span>₹${payAmount}</span>
                </div>
                ${discountBlock}
                <div class="flex justify-between text-lg font-bold text-slate-900 border-t border-blue-200 mt-2 pt-2">
                    <span>Pay Amount</span>
                    <span>₹${Math.max(0, finalPay)}</span>
                </div>
                <div class="flex justify-between text-lg font-bold text-blue-700 mt-2">
                    <span>Points Received</span>
                    <span>● ${finalPoints}</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('review-content').innerHTML = content;
    document.getElementById('review-modal').classList.remove('hidden');

}





