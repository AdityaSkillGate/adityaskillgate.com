/**
 * ADITYA SKILL GATE IT SOLUTION
 * Google Apps Script Backend (V2 Final Merged)
 * 
 * Includes: MailApp, DriveUploads, Secure Auth, XSS Sanitization, and V2 CRUD.
 */

const SPREADSHEET_ID = '1P8a4IpQ9DW2Ut7kE4oBV8f9BHRBoU39UyJPSAjoJUDc'; // Replace with actual ID
const ADMIN_DRIVE_FOLDER = 'ASG_Resumes';
const ADMIN_EMAIL = 'Adityaskillgateitsolution@gmail.com';
const COMPANY_NAME = 'Aditya Skill Gate IT Solution';
const COMPANY_PHONE = '+91 63826 04808';
const WEBSITE_URL = 'https://adityaskillgate.com';
const ADMIN_USERNAME = 'admin';
const TOKEN_EXPIRY_HOURS = 8;

/* ========================================= */
/* 1. ENTRY POINTS & ROUTING (Code.gs)       */
/* ========================================= */

function doGet(e) {
  const action = e?.parameter?.action || 'ping';
  try {
    switch (action) {
      case 'ping': return jsonResponse({ success: true, message: 'ASG API is running', version: '2.0' });
      case 'migrateTimelineHeaders': migrateTimelineHeaders(); return jsonResponse({success:true});
        case 'migratePartnerHeaders': migratePartnerHeaders(); return jsonResponse({success:true});
        case 'migrateJobHeaders': migrateJobHeaders(); return jsonResponse({success:true});
        case 'migrateCourseHeaders': migrateCourseHeaders(); return jsonResponse({success:true});
        case 'migrateEmployeeHeaders': migrateEmployeeHeaders(); return jsonResponse({success:true});
        case 'migratePlacementHeaders': migratePlacementHeaders(); return jsonResponse({success:true});
        case 'migrateProjectHeaders': migrateProjectHeaders(); return jsonResponse({success:true});
        case 'getConfig': return jsonResponse({ success: true, data: getSettings(true) });
        case 'getSettings': return jsonResponse({ success: true, data: getSettings() });
      case 'getCourses': return jsonResponse({ success: true, data: getActiveCourses() });
      case 'getServices': return jsonResponse({ success: true, data: getActiveServices() });
      case 'getPartners': return jsonResponse({ success: true, data: getActivePartners() });
      case 'getChatbot': return jsonResponse({ success: true, data: getSheetData('Chatbot').filter(r => (r.status||'Active').trim().toLowerCase() === 'active') });
      case 'getAbroadUniversities': 
      case 'getUniversities': return jsonResponse({ success: true, data: getActiveAbroadUniversities() });
      case 'getJobs': return jsonResponse({ success: true, data: getOpenJobs() });
      case 'getAbroadJobs': return jsonResponse({ success: true, data: getActiveAbroadJobs() });
      case 'getEmployees': return jsonResponse({ success: true, data: getActiveEmployees() });
      case 'getProjects': return jsonResponse({ success: true, data: getCompletedProjects() });
      case 'getPlacements': return jsonResponse({ success: true, data: getPublishedPlacements() });
      case 'getTimeline': return jsonResponse({ success: true, data: getSheetData('Timeline').filter(t => (t.status||'').trim().toLowerCase() === 'active').sort((a,b) => parseInt(a.sortOrder||0) - parseInt(b.sortOrder||0)) });
        case 'getTestimonials': return jsonResponse({ success: true, data: getActiveTestimonials() });
      case 'getBlogs': return jsonResponse({ success: true, data: getPublishedBlogs() });
      case 'getCategories': return jsonResponse({ success: true, data: getSheetData('Categories') });
      case 'getBlog': return jsonResponse({ success: true, data: getBlogBySlug(e?.parameter?.slug) });
      case 'getCompanyMetrics': return jsonResponse({ success: true, data: getCompanyMetrics() });
        case 'getAnalytics': return jsonResponse({ success: true, data: getAnalyticsSummary() });
      case 'search': return jsonResponse({ success: true, data: searchAll(e?.parameter?.q || '') });
      
      // Secured Admin routes
      case 'getResumes':
      case 'getContacts':
      case 'getCRMLeads':
      case 'getAbroadApplications':
        if (!validateToken(e?.parameter?.token)) return jsonResponse({ success: false, message: 'Unauthorized' }, 401);
        return jsonResponse({ success: true, data: getSheetData(sheetName(action.replace('get', ''))) });

      default: return jsonResponse({ success: false, message: 'Unknown action: ' + action }, 404);
    }
  } catch (err) {
    return jsonResponse({ success: false, message: err.message, stack: err.stack }, 500);
  }
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData?.contents || '{}'); } catch (err) { return jsonResponse({ success: false, message: 'Invalid JSON body' }, 400); }

  const action = body.action;
  const token = body.token;

  // --- SECURE ROUTE GUARD & XSS ---
  const publicActions = ['submitContact', 'submitResume', 'submitEnquiry', 'submitJobApplication', 'adminLogin', 'submitAbroadApplication', 'submitAbroadJobApp', 'saveCRMLead', 'getCourses', 'getJobs', 'getProjects', 'getPlacements', 'getEmployees', 'getPartners', 'getCompanyMetrics', 'getSettings', 'getConfig', 'getTestimonials', 'getAbroadUniversities', 'getAbroadJobs', 'getBlog', 'getServices', 'searchAll', 'adminGetAnalytics'];
  if (!publicActions.includes(action)) {
    if (!validateToken(token)) return jsonResponse({ success: false, message: 'Unauthorized. Invalid or expired token.' }, 401);
    body = sanitizePayload(body); 
  }

  try {
    switch (action) {
      /* ===== PUBLIC FORM SUBMISSIONS ===== */
      case 'submitContact': return handleSubmitContact(body);
      case 'submitResume': return handleSubmitResume(body);
      case 'submitEnquiry': return handleSubmitEnquiry(body);
      case 'submitJobApplication': return handleSubmitJobApplication(body);
      case 'submitAbroadApplication': return handleSubmitAbroadApplication(body);
      case 'submitAbroadJobApp': return handleSubmitResume(body);
      case 'saveSettings': return jsonResponse(saveSettings(body));
      case 'saveCRMLead': return jsonResponse({ success: true, data: createRecord('CRMLeads', body) });

      /* ===== ADMIN AUTH ===== */
      case 'adminLogin': return handleAdminLogin(body);

      /* ===== ADMIN V1 GENERIC CRUD ===== */
      case 'adminGet': return handleAdminGet(body);
      case 'adminCreate': return handleAdminCreate(body);
      case 'adminUpdate': return handleAdminUpdate(body);
      case 'adminDelete': return handleAdminDelete(body);
      case 'adminGetAnalytics': return handleAdminAnalytics(body);

      /* ===== ADMIN V2 EXPLICIT CRUD ===== */
      case 'saveCategory': return jsonResponse({ success: true, data: saveV2Record('Categories', body) });
      case 'savePartner': return jsonResponse({ success: true, data: saveV2Record('Partners', body) });
      case 'saveUniversity': return jsonResponse({ success: true, data: saveV2Record('AbroadUniversities', body) });
      case 'saveAbroadJob': return jsonResponse({ success: true, data: saveV2Record('AbroadJobs', body) });
      case 'deleteCategory': return jsonResponse({ success: true, data: deleteRecord('Categories', body.id) });
      case 'deletePartner': return jsonResponse({ success: true, data: deleteRecord('Partners', body.id) });
      case 'deleteUniversity': return jsonResponse({ success: true, data: deleteRecord('AbroadUniversities', body.id) });
      case 'deleteAbroadJob': return jsonResponse({ success: true, data: deleteRecord('AbroadJobs', body.id) });

      default: return jsonResponse({ success: false, message: 'Unknown action: ' + action }, 400);
    }
  } catch (err) {
    logError(action, err);
    return jsonResponse({ success: false, message: err.message }, 500);
  }
}

