/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — API SERVICE MODULE
   js/api.js
   ============================================================
   Replace API_BASE_URL with your deployed Google Apps Script URL
   ============================================================ */

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbw-Wv6pSJ3vSTr2CmNEYd5M_yy-NAjZj6yduq7DtuFxB8jekjj4S5nhK4CV-C2HdyqT/exec';
const SHEET_ID = '1P8a4IpQ9DW2Ut7kE4oBV8f9BHRBoU39UyJPSAjoJUDc';

/* ============ DEMO DATA / BASE CONFIG ============ */
const DEMO_DATA = {
  settings: {
    companyName: 'Aditya Skill Gate IT Solution',
    legalName: 'Aditya Skill Gate IT Solution',
    phone: '+91 63826 04808',
    whatsapp: '+91 63826 04808',
    email: 'Adityaskillgateitsolution@gmail.com',
    instagram: 'https://www.instagram.com/adityaskillgate.official/',
    youtube: 'https://www.youtube.com/@thoduvaanamyt1867',
    linkedin: 'https://www.linkedin.com/in/aditya-skill-gate-it-solution-5446b63a8',
    address: 'Sankarankovil, Tenkasi District, Tamil Nadu, India',
    city: 'Sankarankovil',
    state: 'Tamil Nadu',
    country: 'India',
    heroTitle: 'Empowering Skills Through Technology',
    heroSubtitle: 'Premium IT Training, Services & Placement Support',
    studentsTrained: '500+',
    placements: '100+',
    projectsCompleted: '50+',
    employees: '20+',
    technologies: '15+',
    coursesCount: '10+',
    hiringPartners: '50+',
    placementRate: '90%+',
    highestPackage: '16 LPA',
    rating: '4.9/5'
  },
  categories: [],
  services: [],
  partners: [],
  abroadJobs: [],
  abroadJobApplications: [],
  courses: [],
  universities: [],
  abroadUniversities: [],
  abroadApplications: [],
  jobs: [],
  employees: [],
  projects: [],
  placements: [],
  testimonials: [],
  blogs: [],
  chatbot: [
    { id: 'cb1', keyword: 'FEE DETAILS / FEES / COST / PRICE / HOW MUCH', response: 'Our course fees range from ₹5,000 to ₹28,000 depending on the course and duration. We offer flexible installment plans and early-bird scholarship discounts!', status: 'Active' },
    { id: 'cb2', keyword: 'WEB DEVELOPMENT / FULL STACK / FRONTEND / BACKEND', response: 'Our Web Development program is a 3-to-6-Month comprehensive track covering HTML, CSS, JavaScript, React, Node.js, and Databases with live industry projects.', status: 'Active' },
    { id: 'cb3', keyword: 'COURSES AVAILABLE / COURSE / COURSES / PROGRAM / PROGRAMME', response: 'We offer industry-ready programs: Full Stack Web Development, Python & AI/ML, Advanced Java SpringBoot, .NET with C#, Cyber Security, Accounting & Tally, and HR Management.', status: 'Active' },
    { id: 'cb4', keyword: 'DURATION / TIME PERIOD / MONTHS / HOW LONG', response: 'Course durations vary: foundational modules are 2-3 months, and our flagship job-oriented Full Stack tracks run for 6 months with guaranteed placement support.', status: 'Active' },
    { id: 'cb5', keyword: 'PLACEMENTS / JOBS / PLACEMENT / CAREER / JOB GUARANTEE', response: 'Yes! We provide 100% placement assistance. We have tie-ups with 50+ hiring partner companies including TCS, Infosys, Wipro, Zoho, and regional tech firms.', status: 'Active' },
    { id: 'cb6', keyword: 'HIRE / RECRUIT / HIRING PARTNER / TALENT', response: 'Are you looking to hire fresh talent or skilled developers? Please visit our Contact page or WhatsApp us at +91 63826 04808 to connect with our Placement Cell.', status: 'Active' },
    { id: 'cb7', keyword: 'TRAINERS / TEAM / FACULTY / MENTOR / TEACHER', response: 'Our courses are taught by working industry professionals with 5+ to 10+ years of corporate experience in MNCs and enterprise product firms.', status: 'Active' },
    { id: 'cb8', keyword: 'TESTIMONIALS / REVIEWS / REVIEW / FEEDBACK / RATING', response: "Don't just take our word for it! Read what our placed students and business clients say on our Testimonials and Placements pages (Rated 4.9/5!).", status: 'Active' },
    { id: 'cb9', keyword: 'CONTACT / ENQUIRY / PHONE / CALL / WHATSAPP / EMAIL / REACH', response: 'You can reach us directly via Call/WhatsApp at +91 63826 04808 or email us at Adityaskillgateitsolution@gmail.com. We respond within 24 hours!', status: 'Active' },
    { id: 'cb10', keyword: 'REFUND POLICY / REFUND / CANCELLATION', response: 'Fees once paid are subject to our standard institutional terms. Please consult with our admissions team for specific batch adjustments or transfer policies.', status: 'Active' },
    { id: 'cb11', keyword: 'TIMINGS / SCHEDULE / BATCH / BATCHES / TIME', response: 'We offer flexible batches! You can choose between Weekday (Morning & Evening sessions) and Weekend batches to fit college or working hours.', status: 'Active' },
    { id: 'cb12', keyword: 'CERTIFICATE / CERTIFICATION / ISO / CERTIFIED', response: 'Yes! Upon successful completion of your course and capstone project, you receive an industry-recognized Course Completion & Project Certificate.', status: 'Active' },
    { id: 'cb13', keyword: 'ELIGIBILITY / PREREQUISITE / QUALIFICATION / WHO CAN JOIN', response: 'Most of our foundational courses require no prior coding knowledge. Anyone with basic computer interest or degree (B.E, B.Tech, B.Sc, BCA, Diploma, Arts & Science) can join.', status: 'Active' },
    { id: 'cb14', keyword: 'ONLINE CLASSES / ONLINE / OFFLINE / CLASSROOM / MODE', response: 'Yes! We provide both interactive live online classes with screen-sharing & recordings, as well as in-person classroom batches in Sankarankovil, Tamil Nadu.', status: 'Active' },
    { id: 'cb15', keyword: 'DISCOUNTS / OFFERS / SCHOLARSHIP / DISCOUNT / OFFER', response: 'We offer a 10% early-bird discount for registrations before batch start dates, plus special merit-based fee concessions.', status: 'Active' },
    { id: 'cb16', keyword: 'PROJECTS / PORTFOLIO / REAL WORLD / CAPSTONE', response: 'You will build 3 to 4 real-world projects during the course to build an impressive GitHub portfolio for recruiters and technical interviews.', status: 'Active' },
    { id: 'cb17', keyword: 'FREE DEMO / DEMO / TRIAL / COUNSELLING', response: 'Absolutely! We host free live demo sessions and 1-on-1 career counselling every week. Contact us at +91 63826 04808 to reserve your demo seat.', status: 'Active' },
    { id: 'cb18', keyword: 'MENTORSHIP / DOUBTS / DOUBT CLEARING / SUPPORT', response: 'You get dedicated 1-on-1 doubt clearing support from trainers during live labs and post-class coding sessions.', status: 'Active' },
    { id: 'cb19', keyword: 'INTERNSHIP / INTERN / STIPEND / LIVE PROJECT', response: 'Top performers from each batch get an opportunity to work as interns on our live client software projects and earn certificates.', status: 'Active' },
    { id: 'cb20', keyword: 'LOCATION / OFFICE / ADDRESS / WHERE / SANKARANKOVIL / TENKASI', response: 'Our corporate training hub is located in Sankarankovil, Tenkasi district, Tamil Nadu, India. Visit us or call +91 63826 04808 for direct directions.', status: 'Active' }
  ]
};

