/**
 * pos-checkin.js
 * Logic for Staff QR Validation / Check-in Module
 */

let currentOrder = null;
let html5QrCode = null;
let cameraActive = false;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Enforce Auth
    const session = await requireStaffAuth();
    if (!session) return;
    
    const appBody = document.getElementById('app-body');
    if (appBody) appBody.classList.remove('hidden');

    const qrInput = document.getElementById('qr-input');
    const form = document.getElementById('qr-form');
    
    // Focus input on load for barcode scanner devices
    if (qrInput) qrInput.focus();

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = qrInput.value.trim().toUpperCase();
            if(!code) return;
            
            await handleScan(code);
        });
    }
    
    const rejectBtn = document.getElementById('reject-btn');
    if (rejectBtn) rejectBtn.addEventListener('click', resetView);

    // 2. Camera Toggle Button Listener
    const toggleBtn = document.getElementById('toggle-camera-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', async () => {
            if (cameraActive) {
                await stopCamera();
            } else {
                await startCamera();
            }
        });
    }
});

async function handleScan(code) {
    const errorBox = document.getElementById('scan-error');
    if (errorBox) errorBox.classList.add('hidden');
    
    const resArea = document.getElementById('result-area');
    const walletArea = document.getElementById('wallet-area');
    const loadingArea = document.getElementById('loading-area');

    if (resArea) resArea.classList.add('hidden');
    if (walletArea) walletArea.classList.add('hidden');
    if (loadingArea) loadingArea.classList.remove('hidden');
    
    try {
        const res = await validateQR(code);
        if (loadingArea) loadingArea.classList.add('hidden');
        
        if (res && res.status === 'success') {
            if (res.type === 'WALLET') {
                showWalletInfo(res.data);
            } else if (res.type === 'BOOKING') {
                showBookingInfo(res.data);
            }
        } else {
            throw new Error((res && res.message) || "Invalid QR Code");
        }
    } catch(e) {
        if (loadingArea) loadingArea.classList.add('hidden');
        if (errorBox) {
            errorBox.textContent = e.message;
            errorBox.classList.remove('hidden');
        }
        const qrInput = document.getElementById('qr-input');
        if (qrInput) {
            qrInput.value = "";
            qrInput.focus();
        }
    }
}

function showWalletInfo(data) {
    document.getElementById('wallet-bal').textContent = `● ${data.balance} pts`;
    document.getElementById('wallet-id').textContent = `Card: ${data.cardNumber}`;
    document.getElementById('wallet-area').classList.remove('hidden');
    const qrInput = document.getElementById('qr-input');
    if (qrInput) {
        qrInput.value = "";
        qrInput.focus();
    }
}

function showBookingInfo(data) {
    currentOrder = data;
    const area = document.getElementById('result-area');
    const badge = document.getElementById('status-badge');
    const checkinBtn = document.getElementById('checkin-btn');
    
    document.getElementById('res-customer').textContent = data.customer || "Guest";
    document.getElementById('res-order').textContent = `Order ID: ${data.orderId}`;
    
    // Status Logic
    if (data.status === 'COMPLETED') {
        badge.textContent = "Valid Booking";
        badge.className = "mb-4 inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-green-100 text-green-800";
        checkinBtn.classList.remove('hidden');
    } else if (data.status === 'CHECKED_IN') {
        badge.textContent = "Already Checked In";
        badge.className = "mb-4 inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-red-100 text-red-800";
        checkinBtn.classList.add('hidden');
    } else if (data.status === 'CANCELLED') {
        badge.textContent = "Cancelled";
        badge.className = "mb-4 inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-red-100 text-red-800";
        checkinBtn.classList.add('hidden');
    } else {
        badge.textContent = data.status || "UNKNOWN";
        badge.className = "mb-4 inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800";
        checkinBtn.classList.add('hidden');
    }
    
    // Items list
    const itemsBox = document.getElementById('res-items');
    itemsBox.innerHTML = "";
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            const div = document.createElement('div');
            div.className = "flex justify-between font-bold text-slate-700 text-sm";
            const vType = item.visitorType && item.visitorType !== 'Mixed' ? ' (' + item.visitorType + ')' : '';
            div.innerHTML = '<span>' + item.name + vType + '</span><span>x' + item.qty + '</span>';
            itemsBox.appendChild(div);
        });
    } else {
        itemsBox.innerHTML = '<div class="text-slate-400 text-sm italic">No items found</div>';
    }
    
    // Add member counts if applicable
    let adultCount = 0;
    let childCount = 0;
    if (data.items) {
        data.items.forEach(item => {
            if (item.visitorType === "Adult") adultCount += parseInt(item.qty || 0);
            if (item.visitorType === "Child") childCount += parseInt(item.qty || 0);
        });
    }
    if (adultCount > 0 || childCount > 0) {
        const memDiv = document.createElement('div');
        memDiv.className = "mt-4 pt-4 border-t border-slate-200 flex justify-between font-bold text-slate-700 text-sm";
        memDiv.innerHTML = `<span>Members:</span><span>${adultCount} Adults, ${childCount} Children</span>`;
        itemsBox.appendChild(memDiv);
    }
    
    area.classList.remove('hidden');
    
    const qrInput = document.getElementById('qr-input');
    if (qrInput) qrInput.value = "";
    
    // Bind checkin logic cleanly
    const newBtn = checkinBtn.cloneNode(true);
    checkinBtn.parentNode.replaceChild(newBtn, checkinBtn);
    newBtn.addEventListener('click', async () => {
        newBtn.disabled = true;
        newBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Processing...';
        
        try {
            const res = await processCheckIn(currentOrder.orderId);
            if (res && res.status === 'success') {
                badge.textContent = "Checked In Successfully!";
                badge.className = "mb-4 inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-green-600 text-white shadow-lg";
                newBtn.classList.add('hidden');
                setTimeout(resetView, 2000);
            } else {
                throw new Error((res && res.message) || "Check-in failed");
            }
        } catch (e) {
            alert(e.message || "Failed to check in");
            newBtn.disabled = false;
            newBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> <span>Check In</span>';
        }
    });
}

