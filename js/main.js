/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — MAIN JS
   js/main.js — Core interactivity for public pages (V2.0.4 Stabilized)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ====== DYNAMIC METRICS & COUNTER ANIMATION ====== */
  function animateCounter(el) {
    let target = parseInt(el.dataset.target || el.textContent, 10);
    if (isNaN(target)) target = 0; // Never display NaN
    const duration = 2000;
    const start = performance.now();
    el.textContent = '0';

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  async function initMetricsAndCounters() {
    const now = new Date();
    // 1. Safe Fallback Preparation (skip date and year computed tokens)
    document.querySelectorAll('[data-metric]').forEach(el => {
      const key = el.dataset.metric;
      if (key === 'currentYear') {
        el.textContent = now.getFullYear();
        return;
      }
      if (key === 'currentMonthYear') {
        el.textContent = new Intl.DateTimeFormat('en', {month: 'long', year: 'numeric'}).format(now);
        return;
      }
      if (key === 'foundingYear') {
        el.textContent = '2025';
        return;
      }
      el.dataset.fallback = el.textContent; // Store original HTML as safe fallback
      el.innerHTML = '<span style="opacity:0.5">...</span>'; // Show loading state
    });

    // 2. Fetch Latest Values from Apps Script
    let metrics = null;
    try {
      if (window.API && window.API.getCompanyMetrics) {
        metrics = await window.API.getCompanyMetrics();
      }
    } catch (e) {
      console.warn('API metrics failed, using safe fallback.', e);
    }

    // 3. Render Dynamically / Handle API failure gracefully
    document.querySelectorAll('[data-metric]').forEach(el => {
      const key = el.dataset.metric;
      if (key === 'currentYear') {
        el.textContent = now.getFullYear();
      } else if (key === 'currentMonthYear') {
        el.textContent = new Intl.DateTimeFormat('en', {month: 'long', year: 'numeric'}).format(now);
      } else if (key === 'foundingYear') {
        el.textContent = '2025';
      } else if (metrics && metrics[key] !== undefined && metrics[key] !== null) {
        el.textContent = metrics[key];
      } else if (el.dataset.fallback && el.dataset.fallback !== '...') {
        el.textContent = el.dataset.fallback;
      }
    });

    document.querySelectorAll('[data-metric-target]').forEach(el => {
      const key = el.dataset.metricTarget;
      if (metrics && metrics[key] !== undefined && metrics[key] !== null) {
        const num = String(metrics[key]).replace(/\D/g, '');
        el.dataset.target = num || '0';
      }
    });

    // 4. Animate numbers AFTER successful fetch (or fallback)
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter, [data-counter]').forEach(el => counterObserver.observe(el));
  }

  /* ====== REUSABLE PROGRAMME CARD ====== */
  window.renderProgrammeCard = function(c, index = 0) {
    const COLORS = ['#2563eb','#4f46e5','#7c3aed','#db2777','#ea580c','#059669'];
    const color = COLORS[index % COLORS.length];
    
    const duration = c.duration || '6 Months';
    const entry = c.entryRequirements || c.eligibility || 'Any Degree';
    const slug = c.slug || c.id || encodeURIComponent(c.title || '');
    
    return `
      <div class="course-card hover-lift" data-motion="fade-up" data-delay="${(index % 3 + 1) * 100}" data-type="${c.type||'IT'}" data-category="${c.category||''}" style="display:flex;flex-direction:column; background:white; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.05); transition:all 0.3s ease;">
        <div class="course-img" style="height:180px; position:relative; ${c.imageUrl ? `background:url('${c.imageUrl}') center/cover;` : `background:linear-gradient(135deg, ${color}cc, ${color})`}">
          <div style="position:absolute; top:15px; left:15px; background:rgba(255,255,255,0.9); padding:4px 10px; border-radius:4px; font-size:0.75rem; font-weight:700; color:var(--navy);">${c.badge||c.category||'Premium'}</div>
        </div>
        <div class="course-body" style="padding:24px; display:flex; flex-direction:column; flex:1;">
          <h3 style="font-size:1.2rem; font-weight:700; color:var(--navy); margin-bottom:12px; line-height:1.4;">${c.title}</h3>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
            <div style="display:flex; align-items:center; gap:6px; font-size:0.85rem; color:var(--gray-600);"><i class="fas fa-clock text-blue"></i> ${duration}</div>
            <div style="display:flex; align-items:center; gap:6px; font-size:0.85rem; color:var(--gray-600);"><i class="fas fa-user-graduate text-green"></i> ${entry}</div>
          </div>
          
          <div style="margin-top:16px; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
            <input type="checkbox" class="compare-checkbox" data-id="${slug}" id="compare-${slug}" onchange="window.toggleCompare('${slug}')" style="width:16px; height:16px; cursor:pointer; accent-color:var(--tech-blue);">
            <label for="compare-${slug}" style="font-size:0.85rem; color:var(--gray-500); cursor:pointer;">Add to Compare</label>
          </div>
          <div style="margin-top:auto; padding-top:16px; border-top:1px solid rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:700; color:var(--navy); font-size:1.1rem;">${c.fee||'Enquire Now'}</div>
            <a href="course-detail.html?id=${slug}" class="btn btn-primary btn-sm" style="padding:8px 16px;">View Programme</a>
          </div>
        </div>
      </div>
    `;
  };

  /* ====== HEADER & NAVBAR ====== */
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  
  // Scroll-aware header
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }, { passive: true });
  }

  // Active Page Indicator
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav .nav-link, .mobile-nav .mobile-nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Language Selector Placeholder Logic
  document.querySelectorAll('.dropdown-menu a').forEach(langLink => {
    langLink.addEventListener('click', (e) => {
      e.preventDefault();
      const code = e.target.getAttribute('data-lang');
      const currentLangEl = document.querySelector('.current-lang');
      if (currentLangEl && code) currentLangEl.innerText = code.toUpperCase();
      if (code) localStorage.setItem('asg_lang', code);
    });
  });

  // Mobile Navigation Hamburger & Accessibility
  if (hamburger && mobileMenu) {
    const toggleMenu = (open) => {
      const shouldOpen = open !== undefined ? open : !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', shouldOpen);
      hamburger.classList.toggle('active', shouldOpen);
      hamburger.setAttribute('aria-expanded', shouldOpen.toString());
      mobileMenu.setAttribute('aria-hidden', (!shouldOpen).toString());
      document.body.classList.toggle('no-scroll', shouldOpen);
      document.body.classList.toggle('mobile-menu-open', shouldOpen);
    };

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close on navigation link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        toggleMenu(false);
        hamburger.focus();
      }
    });
  }

  // Restore saved language
  const savedLang = localStorage.getItem('asg_lang');
  if (savedLang) {
    const el = document.querySelector('.current-lang');
    if (el) el.innerText = savedLang.toUpperCase();
    const sel = document.querySelector('.mobile-lang-select');
    if (sel) sel.value = savedLang;
  }

    /* ====== BULLETPROOF PAGE LOADER ====== */
  const hideLoader = () => {
    const loader = document.getElementById('page-loader');
    if (loader && loader.style.display !== 'none') {
      loader.style.opacity = '0';
      setTimeout(() => {
        if (loader) loader.style.display = 'none';
      }, 400);
    }
  };

  // Immediate hide after DOMContentLoaded
  setTimeout(hideLoader, 200);
  window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 1000); // Safety fallback

  initMetricsAndCounters();

  /* ====== TYPING ANIMATION ====== */
  const typingEl = document.querySelector('.typing-text');
  if (typingEl) {
    const words = JSON.parse(typingEl.dataset.words || '[]');
    if (words.length) {
      let wordIndex = 0;
      let charIndex = 0;
      let deleting = false;

      function type() {
        const current = words[wordIndex];
        if (deleting) {
          typingEl.textContent = current.substring(0, charIndex--);
          if (charIndex < 0) { deleting = false; wordIndex = (wordIndex + 1) % words.length; setTimeout(type, 500); return; }
        } else {
          typingEl.textContent = current.substring(0, charIndex++);
          if (charIndex > current.length) { deleting = true; setTimeout(type, 1800); return; }
        }
        setTimeout(type, deleting ? 60 : 100);
      }
      type();
    }
  }

  /* ====== PARTICLES (Hero) ====== */
  const particleContainer = document.querySelector('.hero-particles');
  if (particleContainer) {
    createParticles(particleContainer);
  }

  function createParticles(container) {
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 1}px;
        height: ${Math.random() * 4 + 1}px;
        border-radius: 50%;
        background: rgba(${Math.random() > 0.5 ? '108,203,47' : '0,150,214'}, ${Math.random() * 0.6 + 0.2});
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        animation: floatParticle ${Math.random() * 10 + 10}s linear infinite;
        animation-delay: ${Math.random() * 5}s;
      `;
      container.appendChild(p);
    }

    if (!document.querySelector('#particleStyle')) {
      const style = document.createElement('style');
      style.id = 'particleStyle';
      style.textContent = `
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-${window.innerHeight}px) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /* ====== SLIDER UTILITY ====== */
  window.createSlider = function(trackSelector, options = {}) {
    const { dots = true, autoPlay = true, interval = 4000, itemsVisible = 3 } = options;
    const track = document.querySelector(trackSelector);
    if (!track) return;

    const wrapper = track.parentElement;
    const items = track.children;
    let current = 0;
    let timer;

    function goTo(index) {
      const maxIndex = Math.max(0, items.length - itemsVisible);
      current = Math.max(0, Math.min(index, maxIndex));
      const itemWidth = items[0]?.offsetWidth || 0;
      const gap = parseInt(getComputedStyle(track).gap) || 0;
      track.style.transform = `translateX(-${current * (itemWidth + gap)}px)`;
      updateDots();
    }

    function next() { goTo(current + 1 >= items.length - itemsVisible + 1 ? 0 : current + 1); }
    function prev() { goTo(current <= 0 ? Math.max(0, items.length - itemsVisible) : current - 1); }

    function updateDots() {
      wrapper.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
      });
    }

    wrapper.querySelector('.slider-prev')?.addEventListener('click', () => { prev(); resetTimer(); });
    wrapper.querySelector('.slider-next')?.addEventListener('click', () => { next(); resetTimer(); });

    if (dots) {
      const dotsContainer = wrapper.querySelector('.slider-dots');
      if (dotsContainer) {
        const count = Math.max(1, items.length - itemsVisible + 1);
        dotsContainer.innerHTML = Array.from({ length: count }, (_, i) =>
          `<div class="slider-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></div>`
        ).join('');
        dotsContainer.querySelectorAll('.slider-dot').forEach(dot => {
          dot.addEventListener('click', () => { goTo(parseInt(dot.dataset.i)); resetTimer(); });
        });
      }
    }

    function resetTimer() {
      clearInterval(timer);
      if (autoPlay) timer = setInterval(next, interval);
    }

    if (autoPlay) timer = setInterval(next, interval);

    /* Swipe support */
    let startX;
    track.addEventListener('touchstart', e => startX = e.touches[0].clientX, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); resetTimer(); }
    }, { passive: true });

    window.addEventListener('resize', () => goTo(current));
    return { goTo, next, prev };
  };

  /* ====== FILTER CHIPS ====== */
  document.querySelectorAll('.filter-chips').forEach(chips => {
    chips.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const event = new CustomEvent('filterChange', { detail: { value: chip.dataset.filter }, bubbles: true });
        chips.dispatchEvent(event);
      });
    });
  });

  /* ====== TOAST NOTIFICATIONS ====== */
  window.showToast = function(message, type = 'info', duration = 4000) {
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
      <span class="toast-icon">${icons[type] || icons.info}</span>
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

  /* ====== MODAL ====== */
  window.openModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(id);
    });
  };

  window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  /* ====== FORM VALIDATION ====== */
  window.validateForm = function(formEl) {
    let valid = true;
    formEl.querySelectorAll('[required]').forEach(field => {
      const error = field.parentElement.querySelector('.form-error');
      field.classList.remove('error');
      if (error) error.textContent = '';

      if (!field.value.trim()) {
        valid = false;
        field.classList.add('error');
        if (error) error.textContent = 'This field is required';
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) {
        valid = false;
        field.classList.add('error');
        if (error) error.textContent = 'Please enter a valid email address';
      } else if (field.type === 'tel') {
        const cleanPhone = field.value.replace(/[\s\-().+]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
          valid = false;
          field.classList.add('error');
          if (error) error.textContent = 'Please enter a valid phone number';
        }
      }
    });
    return valid;
  };

  /* ====== WHATSAPP FLOATING BUTTON ====== */
  const waBtn = document.querySelector('.whatsapp-btn');
  const waMenu = document.querySelector('.whatsapp-menu');

  if (waBtn && waMenu) {
    waBtn.addEventListener('click', () => waMenu.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!waBtn.closest('.whatsapp-float').contains(e.target)) {
        waMenu.classList.remove('open');
      }
    });
  }

  /* ====== CHATBOT ====== */
  const chatToggle = document.querySelector('.chatbot-toggle');
  const chatWindow = document.querySelector('.chatbot-window');
  const chatInput = document.querySelector('.chatbot-input input');
  const chatSend = document.querySelector('.chatbot-send');
  const chatMessages = document.querySelector('.chatbot-messages');

  const chatResponses = {
    'default': 'Thank you for your message! For detailed inquiries, please contact us at +91 63826 04808 or email Adityaskillgateitsolution@gmail.com. 😊'
  };

  function addChatMessage(text, type, id = null) {
    if (!chatMessages) return null;
    const msg = document.createElement('div');
    if (id) msg.id = id;
    msg.className = `chat-msg ${type}`;
    msg.innerHTML = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }

  async function sendChatMessage() {
    if (!chatInput || !chatInput.value.trim()) return;
    const userMsg = chatInput.value.trim();
    addChatMessage(userMsg, 'user');
    chatInput.value = '';

    const loadingId = 'loading-' + Date.now();
    addChatMessage('<i class="fas fa-spinner fa-spin"></i> Checking knowledge base...', 'bot', loadingId);
    
    try {
      const res = await (window.API && window.API.search ? window.API.search(userMsg) : null);
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();
      
      let reply = '';
      if (res && res.botResponse) {
        reply = res.botResponse;
      }
      
      if (res && res.courses && res.courses.length > 0 && (!res.botResponse || userMsg.toLowerCase().includes('course') || userMsg.toLowerCase().includes('learn'))) {
        reply += (reply ? '<br><br>' : '') + `<b>🎓 Available Courses:</b><br>` + res.courses.slice(0, 3).map(c => `• <a href="courses.html" style="color:var(--tech-blue);text-decoration:underline;">${c.title}</a> (${c.duration || '3-6 Months'})`).join('<br>');
      }
      if (res && res.jobs && res.jobs.length > 0 && (!res.botResponse || userMsg.toLowerCase().includes('job') || userMsg.toLowerCase().includes('career') || userMsg.toLowerCase().includes('vacancy'))) {
        reply += (reply ? '<br><br>' : '') + `<b>💼 Open Positions:</b><br>` + res.jobs.slice(0, 3).map(j => `• <a href="jobs.html" style="color:var(--accent-green-dark);text-decoration:underline;">${j.title}</a> (${j.location || 'Tamil Nadu'})`).join('<br>');
      }
      
      if (!reply) {
        reply = chatResponses.default;
      }
      
      addChatMessage(reply, 'bot');
    } catch (err) {
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();
      addChatMessage("Please contact us directly via WhatsApp/Call at +91 63826 04808 or email Adityaskillgateitsolution@gmail.com for instant assistance. 😊", 'bot');
    }
  }

  if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', () => chatWindow.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!chatToggle.closest('.chatbot-widget').contains(e.target)) {
        chatWindow.classList.remove('open');
      }
    });
  }

  chatSend?.addEventListener('click', sendChatMessage);
  chatInput?.addEventListener('keypress', e => { if (e.key === 'Enter') sendChatMessage(); });

  document.querySelectorAll('.chat-suggestion').forEach(s => {
    s.addEventListener('click', () => {
      if (chatInput) { chatInput.value = s.textContent; sendChatMessage(); }
    });
  });

  /* ====== BACK TO TOP ====== */
  const backTop = document.getElementById('back-to-top');
  if (backTop) {
    window.addEventListener('scroll', () => {
      backTop.classList.toggle('visible', window.scrollY > 300);
    }, { passive: true });
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ====== NOTIFICATION POPUP ====== */
  const notifications = [
    { title: '🎓 New Course Batches Open!', text: 'Full Stack, AI/ML & Cloud Computing admissions open.' },
    { title: '🏆 Verified Placements!', text: 'Graduates placed in TCS, Infosys, Zoho and more.' },
    { title: '💼 We Are Hiring!', text: 'Explore our latest software engineering openings.' }
  ];

  const notifPopup = document.querySelector('.notification-popup');
  if (notifPopup) {
    let notifIndex = 0;
    setTimeout(() => {
      function showNotif() {
        const n = notifications[notifIndex % notifications.length];
        const h4 = notifPopup.querySelector('h4');
        const p = notifPopup.querySelector('p');
        if (h4) h4.textContent = n.title;
        if (p) p.textContent = n.text;
        notifPopup.classList.add('show');
        setTimeout(() => notifPopup.classList.remove('show'), 4000);
        notifIndex++;
        setTimeout(showNotif, 12000);
      }
      showNotif();
    }, 4000);
  }

  /* ====== FAQ ACCORDION ====== */
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question, .faq-q');
    const answer = item.querySelector('.faq-answer, .faq-a');
    const icon = item.querySelector('.faq-icon');

    question?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        const ans = i.querySelector('.faq-answer, .faq-a');
        if (ans) ans.style.maxHeight = '0';
        const icn = i.querySelector('.faq-icon');
        if (icn) icn.style.transform = '';
      });
      if (!isOpen) {
        item.classList.add('open');
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });

  /* ====== CONTACT FORM ====== */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(contactForm)) return;

      const btn = contactForm.querySelector('[type="submit"]');
      const originalText = btn ? btn.innerHTML : 'Send Message';
      if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
      }

      const formData = Object.fromEntries(new FormData(contactForm));

      try {
        const res = await (window.API && window.API.submitContact ? window.API.submitContact(formData) : { success: true });
        if (res?.success !== false) {
          contactForm.reset();
          showToast('Message sent successfully! We will contact you soon.', 'success');
          const successEl = contactForm.querySelector('.form-success');
          if (successEl) { successEl.style.display = 'block'; setTimeout(() => successEl.style.display = 'none', 5000); }
        } else {
          showToast(res.message || 'Something went wrong. Please try again.', 'error');
        }
      } catch (err) {
        showToast('Network error. Please check your connection.', 'error');
      } finally {
        if (btn) {
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      }
    });
  }

  /* ====== SEARCH FUNCTIONALITY ====== */
  window.setupSearch = function(inputId, itemsSelector, searchFields) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      document.querySelectorAll(itemsSelector).forEach(item => {
        const text = searchFields.map(f => item.dataset[f] || '').join(' ').toLowerCase();
        item.style.display = (!q || text.includes(q)) ? '' : 'none';
      });
    });
  };

  /* ====== COMPARE SYSTEM ====== */
  window.compareList = JSON.parse(localStorage.getItem('asg_compare') || '[]');
  
  window.toggleCompare = function(id) {
    if(window.compareList.includes(id)) {
      window.compareList = window.compareList.filter(c => c !== id);
    } else {
      if(window.compareList.length >= 3) {
        alert("You can compare up to 3 programmes at a time.");
        const cb = document.getElementById('compare-'+id);
        if(cb) cb.checked = false;
        return;
      }
      window.compareList.push(id);
    }
    localStorage.setItem('asg_compare', JSON.stringify(window.compareList));
    updateCompareBar();
  };

  function updateCompareBar() {
    let bar = document.getElementById('compare-floating-bar');
    if(!bar) {
      bar = document.createElement('div');
      bar.id = 'compare-floating-bar';
      bar.style.cssText = 'position:fixed; bottom:-100px; left:50%; transform:translateX(-50%); background:var(--navy); color:white; padding:16px 24px; border-radius:100px; display:flex; align-items:center; gap:20px; z-index:9999; transition:bottom 0.4s cubic-bezier(0.2,0.8,0.2,1); box-shadow:0 10px 40px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); width:max-content; max-width:90%;';
      document.body.appendChild(bar);
    }
    
    document.querySelectorAll('.compare-checkbox').forEach(cb => {
      cb.checked = window.compareList.includes(cb.dataset.id);
    });

    if(window.compareList.length > 0) {
      bar.style.bottom = '30px';
      bar.innerHTML = `
        <div style="font-weight:600;"><span style="background:var(--accent-green); color:white; width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.8rem; margin-right:8px;">${window.compareList.length}</span> Programmes selected</div>
        <a href="compare.html" class="btn btn-primary btn-sm" style="box-shadow:none;">Compare Now</a>
        <button onclick="window.clearCompare()" style="background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; margin-left:10px;"><i class="fas fa-times"></i></button>
      `;
    } else {
      bar.style.bottom = '-100px';
    }
  }

  window.clearCompare = function() {
    window.compareList = [];
    localStorage.setItem('asg_compare', '[]');
    updateCompareBar();
  };

  updateCompareBar();

  /* ====== GLOBAL ANIMATION OBSERVER ====== */
  const animateObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => {
    animateObserver.observe(el);
  });
  
  window.observeAnimations = function() {
    document.querySelectorAll('[data-animate]:not(.animated)').forEach(el => {
      animateObserver.observe(el);
    });
  };

  console.log('Aditya Skill Gate - main.js loaded successfully (V2.0.4)');
});