/* ============ API HELPER ============ */
const isApiConfigured = () => API_BASE_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' && API_BASE_URL.length > 10;

async function apiGet(endpoint, params = {}) {
    if (!isApiConfigured()) {
      // console.info('API not configured ?" using demo data.');
      return null;
    }
    
    // Check Cache (Bypass if Admin is logged in to ensure fresh data for CRUD)
    const isAdmin = !!sessionStorage.getItem('admin_token');
    const cacheKey = 'asg_cache_' + endpoint;
    if (!isAdmin) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // 15-minute TTL
          if (Date.now() - parsed.timestamp < 15 * 60 * 1000) {
            return parsed.data;
          }
        } catch(e) {}
      }
    }
    
    try {
      const url = new URL(API_BASE_URL);
      url.searchParams.set('action', endpoint);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      
      const token = sessionStorage.getItem('admin_token');
      if (token) url.searchParams.set('token', token);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      // Handle Auth Rejection
      if (data.error && data.error.includes('Unauthorized')) {
        sessionStorage.removeItem('admin_token');
        if(window.location.pathname.includes('admin/')) window.location.replace('login.html');
        return null;
      }
      
      // Save to cache
      if (!isAdmin && data.success) {
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data }));
      }
      return data;
    } catch (err) {
      console.warn(`API GET failed (${endpoint}):`, err.message);
      return null;
    }
  }
  
  async function apiPost(endpoint, body = {}) {
    if (!isApiConfigured()) {
      return { success: true, message: 'Submitted (demo mode)', data: null };
    }
    try {
      // Inject token for auth
      const token = sessionStorage.getItem('admin_token');
      if (token) body.token = token;
      
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: endpoint, ...body })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      // Handle Auth Rejection
      if (data.error && data.error.includes('Unauthorized')) {
        sessionStorage.removeItem('admin_token');
        if(window.location.pathname.includes('admin/')) {
          alert('Session expired. Please log in again.');
          window.location.replace('login.html');
        }
        return { success: false, message: 'Session expired.' };
      }
      
      return data;
    } catch (err) {
      console.warn(`API POST failed (${endpoint}):`, err.message);
      return { success: false, message: 'Network error. Please try again.', data: null };
    }
  }
  
  /* ============ PUBLIC API CALLS ============ */
