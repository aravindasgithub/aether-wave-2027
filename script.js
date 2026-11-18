/* ═══════════════════════════════════════════════════════════════
   AETHER WAVE 2027 — JavaScript
   IEEE ComSoc SBC NSSCE
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Countdown configuration ─────────────────────────────────────
   Set EVENT_DATE to activate the live countdown.
   Format: ISO 8601 date-time string.
   Leave null to show "COMING SOON".
   The user can also set it via the UI; it's persisted in localStorage.
   ─────────────────────────────────────────────────────────────── */
const EVENT_DATE_FALLBACK = null; // e.g. '2027-01-15T09:00:00+05:30'

/* ══════════════════════════════════════════════════════════════
   1. ANIMATED BACKGROUND CANVAS
   ══════════════════════════════════════════════════════════════ */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, animId;

  /* ── Particle system ── */
  const PARTICLE_COUNT = 90;
  const WAVE_LINES     = 4;
  const particles      = [];

  class Particle {
    constructor() { this.reset(true); }

    reset(randomY = false) {
      this.x  = Math.random() * W;
      this.y  = randomY ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.5 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(Math.random() * 0.5 + 0.2);
      this.alpha   = Math.random() * 0.5 + 0.1;
      this.isCyan  = Math.random() > 0.4;
      this.pulse   = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += 0.03;
      if (this.y < -10) this.reset();
    }

    draw() {
      const a = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.isCyan
        ? `rgba(0,240,255,${a})`
        : `rgba(139,92,246,${a})`;
      ctx.fill();
    }
  }

  /* ── Circuit grid dots ── */
  const GRID_COLS = 18;
  const GRID_ROWS = 12;
  let gridDots = [];

  function buildGrid() {
    gridDots = [];
    const cw = W / GRID_COLS;
    const ch = H / GRID_ROWS;
    for (let r = 0; r <= GRID_ROWS; r++) {
      for (let c = 0; c <= GRID_COLS; c++) {
        gridDots.push({
          x: c * cw,
          y: r * ch,
          pulse: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.01,
          active: Math.random() > 0.6,
        });
      }
    }
  }

  /* ── Flowing wave lines ── */
  const waveOffsets = Array.from({ length: WAVE_LINES }, (_, i) => i * 180);
  const waveAmps    = [22, 16, 28, 12];
  const waveFreqs   = [0.004, 0.006, 0.003, 0.007];
  const waveSpeeds  = [0.4, 0.6, 0.3, 0.8];
  const waveYRatios = [0.25, 0.42, 0.62, 0.78];
  let   waveTime    = 0;

  /* ── Resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
    buildGrid();
  }

  /* ── Draw ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    waveTime += 0.5;

    /* Grid dots & faint traces */
    const cw = W / GRID_COLS;
    const ch = H / GRID_ROWS;
    gridDots.forEach(d => {
      d.pulse += d.speed;
      if (!d.active) return;
      const a = 0.04 + 0.06 * Math.abs(Math.sin(d.pulse));
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,240,255,${a})`;
      ctx.fill();
    });

    /* Horizontal circuit traces (subtle) */
    for (let r = 0; r <= GRID_ROWS; r++) {
      if (r % 3 !== 0) continue;
      ctx.beginPath();
      ctx.moveTo(0, r * ch);
      ctx.lineTo(W, r * ch);
      ctx.strokeStyle = 'rgba(0,240,255,0.025)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      if (c % 4 !== 0) continue;
      ctx.beginPath();
      ctx.moveTo(c * cw, 0);
      ctx.lineTo(c * cw, H);
      ctx.strokeStyle = 'rgba(139,92,246,0.02)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* Wave lines */
    for (let w = 0; w < WAVE_LINES; w++) {
      const baseY  = H * waveYRatios[w];
      const amp    = waveAmps[w];
      const freq   = waveFreqs[w];
      const offset = waveOffsets[w] + waveTime * waveSpeeds[w];
      const t      = w / (WAVE_LINES - 1);
      const r = Math.round(0 + t * 139);
      const g = Math.round(240 - t * 148);
      const b = Math.round(255 - t * 9);
      const alpha = 0.12 + 0.08 * Math.sin(waveTime * 0.02 + w);

      ctx.beginPath();
      ctx.moveTo(0, baseY + amp * Math.sin(offset * freq));
      for (let x = 1; x <= W; x += 4) {
        const y = baseY + amp * Math.sin((x + offset) * freq);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    /* Particles */
    particles.forEach(p => { p.update(); p.draw(); });

    /* Occasional energy pulse (random dot connections) */
    if (Math.floor(waveTime) % 60 === 0) {
      const a = particles[Math.floor(Math.random() * particles.length)];
      const b = particles[Math.floor(Math.random() * particles.length)];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist < 200) {
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, 'rgba(0,240,255,0.3)');
        grad.addColorStop(1, 'rgba(139,92,246,0.3)');
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    animId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

/* ══════════════════════════════════════════════════════════════
   2. NAVBAR — scroll shrink + hamburger
   ══════════════════════════════════════════════════════════════ */
(function initNav() {
  const navbar   = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });

  /* Close mobile menu on link click */
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
    });
  });

  /* Active link tracking on scroll */
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.btn-nav)');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${id}`
            ? 'var(--cyan)' : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
})();