function doOptions(e) {
  return jsonResponse({ success: true }, 200);
}

/* ========================================= */
/* 2. FORM HANDLERS                          */
/* ========================================= */

function saveV2Record(sheet, body) {
  if (body.id) { updateRecord(sheet, body.id, body); return body; }
  body.id = generateId(); body.createdAt = now(); return createRecord(sheet, body);
}

function handleSubmitAbroadApplication(body) {
  body.id = generateId();
  body.createdAt = now();
  body.status = 'New';
  createRecord('AbroadApplications', body);
  sendAdminAlert('New Study Abroad Application', 'Student: ' + body.name + '\nUniversity: ' + body.universityName + '\nProgram: ' + body.program);
  return jsonResponse({ success: true, message: 'Application submitted successfully!' });
}

function handleSubmitContact(body) {
  const { name, email, phone, subject, message } = body;
  if (!name || !email || !message) return jsonResponse({ success: false, message: 'Required fields missing' });
  const id = generateId();
  appendRow('Contacts', [id, name, email, phone || '', subject || 'General', message, 'New', now()]);
  sendContactConfirmation(email, name);
  sendAdminAlert('New Contact Form Submission', 'Name: ' + name + '\nEmail: ' + email + '\nSubject: ' + subject + '\nMessage: ' + message);
  return jsonResponse({ success: true, message: 'Thank you! We will contact you soon.', id });
}

function handleSubmitResume(body) {
  const { name, email, phone, skills, preferredRole, experience, coverNote, fileData } = body;
  if (!name || !email) return jsonResponse({ success: false, message: 'Name and email are required' });
  const id = generateId();
  let resumeUrl = '';
  if (fileData?.base64) {
    try { resumeUrl = uploadFileToDrive(fileData.filename, fileData.mimeType, fileData.base64, id); } catch (err) { Logger.log('Drive upload error: ' + err.message); }
  }
  const row = [id, name, email, phone || '', skills || '', preferredRole || '', experience || '', coverNote || '', resumeUrl, 'New', '', '', now()];
  appendRow('Resumes', row);
  sendResumeConfirmation(email, name);
  sendAdminAlert('New Resume Application', 'Applicant: ' + name + '\nEmail: ' + email + '\nRole: ' + preferredRole + '\nResume: ' + resumeUrl);
  return jsonResponse({ success: true, message: 'Resume submitted successfully!', id });
}

function handleSubmitEnquiry(body) {
  const { name, email, phone, courseName, message } = body;
  if (!name || !email) return jsonResponse({ success: false, message: 'Name and email are required' });
  const id = generateId();
  appendRow('Contacts', [id, name, email, phone || '', 'Course Enquiry: ' + (courseName || ''), message || '', 'New', now()]);
  sendCourseEnquiryConfirmation(email, name, courseName);
  sendAdminAlert('New Course Enquiry', 'Student: ' + name + '\nCourse: ' + courseName);
  return jsonResponse({ success: true, message: 'Enquiry received!', id });
}

function handleSubmitJobApplication(body) {
  const { name, email, phone, position, coverNote } = body;
  if (!name || !email) return jsonResponse({ success: false, message: 'Name and email are required' });
  const id = generateId();
  appendRow('Contacts', [id, name, email, phone || '', 'Job Application: ' + (position || ''), coverNote || '', 'New', now()]);
  sendJobApplicationConfirmation(email, name, position);
  sendAdminAlert('New Job Application', 'Applicant: ' + name + '\nPosition: ' + position);
  return jsonResponse({ success: true, message: 'Application submitted successfully!', id });
}

/* ========================================= */
/* 3. ADMIN HANDLERS                         */
/* ========================================= */

function handleAdminLogin(body) {
  const { username, password } = body;
  const result = verifyAdmin(username, password);
  if (result.success) return jsonResponse({ success: true, token: generateToken(username), message: 'Login successful' });
  return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
}

function processImageData(data, id) {
  if (data.imageBase64) {
    try {
      const filename = data.imageFilename || 'img_' + id;
      const mimeType = data.imageMimeType || 'image/jpeg';
      data.imageUrl = uploadFileToDrive(filename, mimeType, data.imageBase64, id);
    } catch (e) { Logger.log('Admin image upload failed: ' + e.message); }
    delete data.imageBase64; delete data.imageFilename; delete data.imageMimeType;
  }
}

function handleAdminGet(body) { 
  return jsonResponse({ success: true, data: getSheetData(sheetName(body.resource), true) }); 
}

function clearAllCaches(targetSheet) {
  try {
    const c = CacheService.getScriptCache();
    if (targetSheet) {
      c.remove('ASG_SHEET_' + targetSheet);
      c.remove('ASG_SHEET_' + sheetName(targetSheet));
    }
    const allSheets = ['Courses', 'Services', 'Partners', 'AbroadUniversities', 'AbroadJobs', 'Placements', 'Testimonials', 'Projects', 'Employees', 'Blogs', 'Chatbot', 'Settings', 'Analytics', 'Resumes', 'Contacts', 'CRMLeads', 'Timeline', 'Categories'];
    allSheets.forEach(s => c.remove('ASG_SHEET_' + s));
    c.remove('ASG_METRICS_V2');
    c.remove('ASG_METRICS');
    c.remove('ASG_ANALYTICS_SUMMARY');
  } catch(e) {}
}

function clearMetricsCache() { clearAllCaches(); }

function handleAdminCreate(body) {
  const { resource, data } = body;
  const id = generateId(); data.id = id; data.createdAt = now();
  processImageData(data, id);
  createRecord(sheetName(resource), data);
  clearAllCaches(resource);
  return jsonResponse({ success: true, message: 'Record created', id, updatedAt: now() });
}
function handleAdminUpdate(body) {
  const { resource, id, data } = body;
  processImageData(data, id);
  updateRecord(sheetName(resource), id, data);
  clearAllCaches(resource);
  return jsonResponse({ success: true, message: 'Record updated', updatedAt: now() });
}
function handleAdminDelete(body) {
  const result = deleteRecord(sheetName(body.resource), body.id);
  clearAllCaches(body.resource);
  return jsonResponse({ success: result, message: result ? 'Deleted' : 'Record not found', updatedAt: now() });
}

function handleAdminAnalytics(body) { return jsonResponse({ success: true, data: getAnalyticsSummary() }); }

/* ========================================= */
/* 4. DATA FETCHING (Api.gs)                 */
/* ========================================= */

function getActiveCourses() {
  const now = new Date();
  return getSheetData('Courses').filter(c => {
    const s = (c.status||'').trim().toLowerCase();
    if (s !== 'active' && s !== 'published') return false;
    
    // Hide expired batches automatically
    if (c.endDate) {
      const end = new Date(c.endDate);
      if (!isNaN(end.getTime()) && end < now) return false;
    }
    return true;
  });
}
function getActiveServices() { return getSheetData('Services').filter(s => (s.status||'').trim().toLowerCase() === 'active'); }
function getActivePartners() {
  return getSheetData('Partners').filter(p => {
    const s = (p.status||'Active').trim().toLowerCase();
    return s === 'active' || s === 'published' || s === 'verified';
  });
}
function getActiveAbroadUniversities() { return getSheetData('AbroadUniversities').filter(u => (u.status||'').trim().toLowerCase() === 'active'); }
function getOpenJobs() {
  const now = new Date();
  return getSheetData('Jobs').filter(j => {
    const s = (j.status||'').trim().toLowerCase();
    if (s !== 'open' && s !== 'active' && s !== 'published') return false;
    
    // Hide expired jobs automatically
    if (j.deadline) {
      const d = new Date(j.deadline);
      if (!isNaN(d.getTime()) && d < now) return false;
    }
    return true;
  });
}
function getActiveAbroadJobs() { return getSheetData('AbroadJobs').filter(j => (j.status||'').trim().toLowerCase() === 'open' || (j.status||'').trim().toLowerCase() === 'active'); }
function getPublishedPlacements() { return getSheetData('Placements').filter(p => { const s = (p.status||'').trim().toLowerCase(); return s === 'published' || s === 'verified'; }); }
function getActiveTestimonials() { return getSheetData('Testimonials').filter(t => (t.status||'').trim().toLowerCase() === 'active'); }
function getCompletedProjects() { return getSheetData('Projects').filter(p => { const s = (p.status||'').trim().toLowerCase(); return s === 'completed' || s === 'published'; }); }
function getActiveEmployees() { return getSheetData('Employees').filter(e => { const s = (e.status||'').trim().toLowerCase(); return s === 'active' || s === 'published'; }); }
function getPublishedBlogs() { return getSheetData('Blogs').filter(b => (b.status||'').trim().toLowerCase() === 'published'); }
function getBlogBySlug(slug) { return getSheetData('Blogs').find(b => b.slug === slug && b.status === 'Published') || null; }



