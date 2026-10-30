/*
 * Section 2 (from section_2/, "Shapes" concept), "Before AI agents / After AI agents": the six equations as data,
 * the small helpers they need, and the Shapes layout, mounted straight into the .s2 stage box (no concept switcher).
 */
window.S2 = (() => {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPS = new Set(['=', '∈', '⊂', '⊆', '≈', '⇒', '∩', '+']);

  // b / a: before and after tokens. diff: the rewrite (o = struck from before, n = new after).
  const ROWS = [
    {
      key: 'identity', title: 'Identity',
      b: ['Identifier', '=', 'Identity'],
      a: ['Identifier', '∈', 'Identity'],
      diff: [['Identifier'], ['=', 'o'], ['∈', 'n'], ['Identity']],
      before: 'An API key was the identity. Hold the key and you were “you”.',
      after: 'The key is one part. Identity also says who built the agent, who it acts for and what it’s for.',
    },
    {
      key: 'delegation', title: 'Delegation',
      b: ['Delegated Authority', '=', 'User Authority'],
      a: ['Delegated Authority', '⊆', 'User Authority'],
      diff: [['Delegated Authority'], ['=', 'o'], ['⊆', 'n'], ['User Authority']],
      before: 'An agent acting for you got everything you could do.',
      after: 'It gets only the slice of your authority the task needs. Never more.',
    },
    {
      key: 'policies', title: 'Agent policies',
      b: ['Policies', '≈', 'Guidelines'],
      a: ['Policies', '⇒', 'Runtime Enforcement'],
      diff: [['Policies'], ['≈', 'o'], ['Guidelines', 'o'], ['⇒', 'n'], ['Runtime Enforcement', 'n']],
      before: 'Rules lived in docs and prompts. Agents were trusted to follow them.',
      after: 'Every rule is checked the moment the agent acts.',
    },
    {
      key: 'access', title: 'Access control',
      b: ['Access', '=', 'Permissions'],
      a: ['Access', '=', 'Policy', '∩', 'Intent', '∩', 'Delegation', '∩', 'Workflow State'],
      diff: [['Access'], ['='], ['Permissions', 'o'], ['Policy', 'n'], ['∩', 'n'], ['Intent', 'n'], ['∩', 'n'], ['Delegation', 'n'], ['∩', 'n'], ['Workflow State', 'n']],
      before: 'If the permission existed, the action went through.',
      after: 'An action runs only where policy, intent, delegation and the current step all agree.',
    },
    {
      key: 'provenance', title: 'Provenance',
      b: ['Logs', '=', 'Activity Records'],
      a: ['Provenance', '=', 'Verifiable Graph of Events'],
      diff: [['Logs', 'o'], ['Provenance', 'n'], ['='], ['Activity Records', 'o'], ['Verifiable Graph of Events', 'n']],
      before: 'Logs listed what happened, one line at a time, with nothing tying them together.',
      after: 'Every action links back to the prompt that started it, and every link can be proven.',
    },
    {
      key: 'evolution', title: 'Identity evolution',
      b: ['Identity(t+1)', '=', 'Identity(t)'],
      a: ['Identity(t+1)', '=', 'Identity(t)', '+', 'ΔVerified Intelligence(t)'],
      diff: [['Identity(t+1)'], ['='], ['Identity(t)'], ['+', 'n'], ['ΔVerified Intelligence(t)', 'n']],
      before: 'An identity was issued once and never changed, while the agent behind it did.',
      after: 'Agents learn, so their identity grows with them, but only by what has been verified.',
    },
  ];

  const isOp = (m) => OPS.has(m);
  const fmt = (m) => m.replace('(t+1)', '(<i>t</i>+1)').replace('(t)', '(<i>t</i>)');
  const tok = (m, cls = '') => `<span class="tk${isOp(m) ? ' tk--op' : ''}${cls ? ' ' + cls : ''}">${fmt(m)}</span>`;
  const eq = (tokens) => tokens.map((m) => tok(m)).join('');
  // the rewrite as slots: an ancestor's data-mode (before | after) collapses the struck (o) or added (n) tokens
  const diffEq = (r) => r.diff.map(([m, k]) => `<span class="slot${k ? ' slot--' + k : ''}">${tok(m)}</span>`).join('');
  const plain = (tokens) => tokens.join(' ');

  const el = (tag, cls, parent, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  };

  // timers a concept clears in one go when it is switched away
  function timers() {
    const ids = new Set();
    return {
      after(ms, fn) { const id = setTimeout(() => { ids.delete(id); fn(); }, ms); ids.add(id); return id; },
      clear() { ids.forEach(clearTimeout); ids.clear(); },
    };
  }

  // a frame loop with dt in seconds; returns stop()
  function loop(fn) {
    let raf = 0, last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      fn(dt, now / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }

  // a two-option switch; returns { el, set, get }
  function seg(parent, options, value, onChange, label, cls = '') {
    const wrap = el('div', 'seg ' + cls, parent);
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', label);
    wrap.innerHTML = options.map(([v, t]) => `<button type="button" class="seg__btn" data-v="${v}">${t}</button>`).join('') + '<span class="seg__thumb" aria-hidden="true"></span>';
    const set = (v, silent) => {
      value = v;
      wrap.querySelectorAll('.seg__btn').forEach((b, i) => {
        const on = b.dataset.v === v;
        b.setAttribute('aria-pressed', on);
        if (on) wrap.style.setProperty('--seg-i', i);
      });
      if (!silent) onChange(v);
    };
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('.seg__btn');
      if (b && b.dataset.v !== value) set(b.dataset.v);
    });
    set(value, true);
    return { el: wrap, set, get: () => value };
  }

  return { reduce, ROWS, isOp, fmt, tok, eq, diffEq, plain, el, timers, loop, seg };
})();

