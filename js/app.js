const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:.13});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));


  const heroVideo = document.getElementById('heroVideo');
  const heroSoundToggle = document.getElementById('heroSoundToggle');
  const heroSoundLabel = document.getElementById('heroSoundLabel');
  const heroSoundIcon = document.getElementById('heroSoundIcon');

  heroSoundToggle?.addEventListener('click', async () => {
    if (!heroVideo) return;
    try {
      if (heroVideo.paused) await heroVideo.play();
      const turnOn = heroVideo.muted;
      heroVideo.muted = !turnOn;
      heroSoundToggle.classList.toggle('sound-on', turnOn);
      heroSoundToggle.setAttribute('aria-pressed', turnOn ? 'true' : 'false');
      heroSoundLabel.textContent = turnOn ? 'Hero sound on' : 'Hero sound off';
      if (heroSoundIcon) heroSoundIcon.textContent = turnOn ? '🔊' : '🔇';
    } catch (err) {
      heroVideo.muted = true;
      heroSoundToggle.classList.remove('sound-on');
      heroSoundToggle.setAttribute('aria-pressed', 'false');
      heroSoundLabel.textContent = 'Hero sound off';
      if (heroSoundIcon) heroSoundIcon.textContent = '🔇';
    }
  });


  const siteSoundtrack = document.getElementById('siteSoundtrack');
  const siteSoundToggle = document.getElementById('siteSoundToggle');
  const siteSoundLabel = document.getElementById('siteSoundLabel');

  let siteSoundWanted = true;

  function updateSiteSoundUI(isOn, blocked = false) {
    siteSoundToggle?.classList.toggle('sound-on', isOn);
    siteSoundToggle?.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    if (siteSoundLabel) {
      siteSoundLabel.textContent = isOn ? 'Site sound on' : 'Site sound off';
    }
  }

  async function startSiteSound() {
    if (!siteSoundtrack || !siteSoundWanted) return;
    try {
      siteSoundtrack.volume = 0.55;
      await siteSoundtrack.play();
      updateSiteSoundUI(true, false);
    } catch (err) {
      // Chrome/Safari may block unmuted autoplay until the visitor interacts once.
      updateSiteSoundUI(true, true);
    }
  }

  // Website soundtrack is the intended default state.
  startSiteSound();

  // If autoplay was blocked, the first interaction anywhere on the page starts it.
  const unlockSiteSound = async () => {
    if (siteSoundWanted && siteSoundtrack?.paused) {
      await startSiteSound();
    }
  };
  document.addEventListener('pointerdown', unlockSiteSound, { once: true });
  document.addEventListener('keydown', unlockSiteSound, { once: true });

  siteSoundToggle?.addEventListener('click', async () => {
    if (!siteSoundtrack) return;

    if (!siteSoundtrack.paused) {
      siteSoundWanted = false;
      siteSoundtrack.pause();
      updateSiteSoundUI(false, false);
      return;
    }

    siteSoundWanted = true;

    // Avoid two independent audio sources playing at once.
    if (heroVideo && !heroVideo.muted) {
      heroVideo.muted = true;
      heroSoundToggle?.classList.remove('sound-on');
      heroSoundToggle?.setAttribute('aria-pressed', 'false');
      if (heroSoundLabel) heroSoundLabel.textContent = 'Hero sound off';
      if (heroSoundIcon) heroSoundIcon.textContent = '🔇';
    }

    await startSiteSound();
  });

  // If the visitor turns Hero audio on, pause the global website soundtrack.
  heroSoundToggle?.addEventListener('click', () => {
    setTimeout(() => {
      if (heroVideo && !heroVideo.muted && siteSoundtrack && !siteSoundtrack.paused) {
        siteSoundWanted = false;
        siteSoundtrack.pause();
        updateSiteSoundUI(false, false);
      }
    }, 0);
  });


  // IMPORTANT:
  // Hero video audio and the site-wide soundtrack are intentionally separate systems.
  // The future site soundtrack will live persistently across page/section navigation and be CMS controlled.

  // Future hook:
  // 1) Replace hero image with CMS-managed video URL.
  // 2) Connect persistent audio player to CMS-managed page soundtrack.
  // 3) Convert posters, events and bookings to dynamic CMS collections.


async function loadSiteConfig() {
  // On GitHub Pages these JSON files become the lightweight CMS/config layer.
  // When index.html is opened directly from disk, browser security may block fetch();
  // the hard-coded HTML defaults still keep the demo working.
  try {
    const [siteRes, contactsRes] = await Promise.all([
      fetch('content/site.json', { cache: 'no-store' }),
      fetch('content/contacts.json', { cache: 'no-store' })
    ]);

    if (siteRes.ok) {
      const site = await siteRes.json();

      if (site.pageTitle) document.title = site.pageTitle;

      const heroVideo = document.getElementById('heroVideo');
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

      const soundtrack = document.getElementById('siteSoundtrack');
      if (soundtrack && site.siteSound?.track) {
        const source = soundtrack.querySelector('source');
        if (source && source.getAttribute('src') !== site.siteSound.track) {
          source.src = site.siteSound.track;
          soundtrack.load();
        }
        soundtrack.loop = site.siteSound.loop !== false;
        const v = Number(site.siteSound.volume);
        if (!Number.isNaN(v)) soundtrack.volume = Math.min(1, Math.max(0, v));
      }
    }

    if (contactsRes.ok) {
      const contacts = await contactsRes.json();
      const bookingButton = document.querySelector('#booking a[href^="mailto:"]');
      const email = contacts?.default?.email;
      if (bookingButton && email) bookingButton.href = `mailto:${email}`;
    }
  } catch (err) {
    // Expected when testing from file://. GitHub Pages will load the JSON normally.
    console.info('Using built-in demo defaults.', err?.message || err);
  }
}

loadSiteConfig();
