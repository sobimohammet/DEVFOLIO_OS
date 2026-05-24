/* ============================================================
   DEVFOLIO_OS — Shared JavaScript Foundation
   ============================================================ */

'use strict';

/* ── DOM Ready helper ─────────────────────────────────────── */
const ready = (fn) => {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
};

/* ── Utility: debounce ────────────────────────────────────── */
function debounce(fn, ms = 100) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ── Utility: clamp ───────────────────────────────────────── */
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/* ── Active nav link ──────────────────────────────────────── */
function initNav() {
  const links = document.querySelectorAll('.nav-link');
  const current = window.location.pathname.split('/').pop() || 'index.html';

  links.forEach(link => {
    const href = link.getAttribute('href').replace('./', '');
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* Mobile toggle */
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      const spans = toggle.querySelectorAll('span');
      if (open) {
        spans[0].style.transform = 'translateY(6px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    /* Close on link click */
    navLinks.querySelectorAll('.nav-link').forEach(l => {
      l.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
      });
    });
  }

  /* Nav scroll behaviour – add shadow when scrolled */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = debounce(() => {
      nav.style.boxShadow = window.scrollY > 20
        ? '0 4px 30px rgba(0,0,0,0.5)'
        : '';
    }, 50);
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

/* ── Scroll-reveal (IntersectionObserver) ─────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
}

/* ── Typing effect ────────────────────────────────────────── */
function typeText(el, text, speed = 50, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      let i = 0;
      el.textContent = '';
      const tick = () => {
        if (i < text.length) {
          el.textContent += text[i++];
          setTimeout(tick, speed + Math.random() * (speed * 0.5));
        } else {
          resolve();
        }
      };
      tick();
    }, delay);
  });
}

/* ── Async terminal sequence ──────────────────────────────── */
async function runTerminalSequence(lines) {
  /*
    lines: Array of { selector, text, speed?, delay? }
    selector targets the element to type into.
  */
  for (const line of lines) {
    const el = document.querySelector(line.selector);
    if (!el) continue;
    await typeText(el, line.text, line.speed ?? 45, line.delay ?? 0);
  }
}

/* ── Particle / starfield canvas ─────────────────────────── */
function initStarfield(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;

  const COLORS = ['rgba(0,245,255,', 'rgba(139,47,255,', 'rgba(196,61,255,'];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeParticles(n = 120) {
    particles = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.6 + 0.2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      // Draw particle
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();

      // Draw connections
      particles.forEach(q => {
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = p.color + (0.06 * (1 - dist / 100)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      // Move
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });

    requestAnimationFrame(draw);
  }

  resize();
  makeParticles();
  draw();
  window.addEventListener('resize', debounce(() => { resize(); makeParticles(); }, 200));
}

/* ── Mouse-parallax for hero elements ────────────────────── */
function initParallax(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const layers = container.querySelectorAll('[data-depth]');

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;

    layers.forEach(el => {
      const depth = parseFloat(el.dataset.depth) || 0;
      const tx = dx * depth * 30;
      const ty = dy * depth * 30;
      el.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });

  container.addEventListener('mouseleave', () => {
    layers.forEach(el => {
      el.style.transform = '';
    });
  });
}

/* ── Cursor glow effect ───────────────────────────────────── */
function initCursorGlow() {
  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  Object.assign(glow.style, {
    position: 'fixed',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: '9999',
    transform: 'translate(-50%, -50%)',
    transition: 'left 0.08s linear, top 0.08s linear',
    left: '-9999px',
    top: '-9999px',
  });
  document.body.appendChild(glow);

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}

/* ── Counter animation ────────────────────────────────────── */
function animateCounter(el, target, duration = 1500, suffix = '') {
  const start = performance.now();
  const from = 0;
  const tick = (now) => {
    const elapsed = now - start;
    const progress = clamp(elapsed / duration, 0, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = Math.round(from + (target - from) * ease);
    el.textContent = val + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── Noise overlay (dynamic canvas) ─────────────────────── */
function injectNoise() {
  const div = document.createElement('div');
  div.className = 'noise';
  document.body.prepend(div);
}

/* ── Orbs ─────────────────────────────────────────────────── */
function injectOrbs() {
  const orbs = document.createElement('div');
  orbs.innerHTML = `
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  `;
  Array.from(orbs.children).forEach(o => document.body.prepend(o));
}

/* ── Clipboard copy helper ────────────────────────────────── */
async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = 'COPIED!';
    btn.style.color = 'var(--cyan)';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.color = '';
    }, 2000);
  } catch {
    /* silent fail */
  }
}

/* ── Live system clock (for nav/footer) ───────────────────── */
function initClock(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const tick = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${hh}:${mm}:${ss}`;
  };
  tick();
  setInterval(tick, 1000);
}

/* ── Smooth page-exit transitions ─────────────────────────── */
function initPageTransitions() {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    /* Only local .html links */
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.25s ease';
      setTimeout(() => { window.location.href = href; }, 260);
    });
  });

  /* Fade in */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.4s ease';
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.body.style.opacity = '1';
    }, 10);
  });
}

/* ── DEVFOLIO_OS boot sequence (console) ──────────────────── */
function bootConsole() {
  const style1 = 'color:#00f5ff;font-weight:bold;font-size:14px;font-family:monospace';
  const style2 = 'color:#7da8cc;font-size:11px;font-family:monospace';
  const style3 = 'color:#8b2fff;font-size:11px;font-family:monospace';
  console.log('%cDEVFOLIO_OS v1.0.0', style1);
  console.log('%c> System online. All modules loaded.', style2);
  console.log('%c> Build: terminal × holographic', style3);
  console.log('%c> © 2025 Alex Vance. All rights reserved.', style2);
}

/* ── Master init ──────────────────────────────────────────── */
ready(() => {
  bootConsole();
  injectNoise();
  injectOrbs();
  initNav();
  initReveal();
  initCursorGlow();
  initPageTransitions();
  initClock('.js-clock');

  /* Expose utilities globally for page-specific scripts */
  window.DEVFOLIO = {
    typeText,
    runTerminalSequence,
    initStarfield,
    initParallax,
    animateCounter,
    copyToClipboard,
  };
});
