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
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const safeUrl=v=>{
    const s=String(v||'').trim();
    if(!s)return '';
    if(/^https?:\/\//i.test(s)||/^\/?assets\//i.test(s)||/^\.\.?\//.test(s))return s;
    return '';
  };
  const lines=v=>esc(v).replace(/\n/g,'<br>');
  async function get(path){
    const r=await fetch(base+path,{headers,cache:'no-store'});
    if(!r.ok)throw new Error('CMS read failed '+r.status);
    return r.json();
  }

  try{
    const [settings,contacts,gigs,media,blocks]=await Promise.all([
      get('/rest/v1/site_settings?id=eq.1&select=*'),
      get('/rest/v1/contact_settings?select=*'),
      get('/rest/v1/gigs?select=*&status=eq.published&order=event_date.asc'),
      get('/rest/v1/media_items?select=*&is_published=eq.true&order=sort_order.asc,created_at.asc'),
      get('/rest/v1/content_blocks?select=*')
    ]);

    const blockMap={};(blocks||[]).forEach(b=>blockMap[b.key]=b.data||{});
    applySettings(settings&&settings[0]);
    applyContent(blockMap);
    applyContacts(contacts||[]);
    renderSoundMedia(media||[]);
    renderLiveMedia(media||[]);
    renderArchiveMedia(media||[]);
    renderVideoLibrary(media||[]);
    renderGigs(gigs||[]);
    setupAvailabilityCheck();
  }catch(err){console.warn('DJ Breeze CMS runtime:',err)}

  function applySettings(s){
    if(!s)return;
    if(s.page_title)document.title=s.page_title;
    const brand=document.querySelector('.brand');
    if(brand&&s.artist_name){
      const small=brand.querySelector('small');
      brand.childNodes[0].nodeValue=s.artist_name+' ';
      if(small)brand.appendChild(small);
    }
    const heroKicker=document.querySelector('.hero .kicker');
    if(heroKicker&&s.hero_kicker)heroKicker.textContent=s.hero_kicker;
    const heroCopy=document.querySelector('.hero-sub p');
    if(heroCopy&&s.hero_copy)heroCopy.textContent=s.hero_copy;
    const hero=document.getElementById('heroVideo');
    if(hero){
      const poster=safeUrl(s.hero_poster_url);if(poster)hero.poster=poster;
      const src=hero.querySelector('source'),video=safeUrl(s.hero_video_url);
      if(src&&video&&src.getAttribute('src')!==video){src.src=video;hero.load();hero.play().catch(()=>{})}
      hero.loop=s.hero_loop!==false;hero.muted=s.hero_muted!==false;
    }
    const audio=document.getElementById('siteSoundtrack');
    if(audio){
      const src=audio.querySelector('source'),sound=safeUrl(s.site_sound_url);
      if(src&&sound&&src.getAttribute('src')!==sound){src.src=sound;audio.load()}
      const vol=Number(s.site_sound_volume);if(!Number.isNaN(vol))audio.volume=Math.max(0,Math.min(1,vol));
      audio.loop=s.site_sound_loop!==false;
      if(s.site_sound_enabled===false){audio.pause();try{siteSoundWanted=false}catch(_){}}
    }
    if(s.instagram_url){document.querySelectorAll('a[href*="instagram.com"]').forEach(a=>a.href=s.instagram_url)}
  }

  function applyContent(b){
    const manifesto=b.manifesto||{},sound=b.sound||{},live=b.live||{},archive=b.archive||{},services=b.services||{},booking=b.booking||{},footer=b.footer||{},nav=b.navigation||{};
    setText('.manifesto .kicker',manifesto.kicker);setHtml('.manifesto h2',manifesto.heading);
    const mp=document.querySelectorAll('.manifesto-copy p');if(mp[0]&&manifesto.lead)mp[0].textContent=manifesto.lead;if(mp[1]&&manifesto.body)mp[1].textContent=manifesto.body;
    if(Array.isArray(manifesto.meta))document.querySelectorAll('.meta-box').forEach((el,i)=>{const m=manifesto.meta[i];if(!m)return;const st=el.querySelector('strong'),sp=el.querySelector('span');if(st)st.textContent=m.value||'';if(sp)sp.textContent=m.label||''});

    setText('#sound .section-head .kicker',sound.kicker);setHtml('#sound .section-head h2',sound.heading);setText('#sound .section-head > p',sound.intro);
    if(Array.isArray(sound.cards))document.querySelectorAll('#sound .era-card').forEach((el,i)=>{const c=sound.cards[i];if(!c)return;const n=el.querySelector('.era-num'),h=el.querySelector('h3'),p=el.querySelector('p');if(n)n.textContent=c.num||'';if(h)h.textContent=c.title||'';if(p)p.textContent=c.body||''});

    setText('#live .section-head .kicker',live.kicker);setHtml('#live .section-head h2',live.heading);setText('#live .section-head > p',live.intro);
    setText('.posters .section-head .kicker',archive.kicker);setHtml('.posters .section-head h2',archive.heading);setText('.posters .section-head > p',archive.intro);
    setText('#events .kicker',services.kicker);setHtml('#events h2',services.heading);
    if(Array.isArray(services.items))document.querySelectorAll('#events .service-row').forEach((el,i)=>{const x=services.items[i];if(!x)return;const strong=el.querySelector('strong'),em=el.querySelector('em');if(strong)strong.textContent=x.title||'';if(em)em.textContent=x.tag||'';if(x.type)el.dataset.bookingType=x.type});
    setText('#booking .kicker',booking.kicker);setHtml('#booking h2',booking.heading);setText('#booking .booking-inner > p',booking.intro);

    if(nav.sound)setText('.nav-links a[href="#sound"]',nav.sound);if(nav.live)setText('.nav-links a[href="#live"]',nav.live);if(nav.events)setText('.nav-links a[href="#events"]',nav.events);if(nav.booking)setText('.nav-links a[href="#booking"]',nav.booking);
    if(footer.handle){const k=document.querySelector('footer .kicker');if(k)k.textContent=footer.handle}
    const fr=document.querySelector('.footer-right');if(fr&&(footer.line1||footer.line2))fr.innerHTML='<a href="admin/" style="opacity:.55">Admin</a><br>'+esc(footer.line1||'')+'<br>'+esc(footer.line2||'');
  }
  function setText(sel,val){if(val==null||val==='')return;const el=document.querySelector(sel);if(el)el.textContent=val}
  function setHtml(sel,val){if(val==null||val==='')return;const el=document.querySelector(sel);if(el)el.innerHTML=lines(val)}

  function applyContacts(rows){
    try{
      if(typeof contactConfig!=='undefined'&&Array.isArray(rows)){
        const next={};rows.forEach(c=>next[c.key]={label:c.label,email:c.email,phone:c.phone});contactConfig=next;
      }
    }catch(_){}
  }

  function renderSoundMedia(rows){
    const items=rows.filter(x=>x.category==='sound'&&x.kind==='image').slice(0,3);
    if(!items.length)return;
    document.querySelectorAll('#sound .era-card img').forEach((img,i)=>{const m=items[i];if(m&&safeUrl(m.file_url)){img.src=m.file_url;img.alt=m.title||'DJ Breeze artwork'}});
  }

  function renderLiveMedia(rows){
    const items=rows.filter(x=>x.category==='live'&&(x.kind==='image'||x.kind==='video'));
    if(!items.length)return;
    const gallery=document.querySelector('#live .gallery');if(!gallery)return;
    gallery.innerHTML=items.slice(0,8).map((m,i)=>{
      const cls='tile'+((m.featured||i===0)?' tall':'')+' reveal in';
      const url=safeUrl(m.file_url),poster=safeUrl(m.poster_url),tag=esc(m.description||m.title||'Live');
      const media=m.kind==='video'?`<video src="${esc(url)}" ${poster?`poster="${esc(poster)}"`:''} muted loop playsinline autoplay preload="metadata"></video>`:`<img src="${esc(url)}" alt="${esc(m.title||'DJ Breeze live')}">`;
      return `<div class="${cls}">${media}<span class="tag">${tag}</span></div>`;
    }).join('');
    if(!document.getElementById('cms-media-style')){const st=document.createElement('style');st.id='cms-media-style';st.textContent='.gallery video{width:100%;height:100%;object-fit:cover;display:block}.cms-video-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.cms-video-card{border:1px solid rgba(255,255,255,.12);background:#111;overflow:hidden}.cms-video-card video{width:100%;aspect-ratio:16/10;object-fit:cover;background:#050505}.cms-video-copy{padding:16px}.cms-video-copy h3{font-size:25px;letter-spacing:-.04em;margin:0 0 6px}.cms-video-copy p{color:#999;margin:0;line-height:1.45}.cms-gig-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cms-gig{border:1px solid rgba(255,255,255,.14);background:#101010;padding:22px;min-height:210px;display:flex;flex-direction:column}.cms-gig .date{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#aaa}.cms-gig h3{font-size:32px;letter-spacing:-.04em;margin:20px 0 8px}.cms-gig p{color:#999;margin:0 0 22px}.cms-gig .ticket{margin-top:auto;font-size:10px;letter-spacing:.12em;text-transform:uppercase}.cms-past{margin-top:36px;border-top:1px solid rgba(255,255,255,.12);padding-top:22px}.cms-past h3{font-size:18px;text-transform:uppercase;letter-spacing:.12em;color:#999}@media(max-width:820px){.cms-video-grid,.cms-gig-grid{grid-template-columns:1fr}}';document.head.appendChild(st)}
  }

  function renderArchiveMedia(rows){
    const items=rows.filter(x=>x.category==='archive'&&x.kind==='image');if(!items.length)return;
    const rail=document.querySelector('.poster-rail');if(!rail)return;
    rail.innerHTML=items.slice(0,12).map(m=>`<div class="poster reveal in"><img src="${esc(safeUrl(m.file_url))}" alt="${esc(m.title||'DJ Breeze archive')}"><div class="poster-cap"><span>${esc(m.title||'Archive')}</span><span>${esc(m.description||'Archive')}</span></div></div>`).join('');
  }

  function renderVideoLibrary(rows){
    const cats=new Set(['club','wedding','private','corporate','public','video']);
    const videos=rows.filter(x=>x.kind==='video'&&!x.is_hero&&cats.has(x.category));
    const old=document.getElementById('cms-videos');if(old)old.remove();if(!videos.length)return;
    const anchor=document.getElementById('events');if(!anchor)return;
    const sec=document.createElement('section');sec.id='cms-videos';sec.className='section sound-section';
    sec.innerHTML=`<div class="wrap"><div class="section-head reveal in"><div><div class="kicker" style="margin-bottom:16px">Video / Moments</div><h2>SEE THE<br>ROOM.</h2></div><p>Club nights, weddings, private events and live moments selected from the DJ Breeze media library.</p></div><div class="cms-video-grid">${videos.map(m=>{const u=safeUrl(m.file_url),p=safeUrl(m.poster_url),meta=[m.venue,m.event_date].filter(Boolean).join(' · ');return `<article class="cms-video-card"><video src="${esc(u)}" ${p?`poster="${esc(p)}"`:''} controls playsinline preload="metadata"></video><div class="cms-video-copy"><div class="kicker">${esc(m.category||'video')}</div><h3>${esc(m.title)}</h3><p>${esc(meta||m.description||'DJ Breeze live moment')}</p></div></article>`}).join('')}</div></div>`;
    anchor.parentNode.insertBefore(sec,anchor);
  }

  function renderGigs(rows){
    const old=document.getElementById('cms-gigs');if(old)old.remove();if(!rows.length)return;
    const anchor=document.getElementById('events');if(!anchor)return;
    const today=new Date().toISOString().slice(0,10),up=rows.filter(g=>g.event_date>=today),past=rows.filter(g=>g.event_date<today).reverse();
    const sec=document.createElement('section');sec.id='cms-gigs';sec.className='section';
    const cards=arr=>arr.map(g=>`<article class="cms-gig"><div class="date">${esc(g.event_date)}${g.start_time?' · '+esc(String(g.start_time).slice(0,5)):''}</div><h3>${esc(g.title)}</h3><p>${esc(g.venue)}${g.city?' · '+esc(g.city):''}</p>${safeUrl(g.ticket_url)?`<a class="ticket" href="${esc(safeUrl(g.ticket_url))}" target="_blank" rel="noopener">Tickets / Info ↗</a>`:'<span class="ticket">Info soon</span>'}</article>`).join('');
    sec.innerHTML=`<div class="wrap"><div class="section-head reveal in"><div><div class="kicker" style="margin-bottom:16px">Upcoming / Gigs</div><h2>NEXT<br>ROOMS.</h2></div><p>Upcoming DJ Breeze dates, updated directly from the admin dashboard.</p></div>${up.length?`<div class="cms-gig-grid">${cards(up)}</div>`:'<div class="cms-past"><h3>No upcoming gigs published yet.</h3></div>'}${past.length?`<div class="cms-past"><h3>Past events</h3><div class="cms-gig-grid">${cards(past.slice(0,9))}</div></div>`:''}</div>`;
    anchor.parentNode.insertBefore(sec,anchor);
    const eventNav=document.querySelector('.nav-links a[href="#events"]');if(eventNav)eventNav.href='#cms-gigs';
  }

  function setupAvailabilityCheck(){
    const input=document.getElementById('bookingDate'),status=document.getElementById('bookingStatus');if(!input)return;
    let seq=0;
    const check=async()=>{
      const date=input.value;if(!date){input.setCustomValidity('');return}
      const run=++seq;input.setCustomValidity('Checking availability…');if(status)status.textContent='Checking date availability…';
      try{
        const r=await fetch(base+'/rest/v1/rpc/check_booking_date',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({p_date:date})});
        if(!r.ok)throw new Error('availability');const state=await r.json();if(run!==seq)return;
        if(state==='booked'||state==='unavailable'){
          input.setCustomValidity('DJ Breeze is not available on this date.');if(status)status.textContent='This date is currently unavailable. Choose another date.';
        }else if(state==='tentative'){
          input.setCustomValidity('');if(status)status.textContent='This date is tentative. You can still send a request and DJ Breeze will confirm availability.';
        }else if(state==='available'){
          input.setCustomValidity('');if(status)status.textContent='This date is currently available.';
        }else{
          input.setCustomValidity('');if(status)status.textContent='Date not blocked — send the request and DJ Breeze will confirm.';
        }
      }catch(_){if(run!==seq)return;input.setCustomValidity('');if(status)status.textContent='Availability could not be checked right now. You can still send the request.'}
    };
    input.addEventListener('input',check);input.addEventListener('change',check);
  }
})();