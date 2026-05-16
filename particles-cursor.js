/**
 * particles-cursor.js
 * Лёгкие фоновые частицы (canvas).
 * Кастомный курсор удалён — он мешает доступности и считается AI-tell.
 * Подстраивается под текущий --accent (warm amber) и тему.
 */
(function () {
  'use strict';

  // На сенсорных устройствах фон-частицы избыточны
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  // Уважаем prefers-reduced-motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ambient-particles';
    Object.assign(canvas.style, {
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      zIndex: '1',
      pointerEvents: 'none',
      opacity: '0.85',
    });
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, particles, mouse = { x: -9999, y: -9999 };
    const COUNT = 48;
    const MAX_DIST = 140;

    function getAccentRgb() {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      // Пытаемся распарсить hex
      let hex = v.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (/^[0-9a-f]{6}$/i.test(hex)) {
        const n = parseInt(hex, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      }
      // Пробуем rgb()
      const m = v.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
      // Дефолт — тёплый amber
      return [184, 134, 76];
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticle() {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.10 + Math.random() * 0.22;
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.8 + Math.random() * 1.6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.2 + Math.random() * 0.4,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.01,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: COUNT }, createParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const [r, g, b] = getAccentRgb();

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        p.pulse += p.pulseSpeed;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80 && dist > 0) {
          const force = (80 - dist) / 80 * 0.4;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (isDark ? a * 0.8 : a * 0.45) + ')';
        ctx.fill();
      });

      // тонкие линии между близкими частицами
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j];
          const dx = pi.x - pj.x, dy = pi.y - pj.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const lineA = (1 - d / MAX_DIST) * (isDark ? 0.10 : 0.05);
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + lineA + ')';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    init();
    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticles);
  } else {
    initParticles();
  }
})();
