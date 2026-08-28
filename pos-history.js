/**
 * pos-history.js
 * Logic for Staff Transaction History Module
 */

let allTransactions = [];
let currentSession = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Enforce Auth
    currentSession = await requireStaffAuth();
    if (!currentSession) return;
    
    const appBody = document.getElementById('app-body');
    if (appBody) appBody.classList.remove('hidden');

    // 2. Load History
    await loadHistory();

    // 3. Bind Search and Filter Inputs
    const searchInput = document.getElementById('search-input');
    const quickSearchInput = document.getElementById('quick-search-input');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (quickSearchInput) quickSearchInput.value = searchInput.value;
            applyFilters();
        });
    }

    if (quickSearchInput) {
        quickSearchInput.addEventListener('input', () => {
            if (searchInput) searchInput.value = quickSearchInput.value;
            applyFilters();
        });
    }

    document.getElementById('time-filter').addEventListener('change', applyFilters);
    document.getElementById('staff-filter').addEventListener('change', applyFilters);
    document.getElementById('status-filter').addEventListener('change', applyFilters);
    
    document.querySelectorAll('.type-filter').forEach(cb => {
        cb.addEventListener('change', (e) => {
            if (e.target.value === "ALL") {
                if (e.target.checked) {
                    document.querySelectorAll('.type-filter').forEach(c => { if(c !== e.target) c.checked = false; });
                }
            } else {
                if (e.target.checked) {
                    const allCb = document.querySelector('.type-filter[value="ALL"]');
                    if (allCb) allCb.checked = false;
                }
            }
            applyFilters();
        });
    });

    // 4. Mobile Filter Drawer Handlers
    const mobileFilterBtn = document.getElementById('mobile-filter-btn');
    const closeFilterBtn = document.getElementById('close-filter-btn');
    const filterBackdrop = document.getElementById('filter-backdrop');
    const filterSidebar = document.getElementById('filter-sidebar');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

    function openMobileFilters() {
        if (filterSidebar) {
            filterSidebar.classList.remove('-translate-x-full');
            filterSidebar.classList.add('translate-x-0');
        }
        if (filterBackdrop) filterBackdrop.classList.remove('hidden');
    }

    function closeMobileFilters() {
        if (filterSidebar) {
            filterSidebar.classList.add('-translate-x-full');
            filterSidebar.classList.remove('translate-x-0');
        }
        if (filterBackdrop) filterBackdrop.classList.add('hidden');
    }

    if (mobileFilterBtn) mobileFilterBtn.addEventListener('click', openMobileFilters);
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', closeMobileFilters);
    if (filterBackdrop) filterBackdrop.addEventListener('click', closeMobileFilters);
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
            closeMobileFilters();
        });
    }
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (quickSearchInput) quickSearchInput.value = '';
            document.getElementById('time-filter').value = 'today';
            document.getElementById('staff-filter').value = 'me';
            document.getElementById('status-filter').value = 'ALL';
            document.querySelectorAll('.type-filter').forEach(cb => {
                cb.checked = (cb.value === 'ALL');
            });
            applyFilters();
            closeMobileFilters();
        });
    }
});

async function loadHistory() {
    const loading = document.getElementById('loading-history');
    const container = document.getElementById('table-container');
    
    try {
        const response = await fetchTransactionHistory();
        if (response && response.status === 'success') {
            allTransactions = response.history || [];
            if (loading) loading.classList.add('hidden');
            if (container) container.classList.remove('hidden');
            applyFilters();
        } else {
            throw new Error((response && response.message) || 'Failed to fetch');
        }
    } catch (e) {
        if (loading) {
            loading.innerHTML = `<div class="text-center p-6 bg-red-50 rounded-xl border border-red-200 max-w-md mx-auto"><span class="material-symbols-outlined text-red-500 text-3xl mb-1">error</span><p class="text-red-700 font-bold text-sm">Failed to load history</p><p class="text-xs text-red-500 mt-1">${e.message}</p></div>`;
        }
    }
}

