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
  const br=v=>esc(v).replace(/\n/g,'<br>');
  const get=async path=>{const r=await fetch(base+path,{headers,cache:'no-store'});if(!r.ok)throw Error('CMS text read failed '+r.status);return r.json()};

  let blocks={},settings=null;
  try{
    const [rows,s]=await Promise.all([
      get('/rest/v1/content_blocks?select=*'),
      get('/rest/v1/site_settings?id=eq.1&select=*')
    ]);
    (rows||[]).forEach(x=>blocks[x.key]=x.data||{});
    settings=s&&s[0];
    applyAll();
    watchDynamicSections();
  }catch(err){console.warn('DJ Breeze site controls:',err)}

  function text(sel,val){if(val==null||val==='')return;const el=document.querySelector(sel);if(el)el.textContent=val}
  function html(sel,val){if(val==null||val==='')return;const el=document.querySelector(sel);if(el)el.innerHTML=br(val)}

  function applyAll(){
    applyHero();applyMarquee();applyLiveArchive();applyBooking();applyDynamic();applySeo();applyFooterPrivacy();
  }

  function applyHero(){
    const h=blocks.hero||{};
    if(settings&&settings.artist_name){
      const words=String(settings.artist_name).trim().split(/\s+/).filter(Boolean);
      const title=document.querySelector('.hero h1');
      if(title&&words.length){
        title.innerHTML='';
        if(words.length===1){const s=document.createElement('span');s.textContent=words[0];title.appendChild(s)}
        else{
          const a=document.createElement('span'),b=document.createElement('span');
          a.textContent=words.slice(0,-1).join(' ');b.textContent=words.at(-1);title.append(a,b);
        }
      }
    }
    text('.hero-actions a:nth-child(1)',h.primary_cta);
    text('.hero-actions a:nth-child(2)',h.secondary_cta);

    const label=document.getElementById('siteSoundLabel');
    if(label){
      const translate=()=>{
        const raw=label.textContent.trim().toLowerCase();
        const next=raw.includes('off')?(h.site_sound_off||'Site sound off'):(h.site_sound_on||'Site sound on');
        if(label.textContent!==next)label.textContent=next;
      };
      translate();
      new MutationObserver(translate).observe(label,{childList:true,characterData:true,subtree:true});
    }
  }

  function applyMarquee(){
    const items=(blocks.marquee||{}).items;
    if(!Array.isArray(items)||!items.length)return;
    const one=items.map(x=>esc(x)).join(' <b>●</b> ');
    const sequence=one+' <b>●</b> '+one+' <b>●</b>';
    document.querySelectorAll('.marquee-item').forEach(el=>el.innerHTML=sequence);
  }

  function applyLiveArchive(){
    const tags=(blocks.live||{}).tags;
    if(Array.isArray(tags))document.querySelectorAll('#live .tile .tag').forEach((el,i)=>{if(tags[i])el.textContent=tags[i]});
    const caps=(blocks.archive||{}).captions;
    if(Array.isArray(caps))document.querySelectorAll('.poster-rail .poster-cap').forEach((el,i)=>{
      const x=caps[i];if(!x)return;const spans=el.querySelectorAll('span');if(spans[0])spans[0].textContent=x.title||'';if(spans[1])spans[1].textContent=x.label||'';
    });
  }

  function applyBooking(){
    const services=blocks.services||{},f=blocks.booking_form||{};
    if(Array.isArray(services.items)){
      document.querySelectorAll('#booking .chips a').forEach((el,i)=>{const x=services.items[i];if(x)el.textContent=x.short||x.title||el.textContent});
    }
    text('#booking > .booking-inner > a.btn.primary',f.start_button);
    const labels=f.labels||{},p=f.placeholders||{},o=f.options||{};
    const map={bookingType:'type',bookingDate:'date',bookingVenue:'venue',bookingName:'name',bookingEmail:'email',bookingPhone:'phone',bookingMessage:'details'};
    Object.entries(map).forEach(([id,key])=>{
      const el=document.getElementById(id);if(!el)return;
      const lab=document.querySelector(`label[for="${id}"]`);if(lab&&labels[key])lab.textContent=labels[key];
      if('placeholder' in el&&p[key]!=null)el.placeholder=p[key];
    });
    const select=document.getElementById('bookingType');if(select){Array.from(select.options).forEach(opt=>{if(o[opt.value])opt.textContent=o[opt.value]})}
    text('#bookingForm button[type="submit"]',f.submit_button);
    text('#copyBooking',f.copy_button);
  }

  function applyDynamic(){
    const d=blocks.dynamic_sections||{};
    text('#cms-videos .section-head .kicker',d.videos_kicker);html('#cms-videos .section-head h2',d.videos_heading);text('#cms-videos .section-head > p',d.videos_intro);
    text('#cms-gigs .section-head .kicker',d.gigs_kicker);html('#cms-gigs .section-head h2',d.gigs_heading);text('#cms-gigs .section-head > p',d.gigs_intro);
    document.querySelectorAll('#cms-gigs .cms-past h3').forEach(h3=>{
      const v=h3.textContent.trim().toLowerCase();
      if(v.includes('past event')&&d.past_heading)h3.textContent=d.past_heading;
      else if(v.includes('no upcoming')&&d.no_upcoming)h3.textContent=d.no_upcoming;
    });
    document.querySelectorAll('#cms-gigs .ticket').forEach(el=>{
      if(el.tagName==='A'&&d.ticket_label)el.textContent=d.ticket_label;
      if(el.tagName!=='A'&&d.info_label)el.textContent=d.info_label;
    });
  }

  function watchDynamicSections(){
    const root=document.querySelector('main')||document.body;
    let queued=false;
    new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyDynamic();applyFooterPrivacy()})}).observe(root,{childList:true,subtree:true});
    const footer=document.querySelector('footer');
    if(footer)new MutationObserver(()=>applyFooterPrivacy()).observe(footer,{childList:true,subtree:true});
  }

  function applySeo(){
    const s=blocks.seo||{};if(!s.description)return;
    let meta=document.querySelector('meta[name="description"]');
    if(!meta){meta=document.createElement('meta');meta.name='description';document.head.appendChild(meta)}
    meta.content=s.description;
  }

  function applyFooterPrivacy(){
    const f=blocks.footer||{},right=document.querySelector('.footer-right');
    if(!right)return;
    const hasAdmin=!!right.querySelector('a[href^="admin"],a[href*="/admin/"]');
    if((f.line1||f.line2)&&(hasAdmin||right.dataset.publicClean!=='1')){
      right.replaceChildren();
      if(f.line1){right.append(document.createTextNode(f.line1));right.append(document.createElement('br'))}
      if(f.line2)right.append(document.createTextNode(f.line2));
      right.dataset.publicClean='1';
    }
    right.querySelectorAll('a[href^="admin"],a[href*="/admin/"]').forEach(a=>a.remove());
  }
})();
