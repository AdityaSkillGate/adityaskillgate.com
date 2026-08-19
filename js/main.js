/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — MAIN JS
   js/main.js — Core interactivity for public pages
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
    // 1. Safe Fallback Preparation
    document.querySelectorAll('[data-metric]').forEach(el => {
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
      if (metrics && metrics[key] !== undefined && metrics[key] !== null) {
        el.textContent = metrics[key];
      } else {
        el.textContent = el.dataset.fallback || '0';
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

  
  
  /* ====== THEME TOGGLE ====== */
  const themeToggle = document.querySelector('.theme-toggle');
  const docEl = document.documentElement;
  const savedTheme = localStorage.getItem('asg_theme') || 'light';
  if (savedTheme === 'dark') {
    docEl.setAttribute('data-theme', 'dark');
    if (themeToggle && themeToggle.querySelector('i')) themeToggle.querySelector('i').className = 'fas fa-sun';
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = docEl.getAttribute('data-theme') === 'dark';
      if (isDark) {
        docEl.removeAttribute('data-theme');
        localStorage.setItem('asg_theme', 'light');
        if (themeToggle.querySelector('i')) themeToggle.querySelector('i').className = 'fas fa-moon';
      } else {
        docEl.setAttribute('data-theme', 'dark');
        localStorage.setItem('asg_theme', 'dark');
        if (themeToggle.querySelector('i')) themeToggle.querySelector('i').className = 'fas fa-sun';
      }
    });
  }

  /* ====== PAGE LOADER ====== */
  const loader = document.getElementById('page-loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => loader.style.display = 'none', 500);
    }, 500);
  }

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
    for (let i = 0; i < 30; i++) {
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
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        valid = false;
        field.classList.add('error');
        if (error) error.textContent = 'Please enter a valid email';
      } else if (field.type === 'tel' && !/^[6-9]\d{9}$/.test(field.value.replace(/\s/g, ''))) {
        valid = false;
        field.classList.add('error');
        if (error) error.textContent = 'Please enter a valid 10-digit phone number';
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
    msg.innerHTML = text; // allow HTML like <b> for rich formatting
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }

  async function sendChatMessage() {
    if (!chatInput || !chatInput.value.trim()) return;
    const userMsg = chatInput.value.trim();
    addChatMessage(userMsg, 'user');
    chatInput.value = '';

    const lower = userMsg.toLowerCase();

    // Call API for dynamic search
    const loadingId = 'loading-' + Date.now();
    addChatMessage('<i class="fas fa-spinner fa-spin"></i> Let me check that for you...', 'bot', loadingId);
    
    try {
      const res = await API.search(userMsg);
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();
      
      let reply = '';
      if (res.botResponse) {
        reply = res.botResponse + '<br><br>';
      }
      
      if (res.courses && res.courses.length > 0) {
        reply += `<b>Courses found:</b><br>` + res.courses.slice(0, 3).map(c => `• ${c.title} (${c.duration}, ${c.fee})`).join('<br>') + '<br><br>';
      }
      if (res.jobs && res.jobs.length > 0) {
        reply += `<b>Jobs found:</b><br>` + res.jobs.slice(0, 3).map(j => `• ${j.title} (${j.location})`).join('<br>') + '<br><br>';
      }
      
      if (!reply) {
        reply = chatResponses.default;
      } else if (!res.botResponse) {
        reply += "You can find more details on our Courses or Careers page! 😊";
      }
      
      addChatMessage(reply, 'bot');
    } catch (err) {
      const loadingMsg = document.getElementById(loadingId);
      if (loadingMsg) loadingMsg.remove();
      addChatMessage("Sorry, I'm having trouble connecting to the server. Please try again later.", 'bot');
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
      backTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ====== NOTIFICATION POPUP ====== */
  const notifications = [
    { title: '🎓 New Course Available!', text: 'Full Stack Web Dev batch starting soon.' },
    { title: '🏆 100+ Placements Achieved!', text: 'Join us and get placed in top companies.' },
    { title: '💼 Hiring Now!', text: 'Check our open job positions.' }
  ];

  const notifPopup = document.querySelector('.notification-popup');
  if (notifPopup) {
    let notifIndex = 0;
    setTimeout(() => {
      function showNotif() {
        const n = notifications[notifIndex % notifications.length];
        notifPopup.querySelector('h4').textContent = n.title;
        notifPopup.querySelector('p').textContent = n.text;
        notifPopup.classList.add('show');
        setTimeout(() => notifPopup.classList.remove('show'), 4000);
        notifIndex++;
        setTimeout(showNotif, 10000);
      }
      showNotif();
    }, 3000);
  }

  /* ====== FAQ ACCORDION ====== */
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');

    question?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-answer').style.maxHeight = '0';
        if (i.querySelector('.faq-icon')) i.querySelector('.faq-icon').style.transform = '';
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
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      btn.disabled = true;

      const formData = Object.fromEntries(new FormData(contactForm));

      try {
        const res = await API.submitContact(formData);
        if (res?.success !== false) {
          contactForm.reset();
          showToast('Message sent successfully! We\'ll contact you soon.', 'success');
          const successEl = contactForm.querySelector('.form-success');
          if (successEl) { successEl.style.display = 'block'; setTimeout(() => successEl.style.display = 'none', 5000); }
        } else {
          showToast(res.message || 'Something went wrong. Please try again.', 'error');
        }
      } catch (err) {
        showToast('Network error. Please check your connection.', 'error');
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
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

  /* ====== METRICS & DYNAMIC DATES ====== */
  async function loadMetrics() {
    // 1. Dynamic Copyright Year
    document.querySelectorAll('.current-year').forEach(el => {
      el.textContent = new Date().getFullYear();
    });

    // 2. Load Company Metrics
    try {
      const settings = await API.getSettings();
      // 'stats' could be a JSON string or object in settings
      let stats = {};
      if (settings.stats) {
        stats = typeof settings.stats === 'string' ? JSON.parse(settings.stats) : settings.stats;
      } else {
        // Fallback or flat settings mapping
        stats = settings; 
      }
      
      document.querySelectorAll('[data-metric]').forEach(el => {
        const key = el.dataset.metric;
        if (stats[key]) {
          el.textContent = stats[key];
        }
      });
    } catch (err) {
      console.warn('Failed to load dynamic metrics:', err);
    }
  }
  
  loadMetrics();

  
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
  
  // Expose function globally so dynamic content can re-trigger it
  window.observeAnimations = function() {
    document.querySelectorAll('[data-animate]:not(.animated)').forEach(el => {
      animateObserver.observe(el);
    });
  };

    console.log('Aditya Skill Gate - main.js loaded');
});


function initCompanyAge() {
  const founded = new Date('2025-10-26T00:00:00+05:30');
  const now = new Date();
  
  // Calculate full months difference
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
  
  // Populate elements
  document.querySelectorAll('.dynamic-company-age').forEach(el => el.textContent = longText);
  document.querySelectorAll('.dynamic-company-age-short').forEach(el => el.textContent = shortText);
  
  // Also update any current year spans
  document.querySelectorAll('[data-metric="currentYear"]').forEach(el => el.textContent = now.getFullYear());
}

// Call on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initCompanyAge);


async function initCompanyConfig() {
  if (typeof API === 'undefined') return;
  const config = await API.getConfig();
  if (!config) return;
  
  // Populate text elements
  document.querySelectorAll('[data-config]').forEach(el => {
    const key = el.getAttribute('data-config');
    if (config[key]) {
       if (el.tagName === 'A' && key === 'email') el.href = 'mailto:' + config[key];
       else if (el.tagName === 'A' && key === 'phone') el.href = 'tel:' + config[key].replace(/\D/g, '');
       else if (el.tagName === 'A' && key === 'whatsapp') el.href = 'https://wa.me/' + config[key].replace(/\D/g, '');
       else el.textContent = config[key];
    }
  });
  
  // Populate hrefs
  document.querySelectorAll('[data-config-href]').forEach(el => {
    const key = el.getAttribute('data-config-href');
    if (config[key]) el.href = config[key];
  });
}

document.addEventListener('DOMContentLoaded', initCompanyConfig);

async function loadDynamicMetrics() {
  if (typeof window.API === 'undefined') return;
  try {
    const res = await window.API.getCompanyMetrics(); 
    if (!res || !res.data) return;
    
    document.querySelectorAll('[data-metric]').forEach(el => {
      const key = el.getAttribute('data-metric');
      if (res.data[key] !== undefined) {
         el.textContent = res.data[key];
      }
      if (key === 'currentYear') el.textContent = new Date().getFullYear();
      if (key === 'currentMonthYear') {
         const m = new Intl.DateTimeFormat('en', {month: 'long', year: 'numeric'}).format(new Date());
         el.textContent = m;
      }
    });
  } catch(e){}
}
document.addEventListener('DOMContentLoaded', loadDynamicMetrics);
