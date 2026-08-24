
/**
 * Phase 4 Centralized Motion System
 */
class MotionSystem {
  constructor() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };
    
    // Core Intersection Observer
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), this.observerOptions);
    
    // Auto-init
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.observeElements();
    this.initPageTransitions();
  }

  observeElements() {
    // Observe new data-motion elements and legacy data-animate elements
    const elements = document.querySelectorAll('[data-motion]:not(.is-visible), [data-animate]:not(.animated)');
    elements.forEach(el => this.observer.observe(el));
    
    // Observe Counters specifically
    const counters = document.querySelectorAll('.counter:not(.is-visible), [data-counter]:not(.is-visible)');
    counters.forEach(el => this.observer.observe(el));
  }

  handleIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        
        // Handle Reveal Animation
        if (el.hasAttribute('data-motion')) el.classList.add('is-visible');
        if (el.hasAttribute('data-animate')) el.classList.add('animated');
        
        // Handle Progress Bars
        if (el.getAttribute('data-motion') === 'progress') {
          const targetW = el.getAttribute('data-target-width') || '100%';
          el.style.width = targetW;
        }

        // Handle Counter
        if (el.classList.contains('counter') || el.hasAttribute('data-counter')) {
          if (!el.dataset.counted) {
            el.dataset.counted = 'true';
            el.classList.add('is-visible');
            if (!this.prefersReducedMotion) {
              this.animateNumber(el);
            } else {
              el.innerText = el.getAttribute('data-target'); // instant
            }
          }
        }
        
        // Stop observing once animated
        observer.unobserve(el);
      }
    });
  }

  animateNumber(el) {
    const targetStr = el.getAttribute('data-target');
    if (!targetStr) return;
    
    const target = parseFloat(targetStr.replace(/[^0-9.]/g, ''));
    if (isNaN(target)) return;
    
    const duration = 2000; // 2 seconds
    const fps = 60;
    const totalFrames = (duration / 1000) * fps;
    let frame = 0;
    
    const isDecimal = target % 1 !== 0;
    
    const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    
    const counterInterval = setInterval(() => {
      frame++;
      const progress = easeOutExpo(frame / totalFrames);
      const current = target * progress;
      
      el.innerText = isDecimal ? current.toFixed(1) : Math.floor(current);
      
      if (frame >= totalFrames) {
        clearInterval(counterInterval);
        el.innerText = targetStr; // ensure exact final string format
      }
    }, 1000 / fps);
  }

  initPageTransitions() {
    if (this.prefersReducedMotion) return;
    
    // Page fade-out transition for internal links
    document.querySelectorAll('a').forEach(a => {
      if (a.hostname === window.location.hostname && 
          !a.hash && 
          a.getAttribute('target') !== '_blank' &&
          !a.getAttribute('href').startsWith('javascript') &&
          !a.getAttribute('href').startsWith('mailto') &&
          !a.getAttribute('href').startsWith('tel')) {
        
        a.addEventListener('click', (e) => {
          if (e.ctrlKey || e.metaKey || e.shiftKey) return;
          e.preventDefault();
          const href = a.getAttribute('href');
          document.body.classList.add('page-transitioning');
          setTimeout(() => {
            window.location.href = href;
          }, 300); // match css transition
        });
      }
    });
    
    // Handle browser back button fade-in gracefully
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        document.body.classList.remove('page-transitioning');
      }
    });
  }
}

// Global Export
window.ASGMotion = new MotionSystem();
window.observeAnimations = () => window.ASGMotion.observeElements();
