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
 * pos-usage.js
 * Logic for Ground Floor Point Redemption POS Module (Multi-Game)
 */

let currentWallet = null;
let currentCustomerId = null;
let currentBalance = 0;
let cart = []; // Array of { attractionId, name, price, quantity }
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
    document.getElementById('load-wallet-btn').addEventListener('click', loadWallet);
    document.getElementById('card-number-input').addEventListener('keypress', (e) => {
        if(e.key === 'Enter') loadWallet();
    });

    document.getElementById('confirm-btn').addEventListener('click', processMultiUsage);
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
});

async function loadAttractions() {
    const grid = document.getElementById('attraction-grid');
    const loading = document.getElementById('loading-games');
    
    try {
        const response = await fetchGroundFloorAttractions();
        loading.classList.add('hidden');
        
        if (response.attractions && response.attractions.length > 0) {
            response.attractions.forEach(attr => {
                const card = document.createElement('div');
                
                const hasPrice = attr.PointsPerPerson !== null && attr.PointsPerPerson !== "";
                const price = parseFloat(attr.PointsPerPerson) || 0;
                
                if (hasPrice) {
                    card.className = "bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all flex flex-col justify-between h-32 active:scale-95";
                    card.onclick = () => openQtyModal(attr, price);
                    card.innerHTML = `
                        <div class="font-bold text-slate-800 line-clamp-2">${attr.Name}</div>
                        <div class="flex justify-between items-end mt-2">
                            <div class="text-primary font-bold bg-blue-50 py-1 px-2 rounded text-sm">
                                ${price} pts
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
            grid.innerHTML = `<div class="col-span-full text-slate-500">No attractions configured in the system.</div>`;
        }
    } catch (e) {
        console.error(e);
        loading.textContent = "Error loading attractions. Please check connection.";
    }
}

async function loadWallet() {
    const cardInput = document.getElementById('card-number-input');
    const cardNumber = cardInput.value.trim();
    const errorBox = document.getElementById('wallet-error');
    const btn = document.getElementById('load-wallet-btn');
    const spinner = document.getElementById('load-spinner');
    
    errorBox.classList.add('hidden');
    if (!cardNumber) return;
    
    btn.disabled = true;
    spinner.classList.remove('hidden');
    spinner.classList.add('animate-spin');
    
    try {
        const response = await fetchWalletDetails(cardNumber);
        
        if (response.status === 'success') {
            currentWallet = response.walletId;
            currentCustomerId = response.customerId || "";
            currentBalance = parseFloat(response.balance);
            
            document.getElementById('current-balance').textContent = `${currentBalance} pts`;
            document.getElementById('wallet-status').textContent = response.statusText;
            document.getElementById('wallet-details').classList.remove('hidden');
            
            // Unlock UI
            document.getElementById('attraction-overlay').classList.add('hidden');
            document.getElementById('usage-section').classList.remove('pointer-events-none', 'opacity-50');
            
            // Reset Cart
            cart = [];
            updateCartUI();
            
        } else {
            throw new Error(response.message || "Card not found.");
        }
        
    } catch (e) {
        errorBox.textContent = e.message;
        errorBox.classList.remove('hidden');
        
        // Lock UI
        document.getElementById('wallet-details').classList.add('hidden');
        document.getElementById('attraction-overlay').classList.remove('hidden');
        document.getElementById('usage-section').classList.add('pointer-events-none', 'opacity-50');
        currentWallet = null;
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
        spinner.classList.remove('animate-spin');
    }
}

function openQtyModal(attr, price) {
    if (!currentWallet) return;
    
    pendingAttraction = {
        attractionId: attr.AttractionID,
        name: attr.Name,
        price: price
    };
    pendingQty = 1;
    
    document.getElementById('qty-modal-title').textContent = attr.Name;
    document.getElementById('qty-modal-price').textContent = `${price} pts / person`;
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
    const existingIdx = cart.findIndex(item => item.attractionId === pendingAttraction.attractionId);
    if (existingIdx >= 0) {
        cart[existingIdx].quantity += pendingQty;
    } else {
        cart.push({
            attractionId: pendingAttraction.attractionId,
            name: pendingAttraction.name,
            price: pendingAttraction.price,
            quantity: pendingQty
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
    const errBox = document.getElementById('cart-error');
    
    errBox.classList.add('hidden');
    
    // Clear existing
    Array.from(container.children).forEach(child => { if (child.id !== 'empty-cart-msg') child.remove(); });
    
    let totalPoints = 0;
    
    if (cart.length === 0) {
        container.appendChild(emptyMsg);
        emptyMsg.classList.remove('hidden');
        clearBtn.classList.add('hidden');
        confirmBtn.disabled = true;
    } else {
        emptyMsg.classList.add('hidden');
        clearBtn.classList.remove('hidden');
        
        cart.forEach((item, idx) => {
            const itemTotal = item.price * item.quantity;
            totalPoints += itemTotal;
            
            const div = document.createElement('div');
            div.className = "bg-white p-3 rounded border border-slate-200 flex justify-between items-center shadow-sm relative group";
            div.innerHTML = `
                <div>
                    <div class="font-bold text-slate-800 text-sm leading-tight">${item.name}</div>
                    <div class="text-xs text-slate-500 mt-1">${item.quantity} x ${item.price} pts</div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="font-bold text-primary">${itemTotal} pts</div>
                    <button class="text-slate-300 hover:text-red-500 transition-colors" onclick="removeFromCart(${idx})" title="Remove">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
        
        confirmBtn.disabled = false;
    }
    
    document.getElementById('total-cost').textContent = `-${totalPoints} pts`;
    
    const remaining = currentBalance - totalPoints;
    const remainingEl = document.getElementById('remaining-balance');
    remainingEl.textContent = `${remaining} pts`;
    
    if (remaining < 0) {
        remainingEl.classList.remove('text-blue-800');
        remainingEl.classList.add('text-red-600');
        errBox.textContent = `Insufficient Balance! Need ${Math.abs(remaining)} more points.`;
        errBox.classList.remove('hidden');
        confirmBtn.disabled = true;
    } else {
        remainingEl.classList.remove('text-red-600');
        remainingEl.classList.add('text-blue-800');
    }
}

async function executeOrder() {
    if (!currentWallet || cart.length === 0) return;
    
    const totalCost = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (currentBalance < totalCost) return;
    
    const btn = document.getElementById('review-confirm-btn');
    const spinner = document.getElementById('review-spinner');
    
    btn.disabled = true;
    spinner.classList.remove('hidden');
    spinner.classList.add('animate-spin');
    
    try {
        const payload = {
            cardNumber: document.getElementById('card-number-input').value.trim(),
            customerId: currentCustomerId,
            items: cart
        };
        
        // Disable everything to prevent duplicate submission
        document.querySelectorAll('#attraction-grid > div').forEach(el => el.classList.add('pointer-events-none'));
        
        const response = await processMultiGameUsage(payload);
        
        if (response.status === 'success') {
            showResultModal(true, response);
            currentBalance = parseFloat(response.balance);
            document.getElementById('current-balance').textContent = `${currentBalance} pts`;
            cart = [];
            updateCartUI();
        }
        
    } catch (e) {
        let errData;
        try { errData = JSON.parse(e.message); } catch(ex) { errData = { message: e.message }; }
        
        if (errData.code === 'INSUFFICIENT_FUNDS') {
            showResultModal(false, errData);
        } else {
            alert("Error: " + errData.message);
        }
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
        spinner.classList.remove('animate-spin');
        document.querySelectorAll('#attraction-grid > div').forEach(el => el.classList.remove('pointer-events-none'));
    }
}

function showResultModal(isSuccess, data) {
    const modal = document.getElementById('result-modal');
    const content = document.getElementById('result-modal-content');
    
    if (isSuccess) {
        content.innerHTML = `
            <div class="bg-green-600 text-white p-6 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3">
                    <span class="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h2 class="text-xl font-bold">Transaction Complete</h2>
            </div>
            <div class="p-6 pb-4">
                <div class="flex justify-between mb-2">
                    <span class="text-slate-500">Bill ID</span>
                    <span class="font-semibold text-slate-800">${data.billId}</span>
                </div>
                <div class="flex justify-between mb-4 pb-4 border-b border-slate-200">
                    <span class="text-slate-500">Total Deducted</span>
                    <span class="font-bold text-red-600">-${data.cost} pts</span>
                </div>
                <div class="text-center">
                    <span class="block text-slate-500 text-sm mb-1">Remaining Balance</span>
                    <span class="text-3xl font-bold text-blue-800">${data.balance} pts</span>
                </div>
            </div>
            <div class="p-4 bg-slate-50 border-t border-slate-200">
                <button onclick="closeModal()" class="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Done</button>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="bg-red-600 text-white p-6 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3">
                    <span class="material-symbols-outlined text-4xl">cancel</span>
                </div>
                <h2 class="text-xl font-bold">Insufficient Points</h2>
            </div>
            <div class="p-6 pb-4 text-center">
                <div class="flex justify-between bg-red-50 p-3 rounded-t border border-red-200 border-b-0">
                    <span class="text-red-700 font-semibold">Required:</span>
                    <span class="font-bold text-red-700">${data.required} pts</span>
                </div>
                <div class="flex justify-between bg-slate-50 p-3 rounded-b border border-slate-200">
                    <span class="text-slate-600 font-semibold">Available:</span>
                    <span class="font-bold text-slate-800">${data.available} pts</span>
                </div>
            </div>
            <div class="p-4 bg-slate-50 border-t border-slate-200">
                <button onclick="closeModal()" class="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 transition-colors">Dismiss</button>
            </div>
        `;
    }
    
    modal.classList.remove('hidden');
}

window.closeModal = function() {
    document.getElementById('result-modal').classList.add('hidden');
};


function processMultiUsage() {

    if (cart.length === 0) return;
    
    let totalPointsUsed = cart.reduce((sum, item) => sum + item.total, 0);
    const balDisplay = document.getElementById('wallet-balance');
    let currentBalance = 0;
    if (balDisplay) currentBalance = parseFloat(balDisplay.textContent) || 0;
    
    const remaining = currentBalance - totalPointsUsed;
    
    const content = `
        <div class="space-y-4">
            <div class="bg-teal-50 border border-teal-100 p-4 rounded-lg">
                <div class="text-sm font-bold text-teal-800 mb-2">Ground Floor Game Usage</div>
                <div class="flex justify-between text-slate-700 font-medium mb-1">
                    <span>Previous Balance</span>
                    <span>● ${currentBalance}</span>
                </div>
                <div class="flex justify-between text-lg font-bold text-red-600 mt-2">
                    <span>Points Used</span>
                    <span>-● ${totalPointsUsed}</span>
                </div>
                <div class="flex justify-between text-lg font-bold text-teal-700 border-t border-teal-200 mt-2 pt-2">
                    <span>Remaining Balance</span>
                    <span>● ${remaining}</span>
                </div>
            </div>
            <div class="text-xs text-slate-500 italic text-center">* No INR payment required *</div>
        </div>
    `;
    
    document.getElementById('review-content').innerHTML = content;
    document.getElementById('review-modal').classList.remove('hidden');

}





