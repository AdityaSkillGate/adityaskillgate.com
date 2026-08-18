/**
 * ADITYA SKILL GATE IT SOLUTION
 * Google Apps Script Backend (V2 Final Merged)
 * 
 * Includes: MailApp, DriveUploads, Secure Auth, XSS Sanitization, and V2 CRUD.
 */

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with actual ID
const ADMIN_DRIVE_FOLDER = 'ASG_Resumes';
const ADMIN_EMAIL = 'Adityaskillgateitsolution@gmail.com';
const COMPANY_NAME = 'Aditya Skill Gate IT Solution';
const COMPANY_PHONE = '+91 63826 04808';
const WEBSITE_URL = 'https://adityaskillgate-itsolution.vercel.app';
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
      case 'getSettings': return jsonResponse({ success: true, data: getSettings() });
      case 'getCourses': return jsonResponse({ success: true, data: getActiveCourses() });
      case 'getServices': return jsonResponse({ success: true, data: getActiveServices() });
      case 'getPartners': return jsonResponse({ success: true, data: getActivePartners() });
      case 'getAbroadUniversities': 
      case 'getUniversities': return jsonResponse({ success: true, data: getActiveAbroadUniversities() });
      case 'getJobs': return jsonResponse({ success: true, data: getOpenJobs() });
      case 'getAbroadJobs': return jsonResponse({ success: true, data: getActiveAbroadJobs() });
      case 'getEmployees': return jsonResponse({ success: true, data: getActiveEmployees() });
      case 'getProjects': return jsonResponse({ success: true, data: getCompletedProjects() });
      case 'getPlacements': return jsonResponse({ success: true, data: getPublishedPlacements() });
      case 'getTestimonials': return jsonResponse({ success: true, data: getActiveTestimonials() });
      case 'getBlogs': return jsonResponse({ success: true, data: getPublishedBlogs() });
      case 'getCategories': return jsonResponse({ success: true, data: getSheetData('Categories') });
      case 'getBlog': return jsonResponse({ success: true, data: getBlogBySlug(e?.parameter?.slug) });
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
  const publicActions = ['submitContact', 'submitResume', 'submitEnquiry', 'submitJobApplication', 'adminLogin', 'submitAbroadApplication', 'submitAbroadJobApp', 'saveCRMLead'];
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

function handleAdminGet(body) { return jsonResponse({ success: true, data: getSheetData(sheetName(body.resource)) }); }
function handleAdminCreate(body) {
  const { resource, data } = body;
  const id = generateId(); data.id = id; data.createdAt = now();
  processImageData(data, id);
  createRecord(sheetName(resource), data);
  return jsonResponse({ success: true, message: 'Record created', id });
}
function handleAdminUpdate(body) {
  const { resource, id, data } = body;
  processImageData(data, id);
  updateRecord(sheetName(resource), id, data);
  return jsonResponse({ success: true, message: 'Record updated' });
}
function handleAdminDelete(body) {
  const result = deleteRecord(sheetName(body.resource), body.id);
  return jsonResponse({ success: result, message: result ? 'Deleted' : 'Record not found' });
}
function handleAdminAnalytics(body) { return jsonResponse({ success: true, data: getAnalyticsSummary() }); }

/* ========================================= */
/* 4. DATA FETCHING (Api.gs)                 */
/* ========================================= */

function getActiveCourses() { return getSheetData('Courses').filter(c => (c.status||'').trim().toLowerCase() === 'active'); }
function getActiveServices() { return getSheetData('Services').filter(s => (s.status||'').trim().toLowerCase() === 'active'); }
function getActivePartners() { return getSheetData('Partners').filter(p => (p.status||'').trim().toLowerCase() === 'active' || (p.status||'').trim().toLowerCase() === 'verified'); }
function getActiveAbroadUniversities() { return getSheetData('AbroadUniversities').filter(u => (u.status||'').trim().toLowerCase() === 'active'); }
function getOpenJobs() { return getSheetData('Jobs').filter(j => (j.status||'').trim().toLowerCase() === 'open'); }
function getActiveAbroadJobs() { return getSheetData('AbroadJobs').filter(j => (j.status||'').trim().toLowerCase() === 'open' || (j.status||'').trim().toLowerCase() === 'active'); }
function getPublishedPlacements() { return getSheetData('Placements').filter(p => (p.status||'').trim().toLowerCase() === 'published' || (p.status||'').trim().toLowerCase() === 'active'); }
function getActiveTestimonials() { return getSheetData('Testimonials').filter(t => (t.status||'').trim().toLowerCase() === 'active'); }
function getCompletedProjects() { return getSheetData('Projects').filter(p => (p.status||'').trim().toLowerCase() === 'completed'); }
function getActiveEmployees() { return getSheetData('Employees').filter(e => (e.status||'').trim().toLowerCase() === 'active'); }
function getPublishedBlogs() { return getSheetData('Blogs').filter(b => (b.status||'').trim().toLowerCase() === 'published'); }
function getBlogBySlug(slug) { return getSheetData('Blogs').find(b => b.slug === slug && b.status === 'Published') || null; }