// --- STATISTICS ENGINE FUNCTIONS ---
function getStudentCount(leads) { return (leads || getSheetData('CRMLeads')).length + (getSheetData('Placements')).length; } // Example logic
function getPlacementCount(placements) { return (placements || getPublishedPlacements()).length; }
function getProjectCount(projects) { return (projects || getCompletedProjects()).length; }
function getEmployeeCount(employees) { return (employees || getActiveEmployees()).length; }
function getCourseCount(courses) { return (courses || getActiveCourses()).length; }
function getITCourseCount(courses) { return (courses || getActiveCourses()).filter(c => (c.category||'').toLowerCase().includes('it') && !(c.category||'').toLowerCase().includes('non')).length; }
function getNonITCourseCount(courses) { return (courses || getActiveCourses()).filter(c => (c.category||'').toLowerCase().includes('non')).length; }
function getOpenJobCount(jobs) { return (jobs || getOpenJobs()).filter(j => !(j.category||'').toLowerCase().includes('abroad')).length; }
function getAbroadJobCount(jobs) { return (jobs || getOpenJobs()).filter(j => (j.category||'').toLowerCase().includes('abroad')).length; }
function getPartnerCount(partners) { return (partners || getActivePartners()).length; }
function getHiringPartnerCount(partners) { return (partners || getActivePartners()).filter(p => { const t=(p.type||'').toLowerCase(); return t.includes('hiring') || t.includes('recruitment'); }).length; }
function getStudyPartnerCount(partners) { return (partners || getActivePartners()).filter(p => { const t=(p.type||'').toLowerCase(); return t.includes('university') || t.includes('college') || t.includes('study'); }).length; }

function getCompanyMetrics(bypassCache = false) {
  let cache = null;
  const cacheKey = 'ASG_METRICS_V2';
  if (!bypassCache) {
    try {
      cache = CacheService.getScriptCache();
      const cached = cache.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch(e){}
  }

  // Fetch base datasets once to avoid multiple Sheets API calls
  const courses = getActiveCourses();
  const jobs = getOpenJobs();
  const projects = getCompletedProjects();
  const placements = getPublishedPlacements();
  const employees = getActiveEmployees();
  const partners = getActivePartners();
  const leads = getSheetData('CRMLeads');

  // Manual Settings Override logic
  const settingsData = getSheetData('Settings') || [];
  const manual = {};
  settingsData.forEach(s => { if (s[0]) manual[s[0]] = s[1]; });

  const result = {
    studentsTrained: manual.studentsTrained || getStudentCount(leads),
    placements: manual.placements || getPlacementCount(placements),
    projectsCompleted: manual.projectsCompleted || getProjectCount(projects),
    employees: manual.employees || getEmployeeCount(employees),
    courses: getCourseCount(courses),
    itCourses: getITCourseCount(courses),
    nonItCourses: getNonITCourseCount(courses),
    openJobs: getOpenJobCount(jobs),
    abroadJobs: getAbroadJobCount(jobs),
    partners: getPartnerCount(partners),
    hiringPartners: manual.hiringPartners || getHiringPartnerCount(partners),
    studyPartners: manual.studyPartners || getStudyPartnerCount(partners),
    placementRate: manual.placementRate || '90%+',
    highestPackage: manual.highestPackage || '16 LPA',
    updatedAt: new Date().toISOString()
  };

  if (cache) {
    try { cache.put(cacheKey, JSON.stringify(result), 900); } catch(e){} // 15 mins
  }
  
  return result;
}


function getAnalyticsSummary() {
  let cache = null;
  const cacheKey = 'ASG_ADMIN_ANALYTICS_V2';
  try {
    cache = CacheService.getScriptCache();
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch(e){}

  const courses = getActiveCourses();
  const jobs = getOpenJobs();
  const abroadJobs = getActiveAbroadJobs();
  const projects = getCompletedProjects();
  const placements = getPublishedPlacements();
  const employees = getActiveEmployees();
  const partners = getActivePartners();
  const leads = getSheetData('CRMLeads');
  const applications = getSheetData('Resumes');

  // Manual Settings Override logic
  const settingsData = getSheetData('Settings') || [];
  const manual = {};
  settingsData.forEach(s => { if (s[0]) manual[s[0]] = s[1]; });

  const summary = {
    students: { val: manual.studentsTrained || (leads.length + placements.length) || '0', src: 'Live CRM & Placements' },
    placements: { val: manual.placements || placements.length || '0', src: 'Verified Placements' },
    projects: { val: manual.projectsCompleted || projects.length || '0', src: 'Portfolio Projects' },
    employees: { val: manual.employees || employees.length || '0', src: 'Active Faculty & Staff' },
    courses: { val: courses.length || '0', src: 'Active Catalog' },
    itCourses: { val: courses.filter(c => (c.category||'').toLowerCase().includes('it') && !(c.category||'').toLowerCase().includes('non')).length || '0', src: 'IT Specializations' },
    nonItCourses: { val: courses.filter(c => (c.category||'').toLowerCase().includes('non')).length || '0', src: 'Non-IT Programs' },
    openJobs: { val: jobs.length || '0', src: 'Domestic Openings' },
    abroadJobs: { val: abroadJobs.length || '0', src: 'Overseas Opportunities' },
    partners: { val: partners.length || '0', src: 'Institutional & Corporate' },
    leads: { val: leads.length || '0', src: 'CRM Inquiries' },
    applications: { val: applications.length || '0', src: 'Candidate Resumes' }
  };

  const recent = {
    placements: placements.slice(0, 5).map(p => ({
      studentName: p.studentName || p.name || 'Student',
      companyName: p.companyName || p.company || 'IT Partner',
      package: p.package || 'Confidential'
    })),
    projects: projects.slice(0, 5).map(pr => ({
      title: pr.title || 'Client Project',
      category: pr.category || 'Software',
      clientName: pr.clientName || pr.client || 'Enterprise'
    })),
    jobs: jobs.slice(0, 5).map(j => ({
      title: j.title || 'Software Role',
      category: j.category || 'Engineering',
      company: j.company || 'Aditya Skill Gate'
    })),
    applications: applications.slice(0, 5).map(a => ({
      name: a.name || a.fullName || 'Applicant',
      role: a.role || a.position || a.skills || 'Candidate',
      date: a.date || a.timestamp || new Date().toISOString()
    }))
  };

  // Generate monthly charts
  const monthlyPlacements = {};
  placements.forEach(p => {
    const d = p.placedDate || p.date || p.timestamp;
    const key = d ? String(d).slice(0, 7) : '2025-11';
    if (key && key.length === 7) monthlyPlacements[key] = (monthlyPlacements[key] || 0) + 1;
  });
  if (Object.keys(monthlyPlacements).length === 0) {
    monthlyPlacements['2025-11'] = 3;
    monthlyPlacements['2025-12'] = 5;
    monthlyPlacements['2026-01'] = 8;
  }

  const monthlyApps = {};
  applications.forEach(a => {
    const d = a.date || a.timestamp;
    const key = d ? String(d).slice(0, 7) : '2025-11';
    if (key && key.length === 7) monthlyApps[key] = (monthlyApps[key] || 0) + 1;
  });
  if (Object.keys(monthlyApps).length === 0) {
    monthlyApps['2025-11'] = 12;
    monthlyApps['2025-12'] = 24;
    monthlyApps['2026-01'] = 35;
  }

  const result = {
    summary: summary,
    recent: recent,
    charts: {
      monthlyPlacements: monthlyPlacements,
      monthlyApps: monthlyApps
    },
    updatedAt: new Date().toISOString()
  };

  if (cache) {
    try { cache.put(cacheKey, JSON.stringify(result), 900); } catch(e){}
  }

  return result;
}

function searchAll(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return { botResponse: null, courses: [], jobs: [], blogs: [] };

  const qClean = q.replace(/[?!.,;:()]/g, ' ');
  const qWords = qClean.split(/\s+/).filter(w => w.length > 1);
  const chatbotRows = getSheetData('Chatbot').filter(r => (r.status || 'Active').trim().toLowerCase() === 'active');
  
  let matchedResponse = null;
  let bestScore = 0;

  for (const row of chatbotRows) {
    const rawKw = (row.keyword || '').toLowerCase().trim();
    if (!rawKw) continue;
    const keywords = rawKw.split(/[\/,|]+/).map(k => k.trim().replace(/[?!.,;:()]/g, '')).filter(k => k.length > 0);

    for (const kw of keywords) {
      // 1. Direct contains or exact match
      if (q === kw || qClean.includes(kw) || kw.includes(qClean)) {
        bestScore = 100;
        matchedResponse = row.response;
        break;
      }
      // 2. Multi-word overlap matching
      const kwWords = kw.split(/\s+/).filter(w => w.length > 1);
      const matchedCount = qWords.filter(qw => kwWords.some(kww => kww.includes(qw) || qw.includes(kww))).length;
      if (matchedCount > 0 && matchedCount > bestScore) {
        bestScore = matchedCount;
        matchedResponse = row.response;
      }
    }
    if (bestScore === 100) break;
  }

  return {
    botResponse: matchedResponse,
    courses: getActiveCourses().filter(c => (c.title + ' ' + (c.category||'') + ' ' + (c.description||'')).toLowerCase().includes(q)),
    jobs: getOpenJobs().filter(j => (j.title + ' ' + (j.department||'') + ' ' + (j.skills||'')).toLowerCase().includes(q)),
    blogs: getPublishedBlogs().filter(b => (b.title + ' ' + (b.excerpt||'') + ' ' + (b.tags||'')).toLowerCase().includes(q))
  };
}

/* ========================================= */
/* 5. AUTHENTICATION & SECURITY (Auth.gs)    */
/* ========================================= */

function getTokenSecret() { return 'ASG_SECRET_2024_' + SPREADSHEET_ID.slice(0, 8); }
function getAdminPasswordHash() { return hashPassword('Aditya@2026'); }

function verifyAdmin(username, password) {
  if (!username || !password) return { success: false, message: 'Username and password required' };
  if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && hashPassword(password) === getAdminPasswordHash()) return { success: true, username };
  Logger.log('Failed login attempt for: ' + username);
  return { success: false, message: 'Invalid username or password' };
}

function generateToken(username) {
  return Utilities.base64Encode(JSON.stringify({ username, expires: Date.now() + TOKEN_EXPIRY_HOURS * 3600000, secret: getTokenSecret() }));
}

function validateToken(token) {
  if (!token) return false;
  try {
    const dec = JSON.parse(Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString());
    return dec.expires > Date.now() && dec.secret === getTokenSecret();
  } catch (err) { return false; }
}

function hashPassword(password) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + getTokenSecret()));
}

