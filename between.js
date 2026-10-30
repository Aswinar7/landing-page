// Section 3: the step list, the flow chart and the chat play one story together.
// Each step mirrors a Figma "section 3 bit" frame (1, 2, 3 / 3.5, 4, 5).
(() => {
  const section = document.getElementById('how-it-works');
  if (!section) return;

  const $ = (sel, root = section) => root.querySelector(sel);
  const $$ = (sel, root = section) => [...root.querySelectorAll(sel)];
  const steps = $$('.step');
  const flow = $('#flow2');
  const chatTitle = $('#chatTitle');
  const chatBody = $('#chatBody');
  const typing = $('#chatTyping');
  const input = $('.chat__input');
  const send = $('.chat__ask button');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // How long each step owns the stage (its progress bar fills over this time).
  const STEP_MS = [3600, 4800, 4800, 5200, 4600];
  const PROMPT = 'Review This GitHub Issue';
  // Reply chunks (code chips stay whole). Write was denied in CBAC, so the agent reports back rather than editing.
  const REPLY = ('Reviewed issue <code>#482</code> in <code>acme/payments-api</code>. The webhook retry times out after 30s; '
    + 'I\'ve summarised the cause and a suggested fix. Write access was out of scope, so nothing in the repo was changed.')
    .match(/<code>.*?<\/code>[^\s]*|\S+/g);

  const LOGS = {
    coca: ['Prompt received', 'user: j.rivera@acme.com', 'session s-91af',
      'User identity verified', 'SSO (Okta)', 'role: Engineer',
      'Intent classified: read / review', 'target: GitHub issue #482', 'sensitivity: low',
      'Candidate: Github Agent (arg-7gd)', 'registered', 'owner: platform-team',
      'Custody chain created', 'chain-id c-3b72', 'user → arg-7gd', 'signed'],
    cbac: [['arg-7gd requests tool: github.read_issue', 'repo: acme/payments-api', '#482'],
      ['Chain c-3b72 attached', 'user j.rivera', 'arg-7gd'],
      ['Context: intent=review', 'data sensitivity=low', 'env=prod', 'time=10:42'],
      ['Policy: eng-read-only', 'matches: read on acme', 'write'],
      ['Scope granted: read issue #482 only', 'token expires in 5 min']],
    action: [['Action: github.read_issue #482', 'matches intent: review'],
      ['Chain c-3b72', 'user j.rivera → arg-7gd', 'signed'],
      ['Scope check: read only', 'write blocked']],
  };
  // GRADE rows come grouped as in the Figma frame (one line per check)
  const COCA_ROWS = [LOGS.coca.slice(0, 3), LOGS.coca.slice(3, 6), LOGS.coca.slice(6, 9), LOGS.coca.slice(9, 12), LOGS.coca.slice(12)];

  // ---- timing helpers (a run is cancelled when the viewer jumps to another step) ----
  // Fast-forward belongs to one run only, so a cancelled run can never change another's pace.
  let runId = 0, fastFor = -1;
  const isFast = id => fastFor === id;
  const wait = (ms, id) => {
    if (id !== runId) return Promise.reject('cancelled');
    if (isFast(id)) return Promise.resolve();
    return new Promise((res, rej) => setTimeout(() => (id === runId ? res() : rej('cancelled')), ms));
  };

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const scrollChat = () => { chatBody.scrollTop = chatBody.scrollHeight; };
  const add = (node, parent = chatBody) => { parent.appendChild(node); scrollChat(); return node; };
  const dots = parts => parts.map(p => `<span class="t">${p}</span>`).join('<i></i>');

  const setTitle = async (text, id) => {
    if (chatTitle.textContent === text) return;
    chatTitle.classList.add('swap');
    await wait(220, id);
    chatTitle.textContent = text;
    chatTitle.classList.remove('swap');
  };

  // flow helpers: light everything tagged for a step, optionally only the delayed parts
  const flowOn = (step, sel, delayed = false) => $$(`${sel}[data-at="${step}"]`, flow)
    .filter(n => (n.dataset.delay != null) === delayed)
    .forEach(n => n.classList.add('on'));
  const rows = step => $$(`.frow[data-at="${step}"]:not(.frow--deny)`, flow);
  const pulse = async (n, id) => { n.classList.add('on', 'pulse'); await wait(500, id); n.classList.remove('pulse'); };
  const nodes = $$('.fnode', flow);

  // A check streams its detail lines, then folds into one "approved · Ns ›" line.
  async function checking(label, lines, id, onLine) {
    const t0 = performance.now();
    const chk = add(el('div', 'chk', `<div class="chk__head"><span class="chk__dot"></span><span class="chk__label">${label} checking</span><span class="chk__time"></span></div><div class="chk__rows"><div></div></div>`));
    const list = chk.querySelector('.chk__rows > div');
    for (const [i, line] of lines.entries()) {
      await wait(260, id);
      list.appendChild(el('span', null, dots(line)));
      scrollChat();
      onLine && onLine(i);
    }
    await wait(500, id);
    chk.classList.add('ok');
    chk.querySelector('.chk__label').textContent = `${label} approved`;
    chk.querySelector('.chk__time').textContent = `· ${isFast(id) ? (lines.length * .26 + .5).toFixed(1) : ((performance.now() - t0) / 1000).toFixed(1)}s`;
    await wait(380, id);
    scrollChat();
    return chk;
  }
  const say = html => add(el('div', 'msg', html));

  // ---- the five steps ----
  const STEPS = [
    async id => { // 1 · User gives a prompt
      await setTitle('User Gives Prompt', id);
      await pulse(nodes[0], id);
      if (!isFast(id)) {
        input.classList.add('has-text');
        for (const ch of PROMPT) { typing.textContent += ch; await wait(42, id); }
        await wait(250, id);
        send.classList.add('press'); await wait(160, id); send.classList.remove('press');
      }
      typing.textContent = ''; input.classList.remove('has-text');
      add(el('div', 'bubble bubble--user', PROMPT));
      await wait(350, id);
      add(el('div', 'meta', 'Prompt submitted'));
    },
    async id => { // 2 · GRADE identifies
      await setTitle('GRADE Identifies', id);
      flowOn(1, '.seg'); flowOn(1, '.fgrp');
      const r = rows(1);
      await checking('GRADE', COCA_ROWS, id, i => r[Math.min(r.length - 1, Math.floor(i * r.length / COCA_ROWS.length))].classList.add('on'));
      r.forEach(n => n.classList.add('on'));
      say('Agent called · <code>arg-7gd</code>');
      await pulse(nodes[1], id);
    },
    async id => { // 3 · CBAC checks controls / permissions
      await setTitle('Tool Called', id);
      flowOn(2, '.seg'); flowOn(2, '.fgrp');
      const r = rows(2);
      await checking('CBAC', LOGS.cbac, id, i => {
        if (i === 0) r[0].classList.add('on');
        if (i === 3) { flowOn(2, '.seg', true); $('.frow--deny', flow).classList.add('on'); }
        if (i === 4) r[1].classList.add('on');
      });
    },
    async id => { // 3.5 → 4 · Actions validated
      flowOn(3, '.seg'); flowOn(3, '.fgrp');
      const r = rows(3);
      await checking('GRADE', LOGS.action, id, i => r[Math.min(r.length - 1, i)].classList.add('on'));
      r.forEach(n => n.classList.add('on'));
      say('Tool called · <code>github.read_issue</code>');
      await pulse(nodes[2], id);
      flowOn(3, '.seg', true);
      await wait(450, id);
      say('SaaS accessed · <code>acme/payments-api</code>');
      await pulse(nodes[3], id);
    },
    async id => { // 5 · Everything is recorded
      await setTitle('Output generated', id);
      flowOn(4, '.seg');
      await wait(400, id);
      await pulse(nodes[4], id);
      flowOn(4, '.seg', true); flowOn(4, '.fgrp');
      const done = '<span class="chk__dot"></span><span class="chk__label">%s</span>';
      const chk = add(el('div', 'chk ok', `<div class="chk__head">${done.replace('%s', 'Output generated')}</div>`));
      rows(4)[0].classList.add('on');
      await wait(450, id);
      chk.appendChild(el('div', 'chk__head', done.replace('%s', 'Provenance recorded') + '<span class="chk__time">· chain <code>c-3b72</code></span>'));
      scrollChat();
      rows(4)[1].classList.add('on');
      await wait(600, id);
      // the agent answers: avatar + name, then the reply streams in word by word
      const reply = add(el('div', 'reply', '<div class="reply__who"><img src="assets/logo-emblem.png" alt="">GitHub Agent<span>· arg-7gd</span></div><p class="reply__text"></p>'));
      const text = reply.querySelector('.reply__text');
      for (const chunk of REPLY) {
        text.insertAdjacentHTML('beforeend', chunk + ' ');
        scrollChat();
        await wait(55, id);
      }
    },
  ];

  function reset() {
    runId++;
    chatBody.textContent = '';
    typing.textContent = '';
    input.classList.remove('has-text');
    chatTitle.textContent = 'User Gives Prompt';
    $$('.on', flow).forEach(n => n.classList.remove('on', 'pulse'));
    steps.forEach(s => s.classList.remove('is-active', 'is-done'));
  }

  function markStep(i) {
    steps.forEach((s, n) => {
      s.classList.toggle('is-active', n === i);
      s.classList.toggle('is-done', n < i);
    });
    const bar = steps[i].querySelector('.bar');
    steps[i].style.setProperty('--dur', STEP_MS[i] + 'ms');
    // restart the progress fill
    steps[i].classList.remove('is-active'); void bar.offsetWidth; steps[i].classList.add('is-active');
  }

  // Play from step `start` (earlier steps are rebuilt instantly), then loop.
  async function play(start = 0) {
    reset();
    const id = runId;
    try {
      fastFor = id;
      section.classList.add('ff'); // rebuild earlier steps without any transitions
      for (let i = 0; i < start; i++) await STEPS[i](id);
      void section.offsetWidth;
      section.classList.remove('ff');
      fastFor = -1;
      for (let i = start; i < STEPS.length; i++) {
        markStep(i);
        const t0 = performance.now();
        await STEPS[i](id);
        await wait(Math.max(700, STEP_MS[i] - (performance.now() - t0)), id);
      }
      await wait(1800, id);
      if (id === runId) play(0);
    } catch (e) {
      if (e !== 'cancelled') throw e;
    }
  }

  // Reduced motion: show the finished story, steps still clickable to replay a moment.
  async function showAll() {
    reset();
    const id = runId;
    fastFor = id;
    section.classList.add('ff');
    try { for (const s of STEPS) await s(id); } catch (e) { if (e !== 'cancelled') throw e; }
    void section.offsetWidth;
    section.classList.remove('ff');
    fastFor = -1;
    steps.forEach(s => s.classList.add('is-done'));
  }

  steps.forEach((s, i) => s.addEventListener('click', () => (reduceMotion ? showAll() : play(i))));

  // Start when the section scrolls into view; stop when it leaves.
  let started = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !started) { started = true; reduceMotion ? showAll() : play(0); }
    else if (!e.isIntersecting && started) { started = false; reset(); }
  }, { threshold: 0.3 }).observe(section);
})();