function resetView() {
    currentOrder = null;
    const resArea = document.getElementById('result-area');
    const walletArea = document.getElementById('wallet-area');
    const errorBox = document.getElementById('scan-error');
    const qrInput = document.getElementById('qr-input');

    if (resArea) resArea.classList.add('hidden');
    if (walletArea) walletArea.classList.add('hidden');
    if (errorBox) errorBox.classList.add('hidden');
    if (qrInput) {
        qrInput.value = "";
        qrInput.focus();
    }
}

// -------------------------------------------------------------
// Camera Scanner Logic using Html5Qrcode core API
// -------------------------------------------------------------
async function startCamera() {
    const toggleBtn = document.getElementById('toggle-camera-btn');
    const readerDiv = document.getElementById('reader');
    const errorBox = document.getElementById('scan-error');
    if (errorBox) errorBox.classList.add('hidden');

    if (!window.Html5Qrcode) {
        if (errorBox) {
            errorBox.textContent = "QR Scanner library not loaded. Please check internet connection.";
            errorBox.classList.remove('hidden');
        }
        return;
    }

    try {
        if (readerDiv) readerDiv.classList.remove('hidden');
        if (toggleBtn) {
            toggleBtn.disabled = true;
            toggleBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">progress_activity</span><span>Starting camera...</span>';
        }

        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader");
        }

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        // Attempt 1: Try environment camera directly
        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                onScanSuccess,
                onScanFailure
            );
        } catch (envErr) {
            console.warn("Direct environment camera request failed, enumerating cameras:", envErr);
            // Attempt 2: Query camera devices
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
                const backCam = cameras.find(c => c.label && (c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') || c.label.toLowerCase().includes('environment')));
                const selectedCameraId = backCam ? backCam.id : cameras[0].id;
                await html5QrCode.start(
                    selectedCameraId,
                    config,
                    onScanSuccess,
                    onScanFailure
                );
            } else {
                // Attempt 3: User facing camera
                await html5QrCode.start(
                    { facingMode: "user" },
                    config,
                    onScanSuccess,
                    onScanFailure
                );
            }
        }

        cameraActive = true;
        if (toggleBtn) {
            toggleBtn.disabled = false;
            toggleBtn.className = "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 mx-auto transition-colors shadow-sm";
            toggleBtn.innerHTML = '<span class="material-symbols-outlined">videocam_off</span><span>Stop Camera</span>';
        }
    } catch (err) {
        console.error("Camera startup error:", err);
        if (errorBox) {
            errorBox.textContent = "Camera access error: " + (err.message || err);
            errorBox.classList.remove('hidden');
        }
        await stopCamera();
    }
}

async function stopCamera() {
    const toggleBtn = document.getElementById('toggle-camera-btn');
    const readerDiv = document.getElementById('reader');

    if (html5QrCode) {
        try {
            if (html5QrCode.isScanning) {
                await html5QrCode.stop();
            }
            html5QrCode.clear();
        } catch (e) {
            console.warn("Camera stop error:", e);
        }
        html5QrCode = null;
    }

    if (readerDiv) {
        readerDiv.innerHTML = '';
        readerDiv.classList.add('hidden');
    }
    cameraActive = false;

    if (toggleBtn) {
        toggleBtn.disabled = false;
        toggleBtn.className = "bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 mx-auto transition-colors shadow-sm";
        toggleBtn.innerHTML = '<span class="material-symbols-outlined">photo_camera</span><span>Use Mobile Camera</span>';
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    const qrInput = document.getElementById('qr-input');
    if (qrInput) qrInput.value = decodedText;
    await stopCamera();
    const form = document.getElementById('qr-form');
    if (form) {
        form.dispatchEvent(new Event('submit'));
    }
}

function onScanFailure(error) {
    // Continuously scanning frame-by-frame, failures are expected until QR is detected
}
