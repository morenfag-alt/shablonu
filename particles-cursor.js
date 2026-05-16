/**
 * particles-cursor.js
 * - Animated particle background (canvas)
 * - Custom cursor with trail & click burst
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────
     PARTICLES BACKGROUND
  ───────────────────────────────────────── */
  function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-bg';
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '0',
      pointerEvents: 'none',
    });
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, particles, mouse = { x: -999, y: -999 };
    const COUNT = 90;
    const MAX_DIST = 130;

    function getAccent() {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim() || '#3f7bff';
    }

    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const n = parseInt(hex, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function createParticle() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.15 + Math.random() * 0.35;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1.2 + Math.random() * 2.2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.3 + Math.random() * 0.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.008 + Math.random() * 0.012,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: COUNT }, createParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const accentHex = getAccent();
      let [r, g, b] = [63, 123, 255];
      try { [r, g, b] = hexToRgb(accentHex); } catch (_) {}

      particles.forEach(p => {
        // move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        // pulse opacity
        p.pulse += p.pulseSpeed;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));

        // mouse repel (soft)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          const force = (90 - dist) / 90 * 0.6;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${(isDark ? a : a * 0.55)})`;
        ctx.fill();
      });

      // draw lines between close particles & mouse
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j];
          const dx = pi.x - pj.x, dy = pi.y - pj.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const lineA = (1 - d / MAX_DIST) * (isDark ? 0.18 : 0.1);
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${lineA})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
        // line to mouse
        const mx = pi.x - mouse.x, my = pi.y - mouse.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md < MAX_DIST * 1.2) {
          const la = (1 - md / (MAX_DIST * 1.2)) * (isDark ? 0.35 : 0.2);
          ctx.beginPath();
          ctx.moveTo(pi.x, pi.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${la})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });

    init();
    draw();
  }

  /* ─────────────────────────────────────────
     CUSTOM CURSOR
  ───────────────────────────────────────── */
  function initCursor() {
    // Only on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const style = document.createElement('style');
    style.textContent = `
      * { cursor: none !important; }
      #kiro-cursor-outer {
        position: fixed; top: 0; left: 0; z-index: 99999;
        width: 36px; height: 36px; border-radius: 50%;
        border: 2px solid var(--accent, #3f7bff);
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: width 0.25s, height 0.25s, border-color 0.25s, opacity 0.25s, background 0.25s;
        mix-blend-mode: screen;
        will-change: transform;
        opacity: 0.85;
      }
      #kiro-cursor-inner {
        position: fixed; top: 0; left: 0; z-index: 100000;
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--accent, #3f7bff);
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: width 0.12s, height 0.12s, opacity 0.25s;
        will-change: transform;
      }
      #kiro-cursor-outer.hover {
        width: 54px; height: 54px;
        background: rgba(63,123,255,0.08);
        border-color: var(--accent2, #6c9bff);
      }
      #kiro-cursor-outer.click {
        width: 20px; height: 20px;
        background: rgba(63,123,255,0.25);
      }
      #kiro-cursor-inner.click {
        width: 3px; height: 3px;
      }
    `;
    document.head.appendChild(style);

    const outer = document.createElement('div');
    outer.id = 'kiro-cursor-outer';
    const inner = document.createElement('div');
    inner.id = 'kiro-cursor-inner';
    document.body.appendChild(outer);
    document.body.appendChild(inner);

    let mx = -200, my = -200;
    let ox = -200, oy = -200;

    // smooth lag for outer ring
    function lerp(a, b, t) { return a + (b - a) * t; }

    function animCursor() {
      ox = lerp(ox, mx, 0.13);
      oy = lerp(oy, my, 0.13);
      outer.style.left = ox + 'px';
      outer.style.top = oy + 'px';
      requestAnimationFrame(animCursor);
    }

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      inner.style.left = mx + 'px';
      inner.style.top = my + 'px';
    });

    // hover effect on interactive elements
    const hoverSels = 'a, button, [role="button"], input, textarea, select, label, .card, .feature, .cat-btn, .opt-btn, .btn, .tab-btn';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverSels)) outer.classList.add('hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverSels)) outer.classList.remove('hover');
    });

    // click burst
    document.addEventListener('mousedown', () => {
      outer.classList.add('click');
      inner.classList.add('click');
    });
    document.addEventListener('mouseup', () => {
      outer.classList.remove('click');
      inner.classList.remove('click');
    });

    animCursor();

    /* ── Trail particles on move ── */
    const trailCanvas = document.createElement('canvas');
    trailCanvas.id = 'kiro-trail';
    Object.assign(trailCanvas.style, {
      position: 'fixed', inset: '0',
      width: '100%', height: '100%',
      zIndex: '99998',
      pointerEvents: 'none',
    });
    document.body.appendChild(trailCanvas);
    const tc = trailCanvas.getContext('2d');
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
      trailCanvas.width = window.innerWidth;
      trailCanvas.height = window.innerHeight;
    });

    let trailParticles = [];

    function getAccentRgb() {
      const hex = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim().replace('#', '');
      try {
        const n = parseInt(hex.length === 3 ? hex.split('').map(c => c+c).join('') : hex, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      } catch { return [63, 123, 255]; }
    }

    let lastTrailX = -999, lastTrailY = -999;
    document.addEventListener('mousemove', e => {
      const dx = e.clientX - lastTrailX;
      const dy = e.clientY - lastTrailY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      if (speed > 4) {
        const count = Math.min(3, Math.floor(speed / 8) + 1);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const v = 0.4 + Math.random() * 1.2;
          trailParticles.push({
            x: e.clientX + (Math.random() - 0.5) * 6,
            y: e.clientY + (Math.random() - 0.5) * 6,
            vx: Math.cos(angle) * v,
            vy: Math.sin(angle) * v - 0.5,
            r: 1.5 + Math.random() * 2.5,
            life: 1,
            decay: 0.04 + Math.random() * 0.04,
          });
        }
        lastTrailX = e.clientX;
        lastTrailY = e.clientY;
      }
    });

    // click burst
    document.addEventListener('click', e => {
      const [r, g, b] = getAccentRgb();
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
        const v = 1.5 + Math.random() * 3;
        trailParticles.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v,
          r: 2 + Math.random() * 3,
          life: 1,
          decay: 0.03 + Math.random() * 0.03,
          burst: true,
          rgb: [r, g, b],
        });
      }
    });

    function drawTrail() {
      tc.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
      const [r, g, b] = getAccentRgb();

      trailParticles = trailParticles.filter(p => p.life > 0);
      trailParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.vx *= 0.97;
        p.life -= p.decay;

        const cr = (p.rgb || [r, g, b]);
        tc.beginPath();
        tc.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        tc.fillStyle = `rgba(${cr[0]},${cr[1]},${cr[2]},${p.life * 0.7})`;
        tc.fill();
      });
      requestAnimationFrame(drawTrail);
    }

    drawTrail();
  }

  /* ─────────────────────────────────────────
     BOOT
  ───────────────────────────────────────── */
  function boot() {
    initParticles();
    initCursor();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
