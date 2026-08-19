/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — API SERVICE MODULE
   js/api.js
   ============================================================
   Replace API_BASE_URL with your deployed Google Apps Script URL
   ============================================================ */

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbw-Wv6pSJ3vSTr2CmNEYd5M_yy-NAjZj6yduq7DtuFxB8jekjj4S5nhK4CV-C2HdyqT/exec';
const SHEET_ID = '1P8a4IpQ9DW2Ut7kE4oBV8f9BHRBoU39UyJPSAjoJUDc';

/* ============ DEMO DATA (fallback when API not configured) ============ */
const DEMO_DATA = {
  settings: {
    companyName: 'Aditya Skill Gate IT Solution',
    phone: '+91 63826 04808',
    whatsapp: '+916382604808',
    email: 'Adityaskillgateitsolution@gmail.com',
    instagram: 'https://www.instagram.com/adityaskillgate.official/',
    youtube: 'https://www.youtube.com/@AdityaSkillGateITSolution',
    address: 'Tamil Nadu, India',
    heroTitle: 'Empowering Skills Through Technology',
    heroSubtitle: 'Premium IT Training, Services & Placement Support',
    stats: { students: 500, placements: 100, projects: 50, employees: 20, technologies: 10, placementRate: '90%+', highestPackage: '₹16 LPA', rating: '4.9/5' }
  },
  
  categories: [
    { id: 'cat1', name: 'Enterprise Solutions', parent: null, status: 'Active' },
    { id: 'cat2', name: 'IT Training', parent: null, status: 'Active' },
    { id: 'cat3', name: 'Non-IT Training', parent: null, status: 'Active' },
    { id: 'cat4', name: 'Abroad Study', parent: null, status: 'Active' },
    { id: 'cat5', name: 'Abroad Jobs', parent: null, status: 'Active' },
    { id: 'cat6', name: 'IT', parent: 'Abroad Jobs', status: 'Active' },
    { id: 'cat7', name: 'Non-IT', parent: 'Abroad Jobs', status: 'Active' }
  ],
  services: [
    { id: 's1', title: 'Enterprise Web Development', category: 'Enterprise Solutions', icon: 'fa-building', description: 'Custom software development and IT consulting.', status: 'Active' },
    { id: 's2', title: 'Full Stack Development', category: 'IT Training', icon: 'fa-laptop-code', description: 'Industry-oriented courses in Full Stack and Python.', status: 'Active' },
    { id: 's3', title: 'Accounting & Tally', category: 'Non-IT Training', icon: 'fa-users-cog', description: 'Professional training in Accounting and Banking.', status: 'Active' },
    { id: 's4', title: 'University Admissions', category: 'Abroad Study', icon: 'fa-graduation-cap', description: 'End-to-end admission guidance.', status: 'Active' },
    { id: 's5', title: 'Global Tech Placements', category: 'IT', parentCategory: 'Abroad Jobs', icon: 'fa-plane-departure', description: 'Global IT career opportunities with visa sponsorship.', status: 'Active' },
    { id: 's6', title: 'Healthcare Abroad Jobs', category: 'Non-IT', parentCategory: 'Abroad Jobs', icon: 'fa-user-nurse', description: 'Nursing and healthcare placements globally.', status: 'Active' }
  ],
  
      //  partners: [
      //    { id: 'pt1', name: 'Infosys', type: 'Hiring Company', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg', website: 'https://infosys.com', country: 'India', description: 'Global leader in next-generation digital services and consulting.', status: 'Verified' },
      //    { id: 'pt2', name: 'TCS', type: 'Hiring Company', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg', website: 'https://tcs.com', country: 'India', description: 'IT services, consulting and business solutions organization.', status: 'Verified' },
      //    { id: 'pt3', name: 'University of London', type: 'University', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/University_of_London_logo.svg/200px-University_of_London_logo.svg.png', website: 'https://london.ac.uk', country: 'UK', description: 'A globally recognized collegiate research university.', status: 'Verified' },
      //    { id: 'pt4', name: 'Toronto College', type: 'College', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/University_of_Toronto_crest.svg/200px-University_of_Toronto_crest.svg.png', website: 'https://utoronto.ca', country: 'Canada', description: 'Leading institution of learning, discovery and knowledge creation.', status: 'Pending' }
      //  ],
       abroadJobs: [
         { id: 'aj1', slug: 'senior-software-engineer-uk', title: 'Senior Software Engineer', category: 'IT', country: 'UK', employer: 'TechGlobal Solutions', role: 'Full Stack Developer', experience: '5+ Years', salary: '£60,000 - £80,000', benefits: 'Visa Sponsorship, Relocation Bonus, Health Insurance', requirements: 'React, Node.js, AWS, System Design', closingDate: '2026-12-31', status: 'Active' },
         { id: 'aj2', slug: 'registered-nurse-canada', title: 'Registered Nurse', category: 'Non-IT', country: 'Canada', employer: 'Toronto Health Network', role: 'Staff Nurse', experience: '2+ Years', salary: '$70,000 - $90,000 CAD', benefits: 'Visa Sponsorship, Permanent Residency Pathway', requirements: 'BSc Nursing, IELTS 7.0+, Active License', closingDate: '2026-11-15', status: 'Active' },
         { id: 'aj3', slug: 'data-scientist-australia', title: 'Data Scientist', category: 'IT', country: 'Australia', employer: 'DataCorp AU', role: 'Data Scientist', experience: '3+ Years', salary: '$100,000 - $130,000 AUD', benefits: 'Visa Sponsorship, Flexible Working', requirements: 'Python, Machine Learning, SQL, Statistics', closingDate: '2024-01-01', status: 'Active' } // Expired for testing
       ],
       abroadJobApplications: [],
       courses: [
         { id: 'c1', slug: 'full-stack-web-development', title: 'Full Stack Web Development', type: 'IT', category: 'Full Stack', duration: '6 Months', fee: '₹48,000', originalFee: '₹72,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: 'Popular', batch: 'Oct 15th, 2024', description: 'Master HTML, CSS, JavaScript, Angular/React, Python/Java, and SQL Server.' },
         { id: 'c2', slug: 'python-ai-ml', title: 'Python & AI/ML', type: 'IT', category: 'AI/ML', duration: '3 Months', fee: '₹24,000', originalFee: '₹30,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: 'Trending', batch: 'Nov 1st, 2024', description: 'Learn Python, machine learning, and AI model deployment.' },
         { id: 'c3', slug: 'advanced-java-springboot', title: 'Advanced Java SpringBoot', type: 'IT', category: 'Java', duration: '3 Months', fee: '₹24,000', originalFee: '₹30,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: 'New', batch: 'Oct 20th, 2024', description: 'Build enterprise applications using Java and SpringBoot.' },
         { id: 'c4', slug: 'advanced-net-csharp', title: 'Advanced .NET with C#', type: 'IT', category: 'Full Stack', duration: '3 Months', fee: '₹24,000', originalFee: '₹30,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: '', batch: 'Nov 5th, 2024', description: 'Enterprise app development with .NET Core and C#.' },
         { id: 'c5', slug: 'cyber-security', title: 'Cyber Security & Ethical Hacking', type: 'IT', category: 'Cyber Security', duration: '4 Months', fee: '₹35,000', originalFee: '₹45,000', trainer: 'Mr. Karthik', imageUrl: '', status: 'Active', badge: 'High Demand', batch: 'Oct 10th, 2024', description: 'Learn ethical hacking, network security, and penetration testing.' },
         { id: 'c6', slug: 'accounting-tally', title: 'Professional Accounting & Tally', type: 'Non-IT', category: 'Accounting', duration: '2 Months', fee: '₹12,000', originalFee: '₹18,000', trainer: 'Mrs. Priya', imageUrl: '', status: 'Active', badge: '', batch: 'Oct 12th, 2024', description: 'Master Tally Prime, GST, and corporate accounting.' },
         { id: 'c7', slug: 'hr-management', title: 'HR Management & Payroll', type: 'Non-IT', category: 'HR', duration: '2 Months', fee: '₹15,000', originalFee: '₹20,000', trainer: 'Ms. Swetha', imageUrl: '', status: 'Active', badge: '', batch: 'Oct 15th, 2024', description: 'Core HR operations, payroll processing, and statutory compliances.' }
       ],
       universities: [
         { id: 'u1', slug: 'toronto-college-canada', name: 'Toronto College', country: 'Canada', type: 'College', programs: ['Computer Science', 'Business Administration', 'Nursing'], scholarship: 'Up to $5,000 CAD', status: 'Active', description: 'A premier institution in Canada offering world-class facilities and high post-graduation employment rates.', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/University_of_Toronto_crest.svg/200px-University_of_Toronto_crest.svg.png' },
         { id: 'u2', slug: 'university-of-london-uk', name: 'University of London', country: 'UK', type: 'University', programs: ['Data Science', 'Finance', 'Engineering'], scholarship: 'Up to £3,000', status: 'Active', description: 'Study in the heart of the UK with access to global networking opportunities.', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/University_of_London_logo.svg/200px-University_of_London_logo.svg.png' }
       ],
       abroadApplications: []
,
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
  
  async saveSettings(data) { return await apiPost('saveSettings', data); },
  async getSettings() {
    const res = await apiGet('getSettings');
    let s = (res && res.data) ? res.data : DEMO_DATA.settings;
    
    // Dynamic metrics overriding placeholders
    if (DEMO_DATA.placements && DEMO_DATA.placements.length > 0) s.placements = DEMO_DATA.placements.length;
    if (DEMO_DATA.projects && DEMO_DATA.projects.length > 0) s.projectsCompleted = DEMO_DATA.projects.length;
    if (DEMO_DATA.courses && DEMO_DATA.courses.length > 0) s.courses = DEMO_DATA.courses.length;
    if (DEMO_DATA.employees && DEMO_DATA.employees.length > 0) s.employees = DEMO_DATA.employees.length;
    
    return s;
  },


  
  async getCompanyMetrics() {
    const res = await apiGet('getCompanyMetrics');
    if (res && res.data) {
      // Overwrite DEMO_DATA stats with real data so legacy code seamlessly picks it up
      Object.assign(DEMO_DATA.stats, res.data);
      return res.data;
    }
    return DEMO_DATA.stats;
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
    return (res?.data?.length) ? res.data : DEMO_DATA.partners;
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
    // Filter out expired jobs
    const today = new Date().toISOString().split('T')[0];
    return allJobs.filter(job => job.status === 'Active' && job.closingDate >= today);
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

  async search(query) {
    const res = await apiGet('search', { q: query });
    return res?.data || { 
       courses: [
         { id: 'c1', slug: 'full-stack-web-development', title: 'Full Stack Web Development', type: 'IT', category: 'Full Stack', duration: '6 Months', fee: '₹48,000', originalFee: '₹72,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: 'Popular', batch: 'Oct 15th, 2024', description: 'Master HTML, CSS, JavaScript, Angular/React, Python/Java, and SQL Server.' },
         { id: 'c2', slug: 'python-ai-ml', title: 'Python & AI/ML', type: 'IT', category: 'AI/ML', duration: '3 Months', fee: '₹24,000', originalFee: '₹30,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: 'Trending', batch: 'Nov 1st, 2024', description: 'Learn Python, machine learning, and AI model deployment.' },
         { id: 'c3', slug: 'advanced-java-springboot', title: 'Advanced Java SpringBoot', type: 'IT', category: 'Java', duration: '3 Months', fee: '₹24,000', originalFee: '₹30,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: 'New', batch: 'Oct 20th, 2024', description: 'Build enterprise applications using Java and SpringBoot.' },
         { id: 'c4', slug: 'advanced-net-csharp', title: 'Advanced .NET with C#', type: 'IT', category: 'Full Stack', duration: '3 Months', fee: '₹24,000', originalFee: '₹30,000', trainer: 'Mr. Marimuthu', imageUrl: '', status: 'Active', badge: '', batch: 'Nov 5th, 2024', description: 'Enterprise app development with .NET Core and C#.' },
         { id: 'c5', slug: 'cyber-security', title: 'Cyber Security & Ethical Hacking', type: 'IT', category: 'Cyber Security', duration: '4 Months', fee: '₹35,000', originalFee: '₹45,000', trainer: 'Mr. Karthik', imageUrl: '', status: 'Active', badge: 'High Demand', batch: 'Oct 10th, 2024', description: 'Learn ethical hacking, network security, and penetration testing.' },
         { id: 'c6', slug: 'accounting-tally', title: 'Professional Accounting & Tally', type: 'Non-IT', category: 'Accounting', duration: '2 Months', fee: '₹12,000', originalFee: '₹18,000', trainer: 'Mrs. Priya', imageUrl: '', status: 'Active', badge: '', batch: 'Oct 12th, 2024', description: 'Master Tally Prime, GST, and corporate accounting.' },
         { id: 'c7', slug: 'hr-management', title: 'HR Management & Payroll', type: 'Non-IT', category: 'HR', duration: '2 Months', fee: '₹15,000', originalFee: '₹20,000', trainer: 'Ms. Swetha', imageUrl: '', status: 'Active', badge: '', batch: 'Oct 15th, 2024', description: 'Core HR operations, payroll processing, and statutory compliances.' }
       ],
       universities: [
         { id: 'u1', slug: 'toronto-college-canada', name: 'Toronto College', country: 'Canada', type: 'College', programs: ['Computer Science', 'Business Administration', 'Nursing'], scholarship: 'Up to $5,000 CAD', status: 'Active', description: 'A premier institution in Canada offering world-class facilities and high post-graduation employment rates.', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/University_of_Toronto_crest.svg/200px-University_of_Toronto_crest.svg.png' },
         { id: 'u2', slug: 'university-of-london-uk', name: 'University of London', country: 'UK', type: 'University', programs: ['Data Science', 'Finance', 'Engineering'], scholarship: 'Up to £3,000', status: 'Active', description: 'Study in the heart of the UK with access to global networking opportunities.', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/University_of_London_logo.svg/200px-University_of_London_logo.svg.png' }
       ],
       abroadApplications: []
, jobs: [], blogs: [] };
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
    const res = await apiPost('adminCreate', { resource, data, token });
    if (res?.success) localStorage.setItem('asg_admin_refresh', Date.now());
    return res;
  },

  async adminUpdate(resource, id, data) {
    const token = sessionStorage.getItem('admin_token');
    const res = await apiPost('adminUpdate', { resource, id, data, token });
    if (res?.success) localStorage.setItem('asg_admin_refresh', Date.now());
    return res;
  },

  async adminDelete(resource, id) {
    const token = sessionStorage.getItem('admin_token');
    const res = await apiPost('adminDelete', { resource, id, token });
    if (res?.success) localStorage.setItem('asg_admin_refresh', Date.now());
    return res;
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
