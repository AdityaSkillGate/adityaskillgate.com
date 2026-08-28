/**
 * pos-shift.js
 * Logic for Staff Shift Management
 */

let currentSession = null;

document.addEventListener('DOMContentLoaded', async () => {
    currentSession = await requireStaffAuth();
    if (!currentSession) return;
    
    document.getElementById('app-body').classList.remove('hidden');
    document.getElementById('os-staff-name').textContent = currentSession.email;
    
    await loadShiftData();

    document.getElementById('open-shift-form').addEventListener('submit', handleOpenShift);
    document.getElementById('close-shift-form').addEventListener('submit', handleCloseShift);
});

async function loadShiftData() {
    const loading = document.getElementById('loading-area');
    const openUI = document.getElementById('open-shift-ui');
    const activeUI = document.getElementById('active-shift-ui');
    
    loading.classList.remove('hidden');
    openUI.classList.add('hidden');
    activeUI.classList.add('hidden');
    
    try {
        const res = await getShiftStatus();
        loading.classList.add('hidden');
        
        if (res.status === 'success') {
            if (res.shift) {
                // Render Active Shift
                const s = res.shift;
                document.getElementById('as-shift-id').textContent = s.id;
                document.getElementById('as-start-time').textContent = new Date(s.startTime).toLocaleString('en-US');
                
                const t = s.liveTotals || {};
                document.getElementById('stat-opening').textContent = `₹${s.openingCash}`;
                document.getElementById('stat-cash').textContent = `+₹${t.cash || 0}`;
                document.getElementById('stat-refunds').textContent = `-₹${t.refunds || 0}`;
                document.getElementById('stat-expected').textContent = `₹${t.expectedCash || 0}`;
                
                document.getElementById('stat-upi').textContent = `₹${t.upi || 0}`;
                document.getElementById('stat-card').textContent = `₹${t.card || 0}`;
                document.getElementById('stat-recharges').textContent = `₹${t.recharges || 0}`;
                document.getElementById('stat-coupons').textContent = `₹${t.coupons || 0}`;
                
                activeUI.classList.remove('hidden');
            } else {
                // Render Open Shift form
                openUI.classList.remove('hidden');
                document.getElementById('opening-cash').focus();
            }
        } else {
            throw new Error(res.message);
        }
    } catch(e) {
        loading.innerHTML = `<span class="text-red-600 font-bold">Failed to load shift: ${e.message}</span>`;
    }
}

async function handleOpenShift(e) {
    e.preventDefault();
    const btn = document.getElementById('os-submit-btn');
    const errBox = document.getElementById('os-error');
    errBox.classList.add('hidden');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Opening...';
    
    try {
        const amt = document.getElementById('opening-cash').value;
        const res = await openShift(amt);
        if (res.status === 'success') {
            await loadShiftData();
        } else {
            throw new Error(res.message);
        }
    } catch(e) {
        errBox.textContent = e.message;
        errBox.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">lock_open</span> Open Shift';
    }
}

async function handleCloseShift(e) {
    e.preventDefault();
    
    if (!confirm("Are you sure you want to CLOSE this shift? This action cannot be undone.")) return;
    
    const btn = document.getElementById('cs-submit-btn');
    const errBox = document.getElementById('cs-error');
    errBox.classList.add('hidden');
    
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Closing...';
    
    try {
        const amt = document.getElementById('actual-cash').value;
        const res = await closeShift(amt);
        if (res.status === 'success') {
            const diff = res.difference;
            let msg = `Shift Closed!\nDifference: ₹${diff}`;
            if (diff !== 0) msg += `\n\nWarning: Cash drawer is ${diff > 0 ? 'OVER' : 'SHORT'} by ₹${Math.abs(diff)}`;
            alert(msg);
            
            // Redirect to dashboard
            window.location.href = 'staff-pos.html';
        } else {
            throw new Error(res.message);
        }
    } catch(e) {
        errBox.textContent = e.message;
        errBox.classList.remove('hidden');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined">lock</span> Close Shift';
    }
}
