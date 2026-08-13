/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — ADMIN JS
   js/admin.js — Admin panel shared logic
   ============================================================ */

/* ====== AUTH GUARD (runs immediately, before DOM load) ====== */
(function() {
  const page = window.location.pathname.split('/').pop();
  if (page === 'login.html') return; // skip guard on login page
  const token = sessionStorage.getItem('admin_token');
  if (!token) {
    window.location.replace('login.html');
  }
})();

document.addEventListener('DOMContentLoaded', () => {

  /* ====== SIDEBAR COLLAPSE ====== */
  const sidebar = document.getElementById('admin-sidebar');
  // Support both sidebar-collapse (old) and sidebar-toggle (new admin pages)
  const collapseBtn = document.getElementById('sidebar-collapse') || document.getElementById('sidebar-toggle');
  const adminMain = document.getElementById('admin-main') || document.querySelector('.admin-main');
  const SIDEBAR_KEY = 'asg_sidebar_collapsed';

  function applySidebarState() {
    const isCollapsed = localStorage.getItem(SIDEBAR_KEY) === 'true';
    sidebar?.classList.toggle('collapsed', isCollapsed);
    if (adminMain) adminMain.style.marginLeft = isCollapsed ? '70px' : '260px';
    if (collapseBtn) {
      collapseBtn.innerHTML = isCollapsed
        ? '<i class="fas fa-chevron-right"></i>'
        : '<i class="fas fa-bars"></i>';
    }
  }

  collapseBtn?.addEventListener('click', () => {
    const isCollapsed = sidebar?.classList.contains('collapsed');
    localStorage.setItem(SIDEBAR_KEY, (!isCollapsed).toString());
    applySidebarState();
  });

  applySidebarState();

  /* ====== MOBILE SIDEBAR TOGGLE ====== */
  const topbarToggle = document.getElementById('topbar-toggle');
  topbarToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
  });

  /* Close sidebar on outside click (mobile) */
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 992 && sidebar && !sidebar.contains(e.target) && !topbarToggle?.contains(e.target)) {
      sidebar.classList.remove('mobile-open');
    }
  });

  /* ====== ACTIVE SIDEBAR LINK ====== */
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path) link.classList.add('active');
  });

  /* ====== THEME TOGGLE ====== */
  const themeKey = 'asg_theme';
  const savedTheme = localStorage.getItem(themeKey) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Support both .theme-toggle and #admin-theme-btn
  const themeIcon = s => s === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  const allThemeBtns = () => document.querySelectorAll('.theme-toggle, .theme-btn, #admin-theme-btn');
  allThemeBtns().forEach(btn => { btn.innerHTML = themeIcon(savedTheme); });

  document.addEventListener('click', e => {
    const btn = e.target.closest('.theme-toggle, .theme-btn, #admin-theme-btn');
    if (!btn) return;
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(themeKey, next);
    allThemeBtns().forEach(b => { b.innerHTML = themeIcon(next); });
  });

  /* ====== MODAL MANAGEMENT ====== */
  // Use 'active' class — matching our admin page CSS (.modal-overlay.active { display: flex; })
  window.openAdminModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeAdminModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Alias: openModal / closeModal for pages that call the shorter name
  window.openModal = window.openAdminModal;
  window.closeModal = window.closeAdminModal;

  /* Close on overlay click */
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  /* ====== GENERIC CRUD TABLE MANAGER ====== */
  window.AdminTable = class AdminTable {
    constructor({ tableId, data, columns, onEdit, onDelete, onToggle, searchField }) {
      this.tableId = tableId;
      this.data = [...data];
      this.filtered = [...data];
      this.columns = columns;
      this.onEdit = onEdit;
      this.onDelete = onDelete;
      this.onToggle = onToggle;
      this.searchField = searchField;
      this.page = 1;
      this.pageSize = 10;
      this.render();
      this.bindSearch();
    }

    render() {
      const tbody = document.querySelector(`#${this.tableId} tbody`);
      if (!tbody) return;
      const start = (this.page - 1) * this.pageSize;
      const pageData = this.filtered.slice(start, start + this.pageSize);

      tbody.innerHTML = pageData.length === 0
        ? `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--gray-400)">
            <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:10px"></i>
            No records found</td></tr>`
        : pageData.map((row, i) => `
          <tr data-id="${row.id || i}">
            ${this.columns.map(col => `<td>${col.render(row)}</td>`).join('')}
            <td>
              <div class="action-btns">
                ${this.onEdit ? `<button class="action-btn action-btn-edit edit-btn" data-id="${row.id}" title="Edit"><i class="fas fa-edit"></i></button>` : ''}
                ${this.onToggle ? `<button class="action-btn action-btn-toggle toggle-btn" data-id="${row.id}" title="Toggle Status"><i class="fas fa-toggle-on"></i></button>` : ''}
                ${this.onDelete ? `<button class="action-btn action-btn-delete delete-btn" data-id="${row.id}" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
              </div>
            </td>
          </tr>
        `).join('');

      /* Bind action buttons */
      tbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = this.data.find(d => d.id === btn.dataset.id);
          if (item && this.onEdit) this.onEdit(item);
        });
      });

      tbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Are you sure you want to delete this record?')) {
            this.data = this.data.filter(d => d.id !== btn.dataset.id);
            this.filtered = this.filtered.filter(d => d.id !== btn.dataset.id);
            if (this.onDelete) this.onDelete(btn.dataset.id);
            this.render();
            showAdminToast('Record deleted successfully', 'success');
          }
        });
      });

      tbody.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = this.data.find(d => d.id === btn.dataset.id);
          if (item && this.onToggle) this.onToggle(item);
          this.render();
        });
      });

      this.renderPagination();
    }

    renderPagination() {
      const totalPages = Math.ceil(this.filtered.length / this.pageSize);
      const paginationEl = document.querySelector(`#${this.tableId}-pagination`);
      if (!paginationEl) return;
      paginationEl.querySelector('.pagination-info').textContent =
        `Showing ${Math.min((this.page - 1) * this.pageSize + 1, this.filtered.length)}–${Math.min(this.page * this.pageSize, this.filtered.length)} of ${this.filtered.length}`;

      const btns = paginationEl.querySelector('.pagination-btns');
      if (!btns) return;
      btns.innerHTML = [
        `<button class="page-btn" ${this.page === 1 ? 'disabled' : ''} id="prev-page"><i class="fas fa-chevron-left"></i></button>`,
        ...Array.from({ length: Math.min(totalPages, 5) }, (_, i) =>
          `<button class="page-btn ${this.page === i + 1 ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`),
        `<button class="page-btn" ${this.page === totalPages ? 'disabled' : ''} id="next-page"><i class="fas fa-chevron-right"></i></button>`
      ].join('');

      btns.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => { this.page = parseInt(btn.dataset.page); this.render(); });
      });
      btns.querySelector('#prev-page')?.addEventListener('click', () => { if (this.page > 1) { this.page--; this.render(); } });
      btns.querySelector('#next-page')?.addEventListener('click', () => { if (this.page < totalPages) { this.page++; this.render(); } });
    }

    bindSearch() {
      const searchInput = document.getElementById(`${this.tableId}-search`);
      if (searchInput && this.searchField) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.toLowerCase();
          this.filtered = this.data.filter(d =>
            (d[this.searchField] || '').toLowerCase().includes(q)
          );
          this.page = 1;
          this.render();
        });
      }

      /* Status filter */
      const statusFilter = document.getElementById(`${this.tableId}-status`);
      if (statusFilter) {
        statusFilter.addEventListener('change', () => {
          const val = statusFilter.value;
          this.filtered = !val ? this.data : this.data.filter(d => d.status === val);
          this.page = 1;
          this.render();
        });
      }
    }

    addRecord(record) {
      record.id = record.id || 'r_' + Date.now();
      this.data.unshift(record);
      this.filtered = [...this.data];
      this.page = 1;
      this.render();
    }

    updateRecord(id, updates) {
      const idx = this.data.findIndex(d => d.id === id);
      if (idx !== -1) { this.data[idx] = { ...this.data[idx], ...updates }; }
      const fidx = this.filtered.findIndex(d => d.id === id);
      if (fidx !== -1) { this.filtered[fidx] = { ...this.filtered[fidx], ...updates }; }
      this.render();
    }
  };

  /* ====== ADMIN TOAST ====== */
  window.showAdminToast = function(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toast-container') || (() => {
      const c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
      return c;
    })();

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-msg">${message}</span>
      <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  window.showToast = window.showAdminToast;

  /* ====== FORM VALIDATION ====== */
  window.validateAdminForm = function(formEl) {
    let valid = true;
    formEl.querySelectorAll('[required]').forEach(field => {
      const error = field.parentElement.querySelector('.form-error');
      field.classList.remove('error');
      if (error) error.textContent = '';
      if (!field.value.trim()) {
        valid = false;
        field.classList.add('error');
        if (error) error.textContent = 'This field is required';
      }
    });
    return valid;
  };

  /* ====== CSV EXPORT ====== */
  window.exportToCSV = function(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ====== STATUS BADGE HELPER ====== */
  window.statusBadge = function(status) {
    const map = {
      'Active': 'status-active', 'Published': 'status-published', 'Open': 'status-open',
      'Inactive': 'status-inactive', 'Draft': 'status-draft', 'Closed': 'status-closed',
      'New': 'status-new', 'Reviewed': 'status-reviewed', 'Shortlisted': 'status-shortlisted',
      'Rejected': 'status-rejected', 'Read': 'status-read', 'Completed': 'status-completed',
      'Ongoing': 'status-ongoing'
    };
    const cls = map[status] || 'status-inactive';
    return `<span class="status-badge ${cls}">${status}</span>`;
  };

  /* ====== AVATAR HELPER ====== */
  window.avatarDiv = function(name, size = 36) {
    const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['#0096D6', '#0D1B4C', '#6CCB2F', '#f59e0b', '#8b5cf6', '#ef4444'];
    const color = colors[name.charCodeAt(0) % colors.length];
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${size * 0.35}px;flex-shrink:0">${initials}</div>`;
  };

  /* ====== CHART UTILITY ====== */
  window.createLineChart = function(canvasId, labels, datasets) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    return new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: datasets.map(d => ({
        ...d,
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      })) },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  };

  window.createDoughnutChart = function(canvasId, labels, data, colors) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors || ['#0096D6', '#6CCB2F', '#0D1B4C', '#f59e0b', '#8b5cf6', '#ef4444'], borderWidth: 0 }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  };

  console.log('✅ Admin panel initialized');
});
