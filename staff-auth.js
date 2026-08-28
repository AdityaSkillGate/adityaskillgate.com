/**
 * staff-auth.js
 * Handles authentication for the Staff POS system.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // If on login page and already logged in, redirect to POS
    if (window.location.pathname.includes('login')) {
        const session = await validateAdminSession();
        if (session && session.status === 'success') {
            window.location.href = 'staff-pos.html';
            return;
        }
    }
    
    const loginForm = document.getElementById('staff-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');
            const spinner = document.getElementById('login-spinner');
            const errBox = document.getElementById('login-error');
            const errText = document.getElementById('login-error-text');
            
            // UI Loading state
            btn.disabled = true;
            spinner.classList.remove('hidden');
            spinner.classList.add('animate-spin');
            errBox.classList.add('hidden');
            
            try {
                // Reuse existing adminLogin from api.js
                const response = await adminLogin(email, password);
                
                if (response.status === 'success') {
                    // Set session
                    sessionStorage.setItem('adminToken', response.token);
                    sessionStorage.setItem('adminRole', response.role);
                    sessionStorage.setItem('adminEmail', response.email);
                    
                    // Redirect to POS
                    window.location.href = 'staff-pos.html';
                } else {
                    errText.textContent = response.message || "Invalid credentials.";
                    errBox.classList.remove('hidden');
                }
            } catch (error) {
                console.error("Login error:", error);
                errText.textContent = "Connection error. Please try again.";
                errBox.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                spinner.classList.add('hidden');
                spinner.classList.remove('animate-spin');
            }
        });
    }
});

// Helper for POS page to enforce auth
async function requireStaffAuth() {
    const session = await validateAdminSession();
    if (!session || session.status !== 'success') {
        window.location.href = 'staff-login.html';
        return null;
    }
    return session;
}


// Global Page Transition Loading Spinner
document.addEventListener('DOMContentLoaded', () => {
    // Inject spinner overlay
    const overlay = document.createElement('div');
    overlay.id = 'global-page-loader';
    overlay.innerHTML = '<div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>';
    overlay.className = 'fixed inset-0 bg-white/80 z-[9999] flex items-center justify-center hidden transition-opacity duration-300';
    document.body.appendChild(overlay);

    // Intercept clicks on links
    document.querySelectorAll('a[href]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                e.preventDefault();
                overlay.classList.remove('hidden');
                setTimeout(() => {
                    window.location.href = href;
                }, 100);
            }
        });
    });
});