function getAnalyticsSummary() {
  const analyticsData = getSheetData('Analytics');
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(); date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    last7Days.push(analyticsData.find(d => d.date === dateStr) || { date: dateStr, visitors: 0, submissions: 0, applications: 0, courseEnquiries: 0, jobApplications: 0 });
  }
  return {
    summary: {
      courses: getActiveCourses().length,
      jobs: getOpenJobs().length,
      resumes: getSheetData('Resumes').length,
      placements: getPublishedPlacements().length,
      projects: getCompletedProjects().length,
      employees: getActiveEmployees().length,
      contacts: getSheetData('Contacts').length,
      testimonials: getActiveTestimonials().length
    },
    last7Days,
    recentResumes: getSheetData('Resumes').slice(-5).reverse(),
    recentContacts: getSheetData('Contacts').slice(-5).reverse()
  };
}

function searchAll(query) {
  const q = query.toLowerCase();
  const botAnswers = getSheetData('Chatbot').filter(row => { const kw = (row.keyword||'').trim().toLowerCase(); return kw && (row.status||'').trim().toLowerCase() === 'active' && q.includes(kw); });
  return {
    botResponse: botAnswers.length > 0 ? botAnswers[0].response : null,
    courses: getActiveCourses().filter(c => (c.title + c.category + c.description).toLowerCase().includes(q)),
    jobs: getOpenJobs().filter(j => (j.title + j.department + j.skills).toLowerCase().includes(q)),
    blogs: getPublishedBlogs().filter(b => (b.title + b.excerpt + b.tags).toLowerCase().includes(q))
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
  Courses: ['id', 'title', 'category', 'duration', 'fee', 'originalFee', 'description', 'syllabus', 'trainer', 'imageUrl', 'status', 'badge', 'createdAt', 'type'],
  Jobs: ['id', 'title', 'department', 'location', 'experience', 'salary', 'skills', 'description', 'type', 'applyLink', 'status', 'createdAt'],
  AbroadJobs: ['id', 'title', 'company', 'location', 'type', 'experience', 'salary', 'benefits', 'requirements', 'closingDate', 'applyLink', 'status', 'createdAt'],
  Employees: ['id', 'name', 'role', 'department', 'photoUrl', 'email', 'phone', 'bio', 'linkedin', 'status', 'createdAt'],
  Projects: ['id', 'title', 'category', 'clientType', 'technology', 'description', 'screenshots', 'results', 'liveUrl', 'status', 'createdAt'],
  Placements: ['id', 'student', 'course', 'company', 'designation', 'package', 'photoUrl', 'testimonial', 'year', 'status', 'createdAt'],
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

function getSheetData(sheetName) {
  try {
    const sheet = getOrCreateSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; 
    
    const headers = data[0];
    return data.slice(1).filter(row => row[0]).map(row => {
      const obj = {};
      headers.forEach((h, i) => { 
        let val = row[i] !== undefined ? String(row[i]) : '';
        try { if(val.startsWith('[') || val.startsWith('{')) val = JSON.parse(val); } catch(e){}
        obj[h] = val; 
      });
      return obj;
    }).filter(row => row.status !== 'Deleted');
  } catch (err) { Logger.log(err.message); return []; }
}

function appendRow(sheetName, rowData) { getOrCreateSheet(sheetName).appendRow(rowData); }

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

function getSettings() {
  try {
    const sheet = getOrCreateSheet('Settings');
    const data = sheet.getDataRange().getValues();
    const settings = {};
    data.slice(1).forEach(row => { if (row[0]) settings[row[0]] = row[1] || ''; });
    return {
      companyName: 'Aditya Skill Gate IT Solution', phone: '+91 63826 04808', whatsapp: '+916382604808', email: 'Adityaskillgateitsolution@gmail.com',
      instagram: 'https://www.instagram.com/adityaskillgate.official/', youtube: 'https://www.youtube.com/@thoduvaanamyt1867', address: 'Tamil Nadu, India',
      heroTitle: 'Empowering Skills Through Technology', heroSubtitle: 'Premium IT Training, Services & Placement Support', ...settings
    };
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
