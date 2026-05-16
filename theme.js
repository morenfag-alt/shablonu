/**
 * theme.js — премиальная анимация смены темы
 * - View Transitions API: круговое раскрытие из точки клика
 * - Fallback: плавный CSS-fade
 * - SVG sun/moon без emoji
 *
 * Подключается на index, templates, typing.
 * Кнопка должна иметь id="themeBtn".
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme';
  const SUN_PATH = 'M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06';
  const SUN_CIRCLE = '<circle cx="12" cy="12" r="4"/>';
  const MOON_PATH = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';

  function iconForTheme(theme) {
    if (theme === 'dark') {
      // в тёмной теме показываем солнце (переключатель в светлую)
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        SUN_CIRCLE +
        '<path d="' + SUN_PATH + '"/></svg>';
    }
    // в светлой — луна
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="' + MOON_PATH + '"/></svg>';
  }

  function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeBtn');
    if (btn) {
      btn.innerHTML = iconForTheme(theme);
      btn.setAttribute('aria-label', theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему');
      btn.setAttribute('title', theme === 'dark' ? 'Светлая тема' : 'Тёмная тема');
    }
    // Уведомляем страницы, которые рендерят canvas в зависимости от темы
    try {
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    } catch (e) {}
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (sysDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  function toggleTheme(event) {
    const cur = getCurrentTheme();
    const next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);

    // Координаты клика — точка раскрытия круга
    const btn = document.getElementById('themeBtn');
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (event && (event.clientX || event.clientY)) {
      x = event.clientX;
      y = event.clientY;
    } else if (btn) {
      const r = btn.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Уважение к prefers-reduced-motion
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // View Transitions API (Chrome / Edge / Safari TP)
    if (!reduce && typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(() => {
        applyTheme(next);
      });

      transition.ready.then(() => {
        const goingDark = next === 'dark';
        // В тёмную — раскрываем тёмное пятно из клика; в светлую — наоборот
        document.documentElement.animate(
          {
            clipPath: goingDark
              ? ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)']
              : ['circle(' + endRadius + 'px at ' + x + 'px ' + y + 'px)', 'circle(0px at ' + x + 'px ' + y + 'px)']
          },
          {
            duration: 620,
            easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
            pseudoElement: goingDark ? '::view-transition-new(root)' : '::view-transition-old(root)'
          }
        );
      }).catch(() => {});
      return;
    }

    // Fallback — плавный CSS fade (transition уже задано в body на background/color)
    applyTheme(next);
  }

  function bindButton() {
    const btn = document.getElementById('themeBtn');
    if (!btn) return;
    // sanitize: убираем emoji-текст и текущее содержимое, ставим SVG
    btn.textContent = '';
    btn.innerHTML = iconForTheme(getCurrentTheme());
    btn.addEventListener('click', toggleTheme);
  }

  // Инициализация максимально рано — до paint
  initTheme();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindButton);
  } else {
    bindButton();
  }

  // Экспорт на случай ручного вызова
  window.__themeToggle = toggleTheme;
  window.__themeApply = applyTheme;
})();
