/*
 * Results: the three figures that were in the hero's footer, in their own short band between the
 * hero and Section 2, framed as what testing showed. The headline sits on the left and the figures
 * in one row between hairlines on the right; they count up from zero once the band scrolls into view.
 */
(() => {
  'use strict';
  const sec = document.querySelector('.rs');
  if (!sec) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nums = [...sec.querySelectorAll('[data-n]')];
  if (!reduce) nums.forEach((el) => { el.textContent = '0'; });

  // count up from zero, easing out
  function count() {
    nums.forEach((el) => {
      const n = +el.dataset.n;
      if (reduce) { el.textContent = n; return; }
      const t0 = performance.now(), D = 1400;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / D);
        el.textContent = Math.round(n * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    sec.classList.add('is-in');
    count();
  }, { threshold: 0.35 }).observe(sec);
})();
