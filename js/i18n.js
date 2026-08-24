/* ========================================================================= */
/* PHASE 11 : MULTILINGUAL ENGINE (i18n)                                     */
/* ========================================================================= */

// Default Fallback Dictionary (UI Strings only - Official College Info stays English unless translated in Sheets)
const DEFAULT_DICT = {
  en: {
    "nav.home": "Home",
    "nav.courses": "Programmes",
    "nav.services": "Services",
    "nav.about": "About Us",
    "nav.contact": "Contact",
    "nav.apply": "Apply Now",
    "btn.explore": "Explore Courses",
    "btn.enquire": "Enquire Now",
    "btn.submit": "Submit Application",
    "footer.quicklinks": "Quick Links",
    "footer.contact": "Contact Us",
    "sys.loading": "Loading...",
    "sys.error": "An error occurred. Please try again."
  },
  zh: {
    "nav.home": "首页",
    "nav.courses": "课程",
    "nav.services": "服务",
    "nav.about": "关于我们",
    "nav.contact": "联系我们",
    "nav.apply": "立即申请",
    "btn.explore": "探索课程",
    "btn.enquire": "立即咨询",
    "btn.submit": "提交申请",
    "footer.quicklinks": "快速链接",
    "footer.contact": "联系我们",
    "sys.loading": "加载中...",
    "sys.error": "发生错误。请重试。"
  },
  ms: {
    "nav.home": "Utama",
    "nav.courses": "Program",
    "nav.services": "Perkhidmatan",
    "nav.about": "Tentang Kami",
    "nav.contact": "Hubungi",
    "nav.apply": "Mohon Sekarang",
    "btn.explore": "Terokai Program",
    "btn.enquire": "Tanya Sekarang",
    "btn.submit": "Hantar Permohonan",
    "footer.quicklinks": "Pautan Pantas",
    "footer.contact": "Hubungi Kami",
    "sys.loading": "Memuatkan...",
    "sys.error": "Ralat berlaku. Sila cuba lagi."
  },
  ta: {
    "nav.home": "முகப்பு",
    "nav.courses": "படிப்புகள்",
    "nav.services": "சேவைகள்",
    "nav.about": "எங்களை பற்றி",
    "nav.contact": "தொடர்புக்கு",
    "nav.apply": "இப்போதே விண்ணப்பிக்கவும்",
    "btn.explore": "படிப்புகளை ஆராய்க",
    "btn.enquire": "விசாரிக்கவும்",
    "btn.submit": "விண்ணப்பத்தை சமர்ப்பிக்கவும்",
    "footer.quicklinks": "விரைவு இணைப்புகள்",
    "footer.contact": "தொடர்பு கொள்க",
    "sys.loading": "ஏற்றுகிறது...",
    "sys.error": "பிழை ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்."
  }
};

window.I18N = {
  lang: window.ASG_LANG || localStorage.getItem('asg_lang') || 'en',
  dict: {},

  init: async function() {
    // 1. Load merged dictionary (Default + localStorage cache)
    const cachedDict = JSON.parse(localStorage.getItem('asg_i18n_dict') || '{}');
    this.dict = this.mergeDicts(DEFAULT_DICT, cachedDict);
    
    // 2. Persist language choice
    localStorage.setItem('asg_lang', this.lang);
    
    // 3. Apply translations instantly to prevent layout shift
    this.applyTranslations();
    this.setupSelectors();

    // 4. Async fetch updates from Google Sheets (Phase 9 API)
    if(window.API) {
      try {
        const res = (window.API && window.API.post) ? await window.API.post({ action: 'getTranslations' }) : null;
        if (res?.success && res.data) {
          this.dict = this.mergeDicts(this.dict, res.data);
          localStorage.setItem('asg_i18n_dict', JSON.stringify(res.data));
          this.applyTranslations(); // Re-apply if updates found
        }
      } catch(e) { console.warn("Failed to fetch live translations", e); }
    }
  },

  mergeDicts: function(target, source) {
    const out = JSON.parse(JSON.stringify(target));
    for (let lang in source) {
      if (!out[lang]) out[lang] = {};
      for (let key in source[lang]) {
        out[lang][key] = source[lang][key];
      }
    }
    return out;
  },

  t: function(key) {
    // Fallback logic: Requested Language -> English Fallback -> Raw Key
    if (this.dict[this.lang] && this.dict[this.lang][key]) return this.dict[this.lang][key];
    if (this.dict['en'] && this.dict['en'][key]) return this.dict['en'][key];
    return key;
  },

  applyTranslations: function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translated;
      } else {
        el.innerText = translated;
      }
    });
    document.documentElement.lang = this.lang;
  },

  changeLanguage: function(newLang) {
    if (this.lang === newLang) return;
    localStorage.setItem('asg_lang', newLang);
    
    // Redirect to localized SEO path if not English
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';
    
    if (newLang === 'en') {
      window.location.href = '/' + filename;
    } else {
      window.location.href = '/' + newLang + '/' + filename;
    }
  },

  setupSelectors: function() {
    // Ensure selector reflects current lang
    document.querySelectorAll('.lang-selector').forEach(sel => {
      sel.value = this.lang;
      sel.addEventListener('change', (e) => this.changeLanguage(e.target.value));
    });
  }
};

// Initialize early
document.addEventListener('DOMContentLoaded', () => window.I18N.init());
