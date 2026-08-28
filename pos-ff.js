/**
 * pos-ff.js
 * Logic for First Floor Direct Billing POS Module
 */

let childPrice = 0;
let adultPrice = 0;

let childQty = 0;
let adultQty = 0;
let appliedCoupon = null;
let appliedDiscount = 0;
let appliedBonus = 0;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Enforce Auth
    const session = await requireStaffAuth();
    if (!session) return;
    
    document.getElementById('app-body').classList.remove('hidden');

    // 2. Load Pricing
    loadPricing();

    // 3. UI Handlers
    document.getElementById('child-minus').addEventListener('click', () => updateQty('child', -1));
    document.getElementById('child-plus').addEventListener('click', () => updateQty('child', 1));
    
    document.getElementById('adult-minus').addEventListener('click', () => updateQty('adult', -1));
    document.getElementById('adult-plus').addEventListener('click', () => updateQty('adult', 1));

    document.getElementById('complete-btn').addEventListener('click', handleBillingSubmit);
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

async function loadPricing() {
    const loading = document.getElementById('loading-pricing');
    const selection = document.getElementById('ticket-selection');
    
    try {
        const response = await fetchFirstFloorPricing();
        
        if (response.status === 'success') {
            childPrice = response.pricing.childPrice;
            adultPrice = response.pricing.adultPrice;
            
            document.getElementById('child-price-display').textContent = `₹${childPrice}`;
            document.getElementById('adult-price-display').textContent = `₹${adultPrice}`;
            document.getElementById('ff-activities').textContent = `Includes: ${response.pricing.activities}`;
            
            loading.classList.add('hidden');
            selection.classList.remove('hidden');
            
            updateTotals();
        } else {
            throw new Error("Failed to load pricing");
        }
    } catch (e) {
        console.error(e);
        loading.innerHTML = `<span class="text-red-500 font-bold">Error loading pricing. Please check connection.</span>`;
    }
}

function updateQty(type, change) {
    if (type === 'child') {
        let n = childQty + change;
        if (n >= 0 && n <= 50) childQty = n;
        document.getElementById('child-qty').value = childQty;
    } else {
        let n = adultQty + change;
        if (n >= 0 && n <= 50) adultQty = n;
        document.getElementById('adult-qty').value = adultQty;
    }
    updateTotals();
}

function updateTotals() {
    const cTotal = childQty * childPrice;
    const aTotal = adultQty * adultPrice;
    const grandTotal = cTotal + aTotal;
    
    document.getElementById('summary-child-qty').textContent = childQty;
    document.getElementById('summary-child-total').textContent = `₹${cTotal}`;
    
    document.getElementById('summary-adult-qty').textContent = adultQty;
    document.getElementById('summary-adult-total').textContent = `₹${aTotal}`;
    
    document.getElementById('summary-subtotal').textContent = `₹${grandTotal}`;
    document.getElementById('grand-total-display').textContent = `₹${grandTotal}`;
    
    const btn = document.getElementById('review-confirm-btn');
    const mainBtn = document.getElementById('complete-btn');
    if (grandTotal > 0) {
        btn.disabled = false;
        if(mainBtn) { mainBtn.disabled = false; mainBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btn.disabled = true;
        if(mainBtn) { mainBtn.disabled = true; mainBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

async function executeOrder() {
    const errorMsg = document.getElementById('error-msg');
    errorMsg.classList.add('hidden');
    
    if (childQty === 0 && adultQty === 0) {
        return;
    }
    
    const btn = document.getElementById('review-confirm-btn');
    const mainBtn = document.getElementById('complete-btn');
    const spinner = document.getElementById('processing-spinner');
    
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const customerName = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    
    btn.disabled = true;
        if(mainBtn) { mainBtn.disabled = true; mainBtn.classList.add('opacity-50', 'cursor-not-allowed'); }
    spinner.classList.remove('hidden');
    spinner.classList.add('animate-spin');
    
    try {
        const payload = {
            childQty,
            adultQty,
            paymentMethod,
            customerName,
            couponCode: document.getElementById("coupon-code") ? document.getElementById("coupon-code").value.trim().toUpperCase() : "",
            phone
        };
        
        const response = await processFirstFloorBilling(payload);
        
        if (response.status === 'success') {
            document.getElementById('review-modal').classList.add('hidden');
            showReceipt(response, paymentMethod);
        } else {
            throw new Error(response.message || "Transaction failed");
        }
        
    } catch (e) {
        errorMsg.textContent = e.message;
        errorMsg.classList.remove('hidden');
        btn.disabled = false;
        if(mainBtn) { mainBtn.disabled = false; mainBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
    } finally {
        spinner.classList.add('hidden');
        spinner.classList.remove('animate-spin');
    }
}

function showReceipt(response, mode) {
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
    document.getElementById('receipt-bill').textContent = response.billId;
    
    const cRow = document.getElementById('receipt-child-row');
    if (childQty > 0) {
        cRow.classList.remove('hidden');
        document.getElementById('receipt-c-qty').textContent = childQty;
        document.getElementById('receipt-c-total').textContent = `₹${response.childTotal}`;
    } else {
        cRow.classList.add('hidden');
    }
    
    const aRow = document.getElementById('receipt-adult-row');
    if (adultQty > 0) {
        aRow.classList.remove('hidden');
        document.getElementById('receipt-a-qty').textContent = adultQty;
        document.getElementById('receipt-a-total').textContent = `₹${response.adultTotal}`;
    } else {
        aRow.classList.add('hidden');
    }

    document.getElementById('receipt-total').textContent = `₹${response.total}`;
    document.getElementById('receipt-mode').textContent = mode;
    
    document.getElementById('receipt-modal').classList.remove('hidden');
}


function handleBillingSubmit() {

    const errBox = document.getElementById('cart-error');
    if (childQty === 0 && adultQty === 0) {
        errBox.textContent = "Add at least one visitor.";
        errBox.classList.remove('hidden');
        return;
    }
    
    errBox.classList.add('hidden');
    
    let discountBlock = '';
    let finalPay = grandTotal - appliedDiscount;
    
    if (appliedDiscount > 0) {
        discountBlock = `<div class="flex justify-between text-green-600 font-semibold mb-2 text-sm"><span>Discount</span><span>-₹${appliedDiscount}</span></div>`;
    }
    
    const content = `
        <div class="space-y-4">
            <div class="bg-orange-50 border border-orange-100 p-4 rounded-lg">
                <div class="text-sm font-bold text-orange-800 mb-2">First Floor Access</div>
                <div class="flex justify-between text-slate-700 font-medium mb-1">
                    <span>Adults (x${adultQty})</span>
                    <span>₹${adultQty * adultPrice}</span>
                </div>
                <div class="flex justify-between text-slate-700 font-medium mb-1">
                    <span>Children (x${childQty})</span>
                    <span>₹${childQty * childPrice}</span>
                </div>
                <div class="flex justify-between text-slate-700 font-medium mt-2 pt-2 border-t border-orange-200">
                    <span>Subtotal</span>
                    <span>₹${grandTotal}</span>
                </div>
                ${discountBlock}
                <div class="flex justify-between text-xl font-bold text-slate-900 border-t border-orange-200 mt-2 pt-2">
                    <span>Total INR</span>
                    <span>₹${Math.max(0, finalPay)}</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('review-content').innerHTML = content;
    document.getElementById('review-modal').classList.remove('hidden');

}