function sanitizePayload(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  let san = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      san[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                         .replace(/on\w+="[^"]*"/gi, '')
                         .replace(/javascript:/gi, '');
    } else if (typeof obj[key] === 'object') {
      san[key] = sanitizePayload(obj[key]);
    } else san[key] = obj[key];
  }
  return san;
}

/* ========================================= */
/* 6. GOOGLE SHEETS CRUD (Sheets.gs)         */
/* ========================================= */

const SS = () => SpreadsheetApp.openById(SPREADSHEET_ID);

const SHEET_HEADERS = {
  Courses: ['id', 'title', 'category', 'subcategory', 'description', 'duration', 'mode', 'fee', 'trainer', 'image', 'syllabus', 'startDate', 'endDate', 'batchTiming', 'seats', 'availableSeats', 'status', 'featured', 'createdAt', 'updatedAt'],
  Jobs: ['id', 'title', 'category', 'type', 'company', 'location', 'country', 'salary', 'experience', 'skills', 'description', 'deadline', 'status', 'featured', 'createdAt', 'updatedAt'],
  AbroadJobs: ['id', 'title', 'company', 'location', 'type', 'experience', 'salary', 'benefits', 'requirements', 'closingDate', 'applyLink', 'status', 'createdAt'],
  Employees: ['id', 'name', 'role', 'department', 'photoUrl', 'email', 'phone', 'bio', 'linkedin', 'status', 'createdAt'],
  Projects: ['id', 'title', 'category', 'clientName', 'clientType', 'description', 'technologies', 'image', 'gallery', 'liveUrl', 'status', 'featured', 'completedDate', 'createdAt', 'updatedAt'],
  Placements: ['id', 'studentName', 'courseId', 'courseName', 'companyName', 'designation', 'package', 'placementDate', 'year', 'studentPhoto', 'testimonial', 'status', 'featured', 'createdAt', 'updatedAt'],
  Testimonials: ['id', 'name', 'role', 'company', 'message', 'photoUrl', 'rating', 'status', 'createdAt'],
  Blogs: ['id', 'title', 'slug', 'excerpt', 'content', 'imageUrl', 'tags', 'author', 'publishedAt', 'status', 'createdAt'],
  Resumes: ['id', 'name', 'email', 'phone', 'skills', 'preferredRole', 'experience', 'coverNote', 'resumeUrl', 'status', 'notes', 'history', 'createdAt'],
  Contacts: ['id', 'name', 'email', 'phone', 'subject', 'message', 'status', 'source', 'service', 'followup', 'notes', 'createdAt'],
  Services: ['id', 'title', 'category', 'description', 'features', 'icon', 'status', 'createdAt'],
  Categories: ['id', 'name', 'parent', 'status', 'createdAt'],
  Partners: ['id', 'name', 'type', 'country', 'website', 'logoUrl', 'description', 'status', 'createdAt'],
  AbroadUniversities: ['id', 'name', 'country', 'programs', 'scholarship', 'description', 'imageUrl', 'status', 'createdAt'],
  AbroadApplications: ['id', 'name', 'email', 'phone', 'universityId', 'universityName', 'program', 'status', 'notes', 'createdAt'],
  Settings: ['key', 'value'],
  Chatbot: ['id', 'keyword', 'response', 'status', 'createdAt'],
  Analytics: ['date', 'visitors', 'submissions', 'applications', 'courseEnquiries', 'jobApplications', 'placements', 'abroadApplications'],
  CRMLeads: ['id', 'name', 'email', 'phone', 'source', 'status', 'createdAt']
};

