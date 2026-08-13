/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — FILE UPLOADER
   js/uploader.js — Drag & drop file upload with validation
   ============================================================ */

class FileUploader {
  constructor(zoneId, options = {}) {
    this.zone = document.getElementById(zoneId);
    if (!this.zone) return;

    this.options = {
      accept: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      acceptExt: ['.pdf', '.doc', '.docx'],
      maxSizeMB: 5,
      onFileSelected: null,
      onError: null,
      previewId: null,
      progressId: null,
      ...options
    };

    this.file = null;
    this.fileInput = this.zone.querySelector('input[type="file"]') || this.createHiddenInput();
    this.preview = options.previewId ? document.getElementById(options.previewId) : null;
    this.progressBar = options.progressId ? document.getElementById(options.progressId) : null;

    this.bindEvents();
  }

  createHiddenInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.className = 'upload-input';
    input.accept = this.options.acceptExt.join(',');
    this.zone.appendChild(input);
    return input;
  }

  bindEvents() {
    /* Click to browse */
    this.zone.addEventListener('click', () => this.fileInput.click());

    /* File input change */
    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files[0]) this.handleFile(this.fileInput.files[0]);
    });

    /* Drag and drop */
    this.zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.zone.classList.add('dragover');
    });

    this.zone.addEventListener('dragleave', () => {
      this.zone.classList.remove('dragover');
    });

    this.zone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.handleFile(file);
    });
  }

  handleFile(file) {
    /* Validate file type */
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const typeOk = this.options.acceptExt.includes(ext);

    if (!typeOk) {
      const msg = `Invalid file type. Please upload: ${this.options.acceptExt.join(', ')}`;
      this.showError(msg);
      return;
    }

    /* Validate file size */
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > this.options.maxSizeMB) {
      const msg = `File too large. Maximum size is ${this.options.maxSizeMB}MB.`;
      this.showError(msg);
      return;
    }

    this.file = file;
    this.showPreview(file);

    if (this.options.onFileSelected) {
      this.options.onFileSelected(file);
    }
  }

  showPreview(file) {
    const sizeStr = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(1) + ' KB';

    const iconMap = { pdf: '📄', doc: '📝', docx: '📝' };
    const ext = file.name.split('.').pop().toLowerCase();
    const icon = iconMap[ext] || '📎';

    /* Hide default zone content */
    const defaultContent = this.zone.querySelector('.upload-icon');
    const uploadText = this.zone.querySelector('.upload-text');
    const uploadHint = this.zone.querySelector('.upload-hint');
    if (defaultContent) defaultContent.style.display = 'none';
    if (uploadText) uploadText.style.display = 'none';
    if (uploadHint) uploadHint.style.display = 'none';

    /* Show preview */
    let preview = this.zone.querySelector('.upload-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.className = 'upload-preview';
      this.zone.appendChild(preview);
    }

    preview.innerHTML = `
      <span style="font-size:2rem">${icon}</span>
      <div style="flex:1">
        <div style="font-weight:600;font-size:0.9rem;color:var(--navy)">${file.name}</div>
        <div style="font-size:0.775rem;color:var(--gray-500)">${sizeStr} · ${ext.toUpperCase()}</div>
        <div class="progress-bar" style="margin-top:6px">
          <div class="progress-fill" style="width:100%"></div>
        </div>
      </div>
      <button type="button" onclick="event.stopPropagation();this.closest('.upload-preview').remove();window.uploadersMap['${this.zone.id}'].clearFile()" style="background:rgba(239,68,68,0.1);border:none;color:#dc2626;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:1rem">✕</button>
    `;

    /* Store reference for clear */
    window.uploadersMap = window.uploadersMap || {};
    window.uploadersMap[this.zone.id] = this;
  }

  clearFile() {
    this.file = null;
    this.fileInput.value = '';
    const defaultContent = this.zone.querySelector('.upload-icon');
    const uploadText = this.zone.querySelector('.upload-text');
    const uploadHint = this.zone.querySelector('.upload-hint');
    if (defaultContent) defaultContent.style.display = '';
    if (uploadText) uploadText.style.display = '';
    if (uploadHint) uploadHint.style.display = '';
  }

  showError(msg) {
    if (this.options.onError) {
      this.options.onError(msg);
    } else if (typeof window.showToast === 'function') {
      window.showToast(msg, 'error');
    } else {
      alert(msg);
    }
  }

  /* Get file as base64 (for sending to Apps Script) */
  async getBase64() {
    if (!this.file) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(this.file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Strip data: prefix
      reader.onerror = reject;
    });
  }

  /* Get file data for upload */
  async getUploadData() {
    if (!this.file) return null;
    const base64 = await this.getBase64();
    return {
      filename: this.file.name,
      mimeType: this.file.type,
      base64: base64,
      size: this.file.size
    };
  }

  getFile() { return this.file; }
  hasFile() { return !!this.file; }
}

/* ====== RESUME FORM HANDLER ====== */
async function handleResumeSubmit(formEl, uploaderId) {
  if (!window.validateForm && !window.validateAdminForm) return;
  const validate = window.validateForm || window.validateAdminForm;

  if (!validate(formEl)) return;

  const uploader = window.uploadersMap?.[uploaderId];
  if (!uploader?.hasFile()) {
    if (typeof window.showToast === 'function') window.showToast('Please upload your resume (PDF/DOC/DOCX)', 'warning');
    return;
  }

  const btn = formEl.querySelector('[type="submit"]');
  const originalHTML = btn?.innerHTML;
  if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...'; btn.disabled = true; }

  try {
    const formData = Object.fromEntries(new FormData(formEl));
    const fileData = await uploader.getUploadData();

    const payload = { ...formData, fileData };
    const res = await API.submitResume(payload);

    if (res?.success !== false) {
      formEl.reset();
      uploader.clearFile();
      if (typeof window.showToast === 'function') window.showToast('Resume submitted successfully! We will contact you soon.', 'success');
      if (typeof openModal === 'function') openModal('success-modal');
    } else {
      if (typeof window.showToast === 'function') window.showToast(res.message || 'Submission failed. Please try again.', 'error');
    }
  } catch (err) {
    if (typeof window.showToast === 'function') window.showToast('Network error. Please try again.', 'error');
    console.error('Resume submit error:', err);
  } finally {
    if (btn) { btn.innerHTML = originalHTML; btn.disabled = false; }
  }
}

window.FileUploader = FileUploader;
window.handleResumeSubmit = handleResumeSubmit;