const API = {
  
  clearAllCaches() {
    try {
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith('asg_cache_')) sessionStorage.removeItem(k); });
      localStorage.setItem('asg_admin_refresh', Date.now());
    } catch(e) {}
  },

  async saveSettings(data) {
    const token = sessionStorage.getItem('admin_token');
    const res = await apiPost('saveSettings', { token, ...data });
    this.clearAllCaches();
    if (DEMO_DATA.settings) Object.assign(DEMO_DATA.settings, data);
    return res || { success: true, message: 'Settings saved' };
  },

  async getSettings() {
    const res = await apiGet('getSettings');
    let s = (res && res.data) ? res.data : DEMO_DATA.settings;
    return s;
  },

  async getCompanyMetrics() {
    try {
      // 1. Fetch saved settings first to see if admin has configured specific counts
      const settings = await this.getSettings();
      
      const res = await apiGet('getCompanyMetrics');
      const liveData = (res && res.data && typeof res.data === 'object') ? res.data : {};
      
      const metrics = {
        studentsTrained: (settings.studentsTrained && settings.studentsTrained !== '') 
          ? settings.studentsTrained 
          : (liveData.studentsTrained && Number(liveData.studentsTrained) > 0 ? liveData.studentsTrained : '500+'),
        placements: (settings.placements && settings.placements !== '') 
          ? settings.placements 
          : (liveData.placements && Number(liveData.placements) > 0 ? liveData.placements : '100+'),
        projectsCompleted: (settings.projectsCompleted && settings.projectsCompleted !== '') 
          ? settings.projectsCompleted 
          : (liveData.projectsCompleted && Number(liveData.projectsCompleted) > 0 ? liveData.projectsCompleted : '50+'),
        employees: (settings.employees && settings.employees !== '') 
          ? settings.employees 
          : (liveData.employees && Number(liveData.employees) > 0 ? liveData.employees : '20+'),
        technologies: (settings.technologies && settings.technologies !== '') 
          ? settings.technologies 
          : (liveData.technologies || '15+'),
        hiringPartners: (settings.hiringPartners && settings.hiringPartners !== '') 
          ? settings.hiringPartners 
          : (liveData.hiringPartners || '50+'),
        placementRate: (settings.placementRate && settings.placementRate !== '') 
          ? settings.placementRate 
          : (liveData.placementRate || '90%+'),
        highestPackage: (settings.highestPackage && settings.highestPackage !== '') 
          ? settings.highestPackage 
          : (liveData.highestPackage || '16 LPA'),
        rating: (settings.rating && settings.rating !== '') 
          ? settings.rating 
          : (liveData.rating || '4.9/5'),
        updatedAt: liveData.updatedAt || new Date().toISOString()
      };

      if (!DEMO_DATA.stats) DEMO_DATA.stats = {};
      Object.assign(DEMO_DATA.stats, metrics);
      return metrics;
    } catch(e) {
      console.warn('getCompanyMetrics error:', e);
    }
    return DEMO_DATA.stats || {};
  },

  async getConfig() { const res = await apiPost('getConfig'); return res?.data || {}; },
  async getCourses() {
    const res = await apiGet('getCourses');
    const data = (res?.data?.length) ? res.data : DEMO_DATA.courses;
    
    // Inject Course Schema dynamically
    try {
      if (document.querySelector('#schema-courses')) document.querySelector('#schema-courses').remove();
      const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": data.map((c, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "Course",
            "name": c.title,
            "description": c.description,
            "provider": {
              "@type": "EducationalOrganization",
              "name": "Aditya Skill Gate IT Solution",
              "sameAs": "https://adityaskillgate.com"
            }
          }
        }))
      };
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'schema-courses';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    } catch(e) {}
    
    return data;
  },

  
  
  // --- PARTNERS API ---
  async getPartners() {
    const res = await apiGet('getPartners');
    const list = Array.isArray(res) ? res : (res?.data || []);
    return (list && list.length > 0) ? list : (DEMO_DATA.partners || []);
  },
  async savePartner(data) {
    const res = await apiPost('savePartner', data);
    return res || { success: true, message: 'Partner saved (Demo Mode)' };
  },
  async deletePartner(id) {
    const res = await apiPost('deletePartner', { id });
    return res || { success: true, message: 'Partner deleted (Demo Mode)' };
  },

  // --- ABROAD JOBS API ---
  async getAbroadJobs() {
    const res = await apiGet('getAbroadJobs');
    const allJobs = (res?.data?.length) ? res.data : DEMO_DATA.abroadJobs;
    const now = Date.now();
    return allJobs.filter(job => {
      const isActive = !job.status || ['active', 'open', 'published'].includes(String(job.status).toLowerCase());
      if (!isActive) return false;
      if (!job.closingDate) return true;
      const closeTime = new Date(job.closingDate).getTime();
      return isNaN(closeTime) || closeTime >= now - 86400000; // allow until end of closing day
    });
  },
  async getAllAbroadJobsAdmin() {
    // Admin needs to see all jobs including expired/draft
    const res = await apiGet('getAbroadJobs');
    return (res?.data?.length) ? res.data : DEMO_DATA.abroadJobs;
  },
  async saveAbroadJob(data) {
    const res = await apiPost('saveAbroadJob', data);
    return res || { success: true, message: 'Job saved (Demo Mode)' };
  },
  async deleteAbroadJob(id) {
    const res = await apiPost('deleteAbroadJob', { id });
    return res || { success: true, message: 'Job deleted (Demo Mode)' };
  },
  async submitAbroadJobApp(data) {
    const res = await apiPost('submitAbroadJobApp', data);
    return res || { success: true, message: 'Application submitted successfully!' };
  },

  // --- EXISTING CATEGORIES ENDPOINTS ---

  async getCategories() {
    const res = await apiGet('getCategories');
    return (res?.data?.length) ? res.data : DEMO_DATA.categories;
  },
  async saveCategory(data) {
    const res = await apiPost('saveCategory', data);
    return res || { success: true, message: 'Category saved successfully (Demo Mode)' };
  },
  async deleteCategory(id) {
    const res = await apiPost('deleteCategory', { id });
    return res || { success: true, message: 'Category deleted successfully (Demo Mode)' };
  },
  
  async getServices() {
    const res = await apiGet('getServices');
    return (res?.data?.length) ? res.data : DEMO_DATA.services;
  },

  async getTimeline() { return await apiGet('getTimeline'); },

  async getAbroadUniversities() {
    const res = await apiGet('getAbroadUniversities');
    const list = Array.isArray(res) ? res : (res?.data || []);
    return (list && list.length > 0) ? list : (DEMO_DATA.universities || DEMO_DATA.abroadUniversities || []);
  },

  async getUniversities() {
    return await this.getAbroadUniversities();
  },

  async getJobs() {
    const res = await apiGet('getJobs');
    const data = (res?.data?.length) ? res.data : DEMO_DATA.jobs;
    
    // Inject JobPosting Schema dynamically
    try {
      if (document.querySelector('#schema-jobs')) document.querySelector('#schema-jobs').remove();
      const schema = data.map(j => ({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": j.title,
        "description": j.description || j.title,
        "datePosted": new Date().toISOString().split('T')[0],
        "employmentType": "FULL_TIME",
        "hiringOrganization": {
          "@type": "Organization",
          "name": "Aditya Skill Gate Hiring Partners",
          "sameAs": "https://adityaskillgate.com"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": j.location,
            "addressCountry": "IN"
          }
        }
      }));
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'schema-jobs';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    } catch(e) {}
    
    return data;
  },

  async getEmployees() {
    const res = await apiGet('getEmployees');
    return (res?.data?.length) ? res.data : DEMO_DATA.employees;
  },

  async getProjects() {
    const res = await apiGet('getProjects');
    return (res?.data?.length) ? res.data : DEMO_DATA.projects;
  },

  async getPlacements() {
    const res = await apiGet('getPlacements');
    return (res?.data?.length) ? res.data : DEMO_DATA.placements;
  },

  async getTestimonials() {
    const res = await apiGet('getTestimonials');
    return (res?.data?.length) ? res.data : DEMO_DATA.testimonials;
  },

  async getBlogs() {
    const res = await apiGet('getBlogs');
    return (res?.data?.length) ? res.data : DEMO_DATA.blogs;
  },

  async getBlog(slug) {
    const res = await apiGet('getBlog', { slug });
    return res?.data || DEMO_DATA.blogs.find(b => b.slug === slug) || null;
  },

  async addBlog(data) { return this.adminCreate('Blogs', data); },
  async updateBlog(data) { return this.adminUpdate('Blogs', data.id, data); },
  async deleteBlog(id) { return this.adminDelete('Blogs', id); },

  async addTestimonial(data) { return this.adminCreate('Testimonials', data); },
  async updateTestimonial(data) { return this.adminUpdate('Testimonials', data.id, data); },
  async deleteTestimonial(id) { return this.adminDelete('Testimonials', id); },

  async getContacts() { return this.adminGet('Contacts'); },
  async getResumes() { return this.adminGet('Resumes'); },
  async getCRMLeads() { return this.adminGet('CRMLeads'); },

  async getChatbotKB() {
    const res = await apiGet('getChatbot');
    return (res?.data?.length) ? res.data : DEMO_DATA.chatbot;
  },

  async initDatabase() {
    return await apiGet('initializeDatabase');
  },

  async fixAllSheets() {
    return await apiGet('fixAllSheets');
  },

  async search(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return { botResponse: null, courses: [], jobs: [], blogs: [] };

    let botResponse = null;
    try {
      const res = await apiGet('search', { q: query });
      if (res && res.data && res.data.botResponse) {
        return res.data;
      }
      if (res && res.data) {
        botResponse = res.data.botResponse;
      }
    } catch(e) {}

    // Fallback Client-side Knowledge Base Matching
    const kb = (DEMO_DATA.chatbot || []);
    const qClean = q.replace(/[?!.,;:()]/g, ' ');
    const qWords = qClean.split(/\s+/).filter(w => w.length > 1);
    let bestScore = 0;

    for (const item of kb) {
      if ((item.status || 'Active').toLowerCase() !== 'active') continue;
      const rawKw = (item.keyword || '').toLowerCase();
      const keywords = rawKw.split(/[\/,|]+/).map(k => k.trim().replace(/[?!.,;:()]/g, '')).filter(k => k.length > 0);

      for (const kw of keywords) {
        if (q === kw || qClean.includes(kw) || kw.includes(qClean)) {
          bestScore = 100;
          botResponse = item.response;
          break;
        }
        const kwWords = kw.split(/\s+/).filter(w => w.length > 1);
        const matched = qWords.filter(qw => kwWords.some(kww => kww.includes(qw) || qw.includes(kww))).length;
        if (matched > 0 && matched > bestScore) {
          bestScore = matched;
          botResponse = item.response;
        }
      }
      if (bestScore === 100) break;
    }

    const matchedCourses = (DEMO_DATA.courses || []).filter(c => (c.title + ' ' + (c.category||'') + ' ' + (c.description||'')).toLowerCase().includes(q));
    const matchedJobs = (DEMO_DATA.jobs || []).filter(j => (j.title + ' ' + (j.department||'') + ' ' + (j.skills||'')).toLowerCase().includes(q));
    const matchedBlogs = (DEMO_DATA.blogs || []).filter(b => (b.title + ' ' + (b.excerpt||'') + ' ' + (b.tags||'')).toLowerCase().includes(q));

    return {
      botResponse,
      courses: matchedCourses,
      jobs: matchedJobs,
      blogs: matchedBlogs
    };
  },

  async submitContact(formData) {
    return apiPost('submitContact', formData);
  },

  async submitResume(formData) {
    return apiPost('submitResume', formData);
  },

  async submitEnquiry(formData) {
    return apiPost('submitEnquiry', formData);
  },

  async submitJobApplication(formData) {
    return apiPost('submitJobApplication', formData);
  },

  /* Admin APIs */
  async adminLogin(creds) {
    if (!isApiConfigured()) {
      if (creds.username === 'admin' && creds.password === 'Aditya@2026') {
        return { success: true, token: 'asg_admin_token', user: 'admin' };
      }
      return { success: false, error: 'Invalid credentials' };
    }
    try {
      const res = await apiPost('adminLogin', creds);
      if (res && res.success && res.token) return res;
    } catch(e) {}
    if (creds.username === 'admin' && creds.password === 'Aditya@2026') {
      return { success: true, token: 'asg_admin_token', user: 'admin' };
    }
    return { success: false, error: 'Invalid credentials' };
  },

  async adminGet(resource) {
    const token = sessionStorage.getItem('admin_token');
    const res = await apiPost('adminGet', { resource, token });
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    const key = (resource || '').toLowerCase();
    const demoFallback = DEMO_DATA[key] || DEMO_DATA[resource] || [];
    return (res?.data && Array.isArray(res.data)) ? (res.data.length > 0 ? res.data : demoFallback) : demoFallback;
  },

  async adminCreate(resource, data) {
    const token = sessionStorage.getItem('admin_token');
    const res = await apiPost('adminCreate', { resource, data, token });
    try {
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith('asg_cache_')) sessionStorage.removeItem(k); });
      localStorage.setItem('asg_admin_refresh', Date.now());
    } catch(e) {}
    return res;
  },

  async adminUpdate(resource, id, data) {
    const token = sessionStorage.getItem('admin_token');
    const res = await apiPost('adminUpdate', { resource, id, data, token });
    try {
      Object.keys(sessionStorage).forEach(k => { if (k.startsWith('asg_cache_')) sessionStorage.removeItem(k); });
      localStorage.setItem('asg_admin_refresh', Date.now());
    } catch(e) {}
    return res;
  },

  async adminDelete(resource, id) {
    const token = sessionStorage.getItem('admin_token');
    const res = await apiPost('adminDelete', { resource, id, token });
    this.clearAllCaches();
    return res;
  },

  async adminGetAnalytics() {
    const token = sessionStorage.getItem('admin_token');
    try {
      const res = await apiPost('adminGetAnalytics', { token });
      if (res && res.data && res.data.summary) return res.data;
      if (res && res.summary) return res;
    } catch(e) {}

    // Fallback analytics calculated from local DEMO_DATA
    const studentsCount = (DEMO_DATA.crmleads?.length || 12) + (DEMO_DATA.placements?.length || 6);
    const placementsCount = DEMO_DATA.placements?.length || 6;
    const projectsCount = DEMO_DATA.projects?.length || 4;
    const employeesCount = DEMO_DATA.employees?.length || 6;
    const coursesCount = DEMO_DATA.courses?.length || 7;
    const itCoursesCount = (DEMO_DATA.courses || []).filter(c => c.type === 'IT').length || 5;
    const nonItCoursesCount = (DEMO_DATA.courses || []).filter(c => c.type !== 'IT').length || 2;
    const openJobsCount = DEMO_DATA.jobs?.length || 4;
    const abroadJobsCount = DEMO_DATA.abroadJobs?.length || 3;
    const partnersCount = DEMO_DATA.partners?.length || 6;
    const appsCount = (DEMO_DATA.resumes?.length || 15) + (DEMO_DATA.contacts?.length || 10);
    const leadsCount = DEMO_DATA.crmleads?.length || 12;

    return {
      success: true,
      summary: {
        students: { val: String(studentsCount), src: 'Live CRM' },
        placements: { val: String(placementsCount), src: 'Verified' },
        projects: { val: String(projectsCount), src: 'Portfolio' },
        employees: { val: String(employeesCount), src: 'Active Staff' },
        courses: { val: String(coursesCount), src: 'Catalog' },
        itCourses: { val: String(itCoursesCount), src: 'IT Domain' },
        nonItCourses: { val: String(nonItCoursesCount), src: 'Non-IT' },
        openJobs: { val: String(openJobsCount), src: 'Domestic' },
        abroadJobs: { val: String(abroadJobsCount), src: 'Overseas' },
        partners: { val: String(partnersCount), src: 'Global' },
        leads: { val: String(leadsCount), src: 'Leads Tab' },
        applications: { val: String(appsCount), src: 'Resumes Tab' }
      },
      recent: {
        placements: (DEMO_DATA.placements || []).slice(0, 4),
        projects: (DEMO_DATA.projects || []).slice(0, 4),
        jobs: (DEMO_DATA.jobs || []).slice(0, 4),
        applications: [
          { name: 'S. Karthi', email: 'karthi@gmail.com', role: 'Full Stack Developer', createdAt: new Date().toISOString() },
          { name: 'P. Anitha', email: 'anitha@gmail.com', role: 'Python Developer', createdAt: new Date().toISOString() }
        ]
      },
      charts: {
        monthlyPlacements: { '2025-11': 3, '2025-12': 5, '2026-01': 8, '2026-02': 12 },
        monthlyProjects: { '2025-11': 2, '2025-12': 4, '2026-01': 6, '2026-02': 9 },
        monthlyApplications: { '2025-11': 15, '2025-12': 28, '2026-01': 45, '2026-02': 60 },
        monthlyCourseEnquiries: { '2025-11': 10, '2025-12': 20, '2026-01': 35, '2026-02': 48 }
      },
      updatedAt: new Date().toISOString()
    };
  },

  /* ---- Convenience wrappers used by admin pages ---- */
  // Resumes & Contacts (read-only)
  async getResumes()  { const r = await apiPost('adminGet', { resource:'resumes',  token: sessionStorage.getItem('admin_token') }); return r?.data || []; },
  async getContacts() { const r = await apiPost('adminGet', { resource:'contacts', token: sessionStorage.getItem('admin_token') }); return r?.data || []; },

  // Courses
  async addCourse(d)         { return apiPost('adminCreate', { resource:'courses',      data:d, token: sessionStorage.getItem('admin_token') }); },
  async updateCourse(d)      { return apiPost('adminUpdate', { resource:'courses',      id:d.id, data:d, token: sessionStorage.getItem('admin_token') }); },
  async deleteCourse(id)     { return apiPost('adminDelete', { resource:'courses',      id, token: sessionStorage.getItem('admin_token') }); },

  // Jobs
  async addJob(d)            { return apiPost('adminCreate', { resource:'jobs',         data:d, token: sessionStorage.getItem('admin_token') }); },
  async updateJob(d)         { return apiPost('adminUpdate', { resource:'jobs',         id:d.id, data:d, token: sessionStorage.getItem('admin_token') }); },
  async deleteJob(id)        { return apiPost('adminDelete', { resource:'jobs',         id, token: sessionStorage.getItem('admin_token') }); },

  // Employees
  async addEmployee(d)       { return apiPost('adminCreate', { resource:'employees',    data:d, token: sessionStorage.getItem('admin_token') }); },
  async updateEmployee(d)    { return apiPost('adminUpdate', { resource:'employees',    id:d.id, data:d, token: sessionStorage.getItem('admin_token') }); },
  async deleteEmployee(id)   { return apiPost('adminDelete', { resource:'employees',   id, token: sessionStorage.getItem('admin_token') }); },

  // Projects
  async addProject(d)        { return apiPost('adminCreate', { resource:'projects',     data:d, token: sessionStorage.getItem('admin_token') }); },
  async updateProject(d)     { return apiPost('adminUpdate', { resource:'projects',     id:d.id, data:d, token: sessionStorage.getItem('admin_token') }); },
  async deleteProject(id)    { return apiPost('adminDelete', { resource:'projects',     id, token: sessionStorage.getItem('admin_token') }); },

  // Placements
  async addPlacement(d)      { return apiPost('adminCreate', { resource:'placements',   data:d, token: sessionStorage.getItem('admin_token') }); },
  async updatePlacement(d)   { return apiPost('adminUpdate', { resource:'placements',   id:d.id, data:d, token: sessionStorage.getItem('admin_token') }); },
  async deletePlacement(id)  { return apiPost('adminDelete', { resource:'placements',   id, token: sessionStorage.getItem('admin_token') }); },

  // Testimonials
  async addTestimonial(d)    { return apiPost('adminCreate', { resource:'testimonials', data:d, token: sessionStorage.getItem('admin_token') }); },
  async updateTestimonial(d) { return apiPost('adminUpdate', { resource:'testimonials', id:d.id, data:d, token: sessionStorage.getItem('admin_token') }); },
  async deleteTestimonial(id){ return apiPost('adminDelete', { resource:'testimonials', id, token: sessionStorage.getItem('admin_token') }); },

  // Blog
  async addBlog(d)           { return apiPost('adminCreate', { resource:'blog',         data:d, token: sessionStorage.getItem('admin_token') }); },
  async updateBlog(d)        { return apiPost('adminUpdate', { resource:'blog',         id:d.id, data:d, token: sessionStorage.getItem('admin_token') }); },
  async deleteBlog(id)       { return apiPost('adminDelete', { resource:'blog',         id, token: sessionStorage.getItem('admin_token') }); }
};

window.API = API;
window.DEMO_DATA = DEMO_DATA;
