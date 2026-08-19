
const COLORS=['#0096D6','#0D1B4C','#6CCB2F','#f59e0b','#8b5cf6','#ef4444'];
const ICONS={'Web Development':'🌐','Enterprise Software':'🏢','Mobile App':'📱','AI/ML':'🤖','EdTech':'🎓','Real Estate':'🏠'};
let allProjects=[];

function renderProjects(projects){
    const g=document.getElementById('all-projects-grid');if(!g)return;
    g.innerHTML=projects.map((p,i)=>{
      const tStack = p.techStack || p.screenshots || p.technology || '';
      const imgUrl = p.screenshotUrl || p.imageUrl || p.results || '';
      return `
      <div class="project-card" data-animate data-delay="${(i%3+1)*80}" data-category="${p.category}">
        <div class="project-img" style="${imgUrl ? `background:url('${imgUrl}') center/cover;` : `background:linear-gradient(135deg,${COLORS[i%COLORS.length]}cc,${COLORS[(i+2)%COLORS.length]}cc)`}">
          ${imgUrl ? '' : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:5rem">${ICONS[p.category]||'🌐'}</div>`}
          <div class="project-overlay"><button class="btn btn-primary btn-sm" onclick="viewProject('${p.id}')">View Details</button></div>
        </div>
        <div class="project-body">
          <div class="project-category">${p.category}</div>
          <h3>${p.title}</h3>
          <p style="font-size:0.85rem;color:var(--gray-500);margin-bottom:12px">${(p.description||'').substring(0,90)}...</p>
          <div class="project-tech">${(Array.isArray(tStack)?tStack:String(tStack).split(',')).slice(0,4).map(t=>`<span class="tech-tag">${t.trim()}</span>`).join('')}</div>
        </div>
      </div>`}).join('');
    document.querySelectorAll('[data-animate]').forEach(el=>{const obs=new IntersectionObserver(e=>{e.forEach(e=>e.isIntersecting&&(e.target.classList.add('animated'),obs.unobserve(e.target)))} ,{threshold:0.1});obs.observe(el);});
  }
  
  window.viewProject=function(id){
  const p=allProjects.find(x=>x.id===id);if(!p)return;
  document.getElementById('proj-modal-title').textContent=p.title;
  document.getElementById('proj-modal-desc').textContent=p.description||'';
  document.getElementById('proj-modal-client').textContent=p.clientName||'Confidential';
  const i=allProjects.indexOf(p);
  const imgEl = document.getElementById('proj-modal-img');
  if (p.imageUrl) {
    imgEl.style.background = `url('${p.imageUrl}') center/cover`;
    imgEl.innerHTML = '';
  } else {
    imgEl.style.background=`linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[(i+2)%COLORS.length]})`;
    imgEl.innerHTML=`<div style="font-size:5rem">${ICONS[p.category]||'🌐'}</div>`;
  }
  document.getElementById('proj-modal-tech').innerHTML=(p.techStack||'').split(',').map(t=>`<span class="tech-tag">${t.trim()}</span>`).join('');
  const link=document.getElementById('proj-modal-link');
  link.href=p.liveUrl||'#';link.style.display=p.liveUrl&&p.liveUrl!=='#'?'':'none';
  openModal('project-modal');
};

document.getElementById('project-filters')?.addEventListener('filterChange',e=>{
  const val=e.detail.value;
  document.querySelectorAll('.project-card').forEach(card=>{
    card.style.display=(val==='All'||card.dataset.category===val)?'':'none';
  });
});

API.getProjects().then(p=>{allProjects=p;renderProjects(p);});
