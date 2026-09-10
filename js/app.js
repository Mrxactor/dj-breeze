const heroVideo = document.getElementById('heroVideo');
const heroSoundToggle = document.getElementById('heroSoundToggle');
const heroSoundLabel = document.getElementById('heroSoundLabel');
const heroSoundIcon = document.getElementById('heroSoundIcon');
const siteSoundtrack = document.getElementById('siteSoundtrack');
const siteSoundToggle = document.getElementById('siteSoundToggle');
const siteSoundLabel = document.getElementById('siteSoundLabel');
let siteSoundWanted = true;
let contactConfig = null;

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .13 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}

function updateSiteSoundUI(isOn) {
  if (siteSoundToggle) {
    siteSoundToggle.classList.toggle('sound-on', isOn);
    siteSoundToggle.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  }
  if (siteSoundLabel) siteSoundLabel.textContent = isOn ? 'Site sound on' : 'Site sound off';
}

async function startSiteSound() {
  if (!siteSoundtrack || !siteSoundWanted) return;
  try {
    siteSoundtrack.volume = 0.55;
    await siteSoundtrack.play();
    updateSiteSoundUI(true);
  } catch (_) {
    updateSiteSoundUI(true);
  }
}
startSiteSound();

document.addEventListener('pointerdown', function unlock() {
  if (siteSoundWanted && siteSoundtrack && siteSoundtrack.paused) startSiteSound();
}, { once: true });

if (siteSoundToggle) {
  siteSoundToggle.addEventListener('click', async () => {
    if (!siteSoundtrack) return;
    if (!siteSoundtrack.paused) {
      siteSoundWanted = false;
      siteSoundtrack.pause();
      updateSiteSoundUI(false);
    } else {
      siteSoundWanted = true;
      if (heroVideo && !heroVideo.muted) {
        heroVideo.muted = true;
        if (heroSoundToggle) heroSoundToggle.classList.remove('sound-on');
        if (heroSoundIcon) heroSoundIcon.textContent = '🔇';
      }
      await startSiteSound();
    }
  });
}

if (heroSoundToggle) {
  heroSoundToggle.addEventListener('click', async () => {
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
    } catch (_) {}
  });
}

const bookingTypeSelect = document.getElementById('bookingType');
const bookingLinks = document.querySelectorAll('.booking-type-link');
bookingLinks.forEach(link => {
  link.addEventListener('click', () => {
    const type = link.getAttribute('data-booking-type');
    if (bookingTypeSelect && type) bookingTypeSelect.value = type;
    document.querySelectorAll('#booking .chips a').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-booking-type') === type);
    });
  });
});

if (bookingTypeSelect) {
  bookingTypeSelect.addEventListener('change', () => {
    const type = bookingTypeSelect.value;
    document.querySelectorAll('#booking .chips a').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-booking-type') === type);
    });
  });
}

function prettyType(value) {
  const labels = {
    club: 'Club / Nightlife',
    wedding: 'Wedding',
    private: 'Private Party',
    corporate: 'Corporate Event',
    public: 'Public Event / Festival'
  };
  return labels[value] || 'Other';
}

function buildBookingRequest(validate) {
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

  const body =
`DJ BREEZE BOOKING REQUEST

Event: ${label}
Date: ${date || '-'}
Venue / City: ${venue || '-'}

Contact name: ${name || '-'}
Email: ${email || '-'}
Phone: ${phone || '-'}

Details:
${message || '-'}`;

  return {
    type,
    subject: `DJ Breeze Booking — ${label}${date ? ' — ' + date : ''}`,
    body
  };
}

function getBookingEmail(type) {
  if (!contactConfig) return '';
  if (contactConfig[type] && contactConfig[type].email) return contactConfig[type].email;
  if (contactConfig.default && contactConfig.default.email) return contactConfig.default.email;
  return '';
}

async function copyText(text, statusEl) {
  try {
    await navigator.clipboard.writeText(text);
    if (statusEl) statusEl.textContent = 'Booking request copied.';
  } catch (_) {
    if (statusEl) statusEl.textContent = 'Copy failed. You can still use Prepare booking request.';
  }
}

const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  bookingForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = buildBookingRequest(true);
    if (!data) return;
    const status = document.getElementById('bookingStatus');
    const destination = getBookingEmail(data.type);

    if (!destination || destination.indexOf('example.com') !== -1) {
      if (status) status.textContent = 'Booking form works. A real booking email still needs to be added in Admin → Booking Contacts.';
      copyText(data.body, status);
      return;
    }

    const mailto =
      'mailto:' + encodeURIComponent(destination) +
      '?subject=' + encodeURIComponent(data.subject) +
      '&body=' + encodeURIComponent(data.body);
    window.location.href = mailto;
    if (status) status.textContent = 'Opening your email app…';
  });
}

const copyBooking = document.getElementById('copyBooking');
if (copyBooking) {
  copyBooking.addEventListener('click', () => {
    const data = buildBookingRequest(false);
    if (data) copyText(data.body, document.getElementById('bookingStatus'));
  });
}

async function loadSiteConfig() {
  try {
    const siteRes = await fetch('content/site.json', { cache: 'no-store' });
    if (siteRes.ok) {
      const site = await siteRes.json();
      if (site.pageTitle) document.title = site.pageTitle;

      if (heroVideo && site.hero) {
        if (site.hero.poster) heroVideo.poster = site.hero.poster;
        const source = heroVideo.querySelector('source');
        if (source && site.hero.video && source.getAttribute('src') !== site.hero.video) {
          source.src = site.hero.video;
          heroVideo.load();
          heroVideo.play().catch(() => {});
        }
      }

      if (siteSoundtrack && site.siteSound) {
        const source = siteSoundtrack.querySelector('source');
        if (source && site.siteSound.track && source.getAttribute('src') !== site.siteSound.track) {
          source.src = site.siteSound.track;
          siteSoundtrack.load();
        }
        const v = Number(site.siteSound.volume);
        if (!Number.isNaN(v)) siteSoundtrack.volume = Math.min(1, Math.max(0, v));
      }
    }

    const contactsRes = await fetch('content/contacts.json', { cache: 'no-store' });
    if (contactsRes.ok) contactConfig = await contactsRes.json();
  } catch (_) {}
}
loadSiteConfig();