function applyFilters() {
    const searchEl = document.getElementById('search-input') || document.getElementById('quick-search-input');
    const searchStr = searchEl ? searchEl.value.toLowerCase().trim() : '';
    const timeFilter = document.getElementById('time-filter').value;
    const staffFilter = document.getElementById('staff-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    const typeFilters = Array.from(document.querySelectorAll('.type-filter:checked')).map(cb => cb.value);
    const filterAllTypes = typeFilters.includes("ALL") || typeFilters.length === 0;

    const todayStr = new Date().toLocaleDateString('en-US');

    // Update active filter indicator on mobile
    const activeDot = document.getElementById('active-filter-dot');
    if (activeDot) {
        const hasCustomFilters = timeFilter !== 'today' || staffFilter !== 'me' || statusFilter !== 'ALL' || !filterAllTypes;
        if (hasCustomFilters) {
            activeDot.classList.remove('hidden');
        } else {
            activeDot.classList.add('hidden');
        }
    }

    const filtered = allTransactions.filter(txn => {
        // 1. Search (ID, Phone, Name, Card)
        if (searchStr) {
            const idMatch = txn.id && txn.id.toLowerCase().includes(searchStr);
            const nameMatch = txn.customerName && txn.customerName.toLowerCase().includes(searchStr);
            const phoneMatch = txn.customerPhone && String(txn.customerPhone).includes(searchStr);
            const cardMatch = txn.cardNumber && String(txn.cardNumber).includes(searchStr);
            if (!idMatch && !nameMatch && !phoneMatch && !cardMatch) return false;
        }
        
        // 2. Timeframe
        if (timeFilter === 'today' && new Date(txn.date).toLocaleDateString('en-US') !== todayStr) return false;
        
        // 3. Staff
        if (staffFilter === 'me' && currentSession && txn.staff !== currentSession.email) return false;
        
        // 4. Type
        if (!filterAllTypes && !typeFilters.includes(txn.type)) return false;
        
        // 5. Status
        if (statusFilter !== 'ALL' && txn.status !== statusFilter) return false;
        
        return true;
    });
    
    renderTable(filtered);
}

function renderTable(data) {
    const tbody = document.getElementById('history-tbody');
    const cardsContainer = document.getElementById('history-cards');
    const noRes = document.getElementById('no-results');
    const resultCount = document.getElementById('result-count');
    
    if (resultCount) resultCount.textContent = data.length;
    
    if (tbody) tbody.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';
    
    if (data.length === 0) {
        if (noRes) noRes.classList.remove('hidden');
    } else {
        if (noRes) noRes.classList.add('hidden');
        
        data.forEach(txn => {
            // Format Status Badge
            let statusBadge = `<span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">${txn.status}</span>`;
            if (txn.status === 'COMPLETED') statusBadge = `<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">COMPLETED</span>`;
            if (txn.status === 'CHECKED_IN') statusBadge = `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">CHECKED IN</span>`;
            if (txn.status === 'CANCELLED' || txn.status === 'REFUNDED') statusBadge = `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">${txn.status}</span>`;
            
            // Format Type Colors
            let typeColor = "text-slate-600";
            let typeBg = "bg-slate-50 border-slate-200";
            if (txn.type === "First Floor") {
                typeColor = "text-orange-600";
                typeBg = "bg-orange-50 border-orange-200";
            } else if (txn.type === "Outdoor") {
                typeColor = "text-green-600";
                typeBg = "bg-green-50 border-green-200";
            } else if (txn.type.includes("Recharge")) {
                typeColor = "text-blue-600";
                typeBg = "bg-blue-50 border-blue-200";
            } else if (txn.type.includes("Usage")) {
                typeColor = "text-teal-600";
                typeBg = "bg-teal-50 border-teal-200";
            } else if (txn.type.includes("Add-on")) {
                typeColor = "text-pink-600";
                typeBg = "bg-pink-50 border-pink-200";
            }

            let custDisplay = `<div class="font-bold text-slate-800 text-sm">${txn.customerName || 'Walk-in Guest'}</div>`;
            if (txn.customerPhone) custDisplay += `<div class="text-xs text-slate-400 font-mono">${txn.customerPhone}</div>`;
            if (txn.cardNumber) custDisplay += `<div class="text-xs text-slate-400 font-mono">Card: ${txn.cardNumber}</div>`;
            
            let amtDisplay = txn.amount > 0 ? `₹${parseFloat(txn.amount).toLocaleString('en-IN')}` : '-';
            let ptsDisplay = txn.points > 0 ? `●${txn.points} pts` : '';

            // Action Button
            const actionBtnHtml = txn.status === 'COMPLETED' ? 
                `<button onclick="openRefundModal('${txn.id}', '${txn.type}', ${txn.amount}, ${txn.points}, '${(txn.customerName || '').replace(/'/g, "\\'")}', '${(txn.cardNumber || '').replace(/'/g, "\\'")}')" class="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded text-xs font-bold transition-colors">REVERSE</button>` : 
                `<span class="text-slate-300 text-xs">-</span>`;

            // 1. Desktop Table Row
            if (tbody) {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition-colors";
                tr.innerHTML = `
                    <td class="py-3 px-4">
                        <div class="font-bold text-slate-800 text-xs">${txn.time || '-'}</div>
                        <div class="text-[11px] text-slate-400">${txn.date || '-'}</div>
                    </td>
                    <td class="py-3 px-4 font-mono text-xs text-slate-600 font-semibold">${txn.id}</td>
                    <td class="py-3 px-4">${custDisplay}</td>
                    <td class="py-3 px-4 font-bold ${typeColor} text-xs uppercase tracking-wide">${txn.type}</td>
                    <td class="py-3 px-4 text-right font-bold text-slate-900">${amtDisplay}</td>
                    <td class="py-3 px-4 text-right font-bold text-blue-700 text-xs">${ptsDisplay || '-'}</td>
                    <td class="py-3 px-4 text-xs text-slate-500 max-w-[120px] truncate" title="${txn.staff}">${txn.staff ? txn.staff.split('@')[0] : '-'}</td>
                    <td class="py-3 px-4">${statusBadge}</td>
                    <td class="py-3 px-4 text-right">${actionBtnHtml}</td>
                `;
                tbody.appendChild(tr);
            }

            // 2. Mobile Responsive Card
            if (cardsContainer) {
                const card = document.createElement('div');
                card.className = "bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col gap-2.5";
                
                let mobilePtsHtml = ptsDisplay ? `<span class="text-xs font-bold text-blue-700">${ptsDisplay}</span>` : '';
                
                card.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">${txn.id}</span>
                        ${statusBadge}
                    </div>
                    <div class="flex justify-between items-start pt-1">
                        <div>
                            <div class="font-bold text-sm text-slate-800">${txn.customerName || 'Walk-in Guest'}</div>
                            ${txn.customerPhone ? `<div class="text-xs text-slate-400 font-mono">${txn.customerPhone}</div>` : ''}
                            ${txn.cardNumber ? `<div class="text-xs text-slate-400 font-mono">Card: ${txn.cardNumber}</div>` : ''}
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-base text-slate-900">${amtDisplay}</div>
                            ${mobilePtsHtml}
                        </div>
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span class="font-bold ${typeColor} uppercase tracking-wide text-xs px-2 py-0.5 rounded border ${typeBg}">${txn.type}</span>
                        <span class="text-slate-400 text-[11px]">${txn.date} ${txn.time}</span>
                    </div>
                    <div class="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span class="truncate text-[11px]"><span class="text-slate-400">Staff:</span> ${txn.staff ? txn.staff.split('@')[0] : '-'}</span>
                        <div>${actionBtnHtml}</div>
                    </div>
                `;
                cardsContainer.appendChild(card);
            }
        });
    }
}

// --- Refund / Reversal Logic ---
function openRefundModal(id, type, amount, points, custName, cardNo) {
    document.getElementById('refund-txn-id').value = id;
    document.getElementById('refund-txn-type').value = type;
    
    document.getElementById('refund-display-id').textContent = id;
    
    let amtDisplay = [];
    if (amount > 0) amtDisplay.push(`₹${amount}`);
    if (points > 0) amtDisplay.push(`●${points}`);
    document.getElementById('refund-display-amt').textContent = amtDisplay.join(' / ');
    
    let cDisp = custName;
    if (cardNo) cDisp += ` (Card: ${cardNo})`;
    document.getElementById('refund-display-cust').textContent = cDisp;
    
    document.getElementById('refund-reason').value = "";
    document.getElementById('auth-email').value = "";
    document.getElementById('auth-pass').value = "";
    document.getElementById('refund-error').classList.add('hidden');
    
    document.getElementById('refund-modal').classList.remove('hidden');
}

document.getElementById('refund-cancel-btn').addEventListener('click', () => {
    document.getElementById('refund-modal').classList.add('hidden');
});

document.getElementById('refund-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('refund-submit-btn');
    const errBox = document.getElementById('refund-error');
    errBox.classList.add('hidden');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Processing...';
    
    const payload = {
        transactionId: document.getElementById('refund-txn-id').value,
        type: document.getElementById('refund-txn-type').value,
        reason: document.getElementById('refund-reason').value,
        authEmail: document.getElementById('auth-email').value,
        authPass: document.getElementById('auth-pass').value
    };
    
    try {
        const res = await processRefundRequest(payload);
        if (res && res.status === 'success') {
            document.getElementById('refund-modal').classList.add('hidden');
            await loadHistory();
        } else {
            throw new Error((res && res.message) || "Failed to process reversal");
        }
    } catch (err) {
        errBox.textContent = err.message;
        errBox.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Authorize Reversal</span>';
    }
});