/* ══════════════════════════════════════════════════════════════
   3. SCROLL REVEAL
   ══════════════════════════════════════════════════════════════ */
(function initReveal() {
  const targets = [
    '.section-header', '.about-text', '.about-visual',
    '.track-card', '.countdown-wrap', '.venue-card',
    '.sponsor-tier', '.sponsor-cta', '.contact-wrap',
    '.hero-stats', '.organizer-badge',
  ];

  const elems = document.querySelectorAll(targets.join(','));
  elems.forEach(el => el.classList.add('reveal'));

  const obs = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  elems.forEach(el => obs.observe(el));

  /* Hero elements are always visible */
  document.querySelectorAll('.hero-content > *').forEach(el => {
    el.classList.add('reveal');
    setTimeout(() => el.classList.add('visible'), 300);
  });
})();

/* ══════════════════════════════════════════════════════════════
   4. COUNTDOWN TIMER
   ══════════════════════════════════════════════════════════════ */
(function initCountdown() {
  const LS_KEY = 'aetherwave_event_date';

  let targetDate = null;
  let timerInterval = null;

  const comingSoonBlock = document.getElementById('coming-soon-block');
  const timerBlock      = document.getElementById('timer-block');
  const dtInput         = document.getElementById('event-datetime');

  /* ── Pad numbers ── */
  function pad(n) { return String(n).padStart(2, '0'); }

  /* ── Render tick ── */
  function tick() {
    if (!targetDate) return;
    const now  = Date.now();
    const diff = targetDate - now;

    if (diff <= 0) {
      /* Event has started */
      document.getElementById('cd-days').textContent  = '00';
      document.getElementById('cd-hours').textContent = '00';
      document.getElementById('cd-mins').textContent  = '00';
      document.getElementById('cd-secs').textContent  = '00';
      clearInterval(timerInterval);
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    document.getElementById('cd-days').textContent  = pad(days);
    document.getElementById('cd-hours').textContent = pad(hours);
    document.getElementById('cd-mins').textContent  = pad(mins);
    document.getElementById('cd-secs').textContent  = pad(secs);
  }

  /* ── Activate live timer ── */
  function activateTimer(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    targetDate = d.getTime();
    clearInterval(timerInterval);
    tick();
    timerInterval = setInterval(tick, 1000);

    comingSoonBlock.style.display = 'none';
    timerBlock.style.display      = 'block';
    return true;
  }

  /* ── Restore from localStorage ── */
  const stored = localStorage.getItem(LS_KEY);
  if (stored) {
    activateTimer(stored);
    if (dtInput) dtInput.value = stored.slice(0, 16);
  } else if (EVENT_DATE_FALLBACK) {
    activateTimer(EVENT_DATE_FALLBACK);
  }

  /* ── Public API for config buttons ── */
  window.setCountdownDate = function () {
    if (!dtInput) return;
    const val = dtInput.value;
    if (!val) { alert('Please pick a date and time.'); return; }
    if (activateTimer(val)) {
      localStorage.setItem(LS_KEY, val);
    } else {
      alert('Invalid date — please try again.');
    }
  };

  window.clearCountdownDate = function () {
    localStorage.removeItem(LS_KEY);
    clearInterval(timerInterval);
    targetDate = null;
    timerBlock.style.display      = 'none';
    comingSoonBlock.style.display = 'block';
    if (dtInput) dtInput.value = '';
  };
})();

/* ══════════════════════════════════════════════════════════════
   5. NOTIFY FORM
   ══════════════════════════════════════════════════════════════ */
window.handleNotify = function (e) {
  e.preventDefault();
  const form = e.target;
  form.style.display = 'none';
  document.getElementById('notify-success').style.display = 'block';
};

/* ══════════════════════════════════════════════════════════════
   6. SMOOTH PARALLAX on hero title (subtle mouse move)
   ══════════════════════════════════════════════════════════════ */
(function initParallax() {
  const title = document.querySelector('.hero-title');
  if (!title) return;

  let raf;
  document.addEventListener('mousemove', e => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      title.style.transform = `translate(${dx * 6}px, ${dy * 4}px)`;
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   7. TRACK CARD — hover sparkle border glow
   ══════════════════════════════════════════════════════════════ */
(function initTrackCards() {
  document.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      const isCyan = card.dataset.track === 'hardware';
      const color  = isCyan ? '0,240,255' : '139,92,246';
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
      card.style.backgroundImage =
        `radial-gradient(circle at ${x}% ${y}%, rgba(${color},0.06) 0%, transparent 55%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.backgroundImage = '';
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   8. SPONSOR TIER CARDS — pulse on hover
   ══════════════════════════════════════════════════════════════ */
(function initSponsorCards() {
  document.querySelectorAll('.sponsor-tier').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const placeholder = card.querySelector('.tier-placeholder');
      if (placeholder) {
        placeholder.style.borderColor = 'rgba(255,255,255,0.25)';
        placeholder.style.color = 'rgba(255,255,255,0.4)';
      }
    });
    card.addEventListener('mouseleave', () => {
      const placeholder = card.querySelector('.tier-placeholder');
      if (placeholder) {
        placeholder.style.borderColor = '';
        placeholder.style.color = '';
      }
    });
  });
})();

/* ══════════════════════════════════════════════════════════════
   9. TYPED TAGLINE EFFECT in footer
   ══════════════════════════════════════════════════════════════ */
(function initTyped() {
  const el = document.querySelector('.footer-tagline');
  if (!el) return;
  const text = el.textContent.trim();
  el.textContent = '';

  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    obs.disconnect();

    let i = 0;
    function type() {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(type, 60);
      }
    }
    setTimeout(type, 500);
  }, { threshold: 0.5 });

  obs.observe(el);
})();

console.log('%c⚡ AETHER WAVE 2027 ⚡', 'color:#00f0ff;font-family:monospace;font-size:1.2rem;font-weight:bold;text-shadow:0 0 10px #00f0ff;');
console.log('%cCODE. BUILD. INNOVATE. | IEEE ComSoc SBC NSSCE', 'color:#8b5cf6;font-family:monospace;font-size:0.85rem;');


/* ══════════════════════════════════════════════════════════════
   SPONSOR FORM HANDLER
   ══════════════════════════════════════════════════════════════ */
window.handleSponsor = function (e) {
  e.preventDefault();
  const form = e.target;
  form.style.display = 'none';
  document.getElementById('sponsor-success').style.display = 'block';
  /* Scroll to success message */
  document.getElementById('sponsor-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
};