function getOrCreateSheet(name) {
  const ss = SS();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setBackground('#0D1B4C').setFontColor('#FFFFFF').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function invalidateCache(sheetName) {
  try {
    const cache = CacheService.getScriptCache();
    if (sheetName) cache.remove('ASG_SHEET_' + sheetName);
    cache.remove('ASG_METRICS');
  } catch(e){}
}

function getSheetData(sheetName, bypassCache = false) {
  try {
    const isSensitive = ['Resumes', 'CRMLeads', 'AbroadApplications', 'Contacts'].includes(sheetName);
    const useCache = !bypassCache && !isSensitive;
    let cache = null;
    let cacheKey = 'ASG_SHEET_' + sheetName;
    if (useCache) {
      try {
        cache = CacheService.getScriptCache();
        const cached = cache.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch(e){}
    }

    const sheet = getOrCreateSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; 
    
    const headers = data[0];
    const result = data.slice(1).filter(row => row[0]).map(row => {
      const obj = {};
      headers.forEach((h, i) => { 
        let val = row[i] !== undefined ? String(row[i]) : '';
        try { if(val.startsWith('[') || val.startsWith('{')) val = JSON.parse(val); } catch(e){}
        obj[h] = val; 
      });
      return obj;
    }).filter(row => row.status !== 'Deleted');

    if (useCache && cache) {
      try {
        const str = JSON.stringify(result);
        if (str.length < 90000) cache.put(cacheKey, str, 900); // 15 mins
      } catch(e) {}
    }
    return result;
  } catch (err) { Logger.log(err.message); return []; }
}

function appendRow(sheetName, rowData) { getOrCreateSheet(sheetName).appendRow(rowData); }


function saveSettings(settingsObj) {
  const ss = SS();
  let sheet = ss.getSheetByName('Settings');
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    sheet.appendRow(['key', 'value']);
  }
  const data = sheet.getDataRange().getValues();
  const map = {};
  for(let i = 1; i < data.length; i++) {
    map[data[i][0]] = i + 1;
  }
  
  for(let key in settingsObj) {
    if (key === 'action' || key === 'token') continue;
    const val = settingsObj[key];
    if (map[key]) {
      sheet.getRange(map[key], 2).setValue(val);
    } else {
      sheet.appendRow([key, val]);
      map[key] = sheet.getLastRow();
    }
  }
  clearAllCaches('Settings');
  return { success: true, message: 'Settings saved successfully', updatedAt: new Date().toISOString() };
}

function createRecord(sheetName, data) {
  const headers = SHEET_HEADERS[sheetName];
  if (!headers) throw new Error('Unknown sheet: ' + sheetName);
  const row = headers.map(h => {
    let val = data[h] !== undefined ? data[h] : '';
    return typeof val === 'object' ? JSON.stringify(val) : val; // Automatically stringify arrays
  });
  appendRow(sheetName, row);
  return data;
}

function updateRecord(sheetName, id, updates) {
  const sheet = getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  
  if (idCol === -1) return false;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === id) {
      Object.keys(updates).forEach(key => {
        const col = headers.indexOf(key);
        if (col !== -1) {
          let val = updates[key];
          sheet.getRange(i + 1, col + 1).setValue(typeof val === 'object' ? JSON.stringify(val) : val);
        }
      });
      return true;
    }
  }
  return false;
}

function deleteRecord(sheetName, id) { return updateRecord(sheetName, id, { status: 'Deleted' }); }

function getSettings(isPublic = false) {
  try {
    const sheet = getOrCreateSheet('Settings');
    const data = sheet.getDataRange().getValues();
    const settings = {};
    data.slice(1).forEach(row => { if (row[0]) settings[row[0]] = row[1] || ''; });
    
    // Default safe configuration
    const config = {
      companyName: settings.companyName || 'Aditya Skill Gate IT Solution',
      legalName: settings.legalName || 'Aditya Skill Gate IT Solution',
      logo: settings.logo || 'assets/logos/logo-icon.png',
      foundedDate: settings.foundedDate || '2025-10-26T00:00:00+05:30',
      tagline: settings.tagline || 'Empowering Skills Through Technology',
      description: settings.description || 'Premium IT Training, Services & Placement Support',
      address: settings.address || 'Sankarankovil',
      city: settings.city || 'Sankarankovil',
      district: settings.district || 'Tenkasi',
      state: settings.state || 'Tamil Nadu',
      country: settings.country || 'India',
      phone: settings.phone || '+91 63826 04808',
      email: settings.email || 'Adityaskillgateitsolution@gmail.com',
      whatsapp: settings.whatsapp || '916382604808',
      website: settings.website || 'https://adityaskillgate.com',
      linkedin: settings.linkedin || 'https://www.linkedin.com/in/aditya-skill-gate-it-solution-5446b63a8',
      instagram: settings.instagram || 'https://www.instagram.com/adityaskillgate.official/',
      youtube: settings.youtube || 'https://www.youtube.com/@AdityaSkillGateITSolution',
      mission: settings.mission || 'To make quality IT education accessible and to connect skilled talent with the right opportunities.',
      vision: settings.vision || 'To become the leading IT training and services provider in Tamil Nadu.'
    };
    
    // If public request, DO NOT send private config (e.g. admin passwords, tokens if they exist)
    if (isPublic) {
      return config;
    }
    
    // Admin gets all combined
    return { ...config, ...settings };
  } catch (err) { return {}; }
}

/* ========================================= */
/* 7. MAIL HANDLERS (Mail.gs)                */
/* ========================================= */

function sendResumeConfirmation(toEmail, applicantName) {
  try {
    MailApp.sendEmail({
      to: toEmail, subject: 'Resume Received Successfully - ' + COMPANY_NAME,
      htmlBody: buildEmailTemplate('<h2 style="color:#0D1B4C">Hello ' + applicantName + ', 👋</h2><p>Thank you for submitting your resume to <strong>' + COMPANY_NAME + '</strong>!</p><p>We have received your application and our HR team will review it carefully. If your profile matches our requirements, we will contact you within <strong>2-3 business days</strong>.</p><div style="background:#f0f9ff;border-left:4px solid #0096D6;padding:16px;border-radius:0 8px 8px 0;margin:24px 0"><p style="margin:0;color:#0D1B4C"><strong>📋 What happens next?</strong></p><ol style="margin:8px 0 0;color:#475569"><li>Our team reviews your profile</li><li>If shortlisted, we\'ll call you for a discussion</li><li>We match you with the best opportunity</li><li>We support you through the placement process</li></ol></div><p>In the meantime, feel free to explore our <a href="' + WEBSITE_URL + '/courses.html" style="color:#0096D6">training courses</a>.</p><p style="color:#64748b;font-size:0.9rem">📞 ' + COMPANY_PHONE + '<br>📧 ' + ADMIN_EMAIL + '</p>')
    });
  } catch (err) { Logger.log(err.message); }
}

function sendContactConfirmation(toEmail, visitorName) {
  try {
    MailApp.sendEmail({
      to: toEmail, subject: 'Thank You for Contacting Us - ' + COMPANY_NAME,
      htmlBody: buildEmailTemplate('<h2 style="color:#0D1B4C">Hello ' + visitorName + ', 👋</h2><p>Thank you for reaching out to <strong>' + COMPANY_NAME + '</strong>!</p><p>We have received your message and our team will get back to you within <strong>24 hours</strong>.</p><div style="background:#f0fff4;border-left:4px solid #6CCB2F;padding:16px;border-radius:0 8px 8px 0;margin:24px 0"><p style="margin:0;color:#0D1B4C"><strong>🕐 Response Time</strong></p><p style="margin:8px 0 0;color:#475569">Monday to Saturday: 9:00 AM – 6:00 PM IST</p></div><p>For urgent queries, please contact us directly:</p><p>📞 <a href="tel:' + COMPANY_PHONE + '" style="color:#0096D6">' + COMPANY_PHONE + '</a><br>💬 <a href="https://wa.me/916382604808" style="color:#0096D6">WhatsApp Chat</a></p>')
    });
  } catch (err) { Logger.log(err.message); }
}

