/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — API SERVICE MODULE
   js/api.js
   ============================================================
   Replace API_BASE_URL with your deployed Google Apps Script URL
   ============================================================ */

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyOH9ZjGPl-xMgfW_V1UqhUpDUhMofWryVuYtCJk8Uf0D_sjY1WoAOYyLIGTMCBvisKQw/exec';
const SHEET_ID = '1zQKpOnYjpCMku9gYi3fQHPw84IFdHmTWYJ8_rSbJkco';

/* ============ DEMO DATA (fallback when API not configured) ============ */
const DEMO_DATA = {
  settings: {
    companyName: 'Aditya Skill Gate IT Solution',
    phone: '+91 63826 04808',
    whatsapp: '+916382604808',
    email: 'Adityaskillgateitsolution@gmail.com',
    instagram: 'https://www.instagram.com/adityaskillgate.official/',
    youtube: 'https://www.youtube.com/@thoduvaanamyt1867',
    address: 'Tamil Nadu, India',
    heroTitle: 'Empowering Skills Through Technology',
    heroSubtitle: 'Premium IT Training, Services & Placement Support',
    stats: { students: 500, placements: 100, projects: 50, employees: 20, technologies: 10 }
  },
  services: [
    { id: 's1', title: 'Enterprise Solutions', category: 'Services', icon: 'fa-building', description: 'Custom software development, IT consulting, and comprehensive tech solutions for businesses.', status: 'Active' },
    { id: 's2', title: 'IT Training', category: 'Training', icon: 'fa-laptop-code', description: 'Industry-oriented courses in Full Stack, Python, AI, Java, Data Science, and Cyber Security.', status: 'Active' },
    { id: 's3', title: 'Non-IT Training', category: 'Training', icon: 'fa-users-cog', description: 'Professional training in Accounting, HR, Banking, Office Admin, and Soft Skills.', status: 'Active' },
    { id: 's4', title: 'Abroad Study', category: 'Consulting', icon: 'fa-graduation-cap', description: 'End-to-end admission guidance, scholarship assistance, and visa support for international universities.', status: 'Active' },
    { id: 's5', title: 'Abroad Jobs', category: 'Consulting', icon: 'fa-plane-departure', description: 'Global career opportunities with visa sponsorship in top companies across the world.', status: 'Active' }
     ],
     partners: [
       { id: 'pt1', name: 'Infosys', type: 'Hiring Company', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg', website: '#', status: 'Active' },
       { id: 'pt2', name: 'TCS', type: 'Hiring Company', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg', website: '#', status: 'Active' },
       { id: 'pt3', name: 'University of London', type: 'University', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/University_of_London_logo.svg/200px-University_of_London_logo.svg.png', website: '#', status: 'Active' },
       { id: 'pt4', name: 'Toronto College', type: 'Study Abroad College', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/University_of_Toronto_crest.svg/200px-University_of_Toronto_crest.svg.png', website: '#', status: 'Active' }
     ],
     courses: [
       { id: 'c1', title: 'Full Stack Web Development', type: 'IT', category: 'Full Stack', duration: '6 Months', fee: '₹48,000', originalFee: '₹72,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: 'Popular', description: 'Master HTML, CSS, JavaScript, Angular/React, Python/Java/Dot Ner, and Sql Server.' },
       { id: 'c2', title: 'Python & AI/ML', type: 'IT', category: 'AI', duration: '3 Months', fee: '₹24,000', originalFee: '₹30,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: 'Trending', description: 'Learn Python, machine learning, and AI model deployment.' },
       { id: 'c3', title: 'Advanced Java SpringBoot', type: 'IT', category: 'Java', duration: '3 Months', fee: '₹24,000', originalFee: '₹30,000', trainer: 'Mr. Marimuthu.', imageUrl: '', status: 'Active', badge: 'New', description: 'Build enterprise applications using Java and SpringBoot.' },
       {
        id: 'c4',
        title: 'Advanced .NET with C#',
        type: 'IT',
        category: '.NET',
        duration: '3 Months',
        fee: '₹24,000',
        originalFee: '₹30,000',
        trainer: 'Mr. Marimuthu.',
        imageUrl: '',
        status: 'Active',
        badge: 'New',
        description: 'Build enterprise web applications using C#, .NET, ASP.NET Core, Entity Framework Core and SQL Server.'
      },
       {
        id: 'c5',
        title: 'Advanced Angular Development',
        type: 'IT',
        category: 'Angular',
        duration: '3 Months',
        fee: '₹24,000',
        originalFee: '₹30,000',
        trainer: 'Mr. Marimuthu.',
        imageUrl: '',
        status: 'Active',
        badge: 'In Demand',
        description: 'Build modern, responsive web applications using Angular, TypeScript, HTML, CSS, Angular Material and REST APIs.'
      },
      
      {
        id: 'c6',
        title: 'Advanced React Development',
        type: 'IT',
        category: 'React',
        duration: '3 Months',
        fee: '₹24,000',
        originalFee: '₹30,000',
        trainer: 'Mr. Marimuthu.',
        imageUrl: '',
        status: 'Active',
        badge: 'New',
        description: 'Develop modern and scalable web applications using React, JavaScript, JSX, React Hooks, APIs and modern UI technologies.'
      }
     ],
     jobs: [
        {
          id: 'j1',
          title: 'React Developer',
          type: 'Domestic',
          category: 'IT Jobs',
          department: 'Engineering',
          location: 'Remote',
          country: 'India',
          experience: '1-3 Years',
          salary: '₹4-8 LPA',
          benefits: 'Health Insurance, Flexible Hours',
          skills: ['React', 'JavaScript', 'Redux'],
          status: 'Open'
        },
        {
          id: 'j2',
          title: 'Python Developer',
          type: 'Domestic',
          category: 'IT Jobs',
          department: 'Engineering',
          location: 'Chennai',
          country: 'India',
          experience: '1-3 Years',
          salary: '₹4-8 LPA',
          benefits: 'Health Insurance, Flexible Hours',
          skills: ['Python', 'Django', 'REST API'],
          status: 'Open'
        },
        {
          id: 'j3',
          title: 'Angular Developer',
          type: 'Domestic',
          category: 'IT Jobs',
          department: 'Engineering',
          location: 'Bangalore',
          country: 'India',
          experience: '1-3 Years',
          salary: '₹4-9 LPA',
          benefits: 'Health Insurance, Flexible Hours',
          skills: ['Angular', 'TypeScript', 'HTML', 'CSS'],
          status: 'Open'
        },
        {
          id: 'j4',
          title: 'SQL Developer',
          type: 'Domestic',
          category: 'IT Jobs',
          department: 'Database',
          location: 'Chennai',
          country: 'India',
          experience: '1-3 Years',
          salary: '₹4-8 LPA',
          benefits: 'Health Insurance, Paid Time Off',
          skills: ['SQL Server', 'T-SQL', 'Stored Procedures'],
          status: 'Open'
        }
      ],
     employees: [
     {
       id: 'e1',
       name: 'Padma Marimuthu',
       role: 'Founder & CEO',
       department: 'Management',
       bio: 'Passionate about bridging the skill gap in the IT industry through quality education and placement support.',
       photoUrl: '',
       linkedin: '#',
       status: 'Active'
     },
     {
       id: 'e2',
       name: 'Marimuthu',
       role: 'Lead Trainer',
       department: 'Training',
       bio: 'Experienced IT trainer specializing in full-stack development and industry-oriented technical training.',
       photoUrl: '',
       linkedin: '#',
       status: 'Active'
     },
     {
       id: 'e3',
       name: 'Mugesh',
       role: 'Sr. Web Developer',
       department: 'Training',
       bio: 'Full-stack developer specializing in modern web technologies and application development.',
       photoUrl: '',
       linkedin: '#',
       status: 'Active'
     },
     {
       id: 'e4',
       name: 'Vanitha',
       role: 'HR & Placements',
       department: 'HR',
       bio: 'Focused on connecting talented students and graduates with suitable career opportunities.',
       photoUrl: '',
       linkedin: '#',
       status: 'Active'
     }
   ],
  projects: [
     {
       id: 'p1',
       title: 'Kurunji Fun World Management System',
       clientName: 'Kurunji Fun World',
       category: 'Web Development',
       description: 'Modern web-based management system for managing activities, customer information, bookings, and day-to-day operations.',
       techStack: ['Angular', '.NET Core', 'C#', 'SQL Server'],
       imageUrl: '',
       liveUrl: '#',
       status: 'Completed'
     },
   
     {
       id: 'p2',
       title: 'Smart Mind IAS Academy Website',
       clientName: 'Smart Mind IAS Academy',
       category: 'Education',
       description: 'Professional educational website for course information, student enquiries, academy details, and online presence.',
       techStack: ['HTML', 'CSS', 'JavaScript', 'Bootstrap'],
       imageUrl: '',
       liveUrl: '#',
       status: 'Completed'
     },
   
     {
       id: 'p3',
       title: 'Vetrivel Electricals Business Management System',
       clientName: 'Vetrivel Electricals',
       category: 'Business Management',
       description: 'Business management solution for handling products, customers, sales, billing, and daily business operations.',
       techStack: ['Angular', '.NET Core', 'C#', 'SQL Server'],
       imageUrl: '',
       liveUrl: '#',
       status: 'Completed'
     },
   
     {
       id: 'p4',
       title: '18 Village People Trust Website',
       clientName: '18 Village People Trust',
       category: 'Web Development',
       description: 'Professional trust website showcasing the organization, activities, community initiatives, events, and contact information.',
       techStack: ['HTML', 'CSS', 'JavaScript', 'Bootstrap'],
       imageUrl: '',
       liveUrl: '#',
       status: 'Completed'
     },
   
     {
       id: 'p5',
       title: 'TN Painter Community Portal',
       clientName: 'TN Painter Community',
       category: 'Community Platform',
       description: 'Community platform designed to connect painters, showcase services, manage member information, and support business enquiries.',
       techStack: ['Angular', 'Node.js', 'MongoDB'],
       imageUrl: '',
       liveUrl: '#',
       status: 'Completed'
     },
   
     {
       id: 'p6',
       title: 'Nanyang Asia College Website',
       clientName: 'Nanyang Asia College, Singapore',
       category: 'Education',
       description: 'Professional college website presenting academic programs, courses, admissions, student information, and institutional details.',
       techStack: ['React', 'Node.js', 'MySQL', 'AWS'],
       imageUrl: '',
       liveUrl: '#',
       status: 'Completed'
     },
   
     {
       id: 'p7',
       title: 'Client Project',
       clientName: '7th Client',
       category: 'Web Development',
       description: 'Custom software solution developed according to the client requirements and business needs.',
       techStack: ['Angular', '.NET Core', 'C#', 'SQL Server'],
       imageUrl: '',
       liveUrl: '#',
       status: 'Completed'
     }
   
   ],
  placements: [
    { id: 'pl1', studentName: 'Arjun M.', courseName: 'Full Stack Web Development', companyName: 'Infosys', designation: 'Junior Developer', package: '4.5 LPA', photoUrl: '', testimonial: 'Aditya Skill Gate transformed my career! The hands-on training and placement support were incredible.', placementDate: '2024-05-15', galleryUrls: [], year: '2024', status: 'Published' },
    { id: 'pl2', studentName: 'Sneha T.', courseName: 'Python & AI/ML', companyName: 'TCS', designation: 'ML Engineer', package: '5.2 LPA', photoUrl: '', testimonial: 'The AI course curriculum was industry-relevant and the mentors were always supportive.', placementDate: '2024-04-20', galleryUrls: [], year: '2024', status: 'Published' },
    { id: 'pl3', studentName: 'Kiran P.', courseName: 'Java SpringBoot', companyName: 'Wipro', designation: 'Java Developer', package: '3.8 LPA', photoUrl: '', testimonial: 'From zero coding knowledge to landing a job at Wipro — thank you Aditya Skill Gate!', placementDate: '2023-11-10', galleryUrls: [], year: '2023', status: 'Published' }
  ],
  abroadUniversities: [
  {
    id: 'au1',
    name: 'Nanyang Asia College',
    country: 'Singapore',
    programs: ['Applied AI and Data Science', 'Project Management'],
    scholarship: 'Available',
    logoUrl: '',
    status: 'Active'
  }
],
  testimonials: [
    { id: 't1', name: 'Arjun M.', role: 'Student', company: 'Placed at Infosys', message: 'The best IT training institute I have attended. Practical projects and personal mentorship made all the difference. Highly recommend!', rating: 5, status: 'Active' },
    { id: 't2', name: 'Prabhakaran V.', role: 'Client', company: 'RetailMax', message: 'Aditya Skill Gate developed our e-commerce platform on time and within budget. Professional team with excellent communication.', rating: 5, status: 'Active' },
    { id: 't3', name: 'Sneha T.', role: 'Student', company: 'Placed at TCS', message: 'The Python and AI course was outstanding. The trainers are industry experts who teach with real-world examples.', rating: 5, status: 'Active' },
    { id: 't4', name: 'Manikandan K.', role: 'Client', company: 'MedCare Hospitals', message: 'Our hospital management system was built perfectly. The team understood our requirements thoroughly and delivered quality work.', rating: 4, status: 'Active' },
    { id: 't5', name: 'Deepa R.', role: 'Student', company: 'Placed at Zoho', message: 'The placement support is amazing. They prepared me thoroughly for interviews and helped me land my dream job!', rating: 5, status: 'Active' },
    { id: 't6', name: 'Suresh N.', role: 'Client', company: 'QuickBite', message: 'Outstanding mobile app development service. The food delivery app they built works flawlessly and users love it.', rating: 5, status: 'Active' }
  ],
  blogs: [
    { id: 'b1', title: 'Top 10 Programming Languages to Learn in 2024', slug: 'top-10-programming-languages-2024', excerpt: 'A comprehensive guide to the most in-demand programming languages and why you should learn them.', imageUrl: '', tags: ['Programming', 'Career'], author: 'Aditya Kumar', publishedAt: '2024-06-01', status: 'Published' },
    { id: 'b2', title: 'How AI is Transforming the IT Industry', slug: 'ai-transforming-it-industry', excerpt: 'Explore how artificial intelligence is changing software development, testing, and deployment practices.', imageUrl: '', tags: ['AI', 'Technology'], author: 'Priya Sharma', publishedAt: '2024-05-15', status: 'Published' },
    { id: 'b3', title: 'From Student to Software Engineer: Success Story', slug: 'student-to-software-engineer', excerpt: 'Read how our graduates successfully transitioned from college to top IT companies.', imageUrl: '', tags: ['Placement', 'Success Story'], author: 'Kavitha R.', publishedAt: '2024-05-01', status: 'Published' }
  ]
};

/* ============ API HELPER ============ */
const isApiConfigured = () => API_BASE_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' && API_BASE_URL.length > 10;

async function apiGet(endpoint, params = {}) {
  if (!isApiConfigured()) {
    console.info('🔧 API not configured — using demo data.');
    return null;
  }
  try {
    const url = new URL(API_BASE_URL);
    url.searchParams.set('action', endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API GET failed (${endpoint}):`, err.message);
    return null;
  }
}

async function apiPost(endpoint, body = {}) {
  if (!isApiConfigured()) {
    console.info('🔧 API not configured — simulating post.');
    return { success: true, message: 'Submitted (demo mode)', data: null };
  }
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: endpoint, ...body })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API POST failed (${endpoint}):`, err.message);
    return { success: false, message: 'Network error. Please try again.', data: null };
  }
}

/* ============ PUBLIC API CALLS ============ */
const API = {
  async getSettings() {
    const res = await apiGet('getSettings');
    return res?.data || DEMO_DATA.settings;
  },

  async getCourses() {
    const res = await apiGet('getCourses');
    return (res?.data?.length) ? res.data : DEMO_DATA.courses;
  },

  async getServices() {
    const res = await apiGet('getServices');
    return (res?.data?.length) ? res.data : DEMO_DATA.services;
  },

  async getPartners() {
    const res = await apiGet('getPartners');
    return (res?.data?.length) ? res.data : DEMO_DATA.partners;
  },

  async getAbroadUniversities() {
    const res = await apiGet('getAbroadUniversities');
    return (res?.data?.length) ? res.data : DEMO_DATA.abroadUniversities;
  },

  async getJobs() {
    const res = await apiGet('getJobs');
    return (res?.data?.length) ? res.data : DEMO_DATA.jobs;
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

  async search(query) {
    const res = await apiGet('search', { q: query });
    return res?.data || { courses: [], jobs: [], blogs: [] };
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
    return apiPost('adminLogin', creds);
  },

  async adminGet(resource) {
    const token = sessionStorage.getItem('admin_token');
    const res = await apiPost('adminGet', { resource, token });
    return res?.data || [];
  },

  async adminCreate(resource, data) {
    const token = sessionStorage.getItem('admin_token');
    return apiPost('adminCreate', { resource, data, token });
  },

  async adminUpdate(resource, id, data) {
    const token = sessionStorage.getItem('admin_token');
    return apiPost('adminUpdate', { resource, id, data, token });
  },

  async adminDelete(resource, id) {
    const token = sessionStorage.getItem('admin_token');
    return apiPost('adminDelete', { resource, id, token });
  },

  async adminGetAnalytics() {
    const token = sessionStorage.getItem('admin_token');
    return apiPost('adminGetAnalytics', { token });
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
