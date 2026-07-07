(() => {
  const STORAGE_KEY = "fisUserSession";
  const STYLE_ID = "fis-auth-style";
  const LOGIN_ID = "fisAuthOverlay";
  const ADMIN_ID = "fisAdminPanel";
  const state = { user: null, token: "" };
  const css = `
    .fis-welcome-splash{position:fixed;inset:0;z-index:1000000;background:linear-gradient(135deg,rgba(0,54,65,.97),rgba(0,126,128,.9));display:flex;align-items:center;justify-content:center;font-family:Inter,Segoe UI,Arial,sans-serif;color:white;transition:opacity .35s ease,transform .35s ease}.fis-welcome-splash.done{opacity:0;transform:scale(1.02)}.fis-welcome-card{text-align:center;padding:34px 42px;border:1px solid rgba(151,237,235,.42);border-radius:28px;background:rgba(255,255,255,.10);box-shadow:0 30px 90px rgba(0,0,0,.34);backdrop-filter:blur(14px)}.fis-welcome-card h2{margin:10px 0 6px;font-size:34px;color:white}.fis-welcome-card p{margin:0;color:#dff9fa}.fis-welcome-orbit{position:relative;width:74px;height:74px;margin:0 auto 12px;border-radius:50%;border:1px solid rgba(255,255,255,.22)}.fis-welcome-orbit span{position:absolute;width:12px;height:12px;border-radius:50%;background:#18d4cf;box-shadow:0 0 22px rgba(24,212,207,.75);animation:fisOrbit 1.15s ease-in-out infinite}.fis-welcome-orbit span:nth-child(1){left:31px;top:-6px}.fis-welcome-orbit span:nth-child(2){right:0;bottom:10px;animation-delay:.12s}.fis-welcome-orbit span:nth-child(3){left:0;bottom:10px;animation-delay:.24s}@keyframes fisOrbit{0%,100%{transform:scale(.82);opacity:.65}50%{transform:scale(1.35);opacity:1}}.fis-auth-overlay{position:fixed;inset:0;z-index:999999;background:linear-gradient(135deg,rgba(0,54,65,.96),rgba(0,93,94,.9));display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#06253f}
    .fis-auth-card{width:min(440px,92vw);background:rgba(255,255,255,.96);border:1px solid rgba(102,201,207,.55);border-radius:22px;box-shadow:0 30px 90px rgba(0,0,0,.35);padding:30px}.fis-auth-kicker{color:#009b9f;letter-spacing:.16em;text-transform:uppercase;font-size:12px;margin-bottom:8px}.fis-auth-card h2{margin:0 0 8px;font-size:30px;color:#06253f;font-weight:700}.fis-auth-card p{margin:0 0 20px;color:#47647d;line-height:1.45}
    .fis-auth-field{display:flex;flex-direction:column;gap:7px;margin:13px 0}.fis-auth-field label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#55708a}.fis-auth-field input,.fis-auth-field select{border:1px solid #c9ddeb;border-radius:12px;padding:12px 14px;font-size:15px;outline:none}.fis-auth-field input:focus{border-color:#00a5a9;box-shadow:0 0 0 3px rgba(0,165,169,.14)}
    .fis-auth-btn{border:0;border-radius:999px;background:linear-gradient(135deg,#05bfc0,#07848d);color:white;padding:12px 18px;font-weight:700;cursor:pointer;box-shadow:0 14px 32px rgba(0,153,153,.28)}.fis-auth-btn.secondary{background:white;color:#004461;border:1px solid #c9ddeb;box-shadow:none}.fis-auth-row{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:18px}.fis-auth-error{min-height:20px;color:#bd2f3d;font-size:13px;margin-top:10px}
    .fis-user-chip{position:fixed;right:18px;bottom:18px;z-index:99990;display:flex;gap:8px;align-items:center;background:rgba(0,61,74,.92);color:white;border:1px solid rgba(0,220,218,.35);border-radius:999px;padding:8px 10px;box-shadow:0 18px 45px rgba(0,0,0,.22);font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px}.fis-user-chip button{border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:white;border-radius:999px;padding:6px 9px;cursor:pointer;font-size:12px}.fis-user-chip .fis-admin{background:#00a5a9;color:#fff;border-color:#00d6d4}
    .fis-admin-shell{position:fixed;inset:0;z-index:999998;background:rgba(4,29,40,.55);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:22px;font-family:Inter,Segoe UI,Arial,sans-serif}.fis-admin-card{width:min(1080px,96vw);max-height:88vh;overflow:auto;background:#fff;border:1px solid #bde8eb;border-radius:20px;box-shadow:0 28px 80px rgba(0,0,0,.28);padding:22px;color:#07324a}.fis-admin-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;border-bottom:1px solid #dcebf2;padding-bottom:14px;margin-bottom:14px}.fis-admin-head h2{margin:0;font-size:26px}.fis-admin-grid{display:grid;grid-template-columns:360px 1fr;gap:18px}.fis-admin-panel{border:1px solid #d6e8f0;border-radius:16px;padding:16px;background:linear-gradient(135deg,#fff,#f3fbfb)}.fis-admin-panel h3{margin:0 0 12px}.fis-admin-table{width:100%;border-collapse:collapse;font-size:13px}.fis-admin-table th,.fis-admin-table td{padding:9px;border-bottom:1px solid #e4eef4;text-align:left;vertical-align:top}.fis-admin-table th{background:#eef7f8;color:#0b3550}.fis-admin-actions{display:flex;gap:8px;flex-wrap:wrap}.fis-admin-actions button,.fis-small-btn{border:1px solid #bddae7;border-radius:999px;background:white;color:#004461;padding:7px 10px;cursor:pointer}.fis-log-box{max-height:430px;overflow:auto;border:1px solid #d6e8f0;border-radius:12px;background:#fbfdff}.fis-muted{color:#617b91;font-size:12px}.fis-pill{display:inline-flex;border-radius:999px;background:#eaf8f8;color:#006f76;padding:4px 8px;font-size:11px;font-weight:700}.fis-close{border:1px solid #bde8eb;background:white;border-radius:999px;width:38px;height:38px;cursor:pointer;font-size:20px;color:#004461}@media(max-width:850px){.fis-admin-grid{grid-template-columns:1fr}.fis-user-chip{position:fixed;right:18px;bottom:18px;z-index:99990;display:flex;gap:8px;align-items:center;background:rgba(0,61,74,.92);color:white;border:1px solid rgba(0,220,218,.35);border-radius:999px;padding:8px 10px;box-shadow:0 18px 45px rgba(0,0,0,.22);font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px}}
  `;
  function addStyle(){ if(!document.getElementById(STYLE_ID)){ const style=document.createElement('style'); style.id=STYLE_ID; style.textContent=css; document.head.appendChild(style); } }
  function getSession(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch{return {};} }
  function saveSession(payload){ state.user=payload.user; state.token=payload.token; localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); }
  function clearSession(){ state.user=null; state.token=''; localStorage.removeItem(STORAGE_KEY); }
  async function api(path, options={}){ const headers=new Headers(options.headers||{}); if(!(options.body instanceof FormData)) headers.set('Content-Type','application/json'); if(state.token) headers.set('X-Session-Token', state.token); const res=await fetch(path,{...options,headers}); const data=await res.json().catch(()=>({ok:false,error:'Invalid server response'})); if(!res.ok && !data.error) data.error=`Request failed ${res.status}`; return data; }
  function logEvent(event, action, details={}){ if(!state.token) return; api('/api/audit/event',{method:'POST',body:JSON.stringify({event,action,details})}).catch(()=>{}); }
  function escapeHtml(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function escapeAttr(v){return escapeHtml(v).replace(/'/g,'&#39;');}
  function val(id){return document.getElementById(id)?.value?.trim()||'';}
  function loginOverlay(message=''){ addStyle(); if(document.getElementById(LOGIN_ID)) return; const overlay=document.createElement('div'); overlay.id=LOGIN_ID; overlay.className='fis-auth-overlay'; overlay.innerHTML=`<form class="fis-auth-card" id="fisLoginForm"><div class="fis-auth-kicker">Secure Suite Access</div><h2>Sign in</h2><p>Use your Krestrel Analysis Suite user ID. User actions are logged for UAT and production audit review.</p><div class="fis-auth-field"><label>User name</label><input id="fisLoginUser" autocomplete="username" value="admin"></div><div class="fis-auth-field"><label>Password</label><input id="fisLoginPass" type="password" autocomplete="current-password" placeholder="Password"></div><div class="fis-auth-error" id="fisLoginError">${message||''}</div><div class="fis-auth-row"><button class="fis-auth-btn" type="submit">Sign in</button></div></form>`; document.body.appendChild(overlay); document.getElementById('fisLoginPass')?.focus(); document.getElementById('fisLoginForm').addEventListener('submit', async event=>{ event.preventDefault(); const username=val('fisLoginUser'); const password=document.getElementById('fisLoginPass').value; const error=document.getElementById('fisLoginError'); error.textContent='Signing in...'; const data=await api('/api/auth/login',{method:'POST',body:JSON.stringify({username,password})}); if(!data.ok){ error.textContent=data.error||'Login failed.'; return; } saveSession({token:data.token,user:data.user}); overlay.remove(); renderChip(); logEvent('PAGE_OPEN','User opened page',{title:document.title,path:location.pathname}); showWelcome(routeToSuiteStart); }); }
  function showWelcome(callback){
    addStyle();
    if(!document.getElementById('fisMatrixTransitionStyle')){
      const style=document.createElement('style');
      style.id='fisMatrixTransitionStyle';
      style.textContent=`
        .fis-matrix-gate{position:fixed;inset:0;z-index:1000000;overflow:hidden;display:grid;place-items:center;background:radial-gradient(circle at 26% 24%,rgba(24,212,207,.20),transparent 28%),linear-gradient(135deg,#002d39,#004a55 52%,#002934);font-family:Inter,Segoe UI,Arial,sans-serif;color:white;transition:opacity .45s ease,transform .45s ease}
        .fis-matrix-gate.done{opacity:0;transform:scale(1.02);pointer-events:none}
        .fis-matrix-gate::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(24,212,207,.06) 1px,transparent 1px),linear-gradient(rgba(24,212,207,.045) 1px,transparent 1px);background-size:58px 58px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.70),transparent 86%)}
        .fis-matrix-stream{position:absolute;top:-20vh;width:80px;height:140vh;color:rgba(160,255,252,.46);font-family:Consolas,"Courier New",monospace;font-size:13px;line-height:1.75;text-align:center;white-space:pre;animation:fisMatrixFall linear infinite;text-shadow:0 0 14px rgba(24,212,207,.28)}
        .fis-matrix-stream.gold{color:rgba(255,196,0,.30)}
        .fis-matrix-card{position:relative;z-index:2;width:min(720px,90vw);padding:34px 38px;border:1px solid rgba(204,255,255,.38);border-radius:30px;background:rgba(255,255,255,.085);box-shadow:0 34px 95px rgba(0,0,0,.34);backdrop-filter:blur(18px);text-align:center}
        .fis-matrix-kicker{color:#18d4cf;letter-spacing:.22em;text-transform:uppercase;font-size:12px;font-weight:800}
        .fis-matrix-title{margin:12px 0 8px;font-size:30px;font-weight:350;color:white}
        .fis-matrix-sub{margin:0;color:#dff9fa;font-size:15px}
        .fis-count-ring{position:relative;width:150px;height:150px;margin:28px auto 22px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(from 0deg,#18d4cf,#ffc400,#18d4cf);box-shadow:0 0 42px rgba(24,212,207,.26);animation:fisRingSpin 1.2s linear infinite}
        .fis-count-ring::before{content:"";position:absolute;inset:10px;border-radius:50%;background:linear-gradient(135deg,rgba(0,55,66,.96),rgba(0,79,86,.90));box-shadow:inset 0 0 24px rgba(255,255,255,.08)}
        .fis-count-number{position:relative;z-index:1;font-size:70px;font-weight:300;line-height:1;color:white;text-shadow:0 0 24px rgba(24,212,207,.45);animation:fisCountPop .9s ease both}
        .fis-matrix-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}
        .fis-matrix-tool{border:1px solid rgba(204,255,255,.24);border-radius:18px;padding:13px 10px;background:rgba(255,255,255,.07);color:#ecffff;font-weight:700;font-size:14px;animation:fisToolLift 1.5s ease-in-out infinite}
        .fis-matrix-tool:nth-child(2){animation-delay:.18s}.fis-matrix-tool:nth-child(3){animation-delay:.36s}
        @keyframes fisMatrixFall{from{transform:translateY(-22vh);opacity:0}12%{opacity:1}88%{opacity:.75}to{transform:translateY(112vh);opacity:0}}
        @keyframes fisRingSpin{to{transform:rotate(360deg)}}
        @keyframes fisCountPop{from{transform:scale(.76);opacity:.2}55%{transform:scale(1.08);opacity:1}to{transform:scale(1);opacity:1}}
        @keyframes fisToolLift{0%,100%{transform:translateY(0);border-color:rgba(204,255,255,.24)}50%{transform:translateY(-4px);border-color:rgba(255,196,0,.60)}}
      `;
      document.head.appendChild(style);
    }
    const gate=document.createElement('div');
    gate.className='fis-matrix-gate';
    const values=['83','91','42','7.8','12','64','NPS','CSAT','0.86','+3','-1','98','AI','CX'];
    const streams=[];
    for(let i=0;i<24;i+=1){
      const stream=document.createElement('div');
      stream.className='fis-matrix-stream'+(i%5===0?' gold':'');
      stream.style.left=`${(i*4.35)%100}%`;
      stream.style.animationDuration=`${7+(i%8)}s`;
      stream.style.animationDelay=`${-(i*.48)}s`;
      stream.textContent=Array.from({length:36},(_,j)=>values[(i*3+j*5)%values.length]).join('\n');
      streams.push(stream);
      gate.appendChild(stream);
    }
    gate.insertAdjacentHTML('beforeend',`<div class="fis-matrix-card"><div class="fis-matrix-kicker">Login successful</div><h2 class="fis-matrix-title">Preparing CX Intelligence Suite</h2><p class="fis-matrix-sub">Loading your secure local analytics workspace.</p><div class="fis-count-ring"><span class="fis-count-number" id="fisMatrixCount">3</span></div><div class="fis-matrix-tools"><div class="fis-matrix-tool">NPS Analyzer</div><div class="fis-matrix-tool">CSAT Analyzer</div><div class="fis-matrix-tool">Sentiment Analyzer</div></div></div>`);
    document.body.appendChild(gate);
    const countEl=gate.querySelector('#fisMatrixCount');
    let count=3;
    const timer=setInterval(()=>{
      count-=1;
      if(countEl && count>0){
        countEl.textContent=String(count);
        countEl.style.animation='none';
        countEl.offsetHeight;
        countEl.style.animation='fisCountPop .9s ease both';
      }
      if(count<=0){
        clearInterval(timer);
        if(countEl) countEl.textContent='Go';
        setTimeout(()=>gate.classList.add('done'),360);
        setTimeout(()=>{ gate.remove(); if(typeof callback==='function') callback(); },850);
      }
    },1000);
  }
  function routeToSuiteStart(){
    const isAppPage = /\/apps\//i.test(location.pathname);
    const isHome = location.pathname === '/' || (/\/index\.html$/i.test(location.pathname) && !isAppPage);
    if(isAppPage) return;
    if(isHome) location.href='/index.html';
  }
  function renderChip(){ document.querySelector('.fis-user-chip')?.remove(); if(!state.user) return; const chip=document.createElement('div'); chip.className='fis-user-chip'; chip.innerHTML=`<span>${escapeHtml(state.user.displayName||state.user.username)}</span><span class="fis-pill">${escapeHtml(state.user.role)}</span>${state.user.role==='admin'?'<button class="fis-admin">Admin Logs</button>':''}<button class="fis-logout">Logout</button>`; document.body.appendChild(chip); chip.querySelector('.fis-logout')?.addEventListener('click',async()=>{await api('/api/auth/logout',{method:'POST',body:'{}'}).catch(()=>{}); clearSession(); location.reload();}); chip.querySelector('.fis-admin')?.addEventListener('click',openAdminPanel); }
  async function openAdminPanel(){ addStyle(); document.getElementById(ADMIN_ID)?.remove(); const shell=document.createElement('div'); shell.id=ADMIN_ID; shell.className='fis-admin-shell'; shell.innerHTML=`<div class="fis-admin-card"><div class="fis-admin-head"><div><div class="fis-auth-kicker">Admin Control</div><h2>User management and audit logs</h2><div class="fis-muted">Users are stored in security/users.json. Audit logs are written in real time under logs/audit.</div></div><button class="fis-close">Ã—</button></div><div class="fis-admin-grid"><div class="fis-admin-panel"><h3>Create / update user</h3><div class="fis-auth-field"><label>User name</label><input id="fisNewUser"></div><div class="fis-auth-field"><label>Display name</label><input id="fisNewDisplay"></div><div class="fis-auth-field"><label>Role</label><select id="fisNewRole"><option value="user">User</option><option value="admin">Admin</option></select></div><div class="fis-auth-field"><label>Password / reset password</label><input id="fisNewPassword" type="password"></div><div class="fis-auth-row"><button class="fis-auth-btn" id="fisCreateUser">Create User</button><button class="fis-auth-btn secondary" id="fisResetPassword">Reset Password</button></div><div class="fis-auth-error" id="fisAdminMessage"></div></div><div class="fis-admin-panel"><h3>Existing users</h3><div id="fisUsersTable" class="fis-muted">Loading...</div></div></div><div class="fis-admin-panel" style="margin-top:18px"><div class="fis-auth-row"><h3 style="margin:0">Latest audit log</h3><button class="fis-small-btn" id="fisRefreshLogs">Refresh logs</button></div><div class="fis-log-box" id="fisAuditLog">Loading...</div></div></div>`; document.body.appendChild(shell); shell.querySelector('.fis-close')?.addEventListener('click',()=>shell.remove()); shell.addEventListener('click',e=>{if(e.target===shell) shell.remove();}); shell.querySelector('#fisCreateUser')?.addEventListener('click',()=>saveUser('create')); shell.querySelector('#fisResetPassword')?.addEventListener('click',()=>saveUser('reset')); shell.querySelector('#fisRefreshLogs')?.addEventListener('click',loadLogs); await loadUsers(); await loadLogs(); }
  async function loadUsers(){ const box=document.getElementById('fisUsersTable'); if(!box) return; const data=await api('/api/auth/users'); if(!data.ok){ box.textContent=data.error||'Unable to load users.'; return; } box.innerHTML=`<table class="fis-admin-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Last login</th><th>Action</th></tr></thead><tbody>${data.users.map(u=>`<tr><td><strong>${escapeHtml(u.username)}</strong><br><span class="fis-muted">${escapeHtml(u.displayName||'')}</span></td><td>${escapeHtml(u.role)}</td><td>${u.active?'Active':'Inactive'}</td><td>${escapeHtml(u.lastLoginAt||'-')}</td><td><div class="fis-admin-actions"><button data-user="${escapeAttr(u.username)}" data-action="toggle">${u.active?'Disable':'Enable'}</button><button data-user="${escapeAttr(u.username)}" data-action="delete">Delete</button></div></td></tr>`).join('')}</tbody></table>`; box.querySelectorAll('button[data-action="toggle"]').forEach(btn=>btn.addEventListener('click',()=>toggleUser(btn.dataset.user))); box.querySelectorAll('button[data-action="delete"]').forEach(btn=>btn.addEventListener('click',()=>deleteUser(btn.dataset.user))); }
  async function loadLogs(){ const box=document.getElementById('fisAuditLog'); if(!box) return; const data=await api('/api/audit/logs?limit=300'); if(!data.ok){ box.textContent=data.error||'Unable to load logs.'; return; } box.innerHTML=`<table class="fis-admin-table"><thead><tr><th>Time</th><th>User</th><th>Event</th><th>Action</th></tr></thead><tbody>${data.entries.map(r=>`<tr><td>${escapeHtml(r.timestamp||'')}</td><td>${escapeHtml(r.user||'')}</td><td><span class="fis-pill">${escapeHtml(r.event||'')}</span></td><td>${escapeHtml(r.action||'')}</td></tr>`).join('')}</tbody></table>`; }
  async function saveUser(action){ const msg=document.getElementById('fisAdminMessage'); const payload={action,username:val('fisNewUser'),displayName:val('fisNewDisplay'),role:val('fisNewRole'),password:val('fisNewPassword')}; const data=await api('/api/auth/users',{method:'POST',body:JSON.stringify(payload)}); msg.textContent=data.ok?'Saved.':(data.error||'Unable to save user.'); if(data.ok){await loadUsers(); await loadLogs();} }
  async function toggleUser(username){ const data=await api('/api/auth/users'); const user=(data.users||[]).find(u=>u.username===username); if(!user) return; await api('/api/auth/users',{method:'POST',body:JSON.stringify({action:'update',username,active:!user.active})}); await loadUsers(); await loadLogs(); }
  async function deleteUser(username){ if(!confirm(`Delete user ${username}?`)) return; await api('/api/auth/users',{method:'POST',body:JSON.stringify({action:'delete',username})}); await loadUsers(); await loadLogs(); }
  function attachActivityLogging(){ document.addEventListener('click',event=>{ const target=event.target.closest('button,a,[role="button"],.nav-item,.suite-tool,.tab-button'); if(!target||target.closest('.fis-auth-overlay')||target.closest('.fis-admin-shell')||target.closest('.fis-user-chip')) return; const label=(target.innerText||target.getAttribute('aria-label')||target.id||target.className||'Click').toString().trim().slice(0,120); if(/upload|analy|export|download|save|refresh|dashboard|lens|statistics|column|theme|sentiment|nav/i.test(label)) logEvent('UI_CLICK',label,{path:location.pathname}); },true); }
  async function init(){ addStyle(); const existing=getSession(); state.token=existing.token||''; state.user=existing.user||null; if(state.token){ const data=await api('/api/auth/status'); if(data.ok&&data.authenticated){state.user=data.user; renderChip(); attachActivityLogging(); logEvent('PAGE_OPEN','User opened page',{title:document.title,path:location.pathname}); return;} clearSession(); } loginOverlay(); attachActivityLogging(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();