/* Shapes: each rule drawn as a diagram whose parts physically move from the old shape to the new one */
S2.shapes = ({
  id: 'shapes', name: 'Shapes',
  blurb: 'Each rule as a diagram. The same parts move from the old shape to the new one.',
  mount(stage) {
    const { el, ROWS, diffEq, seg, timers, loop, reduce } = S2;
    const tm = timers();
    const NS = 'http://www.w3.org/2000/svg';

    const cap = (b, a) => `<text class="cap cap--b" x="320" y="404">${b}</text><text class="cap cap--a" x="320" y="404">${a}</text>`;
    const chip = (x, y, w, t, cls = '', d = 0) => `<g transform="translate(${x} ${y})"><g class="chip ${cls}" style="--d:${d}ms"><rect x="${-w / 2}" y="-18" width="${w}" height="36" rx="18"/><text y="1">${t}</text></g></g>`;

    const SCENES = {
      identity: `
        <circle class="id-whole" cx="320" cy="210" r="110"/>
        ${chip(352, 136, 150, 'Who built it', 'id-chip', 0)}
        ${chip(380, 210, 160, 'Who it acts for', 'id-chip', 90)}
        ${chip(352, 284, 150, 'What it’s for', 'id-chip', 180)}
        <g class="id-key"><circle cx="320" cy="210" r="110"/>
          <g transform="translate(320 210)" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"><circle cx="-22" cy="0" r="18"/><path d="M-4 0H40M28 0v14M40 0v10"/></g>
        </g>
        <text class="id-keylbl" x="224" y="268">API key</text>
        <text class="id-inlbl" x="320" y="290">API key</text>
        ${cap('The key is the whole identity', 'The key is one part of the identity')}`,

      delegation: `
        <rect class="dg-user" x="140" y="96" width="360" height="228" rx="20"/>
        <text class="dg-ulbl" x="162" y="126">Your authority</text>
        ${['Read tickets', 'Draft replies', 'Issue refunds', 'Export data', 'Billing', 'Admin'].map((t, i) =>
          chip(210 + (i % 3) * 110, 184 + Math.floor(i / 3) * 66, 100, t, i < 2 ? 'dg-in' : 'dg-out', i * 60)).join('')}
        <rect class="dg-agent" x="150" y="148" width="340" height="140" rx="26"/>
        <text class="dg-albl" x="486" y="140">Agent</text>
        ${cap('The agent gets all of it', 'The agent gets this task’s slice')}`,

      policies: `
        <g class="pl-doc"><rect x="48" y="153" width="152" height="111" rx="12"/>
          <text class="pl-doct" x="66" y="181">Agent rules</text>
          <text class="pl-docs" x="66" y="207">Never send customer</text><text class="pl-docs" x="66" y="223">data outside the</text><text class="pl-docs" x="66" y="239">workspace.</text></g>
        <line class="pl-track" x1="214" y1="210" x2="616" y2="210"/>
        <line class="pl-guide" x1="420" y1="146" x2="420" y2="274"/>
        <rect class="pl-gate" x="413" y="146" width="14" height="128" rx="7"/>
        <text class="pl-glbl pl-glbl--b" x="420" y="132">A guideline</text>
        <text class="pl-glbl pl-glbl--a" x="420" y="132">Checked here</text>
        <g class="pl-dots"></g>
        ${cap('Rules are read once, then hoped for', 'Every action is checked against the rule')}`,

      access: `
        ${[[-55, -45], [55, -45], [-55, 45], [55, 45]].map(([x, y], i) => `<circle class="ac-c" style="--x:${x}px;--y:${y}px" cx="320" cy="210" r="100"/>`).join('')}
        <defs>${[[-55, -45], [55, -45], [-55, 45], [55, 45]].map(([x, y], i) => `<clipPath id="ac-k${i}"><circle cx="${320 + x}" cy="${210 + y}" r="100"/></clipPath>`).join('')}</defs>
        <g class="ac-grant" clip-path="url(#ac-k0)"><g clip-path="url(#ac-k1)"><g clip-path="url(#ac-k2)"><rect clip-path="url(#ac-k3)" x="220" y="110" width="200" height="200" fill="rgba(47, 107, 240, 0.32)"/></g></g></g>
        <text class="ac-perm" x="320" y="214">Permissions</text>
        <text class="ac-l" x="196" y="64" text-anchor="end">Policy</text>
        <text class="ac-l" x="444" y="64" text-anchor="start">Intent</text>
        <text class="ac-l" x="196" y="364" text-anchor="end">Delegation</text>
        <text class="ac-l" x="444" y="364" text-anchor="start">Workflow state</text>
        <g class="ac-dots"></g>
        ${cap('Inside the permission? Allowed.', 'Allowed only where all four overlap')}`,

      provenance: `
        <g class="pv-edges">
          <path pathLength="1" d="M160 210H190"/>
          <path pathLength="1" d="M310 210C330 210 330 130 350 130"/>
          <path pathLength="1" d="M310 210C330 210 330 290 350 290"/>
          <path pathLength="1" d="M470 130C486 130 486 210 500 210"/>
          <path pathLength="1" d="M470 290C486 290 486 210 500 210"/>
        </g>
        ${[['Prompt', 100, 210], ['Support agent', 250, 210], ['Policy check', 410, 130], ['Helpdesk API', 410, 290], ['Refund issued', 560, 210]].map(([t, x, y], i) => {
          const bx = 330, by = 120 + i * 45;
          return `<g class="pv-node" style="--bx:${bx - x}px;--by:${by - y}px;--d:${i * 70}ms"><g transform="translate(${x} ${y})"><rect x="-60" y="-17" width="120" height="34" rx="17"/><text y="1">${t}</text></g></g>
            <text class="pv-time" x="${bx - 74}" y="${by + 4}">10:42:0${i + 1}</text>`;
        }).join('')}
        <g class="pv-seal"><circle cx="560" cy="256" r="13"/><path d="M553 256l5 5 9-10"/><text x="560" y="292">Every link signed</text></g>
        ${cap('A list of lines, nothing joins them', 'A chain from prompt to result you can prove')}`,

      evolution: `
        <circle class="ev-ring ev-ring--2" cx="450" cy="200" r="96"/>
        <circle class="ev-ring ev-ring--1" cx="450" cy="200" r="78"/>
        <circle class="ev-core" cx="190" cy="200" r="62"/><circle class="ev-core" cx="450" cy="200" r="62"/>
        <text class="ev-in" x="190" y="196">Agent</text><text class="ev-in" x="190" y="214">identity</text>
        <text class="ev-in" x="450" y="196">Agent</text><text class="ev-in" x="450" y="214">identity</text>
        <text class="ev-op" x="320" y="214">=</text>
        <text class="ev-t" x="190" y="300">Today</text><text class="ev-t" x="450" y="322">Tomorrow</text>
        <text class="ev-add" style="--d:0ms" x="450" y="66">+ a new skill, verified</text>
        <text class="ev-add" style="--d:200ms" x="450" y="88">+ a lesson from its last task, verified</text>
        <text class="ev-rej" x="450" y="350">Something picked up from an unknown source: left out</text>
        ${cap('The same identity, forever', 'It grows, but only by what was verified')}`,
    };

    // this layout carries the section headline in its own left column
    const frame = stage.closest('.frame');
    const head = frame.querySelector('.frame__head');
    frame.classList.add('is-split');

    const root = el('div', 'sh', stage, `
      <div class="sh__side">
        <div class="sh__head">${head.innerHTML}</div>
        <nav class="sh__nav" aria-label="Rules">${ROWS.map((r, i) => `<button type="button" data-i="${i}">${r.title}</button>`).join('')}</nav>
      </div>
      <div class="sh__card">
        <div class="sh__ctl"><p class="sh__ctl-h" id="sh-ctl-h">Agents</p></div>
        <div class="sh__text">
          <div class="eq sh__eq"></div>
          <div class="sh__words"><p class="sh__w sh__w--b"></p><p class="sh__w sh__w--a"></p></div>
        </div>
        <svg class="sh__fig" viewBox="0 40 640 384" role="img" aria-label="Diagram of the rule">${ROWS.map((r) => `<g class="sc" data-k="${r.key}">${SCENES[r.key]}</g>`).join('')}</svg>
      </div>`);

    const fig = root.querySelector('.sh__fig');
    const eqEl = root.querySelector('.sh__eq');
    const navBtns = [...root.querySelectorAll('.sh__nav button')];
    const HOLD_B = 2880, HOLD_A = 4320; // ms shown before, then after, per rule
    let cur = 0, auto = !reduce;
    let held = 'hold' in stage.dataset; // drawn but still until the page calls stage.s2Start()

    const setMode = (m) => { root.dataset.mode = m; sw.set(m, true); };
    const sw = seg(root.querySelector('.sh__ctl'), [['before', 'Before'], ['after', 'After']], 'before', (m) => { root.dataset.mode = m; play(m); }, 'Before or after agents');

    function show(i) {
      tm.clear();
      cur = i;
      const r = ROWS[i];
      root.classList.add('no-anim');
      setMode('before');
      fig.querySelectorAll('.sc').forEach((g) => g.classList.toggle('is-on', g.dataset.k === r.key));
      fig.querySelectorAll('.pl-dots, .ac-dots').forEach((g) => g.replaceChildren());
      dots.length = 0;
      eqEl.innerHTML = diffEq(r);
      root.querySelector('.sh__w--b').textContent = r.before;
      root.querySelector('.sh__w--a').textContent = r.after;
      navBtns.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
      const nav = navBtns[i].parentElement; // scrolls only on phones, where the tabs run sideways
      nav.scrollTo({ left: navBtns[i].offsetLeft - nav.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      void root.offsetWidth;
      root.classList.remove('no-anim');
      if (auto) play('before');
    }
    // autoplay carries on from wherever the visitor puts it: a clicked state or a clicked rule
    function play(from) {
      tm.clear();
      if (!auto || held) return;
      const left = from === 'before' ? HOLD_B + HOLD_A : HOLD_A;
      if (from === 'before') tm.after(HOLD_B, () => setMode('after'));
      tm.after(left, () => show((cur + 1) % ROWS.length));
      root.style.setProperty('--prog', left + 'ms');
      root.classList.remove('is-auto'); void root.offsetWidth; root.classList.add('is-auto'); // restart the tab's progress bar
    }
    navBtns.forEach((b) => b.addEventListener('click', () => { show(+b.dataset.i); if (!auto) setMode('after'); }));

    // moving actions for the policies gate and the access overlap
    const dots = [];
    const AC = [[-55, -45], [55, -45], [-55, 45], [55, 45]];
    let spawnT = 0, count = 0, lastAfter = false;
    const circ = (g, cls, x, y, r) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', cls);
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', r);
      g.appendChild(c);
      return c;
    };
    const stop = loop((dt) => {
      const key = ROWS[cur].key, after = root.dataset.mode === 'after';
      spawnT -= dt;
      if (key === 'policies') {
        const g = fig.querySelector('.pl-dots');
        if (spawnT <= 0) { spawnT = 0.62; const bad = count++ % 4 === 3; dots.push({ x: 214, bad, hold: 0, done: false, n: circ(g, bad ? 'pd pd--bad' : 'pd', 214, 210, 9) }); }
        for (let i = dots.length - 1; i >= 0; i--) {
          const d = dots[i];
          if (d.done) { d.hold += dt; d.n.style.opacity = Math.max(0, 1 - d.hold / 0.7); if (d.hold > 0.7) { d.n.remove(); dots.splice(i, 1); } continue; }
          if (after && d.x < 402 && d.x + 130 * dt >= 402) {
            d.x = 402;
            if (d.bad) { d.done = true; d.hold = 0; d.n.setAttribute('class', 'pd pd--stop'); }
            else { d.hold = 0.22; d.n.classList.add('pd--ok'); }
          }
          if (d.hold > 0 && !d.done) { d.hold -= dt; continue; }
          d.x += 130 * dt;
          d.n.setAttribute('cx', d.x.toFixed(1));
          if (d.x > 616) { d.n.remove(); dots.splice(i, 1); }
        }
      } else if (key === 'access') {
        const g = fig.querySelector('.ac-dots');
        // the circles move when the mode flips, so dots placed for the old layout go
        if (after !== lastAfter) { lastAfter = after; dots.forEach((d) => d.n.remove()); dots.length = 0; }
        if (spawnT <= 0) {
          spawnT = 0.32;
          const centres = after ? AC : [[0, 0]];
          // keep every dot clear of the circle outlines, and of the Permissions label before agents
          const clear = (x, y) => centres.every(([cx, cy]) => Math.abs(Math.hypot(x - 320 - cx, y - 210 - cy) - 100) > 11) && (after || Math.abs(x - 320) > 62 || Math.abs(y - 213) > 18);
          let x, y, tries = 0;
          do {
            const near = Math.random() < 0.4, a = Math.random() * Math.PI * 2, rr = (near ? 26 : 120) * Math.sqrt(Math.random());
            x = 320 + Math.cos(a) * rr; y = 210 + Math.sin(a) * rr;
          } while (!(clear(x, y) && (after || Math.hypot(x - 320, y - 210) < 100)) && ++tries < 40);
          if (tries < 40) {
            const ok = !after || AC.every(([cx, cy]) => Math.hypot(x - 320 - cx, y - 210 - cy) < 100);
            dots.push({ t: 0, n: circ(g, ok ? 'ad' : 'ad ad--no', x, y, 6) });
          }
        }
        for (let i = dots.length - 1; i >= 0; i--) {
          const d = dots[i];
          d.t += dt;
          d.n.style.opacity = d.t < 0.2 ? d.t / 0.2 : Math.max(0, 1 - (d.t - 1.1) / 0.6);
          if (d.t > 1.7) { d.n.remove(); dots.splice(i, 1); }
        }
      }
    });

    // reserve the tallest equation and sentence across every rule and both states, so the drawing never shifts
    const text = root.querySelector('.sh__text');
    const wB = root.querySelector('.sh__w--b'), wA = root.querySelector('.sh__w--a');
    const lockText = () => {
      const mode = root.dataset.mode;
      root.classList.add('no-anim');
      text.style.minHeight = '';
      let h = 0;
      ROWS.forEach((r) => {
        eqEl.innerHTML = diffEq(r);
        wB.textContent = r.before; wA.textContent = r.after;
        ['before', 'after'].forEach((m) => { root.dataset.mode = m; h = Math.max(h, text.offsetHeight); });
      });
      const r = ROWS[cur];
      eqEl.innerHTML = diffEq(r);
      wB.textContent = r.before; wA.textContent = r.after;
      root.dataset.mode = mode;
      void root.offsetWidth;
      root.classList.remove('no-anim');
      text.style.minHeight = h + 'px';
    };
    let lastW = 0;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w !== lastW) { lastW = w; lockText(); }
    });
    ro.observe(text);
    document.fonts.ready.then(() => { if (root.isConnected) lockText(); });

    show(0);
    if (!auto) setMode('after');
    stage.s2Start = () => { if (!held) return; held = false; if (auto) show(cur); };
    return () => { tm.clear(); stop(); ro.disconnect(); frame.classList.remove('is-split'); };
  },
});

// drawn at load so it is there as it scrolls in, held on the first rule; the run starts once
// most of the section is on screen
(() => {
  const stage = document.getElementById('s2Stage');
  if (!stage) return;
  stage.dataset.idea = S2.shapes.id;
  stage.dataset.hold = '';
  S2.shapes.mount(stage);
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    stage.s2Start();
  }, { threshold: 0.6 }).observe(stage.closest('.s2'));
})();
