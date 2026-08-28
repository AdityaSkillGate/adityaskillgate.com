/**
 * pos-outdoor.js
 * Logic for Outdoor Direct Billing POS Module
 */

let cart = []; // Array of { id, name, price, qty, total }
let appliedCoupon = null;
let appliedDiscount = 0;
let appliedBonus = 0;
let pendingAttraction = null;
let pendingQty = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Enforce Auth
    const session = await requireStaffAuth();
    if (!session) return;
    
    document.getElementById('app-body').classList.remove('hidden');

    // 2. Load Attractions
    loadAttractions();

    // 3. UI Handlers
    document.getElementById('confirm-btn').addEventListener('click', processBilling);
    document.getElementById('review-cancel-btn').addEventListener('click', () => document.getElementById('review-modal').classList.add('hidden'));
    document.getElementById('review-confirm-btn').addEventListener('click', executeOrder);
    document.getElementById('clear-cart-btn').addEventListener('click', () => {
        if(confirm("Clear all items from this transaction?")) {
            cart = [];
            updateCartUI();
        }
    });

    // Qty Modal Handlers
    document.getElementById('modal-qty-minus').addEventListener('click', () => updatePendingQty(-1));
    document.getElementById('modal-qty-plus').addEventListener('click', () => updatePendingQty(1));
    document.getElementById('modal-qty-cancel').addEventListener('click', () => {
        document.getElementById('qty-modal').classList.add('hidden');
        pendingAttraction = null;
    });
    document.getElementById('modal-qty-add').addEventListener('click', confirmAddToCard);
    
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

