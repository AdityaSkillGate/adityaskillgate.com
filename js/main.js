/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — MAIN JS
   js/main.js — Core interactivity for public pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ====== PAGE LOADER ====== */
  const loader = document.getElementById('page-loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('hidden'), 800);
    });
  }

  /* ====== THEME (DARK/LIGHT MODE) ====== */
  const themeKey = 'asg_theme';
  const theme = localStorage.getItem(themeKey) || 'light';
  document.documentElement.setAttribute('data-theme', theme);

  const themeToggles = document.querySelectorAll('.theme-toggle');
  themeToggles.forEach(btn => {
    updateThemeIcon(btn, theme);
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(themeKey, next);
      themeToggles.forEach(b => updateThemeIcon(b, next));
    });
  });

  function updateThemeIcon(btn, theme) {
    btn.innerHTML = theme === 'dark'
      ? '<i class="fas fa-sun"></i>'
      : '<i class="fas fa-moon"></i>';
  }

  /* ====== NAVBAR ====== */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    /* Set active nav link */
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      if (link.getAttribute('href') === path) link.classList.add('active');
    });
  }

  /* ====== MOBILE MENU ====== */
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    /* Close on outside click */
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    /* Mobile submenu toggles */
    document.querySelectorAll('.mobile-nav-link[data-submenu]').forEach(link => {
      link.addEventListener('click', () => {
        const target = document.getElementById(link.dataset.submenu);
        if (target) target.classList.toggle('open');
        const icon = link.querySelector('.submenu-icon');
        if (icon) icon.style.transform = target?.classList.contains('open') ? 'rotate(180deg)' : '';
      });
    });
  }

  /* ====== SMOOTH SCROLL ====== */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ====== SCROLL ANIMATIONS (IntersectionObserver) ====== */
  const animElements = document.querySelectorAll('[data-animate]');
  if (animElements.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    animElements.forEach(el => observer.observe(el));
  }

  /* ====== COUNTER ANIMATION ====== */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target || el.textContent, 10);
    const duration = 2000;
    const start = performance.now();
    el.textContent = '0';

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = Math.floor(eased * target);
      el.textContent = current.toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter, [data-counter]').forEach(el => counterObserver.observe(el));

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

  console.log('✅ Aditya Skill Gate — main.js loaded');
});