function sendCourseEnquiryConfirmation(toEmail, studentName, courseName) {
  try {
    MailApp.sendEmail({
      to: toEmail, subject: 'Course Enquiry Received - ' + COMPANY_NAME,
      htmlBody: buildEmailTemplate('<h2 style="color:#0D1B4C">Hello ' + studentName + '! 🎓</h2><p>Thank you for your interest in our <strong>' + (courseName || 'IT course') + '</strong>!</p><p>Our course counselor will contact you shortly.</p><div style="background:#f0f9ff;border-left:4px solid #0096D6;padding:16px;border-radius:0 8px 8px 0;margin:24px 0"><p style="margin:0;color:#0D1B4C"><strong>⚡ Quick Access</strong></p><p style="margin:8px 0 0"><a href="' + WEBSITE_URL + '/courses.html" style="color:#0096D6">View All Courses →</a></p></div><p>📞 ' + COMPANY_PHONE + ' | 💬 WhatsApp: <a href="https://wa.me/916382604808?text=Hi! I enquired about ' + courseName + '" style="color:#0096D6">Chat Now</a></p>')
    });
  } catch (err) { Logger.log(err.message); }
}

function sendJobApplicationConfirmation(toEmail, applicantName, jobTitle) {
  try {
    MailApp.sendEmail({
      to: toEmail, subject: 'Job Application Submitted - ' + COMPANY_NAME,
      htmlBody: buildEmailTemplate('<h2 style="color:#0D1B4C">Hello ' + applicantName + '! 💼</h2><p>Your application for <strong>' + (jobTitle || 'the position') + '</strong> at ' + COMPANY_NAME + ' has been submitted successfully!</p><div style="background:#f0f9ff;border-left:4px solid #0096D6;padding:16px;border-radius:0 8px 8px 0;margin:24px 0"><p style="margin:0;color:#0D1B4C"><strong>📌 Application Status</strong></p><p style="margin:8px 0 0;color:#475569">Your application is under review. Our HR team will contact you if your profile matches our requirements.</p></div><p>Expected response time: <strong>3-5 business days</strong></p><p>📞 ' + COMPANY_PHONE + '<br>📧 ' + ADMIN_EMAIL + '</p>')
    });
  } catch (err) { Logger.log(err.message); }
}

function sendAdminAlert(subject, details) {
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL, subject: '[ASG Admin] ' + subject,
      htmlBody: buildEmailTemplate('<h2 style="color:#0D1B4C">🔔 New Submission Alert</h2><h3 style="color:#0096D6">' + subject + '</h3><div style="background:#f8fafc;border:1px solid #e2e8f0;padding:20px;border-radius:8px;margin:20px 0"><pre style="font-family:monospace;white-space:pre-wrap;color:#334155;margin:0">' + details + '</pre></div><p><a href="' + WEBSITE_URL + '/admin/dashboard.html" style="background:#0096D6;color:white;padding:12px 24px;border-radius:100px;text-decoration:none;font-weight:600">View in Admin Panel →</a></p>')
    });
  } catch (err) { Logger.log(err.message); }
}

function buildEmailTemplate(contentHtml) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + COMPANY_NAME + '</title></head><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f4f8"><div style="max-width:600px;margin:0 auto;padding:20px"><div style="background:linear-gradient(135deg,#0D1B4C,#0096D6);border-radius:16px 16px 0 0;padding:32px;text-align:center"><h1 style="color:white;font-size:1.4rem;margin:0;font-weight:800">ADITYA</h1><p style="color:#6CCB2F;margin:4px 0 0;font-weight:600;font-size:0.9rem">SKILL GATE IT SOLUTION</p></div><div style="background:white;padding:36px;line-height:1.7;color:#334155;font-size:0.95rem">' + contentHtml + '</div><div style="background:#0D1B4C;border-radius:0 0 16px 16px;padding:20px;text-align:center;color:rgba(255,255,255,0.6);font-size:0.8rem"><p style="margin:0">© ' + new Date().getFullYear() + ' ' + COMPANY_NAME + '. Tamil Nadu, India.</p></div></div></body></html>';
}

/* ========================================= */
/* 8. UTILITIES (Utils.gs)                   */
/* ========================================= */

function generateId() { return Math.random().toString(36).substr(2, 9); }
function jsonResponse(data, statusCode=200) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }

function uploadFileToDrive(filename, mimeType, base64Data, prefix) {
  try {
    const folders = DriveApp.getFoldersByName(ADMIN_DRIVE_FOLDER);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(ADMIN_DRIVE_FOLDER);
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, prefix + '_' + filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return 'https://drive.google.com/uc?export=view&id=' + file.getId();
  } catch (err) { Logger.log(err.message); throw err; }
}

function sheetName(resource) {
  const MAP = {
    'courses':'Courses', 'jobs':'Jobs', 'employees':'Employees', 'projects':'Projects', 'placements':'Placements', 'testimonials':'Testimonials', 'blog':'Blogs', 'resumes':'Resumes', 'contacts':'Contacts', 'chatbot':'Chatbot', 'services':'Services', 'partners':'Partners', 'abroaduniversities':'AbroadUniversities', 'categories':'Categories', 'abroadjobs':'AbroadJobs', 'abroadapplications':'AbroadApplications', 'crmleads':'CRMLeads'
  };
  return MAP[resource?.toLowerCase()] || (resource ? resource.charAt(0).toUpperCase() + resource.slice(1) : '');
}
function now() { return new Date().toISOString(); }
function logError(action, err) { try { Logger.log('[ERROR] ' + action + ': ' + err.message); } catch (e) {} }

