/*
 * Section 2, "Formulas" (the default; Page options → Section 2 → Scan): the six rules from the Shapes section
 * rewritten by scroll. The frame pins under the nav for the height of the viewport while the
 * section's tall track scrolls past, and an AgentDNA scan line sweeps down the list with the scroll:
 * above it every rule is already in its corrected form, below it the old one. Scrolling back up
 * plays it in reverse. (Five other styles were moved to section_2_formulas_backup/.)
 */
(() => {
  'use strict';
  const sec = document.querySelector('.fx');
  if (!sec || !window.S2) return;
  const { ROWS, fmt, isOp, el } = S2;
  const N = ROWS.length;

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const pad = (i) => String(i + 1).padStart(2, '0');
  // one side of a rule: before drops the new (n) tokens, after the struck (o) ones
  const side = (r, mode) => r.diff.filter(([, k]) => k !== (mode === 'before' ? 'n' : 'o'));
  const tokHtml = ([m, k]) => `<span class="tk${isOp(m) ? ' tk--op' : ''}${k ? ' tk--' + k : ''}">${fmt(m)}</span>`;
  const sideEq = (r, mode) => side(r, mode).map(tokHtml).join('');
  const statePill = (cls, b, a) => `<span class="${cls}"><span class="${cls}-b">${b}</span><span class="${cls}-a"><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 6.3l2.2 2.2 4.6-4.9"/></svg>${a}</span></span>`;

  /* ---------- Scan: the AgentDNA scan line sweeps the list; above it every rule is already rewritten ---------- */
  const Scan = {
    mount(stage) {
      const root = el('div', 'fsc', stage);
      const panel = el('div', 'fsc__panel', root);
      const list = el('div', 'fsc__rows', panel);
      const rows = ROWS.map((r, i) => {
        const row = el('div', 'fsc__row', list, `
          <span class="fsc__no">${pad(i)}</span><span class="fsc__title">${r.title}</span>
          <div class="fsc__cell"><div class="eq fsc__eq fsc__eq--b">${sideEq(r, 'before')}</div><div class="eq fsc__eq fsc__eq--a">${sideEq(r, 'after')}</div></div>
          ${statePill('fsc__state', 'Before agents', 'Rewritten')}`);
        return { row, cell: row.querySelector('.fsc__cell'), b: row.querySelector('.fsc__eq--b'), a: row.querySelector('.fsc__eq--a') };
      });
      const beam = el('div', 'fsc__beam', panel, '<span class="fsc__chip"><i></i><b></b></span>');
      const chip = beam.querySelector('b');
      return {
        update(p) {
          const f = clamp((p - 0.05) / 0.85);
          const pr = panel.getBoundingClientRect(), lr = list.getBoundingClientRect();
          const top = lr.top - pr.top, y = top - 32 + f * (lr.height + 64); // from just above the list to just below it
          beam.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
          let under = -1, done = 0;
          rows.forEach((o, i) => {
            const cr = o.cell.getBoundingClientRect(), rr = o.row.getBoundingClientRect();
            const ct = cr.top - pr.top, Y = clamp(y - ct, 0, cr.height + 2);
            // pixel-exact: the corrected rule shows above the line, the old one below it
            o.a.style.clipPath = `inset(0 0 calc(100% - ${Y.toFixed(1)}px) 0)`;
            o.b.style.clipPath = `inset(${Y.toFixed(1)}px 0 0 0)`;
            const isDone = y >= ct + cr.height * 0.6;
            o.row.classList.toggle('is-done', isDone);
            if (isDone) done++;
            if (y >= rr.top - pr.top && y < rr.bottom - pr.top) under = i;
          });
          chip.textContent = under >= 0 ? `Scanning · ${ROWS[under].title}` : done === N ? `${N} of ${N} rules rewritten` : 'Scroll to scan';
          beam.classList.toggle('is-done', done === N);
        },
      };
    },
  };

  /* ---------- the shell: pinned frame, scroll progress ---------- */
  const track = sec.querySelector('.fx__track'), pin = sec.querySelector('.fx__pin');
  const stage = sec.querySelector('.fx__stage');
  const scan = Scan.mount(stage);
  let raf = 0;

  function progress() {
    const range = track.offsetHeight - pin.offsetHeight;
    const top = parseFloat(getComputedStyle(pin).top) || 0;
    return range > 0 ? clamp((top - track.getBoundingClientRect().top) / range) : 1;
  }
  function update() {
    raf = 0;
    if (sec.hidden) return;
    scan.update(progress());
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
  if (document.fonts) document.fonts.ready.then(queue);

  // the Page options panel calls this when the section is shown again
  window.S2Formulas = { refresh: update };
})();
