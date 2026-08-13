const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.html') && f !== 'login.html' && f !== 'company-profile-gen.html');

const standardSidebar = `<nav class="sidebar-nav">
    <div class="sidebar-section-title">Main</div>
    <a href="dashboard.html" class="sidebar-link" data-page="dashboard"><div class="sidebar-icon"><i class="fas fa-chart-pie"></i></div><span>Dashboard</span></a>
    <a href="reports.html" class="sidebar-link" data-page="reports"><div class="sidebar-icon"><i class="fas fa-file-pdf"></i></div><span>Report Center</span></a>
    <div class="sidebar-section-title">Content</div>
    <a href="services.html" class="sidebar-link" data-page="services"><div class="sidebar-icon"><i class="fas fa-cog"></i></div><span>Services</span></a>
    <a href="courses.html" class="sidebar-link" data-page="courses"><div class="sidebar-icon"><i class="fas fa-graduation-cap"></i></div><span>Courses</span></a>
    <a href="abroad.html" class="sidebar-link" data-page="abroad"><div class="sidebar-icon"><i class="fas fa-plane-departure"></i></div><span>Study Abroad</span></a>
    <a href="partners.html" class="sidebar-link" data-page="partners"><div class="sidebar-icon"><i class="fas fa-handshake"></i></div><span>Partners</span></a>
    <a href="jobs.html" class="sidebar-link" data-page="jobs"><div class="sidebar-icon"><i class="fas fa-briefcase"></i></div><span>Job Openings</span></a>
    <a href="employees.html" class="sidebar-link" data-page="employees"><div class="sidebar-icon"><i class="fas fa-users"></i></div><span>Team / Employees</span></a>
    <a href="projects.html" class="sidebar-link" data-page="projects"><div class="sidebar-icon"><i class="fas fa-laptop-code"></i></div><span>Projects</span></a>
    <a href="placements.html" class="sidebar-link" data-page="placements"><div class="sidebar-icon"><i class="fas fa-trophy"></i></div><span>Placements</span></a>
    <a href="testimonials.html" class="sidebar-link" data-page="testimonials"><div class="sidebar-icon"><i class="fas fa-star"></i></div><span>Testimonials</span></a>
    <a href="blog.html" class="sidebar-link" data-page="blog"><div class="sidebar-icon"><i class="fas fa-blog"></i></div><span>Blog Posts</span></a>
    <div class="sidebar-section-title">Submissions</div>
    <a href="crm.html" class="sidebar-link" data-page="crm"><div class="sidebar-icon"><i class="fas fa-users-cog"></i></div><span>CRM / Leads</span></a>
    <a href="resumes.html" class="sidebar-link" data-page="resumes"><div class="sidebar-icon"><i class="fas fa-file-pdf"></i></div><span>Resumes</span></a>
    <a href="contacts.html" class="sidebar-link" data-page="contacts"><div class="sidebar-icon"><i class="fas fa-envelope"></i></div><span>Contact Forms</span></a>
    <a href="chatbot.html" class="sidebar-link" data-page="chatbot"><div class="sidebar-icon"><i class="fas fa-robot"></i></div><span>Chatbot KB</span></a>
    <div class="sidebar-section-title">Settings</div>
    <a href="settings.html" class="sidebar-link" data-page="settings"><div class="sidebar-icon"><i class="fas fa-cog"></i></div><span>Settings</span></a>
  </nav>`;

files.forEach(file => {
  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace anything between <nav class="sidebar-nav"> and </nav>
  const regex = /<nav class="sidebar-nav">[\s\S]*?<\/nav>/;
  
  if (regex.test(content)) {
    // Generate active class logic based on filename
    const pageName = file.replace('.html', '');
    let fileSidebar = standardSidebar.replace(
      new RegExp(`data-page="${pageName}"`), 
      `data-page="${pageName}" class="sidebar-link active"`
    );
    // Remove remaining data-page attributes
    fileSidebar = fileSidebar.replace(/ data-page="[^"]+"/g, '');
    
    // Add active class if it was missing the data-page attribute for some reason
    if (!fileSidebar.includes('class="sidebar-link active"')) {
       fileSidebar = fileSidebar.replace(`href="${file}" class="sidebar-link"`, `href="${file}" class="sidebar-link active"`);
    }

    content = content.replace(regex, fileSidebar);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated sidebar in ${file}`);
  }
});
