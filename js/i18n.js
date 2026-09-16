/* ========================================================================= */
/* ADITYA SKILL GATE IT SOLUTION — MULTILINGUAL ENGINE (i18n)                */
/* ========================================================================= */

// Strict page language detection (en is default for root pages)
function getPageLang() {
  if (typeof window.ASG_LANG === 'string' && window.ASG_LANG) {
    return window.ASG_LANG;
  }
  const path = (window.location.pathname || '').toLowerCase();
  if (path.includes('/ta/') || path.startsWith('/ta/')) return 'ta';
  if (path.includes('/zh/') || path.startsWith('/zh/')) return 'zh';
  if (path.includes('/ms/') || path.startsWith('/ms/')) return 'ms';
  return 'en'; // Strict default for all main root pages
}

// Default Fallback Dictionary
const DEFAULT_DICT = {
  en: {
    "Home": "Home",
    "about": "About",
    "services": "Services",
    "nav.courses": "Courses",
    "nav.careers": "Careers",
    "nav.projects": "Projects",
    "nav.placements": "Placements",
    "contact": "Contact",
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
    "Home": "首页",
    "about": "关于我们",
    "services": "服务",
    "nav.courses": "课程",
    "nav.careers": "招聘",
    "nav.projects": "项目案例",
    "nav.placements": "就业成果",
    "contact": "联系我们",
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
    "Home": "Utama",
    "about": "Tentang Kami",
    "services": "Perkhidmatan",
    "nav.courses": "Program",
    "nav.careers": "Kerjaya",
    "nav.projects": "Projek",
    "nav.placements": "Penempatan",
    "contact": "Hubungi",
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
    "Home": "முகப்பு",
    "about": "எங்களை பற்றி",
    "services": "சேவைகள்",
    "nav.courses": "படிப்புகள்",
    "nav.careers": "வேலைவாய்ப்புகள்",
    "nav.projects": "திட்டங்கள்",
    "nav.placements": "வேலைவாய்ப்பு பெற்றோர்",
    "contact": "தொடர்புக்கு",
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
  lang: getPageLang(),
  dict: {},

  init: async function() {
    this.lang = getPageLang();

    // 1. Load merged dictionary (Default + localStorage cache)
    const cachedDict = JSON.parse(localStorage.getItem('asg_i18n_dict') || '{}');
    this.dict = this.mergeDicts(DEFAULT_DICT, cachedDict);
    
    // 2. Persist language choice
    localStorage.setItem('asg_lang', this.lang);
    
    // 3. Apply translations only if not English
    if (this.lang !== 'en') {
      this.applyTranslations();
    }
    this.setupSelectors();

    // 4. Async fetch updates from Google Sheets if configured
    if (window.API && typeof window.API.post === 'function') {
      try {
        const res = await window.API.post({ action: 'getTranslations' });
        if (res?.success && res.data) {
          this.dict = this.mergeDicts(this.dict, res.data);
          localStorage.setItem('asg_i18n_dict', JSON.stringify(res.data));
          if (this.lang !== 'en') this.applyTranslations();
        }
      } catch(e) { /* silent catch */ }
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
    
    // Redirect to localized SEO path
    const currentPath = window.location.pathname;
    const filename = currentPath.split('/').pop() || 'index.html';
    
    if (newLang === 'en') {
      window.location.href = '/' + filename;
    } else {
      window.location.href = '/' + newLang + '/' + filename;
    }
  },

  setupSelectors: function() {
    document.querySelectorAll('.lang-selector').forEach(sel => {
      sel.value = this.lang;
      sel.addEventListener('change', (e) => this.changeLanguage(e.target.value));
    });
  }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => window.I18N.init());
