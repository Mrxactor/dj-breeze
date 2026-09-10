(async()=>{
  let cfg;
  try{
    const r=await fetch('content/backend.json',{cache:'no-store'});
    if(!r.ok)return;
    cfg=await r.json();
  }catch(_){return;}
  if(!cfg||!cfg.enabled||!cfg.url||!cfg.anonKey)return;
  const base=cfg.url.replace(/\/$/,'');
  const headers={apikey:cfg.anonKey,Authorization:'Bearer '+cfg.anonKey};
  async function get(path){
    const r=await fetch(base+path,{headers,cache:'no-store'});
    if(!r.ok)throw new Error('CMS read failed '+r.status);
    return r.json();
  }
  try{
    const [settings,contacts,gigs]=await Promise.all([
      get('/rest/v1/site_settings?id=eq.1&select=*'),
      get('/rest/v1/contact_settings?select=*'),
      get('/rest/v1/gigs?select=*&status=eq.published&order=event_date.asc')
    ]);
    const s=settings&&settings[0];
    if(s){
      if(s.page_title)document.title=s.page_title;
      const brand=document.querySelector('.brand');
      if(brand&&s.artist_name){const small=brand.querySelector('small');brand.childNodes[0].nodeValue=s.artist_name+' ';if(small)brand.appendChild(small)}
      const heroKicker=document.querySelector('.hero .kicker');
      if(heroKicker&&s.hero_kicker)heroKicker.textContent=s.hero_kicker;
      const heroCopy=document.querySelector('.hero-sub p');
      if(heroCopy&&s.hero_copy)heroCopy.textContent=s.hero_copy;
      const hero=document.getElementById('heroVideo');
      if(hero){
        if(s.hero_poster_url)hero.poster=s.hero_poster_url;
        const src=hero.querySelector('source');
        if(src&&s.hero_video_url&&src.getAttribute('src')!==s.hero_video_url){src.src=s.hero_video_url;hero.load();hero.play().catch(()=>{})}
        hero.loop=s.hero_loop!==false;
        hero.muted=s.hero_muted!==false;
      }
      const audio=document.getElementById('siteSoundtrack');
      if(audio){
        const src=audio.querySelector('source');
        if(src&&s.site_sound_url&&src.getAttribute('src')!==s.site_sound_url){src.src=s.site_sound_url;audio.load()}
        if(typeof s.site_sound_volume==='number')audio.volume=Math.max(0,Math.min(1,s.site_sound_volume));
        audio.loop=s.site_sound_loop!==false;
        if(s.site_sound_enabled===false){audio.pause();if(typeof siteSoundWanted!=='undefined')siteSoundWanted=false}
      }
      if(s.instagram_url){document.querySelectorAll('a[href*="instagram.com"]').forEach(a=>a.href=s.instagram_url)}
    }
    if(typeof contactConfig!=='undefined'&&Array.isArray(contacts)){
      const next={};contacts.forEach(c=>next[c.key]={label:c.label,email:c.email,phone:c.phone});contactConfig=next;
    }
    renderGigs(gigs||[]);
  }catch(err){console.warn('DJ Breeze CMS runtime:',err)}

  function renderGigs(rows){
    const old=document.getElementById('cms-gigs');if(old)old.remove();
    if(!rows.length)return;
    const events=document.getElementById('events');if(!events)return;
    const sec=document.createElement('section');sec.id='cms-gigs';sec.className='section';
    sec.innerHTML=`<div class="wrap"><div class="section-head reveal in"><div><div class="kicker" style="margin-bottom:16px">Upcoming / Gigs</div><h2>NEXT<br>ROOMS.</h2></div><p>Upcoming DJ Breeze dates, updated directly from the admin dashboard.</p></div><div class="cms-gig-grid"></div></div>`;
    const style=document.createElement('style');style.textContent='.cms-gig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cms-gig{border:1px solid rgba(255,255,255,.14);background:#101010;padding:22px;min-height:210px;display:flex;flex-direction:column}.cms-gig .date{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#aaa}.cms-gig h3{font-size:32px;letter-spacing:-.04em;margin:20px 0 8px}.cms-gig p{color:#999;margin:0 0 22px}.cms-gig .ticket{margin-top:auto;font-size:10px;letter-spacing:.12em;text-transform:uppercase}@media(max-width:820px){.cms-gig-grid{grid-template-columns:1fr}}';document.head.appendChild(style);
    const grid=sec.querySelector('.cms-gig-grid');
    grid.innerHTML=rows.map(g=>`<article class="cms-gig"><div class="date">${esc(g.event_date)}${g.start_time?' · '+esc(String(g.start_time).slice(0,5)):''}</div><h3>${esc(g.title)}</h3><p>${esc(g.venue)}${g.city?' · '+esc(g.city):''}</p>${g.ticket_url?`<a class="ticket" href="${esc(g.ticket_url)}" target="_blank" rel="noopener">Tickets / Info ↗</a>`:'<span class="ticket">Info soon</span>'}</article>`).join('');
    events.parentNode.insertBefore(sec,events);
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
})();