/* ====== GLOBAL FOUNDING AGE & CONFIG INITIALIZERS ====== */
function initCompanyAge() {
  const founded = new Date('2025-10-26T00:00:00+05:30');
  const now = new Date();
  
  let months = (now.getFullYear() - founded.getFullYear()) * 12;
  months -= founded.getMonth();
  months += now.getMonth();
  if (now.getDate() < founded.getDate()) {
    months--;
  }
  if (months < 0) months = 0;
  
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  
  let longText = '';
  if (years === 0) longText = `${remMonths} Month${remMonths !== 1 ? 's' : ''}`;
  else if (remMonths === 0) longText = `${years} Year${years !== 1 ? 's' : ''}`;
  else longText = `${years} Year${years !== 1 ? 's' : ''}, ${remMonths} Month${remMonths !== 1 ? 's' : ''}`;
  
  let shortText = '';
  if (years >= 1) shortText = `${years}+ years`;
  else shortText = `${months} months`;
  
  document.querySelectorAll('.dynamic-company-age').forEach(el => el.textContent = longText);
  document.querySelectorAll('.dynamic-company-age-short').forEach(el => el.textContent = shortText);
  document.querySelectorAll('[data-metric="currentYear"]').forEach(el => el.textContent = now.getFullYear());
  document.querySelectorAll('.current-year').forEach(el => el.textContent = now.getFullYear());
}
document.addEventListener('DOMContentLoaded', initCompanyAge);

async function initCompanyConfig() {
  if (typeof API === 'undefined') return;
  try {
    const config = await API.getConfig();
    if (!config) return;
    
    document.querySelectorAll('[data-config]').forEach(el => {
      const key = el.getAttribute('data-config');
      if (config[key]) {
        if (el.tagName === 'A' && key === 'email') el.href = 'mailto:' + config[key];
        else if (el.tagName === 'A' && key === 'phone') el.href = 'tel:' + config[key].replace(/\D/g, '');
        else if (el.tagName === 'A' && key === 'whatsapp') el.href = 'https://wa.me/' + config[key].replace(/\D/g, '');
        else el.textContent = config[key];
      }
    });
    
    document.querySelectorAll('[data-config-href]').forEach(el => {
      const key = el.getAttribute('data-config-href');
      if (config[key]) el.href = config[key];
    });
  } catch(e){}
}
document.addEventListener('DOMContentLoaded', initCompanyConfig);
