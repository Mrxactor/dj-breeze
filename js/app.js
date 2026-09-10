const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: .13 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

const heroVideo = document.getElementById('heroVideo');
const heroSoundToggle = document.getElementById('heroSoundToggle');
const heroSoundLabel = document.getElementById('heroSoundLabel');
const heroSoundIcon = document.getElementById('heroSoundIcon');
const siteSoundtrack = document.getElementById('siteSoundtrack');
const siteSoundToggle = document.getElementById('siteSoundToggle');
const siteSoundLabel = document.getElementById('siteSoundLabel');

let siteSoundWanted = true;
let contactConfig = null;

function updateSiteSoundUI(isOn) {
  siteSoundToggle?.classList.toggle('sound-on', isOn);
  siteSoundToggle?.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  if (siteSoundLabel) siteSoundLabel.textContent = isOn ? 'Site sound on' : 'Site sound off';
}

async function startSiteSound() {
  if (!siteSoundtrack || !siteSoundWanted) return;
  try {
    siteSoundtrack.volume = 0.55;
    await siteSoundtrack.play();
    updateSiteSoundUI(true);
  } catch (err) {
    updateSiteSoundUI(true);
  }
}

startSiteSound();

const unlockSiteSound = async () => {
  if (siteSoundWanted && siteSoundtrack?.paused) await startSiteSound();
};
document.addEventListener('pointerdown', unlockSiteSound, { once: true });
document.addEventListener('keydown', unlockSiteSound, { once: true });

siteSoundToggle?.addEventListener('click', async () => {
  if (!siteSoundtrack) return;
  if (!siteSoundtrack.paused) {
    siteSoundWanted = false;
    siteSoundtrack.pause();
    updateSiteSoundUI(false);
    return;
  }

  siteSoundWanted = true;
  if (heroVideo && !heroVideo.muted) {
    heroVideo.muted = true;
    heroSoundToggle?.classList.remove('sound-on');
    heroSoundToggle?.setAttribute('aria-pressed', 'false');
    if (heroSoundLabel) heroSoundLabel.textContent = 'Hero sound off';
    if (heroSoundIcon) heroSoundIcon.textContent = '🔇';
  }
  await startSiteSound();
});

heroSoundToggle?.addEventListener('click', async () => {
  if (!heroVideo) return;
  try {
    if (heroVideo.paused) await heroVideo.play();
    const turnOn = heroVideo.muted;
    heroVideo.muted = !turnOn;
    heroSoundToggle.classList.toggle('sound-on', turnOn);
    heroSoundToggle.setAttribute('aria-pressed', turnOn ? 'true' : 'false');
    if (heroSoundLabel) heroSoundLabel.textContent = turnOn ? 'Hero sound on' : 'Hero sound off';
    if (heroSoundIcon) heroSoundIcon.textContent = turnOn ? '🔊' : '🔇';

    if (turnOn && siteSoundtrack && !siteSoundtrack.paused) {
      siteSoundWanted = false;
      siteSoundtrack.pause();
      updateSiteSoundUI(false);
    }
  } catch (err) {
    heroVideo.muted = true;
    heroSoundToggle.classList.remove('sound-on');
    heroSoundToggle.setAttribute('aria-pressed', 'false');
    if (heroSoundLabel) heroSoundLabel.textContent = 'Hero sound off';
    if (heroSoundIcon) heroSoundIcon.textContent = '🔇';
  }
});

// Reliable in-page navigation for GitHub Pages and mobile browsers.
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', id);
  });
});

function injectInteractiveStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .service-row{cursor:pointer;transition:background .2s ease,padding-left .2s ease}
    .service-row:hover,.service-row:focus{background:rgba(0,0,0,.055);padding-left:12px;outline:none}
    .booking .chips span{cursor:pointer;transition:.2s;user-select:none}
    .booking .chips span:hover,.booking .chips span.active{background:#f2eee5;color:#090909;border-color:#f2eee5}
    .booking-form-wrap{width:min(100%,760px);margin:26px auto 0;text-align:left;border:1px solid rgba(255,255,255,.18);background:rgba(10,10,10,.72);backdrop-filter:blur(14px);padding:22px;border-radius:18px;display:none}
    .booking-form-wrap.open{display:block;animation:bookingIn .28s ease}
    @keyframes bookingIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    .booking-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .booking-field{display:flex;flex-direction:column;gap:7px}
    .booking-field.full{grid-column:1/-1}
    .booking-field label{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#aaa}
    .booking-field input,.booking-field select,.booking-field textarea{width:100%;border:1px solid rgba(255,255,255,.18);background:#111;color:#fff;border-radius:10px;padding:13px;font:inherit;outline:none}
    .booking-field input:focus,.booking-field select:focus,.booking-field textarea:focus{border-color:rgba(255,255,255,.55)}
    .booking-field textarea{min-height:115px;resize:vertical}
    .booking-form-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
    .booking-status{margin-top:13px;color:#bbb;font-size:12px;line-height:1.5;min-height:18px}
    .booking-form-wrap .btn{cursor:pointer}
    @media(max-width:640px){.booking-form-grid{grid-template-columns:1fr}.booking-field.full{grid-column:auto}.booking-form-wrap{padding:16px}}
  `;
  document.head.appendChild(style);
}
injectInteractiveStyles();

const bookingSection = document.getElementById('booking');
const bookingInner = bookingSection?.querySelector('.booking-inner');
const chips = [...document.querySelectorAll('#booking .chips span')];

const typeMap = {
  'club / nightlife': 'club',
  'club': 'club',
  'weddings': 'wedding',
  'wedding': 'wedding',
  'private parties': 'private',
  'private': 'private',
  'corporate events': 'corporate',
  'corporate': 'corporate',
  'public events': 'public',
  'public event': 'public'
};

function prettyType(value) {
  return {
    club: 'Club / Nightlife',
    wedding: 'Wedding',
    private: 'Private Party',
    corporate: 'Corporate Event',
    public: 'Public Event / Festival'
  }[value] || 'Other';
}

function ensureBookingForm() {
  let wrap = document.getElementById('bookingFormWrap');
  if (wrap || !bookingInner) return wrap;

  wrap = document.createElement('div');
  wrap.id = 'bookingFormWrap';
  wrap.className = 'booking-form-wrap';
  wrap.innerHTML = `
    <form id="bookingForm">
      <div class="booking-form-grid">
        <div class="booking-field">
          <label for="bookingType">Event type</label>
          <select id="bookingType" required>
            <option value="club">Club / Nightlife</option>
            <option value="wedding">Wedding</option>
            <option value="private">Private Party</option>
            <option value="corporate">Corporate Event</option>
            <option value="public">Public Event / Festival</option>
          </select>
        </div>
        <div class="booking-field">
          <label for="bookingDate">Date</label>
          <input id="bookingDate" type="date" required>
        </div>
        <div class="booking-field">
          <label for="bookingVenue">Venue / City</label>
          <input id="bookingVenue" type="text" placeholder="Göteborg / Venue" required>
        </div>
        <div class="booking-field">
          <label for="bookingName">Your name</label>
          <input id="bookingName" type="text" placeholder="Name" required>
        </div>
        <div class="booking-field">
          <label for="bookingEmail">Email</label>
          <input id="bookingEmail" type="email" placeholder="you@example.com" required>
        </div>
        <div class="booking-field">
          <label for="bookingPhone">Phone</label>
          <input id="bookingPhone" type="tel" placeholder="+46 ...">
        </div>
        <div class="booking-field full">
          <label for="bookingMessage">Details</label>
          <textarea id="bookingMessage" placeholder="Time, number of guests, music, setup, budget or anything DJ Breeze should know."></textarea>
        </div>
      </div>
      <div class="booking-form-actions">
        <button class="btn primary" type="submit">Prepare booking request ↗</button>
        <button class="btn" id="copyBooking" type="button">Copy request</button>
      </div>
      <div class="booking-status" id="bookingStatus" aria-live="polite"></div>
    </form>`;

  bookingInner.appendChild(wrap);

  const form = wrap.querySelector('#bookingForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = buildBookingRequest();
    if (!data) return;

    const destination = getBookingEmail(data.type);
    const status = document.getElementById('bookingStatus');
    if (!destination || destination.includes('example.com')) {
      status.textContent = 'Formuläret fungerar. Booking-adressen är ännu inte kopplad, så förfrågan är redo att kopieras. Lägg in riktig booking-email i Admin → Booking Contacts.';
      copyText(data.body, status);
      return;
    }

    const mailto = `mailto:${encodeURIComponent(destination)}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(data.body)}`;
    window.location.href = mailto;
    status.textContent = `Öppnar din mailapp och adresserar förfrågan till ${destination}.`;
  });

  wrap.querySelector('#copyBooking').addEventListener('click', () => {
    const data = buildBookingRequest(false);
    if (!data) return;
    copyText(data.body, document.getElementById('bookingStatus'));
  });

  wrap.querySelector('#bookingType').addEventListener('change', e => setBookingType(e.target.value, false));
  return wrap;
}

function buildBookingRequest(validate = true) {
  const form = document.getElementById('bookingForm');
  if (!form) return null;
  if (validate && !form.reportValidity()) return null;

  const type = document.getElementById('bookingType').value;
  const date = document.getElementById('bookingDate').value;
  const venue = document.getElementById('bookingVenue').value.trim();
  const name = document.getElementById('bookingName').value.trim();
  const email = document.getElementById('bookingEmail').value.trim();
  const phone = document.getElementById('bookingPhone').value.trim();
  const message = document.getElementById('bookingMessage').value.trim();
  const label = prettyType(type);

  const body = `DJ BREEZE BOOKING REQUEST\n\nEvent: ${label}\nDate: ${date || '-'}\nVenue / City: ${venue || '-'}\n\nContact name: ${name || '-'}\nEmail: ${email || '-'}\nPhone: ${phone || '-'}\n\nDetails:\n${message || '-'}`;
  return { type, subject: `DJ Breeze Booking — ${label}${date ? ` — ${date}` : ''}`, body };
}

async function copyText(text, statusEl) {
  try {
    await navigator.clipboard.writeText(text);
    if (statusEl) statusEl.textContent = 'Booking request copied.';
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Kunde inte kopiera automatiskt. Markera texten manuellt i din mailapp.';
  }
}

function getBookingEmail(type) {
  return contactConfig?.[type]?.email || contactConfig?.default?.email || '';
}

function setBookingType(type, scroll = true) {
  const normalized = typeMap[String(type).toLowerCase()] || type;
  const wrap = ensureBookingForm();
  if (!wrap) return;
  wrap.classList.add('open');

  const select = document.getElementById('bookingType');
  if (select && [...select.options].some(o => o.value === normalized)) select.value = normalized;

  chips.forEach(chip => {
    const chipType = typeMap[chip.textContent.trim().toLowerCase()];
    chip.classList.toggle('active', chipType === normalized);
  });

  if (scroll) bookingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Make booking category chips real controls.
chips.forEach(chip => {
  chip.setAttribute('role', 'button');
  chip.setAttribute('tabindex', '0');
  const activate = () => setBookingType(typeMap[chip.textContent.trim().toLowerCase()] || 'club');
  chip.addEventListener('click', activate);
  chip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  });
});

// Make the five service rows clickable and preselect the correct booking type.
document.querySelectorAll('.service-row').forEach(row => {
  row.setAttribute('role', 'button');
  row.setAttribute('tabindex', '0');
  const label = row.querySelector('strong')?.textContent.trim().toLowerCase() || '';
  const activate = () => setBookingType(typeMap[label] || 'club');
  row.addEventListener('click', activate);
  row.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  });
});

// The booking CTA now opens the inline form instead of depending on a mail app.
const oldBookingLink = bookingSection?.querySelector('a.btn.primary[href^="mailto:"]');
if (oldBookingLink) {
  oldBookingLink.removeAttribute('href');
  oldBookingLink.setAttribute('role', 'button');
  oldBookingLink.setAttribute('tabindex', '0');
  oldBookingLink.style.cursor = 'pointer';
  oldBookingLink.textContent = 'Start booking request ↗';
  const open = () => setBookingType('club', false);
  oldBookingLink.addEventListener('click', open);
  oldBookingLink.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });
}

async function loadSiteConfig() {
  try {
    const [siteRes, contactsRes] = await Promise.all([
      fetch('content/site.json', { cache: 'no-store' }),
      fetch('content/contacts.json', { cache: 'no-store' })
    ]);

    if (siteRes.ok) {
      const site = await siteRes.json();
      if (site.pageTitle) document.title = site.pageTitle;

      if (heroVideo && site.hero) {
        if (site.hero.poster) heroVideo.poster = site.hero.poster;
        if (site.hero.video) {
          const source = heroVideo.querySelector('source');
          if (source && source.getAttribute('src') !== site.hero.video) {
            source.src = site.hero.video;
            heroVideo.load();
            heroVideo.play().catch(() => {});
          }
        }
        heroVideo.loop = site.hero.loop !== false;
        heroVideo.muted = site.hero.muted !== false;
      }

      if (siteSoundtrack && site.siteSound?.track) {
        const source = siteSoundtrack.querySelector('source');
        if (source && source.getAttribute('src') !== site.siteSound.track) {
          source.src = site.siteSound.track;
          siteSoundtrack.load();
        }
        siteSoundtrack.loop = site.siteSound.loop !== false;
        const v = Number(site.siteSound.volume);
        if (!Number.isNaN(v)) siteSoundtrack.volume = Math.min(1, Math.max(0, v));
      }
    }

    if (contactsRes.ok) contactConfig = await contactsRes.json();
  } catch (err) {
    console.info('Using built-in demo defaults.', err?.message || err);
  }
}

loadSiteConfig();