/* ========================================= */
/* 9. DATA SEEDING FOR DEMO                  */
/* ========================================= */
function seedDemoData() {
  const ss = SS();
  
  // Seed Projects
  const projSheet = getOrCreateSheet('Projects');
  if (projSheet.getLastRow() <= 1) {
    projSheet.appendRow(['proj1', 'Voltaura Company Web-site', 'Web Development', 'Voltaura', 'React, Node.js', 'Corporate website', '', 'Increased traffic', 'https://voltaura.com', 'Completed', now()]);
    projSheet.appendRow(['proj2', 'Digisharkz', 'Web Development', 'Digisharkz', 'Angular, Firebase', 'Marketing platform', '', 'Good results', 'https://digisharkz.com', 'Completed', now()]);
  }

  // Seed Placements
  const placeSheet = getOrCreateSheet('Placements');
  if (placeSheet.getLastRow() <= 1) {
    placeSheet.appendRow(['pl1', 'Aditya', 'Full Stack', 'TCS', 'Software Engineer', '6 LPA', '', 'Great course!', '2024', 'Published', now()]);
  }

  // Seed Abroad Jobs
  const abroadJobsSheet = getOrCreateSheet('AbroadJobs');
  if (abroadJobsSheet.getLastRow() <= 1) {
    abroadJobsSheet.appendRow(['aj1', 'Senior Full Stack Developer', 'TechNova Solutions', 'Toronto, Canada', 'Full-time', '5+ Years', '$90k - $120k CAD', 'Visa Sponsorship, Health Insurance', 'React, Node.js, AWS', '2027-12-31', 'https://example.com/apply', 'Open', now()]);
  }

  // Seed Partners
  const partSheet = getOrCreateSheet('Partners');
  if (partSheet.getLastRow() <= 1) {
    partSheet.appendRow(['p1', 'Google Cloud Partner', 'Technology Partner', 'USA', 'https://cloud.google.com', 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg', 'Cloud provider', 'Verified', now()]);
  }

  Logger.log('Demo data seeded successfully!');
}

/* ========================================= */
/* 10. MIGRATION SCRIPT FOR LEGACY HEADERS   */
/* ========================================= */

function migrateProjectHeaders() {
  const ss = SS();
  const sheet = ss.getSheetByName('Projects');
  if (!sheet) return;
  const targetHeaders = ['id', 'title', 'category', 'clientName', 'clientType', 'description', 'technologies', 'image', 'gallery', 'liveUrl', 'status', 'featured', 'completedDate', 'createdAt', 'updatedAt'];
  
  const currentData = sheet.getDataRange().getValues();
  if (currentData.length === 0) {
    sheet.appendRow(targetHeaders);
    return;
  }
  
  const currentHeaders = currentData[0];
  if (currentHeaders.join(',') === targetHeaders.join(',')) return; // Already migrated
  
  // Write the new headers to the first row
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  
  // Try to map existing data (techStack -> technologies, screenshotUrl -> image)
  for (let i = 1; i < currentData.length; i++) {
    const row = currentData[i];
    const newRow = new Array(targetHeaders.length).fill('');
    
    // id
    newRow[0] = row[currentHeaders.indexOf('id')] || '';
    // title
    newRow[1] = row[currentHeaders.indexOf('title')] || '';
    // category
    newRow[2] = row[currentHeaders.indexOf('category')] || '';
    // clientName
    newRow[3] = row[currentHeaders.indexOf('clientName')] || '';
    // clientType (new)
    newRow[4] = row[currentHeaders.indexOf('clientType')] || '';
    // description
    newRow[5] = row[currentHeaders.indexOf('description')] || '';
    // technologies (was techStack)
    newRow[6] = row[currentHeaders.indexOf('technologies')] || row[currentHeaders.indexOf('techStack')] || row[currentHeaders.indexOf('technology')] || '';
    // image (was screenshotUrl)
    newRow[7] = row[currentHeaders.indexOf('image')] || row[currentHeaders.indexOf('screenshotUrl')] || '';
    // gallery (new)
    newRow[8] = row[currentHeaders.indexOf('gallery')] || '';
    // liveUrl
    newRow[9] = row[currentHeaders.indexOf('liveUrl')] || '';
    // status
    newRow[10] = row[currentHeaders.indexOf('status')] || '';
    // featured (new)
    newRow[11] = row[currentHeaders.indexOf('featured')] || '';
    // completedDate (new)
    newRow[12] = row[currentHeaders.indexOf('completedDate')] || '';
    // createdAt
    newRow[13] = row[currentHeaders.indexOf('createdAt')] || '';
    // updatedAt (new)
    newRow[14] = row[currentHeaders.indexOf('updatedAt')] || newRow[13];
    
    sheet.getRange(i + 1, 1, 1, targetHeaders.length).setValues([newRow]);
  }
}


function migratePlacementHeaders() {
  const ss = SS();
  const sheet = ss.getSheetByName('Placements');
  if (!sheet) return;
  const targetHeaders = ['id', 'studentName', 'courseId', 'courseName', 'companyName', 'designation', 'package', 'placementDate', 'year', 'studentPhoto', 'testimonial', 'status', 'featured', 'createdAt', 'updatedAt'];
  
  const currentData = sheet.getDataRange().getValues();
  if (currentData.length === 0) {
    sheet.appendRow(targetHeaders);
    return;
  }
  
  const currentHeaders = currentData[0];
  if (currentHeaders.join(',') === targetHeaders.join(',')) return; // Already migrated
  
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  
  for (let i = 1; i < currentData.length; i++) {
    const row = currentData[i];
    const newRow = new Array(targetHeaders.length).fill('');
    
    newRow[0] = row[currentHeaders.indexOf('id')] || '';
    newRow[1] = row[currentHeaders.indexOf('studentName')] || '';
    newRow[2] = row[currentHeaders.indexOf('courseId')] || '';
    newRow[3] = row[currentHeaders.indexOf('courseName')] || '';
    newRow[4] = row[currentHeaders.indexOf('companyName')] || '';
    newRow[5] = row[currentHeaders.indexOf('designation')] || '';
    newRow[6] = row[currentHeaders.indexOf('package')] || '';
    newRow[7] = row[currentHeaders.indexOf('placementDate')] || '';
    newRow[8] = row[currentHeaders.indexOf('year')] || '';
    newRow[9] = row[currentHeaders.indexOf('studentPhoto')] || row[currentHeaders.indexOf('photoUrl')] || row[currentHeaders.indexOf('image')] || '';
    newRow[10] = row[currentHeaders.indexOf('testimonial')] || '';
    newRow[11] = row[currentHeaders.indexOf('status')] || '';
    newRow[12] = row[currentHeaders.indexOf('featured')] || '';
    newRow[13] = row[currentHeaders.indexOf('createdAt')] || '';
    newRow[14] = row[currentHeaders.indexOf('updatedAt')] || newRow[13];
    
    sheet.getRange(i + 1, 1, 1, targetHeaders.length).setValues([newRow]);
  }
}


function migrateEmployeeHeaders() {
  const ss = SS();
  const sheet = ss.getSheetByName('Employees');
  if (!sheet) return;
  const targetHeaders = ['id', 'name', 'designation', 'department', 'photo', 'bio', 'skills', 'email', 'linkedin', 'joinDate', 'status', 'featured', 'createdAt', 'updatedAt'];
  
  const currentData = sheet.getDataRange().getValues();
  if (currentData.length === 0) {
    sheet.appendRow(targetHeaders);
    return;
  }
  
  const currentHeaders = currentData[0];
  if (currentHeaders.join(',') === targetHeaders.join(',')) return;
  
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  
  for (let i = 1; i < currentData.length; i++) {
    const row = currentData[i];
    const newRow = new Array(targetHeaders.length).fill('');
    
    newRow[0] = row[currentHeaders.indexOf('id')] || '';
    newRow[1] = row[currentHeaders.indexOf('name')] || '';
    newRow[2] = row[currentHeaders.indexOf('designation')] || row[currentHeaders.indexOf('role')] || '';
    newRow[3] = row[currentHeaders.indexOf('department')] || '';
    newRow[4] = row[currentHeaders.indexOf('photo')] || row[currentHeaders.indexOf('photoUrl')] || row[currentHeaders.indexOf('image')] || '';
    newRow[5] = row[currentHeaders.indexOf('bio')] || '';
    newRow[6] = row[currentHeaders.indexOf('skills')] || '';
    newRow[7] = row[currentHeaders.indexOf('email')] || '';
    newRow[8] = row[currentHeaders.indexOf('linkedin')] || '';
    newRow[9] = row[currentHeaders.indexOf('joinDate')] || '';
    newRow[10] = row[currentHeaders.indexOf('status')] || '';
    newRow[11] = row[currentHeaders.indexOf('featured')] || '';
    newRow[12] = row[currentHeaders.indexOf('createdAt')] || '';
    newRow[13] = row[currentHeaders.indexOf('updatedAt')] || newRow[12];
    
    sheet.getRange(i + 1, 1, 1, targetHeaders.length).setValues([newRow]);
  }
}


function migrateCourseHeaders() {
  const ss = SS();
  const sheet = ss.getSheetByName('Courses');
  if (!sheet) return;
  const targetHeaders = ['id', 'title', 'category', 'subcategory', 'description', 'duration', 'mode', 'fee', 'trainer', 'image', 'syllabus', 'startDate', 'endDate', 'batchTiming', 'seats', 'availableSeats', 'status', 'featured', 'createdAt', 'updatedAt'];
  
  const currentData = sheet.getDataRange().getValues();
  if (currentData.length === 0) {
    sheet.appendRow(targetHeaders);
    return;
  }
  
  const currentHeaders = currentData[0];
  if (currentHeaders.join(',') === targetHeaders.join(',')) return;
  
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  
  for (let i = 1; i < currentData.length; i++) {
    const row = currentData[i];
    const newRow = new Array(targetHeaders.length).fill('');
    
    newRow[0] = row[currentHeaders.indexOf('id')] || '';
    newRow[1] = row[currentHeaders.indexOf('title')] || '';
    newRow[2] = row[currentHeaders.indexOf('category')] || row[currentHeaders.indexOf('type')] || '';
    newRow[3] = row[currentHeaders.indexOf('subcategory')] || '';
    newRow[4] = row[currentHeaders.indexOf('description')] || '';
    newRow[5] = row[currentHeaders.indexOf('duration')] || '';
    newRow[6] = row[currentHeaders.indexOf('mode')] || '';
    newRow[7] = row[currentHeaders.indexOf('fee')] || '';
    newRow[8] = row[currentHeaders.indexOf('trainer')] || '';
    newRow[9] = row[currentHeaders.indexOf('image')] || row[currentHeaders.indexOf('imageUrl')] || '';
    newRow[10] = row[currentHeaders.indexOf('syllabus')] || '';
    newRow[11] = row[currentHeaders.indexOf('startDate')] || '';
    newRow[12] = row[currentHeaders.indexOf('endDate')] || '';
    newRow[13] = row[currentHeaders.indexOf('batchTiming')] || '';
    newRow[14] = row[currentHeaders.indexOf('seats')] || '';
    newRow[15] = row[currentHeaders.indexOf('availableSeats')] || '';
    newRow[16] = row[currentHeaders.indexOf('status')] || '';
    newRow[17] = row[currentHeaders.indexOf('featured')] || '';
    newRow[18] = row[currentHeaders.indexOf('createdAt')] || '';
    newRow[19] = row[currentHeaders.indexOf('updatedAt')] || newRow[18];
    
    sheet.getRange(i + 1, 1, 1, targetHeaders.length).setValues([newRow]);
  }
}


function migrateJobHeaders() {
  const ss = SS();
  const sheet = ss.getSheetByName('Jobs');
  if (!sheet) return;
  const targetHeaders = ['id', 'title', 'category', 'type', 'company', 'location', 'country', 'salary', 'experience', 'skills', 'description', 'deadline', 'status', 'featured', 'createdAt', 'updatedAt'];
  
  const currentData = sheet.getDataRange().getValues();
  if (currentData.length === 0) {
    sheet.appendRow(targetHeaders);
    return;
  }
  
  const currentHeaders = currentData[0];
  if (currentHeaders.join(',') === targetHeaders.join(',')) return;
  
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  
  for (let i = 1; i < currentData.length; i++) {
    const row = currentData[i];
    const newRow = new Array(targetHeaders.length).fill('');
    
    newRow[0] = row[currentHeaders.indexOf('id')] || '';
    newRow[1] = row[currentHeaders.indexOf('title')] || '';
    newRow[2] = row[currentHeaders.indexOf('category')] || row[currentHeaders.indexOf('department')] || '';
    newRow[3] = row[currentHeaders.indexOf('type')] || '';
    newRow[4] = row[currentHeaders.indexOf('company')] || 'Aditya Skill Gate';
    newRow[5] = row[currentHeaders.indexOf('location')] || '';
    newRow[6] = row[currentHeaders.indexOf('country')] || 'India';
    newRow[7] = row[currentHeaders.indexOf('salary')] || '';
    newRow[8] = row[currentHeaders.indexOf('experience')] || '';
    newRow[9] = row[currentHeaders.indexOf('skills')] || '';
    newRow[10] = row[currentHeaders.indexOf('description')] || '';
    newRow[11] = row[currentHeaders.indexOf('deadline')] || row[currentHeaders.indexOf('closingDate')] || '';
    newRow[12] = row[currentHeaders.indexOf('status')] || '';
    newRow[13] = row[currentHeaders.indexOf('featured')] || '';
    newRow[14] = row[currentHeaders.indexOf('createdAt')] || '';
    newRow[15] = row[currentHeaders.indexOf('updatedAt')] || newRow[14];
    
    sheet.getRange(i + 1, 1, 1, targetHeaders.length).setValues([newRow]);
  }
}


function migratePartnerHeaders() {
  const ss = SS();
  const sheet = ss.getSheetByName('Partners');
  if (!sheet) return;
  const targetHeaders = ['id', 'name', 'type', 'logo', 'country', 'website', 'description', 'verified', 'status', 'featured', 'createdAt', 'updatedAt'];
  
  const currentData = sheet.getDataRange().getValues();
  if (currentData.length === 0) {
    sheet.appendRow(targetHeaders);
    return;
  }
  
  const currentHeaders = currentData[0];
  if (currentHeaders.join(',') === targetHeaders.join(',')) return;
  
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  
  for (let i = 1; i < currentData.length; i++) {
    const row = currentData[i];
    const newRow = new Array(targetHeaders.length).fill('');
    
    newRow[0] = row[currentHeaders.indexOf('id')] || '';
    newRow[1] = row[currentHeaders.indexOf('name')] || '';
    newRow[2] = row[currentHeaders.indexOf('type')] || '';
    newRow[3] = row[currentHeaders.indexOf('logo')] || row[currentHeaders.indexOf('logoUrl')] || '';
    newRow[4] = row[currentHeaders.indexOf('country')] || 'India';
    newRow[5] = row[currentHeaders.indexOf('website')] || '';
    newRow[6] = row[currentHeaders.indexOf('description')] || '';
    newRow[7] = row[currentHeaders.indexOf('verified')] || 'true';
    newRow[8] = row[currentHeaders.indexOf('status')] || 'Active';
    newRow[9] = row[currentHeaders.indexOf('featured')] || 'false';
    newRow[10] = row[currentHeaders.indexOf('createdAt')] || '';
    newRow[11] = row[currentHeaders.indexOf('updatedAt')] || newRow[10];
    
    sheet.getRange(i + 1, 1, 1, targetHeaders.length).setValues([newRow]);
  }
}


function migrateTimelineHeaders() {
  const ss = SS();
  let sheet = ss.getSheetByName('Timeline');
  
  const targetHeaders = ['id', 'date', 'year', 'title', 'description', 'icon', 'image', 'status', 'sortOrder'];
  
  if (!sheet) {
    sheet = ss.insertSheet('Timeline');
    sheet.appendRow(targetHeaders);
    // Insert initial record
    sheet.appendRow([Utilities.getUuid(), '2025-10-26', '2025', 'Company Founded', 'Aditya Skill Gate IT Solution was established.', 'fas fa-flag', '', 'Active', '1']);
    return;
  }
  
  const currentData = sheet.getDataRange().getValues();
  if (currentData.length === 0) {
    sheet.appendRow(targetHeaders);
    sheet.appendRow([Utilities.getUuid(), '2025-10-26', '2025', 'Company Founded', 'Aditya Skill Gate IT Solution was established.', 'fas fa-flag', '', 'Active', '1']);
    return;
  }
  
  const currentHeaders = currentData[0];
  if (currentHeaders.join(',') === targetHeaders.join(',')) return;
  
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
}

function migrateSheetHeaders() {
  const ss = SS();
  
  // Migrate Projects Sheet
  const projSheet = ss.getSheetByName('Projects');
  if (projSheet) {
    const data = projSheet.getDataRange().getValues();
    if (data.length > 0) {
      const headers = data[0];
      const replacements = {
        'clientType': 'clientName',
        'technology': 'techStack',
        'screenshots': 'techStack', // if they used screenshots for techStack
        'results': 'screenshotUrl' // if they used results for imageUrl
      };
      
      let changed = false;
      headers.forEach((h, i) => {
        if (replacements[h]) {
          projSheet.getRange(1, i + 1).setValue(replacements[h]);
          changed = true;
        }
      });
      if (changed) Logger.log('Projects headers migrated successfully.');
    }
  }

  // Migrate Placements Sheet
  const placeSheet = ss.getSheetByName('Placements');
  if (placeSheet) {
    const data = placeSheet.getDataRange().getValues();
    if (data.length > 0) {
      const headers = data[0];
      const replacements = {
        'student': 'studentName',
        'course': 'courseName',
        'company': 'companyName'
      };
      
      let changed = false;
      headers.forEach((h, i) => {
        if (replacements[h]) {
          placeSheet.getRange(1, i + 1).setValue(replacements[h]);
          changed = true;
        }
      });
      if (changed) Logger.log('Placements headers migrated successfully.');
    }
  }
  
  Logger.log('Migration complete!');
}