async function loadAttractions() {
    const grid = document.getElementById('attraction-grid');
    const loading = document.getElementById('loading-games');
    
    try {
        const response = await fetchOutdoorPricing();
        loading.classList.add('hidden');
        
        if (response.attractions && response.attractions.length > 0) {
            response.attractions.forEach(attr => {
                const card = document.createElement('div');
                
                const hasPrice = attr.Price !== null && attr.Price !== "";
                const price = parseFloat(attr.Price) || 0;
                
                if (hasPrice) {
                    card.className = "bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-32 active:scale-95";
                    card.onclick = () => openQtyModal(attr, price);
                    card.innerHTML = `
                        <div class="font-bold text-slate-800 line-clamp-2">${attr.Name}</div>
                        <div class="flex justify-between items-end mt-2">
                            <div class="text-primary font-bold bg-blue-50 py-1 px-2 rounded text-sm">
                                ₹${price}
                            </div>
                            <span class="material-symbols-outlined text-slate-300">add_circle</span>
                        </div>
                    `;
                } else {
                    card.className = "bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between h-32 opacity-60";
                    card.innerHTML = `
                        <div class="font-bold text-slate-500 line-clamp-2">${attr.Name}</div>
                        <div class="text-slate-400 font-semibold text-xs mt-2 self-start">
                            Not Configured
                        </div>
                    `;
                }
                
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = `<div class="col-span-full text-slate-500">No outdoor attractions configured in the system.</div>`;
        }
    } catch (e) {
        console.error(e);
        loading.textContent = "Error loading attractions. Please check connection.";
    }
}

function openQtyModal(attr, price) {
    pendingAttraction = {
        id: attr.AttractionID,
        name: attr.Name,
        price: price
    };
    pendingQty = 1;
    
    document.getElementById('qty-modal-title').textContent = attr.Name;
    document.getElementById('qty-modal-price').textContent = `₹${price} / visitor`;
    document.getElementById('modal-qty-input').value = pendingQty;
    
    document.getElementById('qty-modal').classList.remove('hidden');
}

function updatePendingQty(change) {
    let newQty = pendingQty + change;
    if (newQty >= 1 && newQty <= 50) {
        pendingQty = newQty;
        document.getElementById('modal-qty-input').value = pendingQty;
    }
}

function confirmAddToCard() {
    if (!pendingAttraction) return;
    
    // Check if already in cart
    const existingIdx = cart.findIndex(item => item.id === pendingAttraction.id);
    if (existingIdx >= 0) {
        cart[existingIdx].qty += pendingQty;
        cart[existingIdx].total = cart[existingIdx].qty * cart[existingIdx].price;
    } else {
        cart.push({
            id: pendingAttraction.id,
            name: pendingAttraction.name,
            price: pendingAttraction.price,
            qty: pendingQty,
            total: pendingQty * pendingAttraction.price
        });
    }
    
    document.getElementById('qty-modal').classList.add('hidden');
    pendingAttraction = null;
    
    updateCartUI();
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const emptyMsg = document.getElementById('empty-cart-msg');
    const clearBtn = document.getElementById('clear-cart-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    
    // Clear existing
    Array.from(container.children).forEach(child => { if (child.id !== 'empty-cart-msg') child.remove(); });
    
    let totalCost = 0;
    
    if (cart.length === 0) {
        container.appendChild(emptyMsg);
        emptyMsg.classList.remove('hidden');
        clearBtn.classList.add('hidden');
        confirmBtn.disabled = true;
    } else {
        emptyMsg.classList.add('hidden');
        clearBtn.classList.remove('hidden');
        
        cart.forEach((item, idx) => {
            totalCost += item.total;
            
            const div = document.createElement('div');
            div.className = "bg-white p-3 rounded border border-slate-200 flex justify-between items-center shadow-sm relative group";
            div.innerHTML = `
                <div>
                    <div class="font-bold text-slate-800 text-sm leading-tight">${item.name}</div>
                    <div class="text-xs text-slate-500 mt-1">${item.qty} x ₹${item.price}</div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="font-bold text-primary">₹${item.total}</div>
                    <button class="text-slate-300 hover:text-red-500 transition-colors" onclick="removeFromCart(${idx})" title="Remove">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
        
        confirmBtn.disabled = false;
    }
    
    document.getElementById('total-cost').textContent = `₹${totalCost}`;
}

async function executeOrder() {
    if (cart.length === 0) return;
    
    const errBox = document.getElementById('cart-error');
    errBox.classList.add('hidden');
    
    const btn = document.getElementById('review-confirm-btn');
    const spinner = document.getElementById('review-spinner');
    
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const customerName = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
      const adultCount = parseInt(document.getElementById('adult-count').value) || 0;
      const childCount = parseInt(document.getElementById('child-count').value) || 0;
    
    btn.disabled = true;
    spinner.classList.remove('hidden');
    spinner.classList.add('animate-spin');
    
    try {
        const payload = {
            items: cart,
            paymentMethod,
            customerName,
            couponCode: document.getElementById("coupon-code") ? document.getElementById("coupon-code").value.trim().toUpperCase() : "",
            phone,
            adultCount,
            childCount
        };
        
        document.querySelectorAll('#attraction-grid > div').forEach(el => el.classList.add('pointer-events-none'));
        
        const response = await processOutdoorBilling(payload);
        
        if (response.status === 'success') {
            document.getElementById('review-modal').classList.add('hidden');
            showReceipt(response, paymentMethod);
        } else {
            throw new Error(response.message || "Transaction failed");
        }
        
    } catch (e) {
        errBox.textContent = e.message;
        errBox.classList.remove('hidden');
        btn.disabled = false;
    } finally {
        spinner.classList.add('hidden');
        spinner.classList.remove('animate-spin');
        document.querySelectorAll('#attraction-grid > div').forEach(el => el.classList.remove('pointer-events-none'));
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
    
    const itemsContainer = document.getElementById('receipt-items');
    itemsContainer.innerHTML = '';
    
    response.items.forEach(item => {
        const div = document.createElement('div');
        div.className = "flex justify-between font-semibold text-slate-800 mb-2 text-sm";
        div.innerHTML = `
            <span>${item.name} <span class="text-slate-500 font-normal">x${item.qty}</span></span>
            <span>₹${item.total}</span>
        `;
        itemsContainer.appendChild(div);
    });
    
    document.getElementById('receipt-total').textContent = `₹${response.total}`;
    document.getElementById('receipt-mode').textContent = mode;
    
    document.getElementById('receipt-modal').classList.remove('hidden');
}


function processBilling() {

    if (cart.length === 0) return;
    
    let totalCost = cart.reduce((sum, item) => sum + item.total, 0);
    let discountBlock = '';
    let finalPay = totalCost - appliedDiscount;
    
    if (appliedDiscount > 0) {
        discountBlock = `<div class="flex justify-between text-green-600 font-semibold mb-2 text-sm"><span>Discount</span><span>-₹${appliedDiscount}</span></div>`;
    }
    
    let itemsHtml = '';
    cart.forEach(item => {
        itemsHtml += `<div class="flex justify-between text-slate-700 font-medium mb-1 text-sm">
            <span>${item.name} (x${item.qty})</span>
            <span>₹${item.total}</span>
        </div>`;
    });
    
    const content = `
        <div class="space-y-4">
            <div class="bg-green-50 border border-green-100 p-4 rounded-lg">
                <div class="text-sm font-bold text-green-800 mb-2">Outdoor Games</div>
                ${itemsHtml}
                <div class="flex justify-between text-slate-700 font-medium mt-2 pt-2 border-t border-green-200">
                    <span>Subtotal</span>
                    <span>₹${totalCost}</span>
                </div>
                ${discountBlock}
                <div class="flex justify-between text-xl font-bold text-slate-900 border-t border-green-200 mt-2 pt-2">
                    <span>Total INR</span>
                    <span>₹${Math.max(0, finalPay)}</span>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('review-content').innerHTML = content;
    document.getElementById('review-modal').classList.remove('hidden');

}





