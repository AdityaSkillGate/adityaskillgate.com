/**
 * pos.js
 * Logic for the Staff POS Dashboard
 */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Enforce Authentication
    const session = await requireStaffAuth();
    if (!session) return;
    
    // Unhide body once authenticated
    const appBody = document.getElementById("app-body");
    if (appBody) appBody.classList.remove("hidden");

    // 2. Set UI Elements (with null guards so we never crash)
    const staffNameEl = document.getElementById("staff-name");
    const staffRoleEl = document.getElementById("staff-role");
    const staffNameMobileEl = document.getElementById("staff-name-mobile");
    const currentDateEl = document.getElementById("current-date");
    const logoutBtn = document.getElementById("logout-btn");

    const displayName = session.email ? session.email.split("@")[0].toUpperCase() : "STAFF";
    const displayRole = session.role || "Staff";

    if (staffNameEl) staffNameEl.textContent = displayName;
    if (staffRoleEl) staffRoleEl.textContent = displayRole;
    if (staffNameMobileEl) staffNameMobileEl.textContent = displayName;

    // Set Date
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    if (currentDateEl) currentDateEl.textContent = new Date().toLocaleDateString("en-IN", options);

    // 3. Logout Handler
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            if (confirm("Are you sure you want to log out?")) {
                await logoutAdmin();
                window.location.href = "staff-login.html";
            }
        });
    }

    // 4. Load Real Data from History
    async function loadDashboardStats() {
        const statIds = ["stat-visitors", "stat-transactions", "stat-revenue", "stat-wallets", "stat-recharges"];
        statIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "...";
        });

        try {
            const today = new Date().toISOString().split("T")[0];
            const res = await fetchTransactionHistory({ startDate: today, endDate: today });
            if (res && res.status === "success" && Array.isArray(res.history)) {
                let visitors = 0;
                let transactions = res.history.length;
                let revenue = 0;
                let wallets = 0;
                let recharges = 0;

                res.history.forEach(tx => {
                    revenue += parseFloat(tx.amount || 0);
                    const txId = String(tx.id || "");
                    if (txId.startsWith("B-FF") || txId.startsWith("B-OUT")) {
                        visitors += 2;
                    }
                    if (txId.startsWith("B-GF") && parseFloat(tx.amount) > 0) {
                        recharges += parseFloat(tx.amount);
                        wallets += 1;
                    }
                });

                const setEl = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = val;
                };

                setEl("stat-transactions", transactions);
                setEl("stat-revenue", "\u20B9" + revenue.toLocaleString("en-IN"));
                setEl("stat-wallets", wallets);
                setEl("stat-recharges", "\u20B9" + recharges.toLocaleString("en-IN"));
                setEl("stat-visitors", visitors > 0 ? visitors + "+" : "0");
            } else {
                statIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = "-";
                });
            }
        } catch (e) {
            console.error("Dashboard stats error:", e);
            statIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = "-";
            });
        }
    }

    loadDashboardStats();
});
