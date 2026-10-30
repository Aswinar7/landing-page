// Hero "Pillars" illustration: one product card that switches between Identity, Access and Provenance,
// with callouts pointing at what each view proves. Tabs auto-advance; click to choose; pauses on hover.
(() => {
  const root = document.getElementById('pillars');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const card = $('pillarCard'), callouts = $('pillarCallouts');
  const tabs = [...root.querySelectorAll('[data-pillar]')];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 5200, AFTER_SCAN = 1000; // dark style: next tab 1s after its scan completes

  // rows: [state, title, detail, time]; state = ok | live | no
  const PILLARS = [
    {
      crumb: 'INTENT / S-91AF', status: ['ok', 'Verified'],
      kicker: 'CHAIN OF CUSTODY', title: 'Every hand-off is <em>signed</em>.',
      desc: 'Every user, agent and tool signs its own envelope, so each request traces back to the person who started it.',
      nodes: ['CFO', 'Finance Agent', 'Reporting Agent'],
      rows: [
        ['ok', 'CFO · j.rivera', 'User identity verified', 'Signed'],
        ['ok', 'Finance Agent', 'Agent DNA matched · delegated by CFO', 'Signed'],
        ['ok', 'Reporting Agent', 'Agent DNA matched · delegated by Finance', 'Signed'],
      ],
      meter: 1, foot: '3 of 3 envelopes verified', link: 'View chain',
      callouts: [['Signed envelope', 1], ['Agent DNA matched', 2], ['Verified status', 'status']],
    },
    {
      crumb: 'POLICY / FORECAST BUILD', status: ['live', 'Live'],
      kicker: 'CONTEXT-BASED ACCESS', title: 'Every action <em>in scope</em>.',
      desc: 'Context-based access checks each action against the original intent, and stops anything that falls out of scope.',
      nodes: ['Salesforce', 'Slack', 'Gmail'],
      rows: [
        ['ok', 'Finance Agent → Salesforce', 'Read pipeline & bookings', '12:04:22'],
        ['ok', 'Reporting Agent → Slack', 'Post to #board-prep', '12:04:23'],
        ['no', 'Forecast Agent → Gmail', 'Access denied · out of scope', '12:04:23'],
      ],
      meter: .67, foot: '2 allowed · 1 blocked', link: 'View policy',
      callouts: [['Allowed by policy', 0], ['Scoped to intent', 1], ['Out-of-scope request', 2]],
    },
    {
      crumb: 'PROVENANCE CARD / QMRY…78Q', status: ['ok', 'Recorded'],
      kicker: 'IMMUTABLE RECORD', title: 'Every workflow, <em>on record</em>.',
      desc: 'Completed workflows are committed to the Provenance Layer as a tamper-evident record, denials included.',
      nodes: ['Initiated', 'Verified', 'Denied'],
      rows: [
        ['ok', 'Intent initiated', 'CFO · session s-91af', '12:04:21'],
        ['ok', 'Reporting agent verified', 'Board deck draft · Google Drive', '12:04:23'],
        ['no', 'Forecast agent req denied', 'External mail ID · out of scope', '12:04:23'],
      ],
      meter: 1, foot: 'Tamper-evident · denials recorded too', link: 'Open record',
      callouts: [['Timestamped entry', 0], ['Failures recorded too', 2], ['Tamper-evident', 'foot']],
    },
  ];

  const icon = st => (st === 'no'
    ? '<svg viewBox="0 0 12 12"><path d="M3.5 3.5l5 5M8.5 3.5l-5 5"/></svg>'
    : st === 'live' ? '<i></i>'
      : '<svg viewBox="0 0 12 12"><path d="M2.6 6.3l2.3 2.3 4.5-4.9"/></svg>');

  function render(p) {
    $('pcCrumb').textContent = p.crumb;
    const [st, label] = p.status;
    $('pcStatus').className = 'pcard__status is-' + st;
    $('pcStatus').innerHTML = icon(st) + label;
    $('pcKicker').textContent = p.kicker;
    $('pcTitle').innerHTML = p.title;
    $('pcRows').innerHTML = p.rows.map(([s, t, d, tm], i) =>
      `<li class="is-${s}" style="--i:${i}"><span class="pcard__mark">${icon(s === 'live' ? 'ok' : s)}</span>` +
      `<span class="pcard__txt"><b>${t}</b><small>${d}</small></span><time>${tm}</time></li>`).join('');
    $('pcMeter').style.setProperty('--fill', p.meter);
    $('pcMeter').classList.toggle('has-block', p.rows.some(r => r[0] === 'no'));
    $('pcFoot').textContent = p.foot;
    $('pcDesc').textContent = p.desc;
    $('pcBadge').className = 'pcard__badge is-' + st;
    $('pcBadge').innerHTML = icon(st) + label;
    renderDiagram(p);
    $('pcLink').innerHTML = p.link + ' →';
    placeCallouts(p);
    renderDuo(PILLARS.indexOf(p));
  }

  // dark style: three overlapping circle fields, one label pill each; the highlight steps across them
  const SVGNS = 'http://www.w3.org/2000/svg';
  let hl = 0, hlTimer = null;
  function renderDiagram(p) {
    const W = 440, H = 148, cw = W / 3, r = 68;
    let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g class="pdg__grid">`;
    for (let k = 0; k <= 3; k++) svg += `<line x1="${k * cw}" y1="0" x2="${k * cw}" y2="${H}"/>`;
    svg += `<line x1="0" y1="0" x2="${W}" y2="0"/><line x1="0" y1="${H}" x2="${W}" y2="${H}"/></g><g class="pdg__rings">`;
    for (let k = 0; k < 3; k++) for (const dx of [-30, -12, 12, 30]) svg += `<circle cx="${cw * k + cw / 2 + dx}" cy="${H / 2}" r="${r}"/>`;
    svg += '</g>';
    for (let k = 0; k < 3; k++) svg += `<circle class="pdg__focus" data-k="${k}" cx="${cw * k + cw / 2}" cy="${H / 2}" r="${r}"/>`;
    svg += '</svg>';
    const nodes = p.nodes.map((n, k) => `<span class="pdg__node${p.rows[k][0] === 'no' ? ' is-no' : ''}" data-k="${k}" style="left:${(k + .5) * 100 / 3}%">${n}</span>`).join('');
    $('pcDiagram').innerHTML = svg + nodes;
    hl = 0; highlight();
  }
  function highlight() {
    $('pcDiagram').querySelectorAll('[data-k]').forEach(n => n.classList.toggle('is-on', +n.dataset.k === hl));
  }
  function stepHighlight() {
    clearInterval(hlTimer);
    if (still) return;
    hlTimer = setInterval(() => { hl = (hl + 1) % 3; highlight(); }, 1700);
  }
  stepHighlight();

  // ---- Dark style (two panels): actors scanned on the light side, checks logged on the dark side ----
  // check lines use the SDK's vocabulary: verify() → 1000 RESULT_OK, agent whitelist, GRADE chain, CBAC, record()
  const ICON = {
    user: '<svg viewBox="0 0 16 16"><circle cx="8" cy="5.5" r="2.6"/><path d="M3 13.5c.8-2.4 2.7-3.6 5-3.6s4.2 1.2 5 3.6"/></svg>',
    agent: '<svg viewBox="0 0 16 16"><rect x="3" y="5" width="10" height="8" rx="2"/><path d="M8 2.5V5M6 9h.01M10 9h.01"/></svg>',
    app: '<svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="11" rx="3"/><path d="M5.5 8h5M8 5.5v5"/></svg>',
    record: '<svg viewBox="0 0 16 16"><path d="M8 1.8 13.5 5v6L8 14.2 2.5 11V5Z"/><path d="M5.6 8.2 7.2 9.8 10.4 6.4"/></svg>',
  };
  const DUO = [
    { kick: 'SCANNING IDENTITIES', title: ['Who is acting?', 'Every identity checked.'], tags: ['Identity', 'Agent DNA', 'Signature', 'Chain'],
      dtitle: 'Chain of custody, verified.', desc: 'Each actor signs its own envelope. AgentDNA verifies the chain before anyone acts.',
      actors: [
        ['user', 'CFO · j.rivera', 'User · SSO', 'ok', [['verify', 'envelope signature', '1000'], ['user card', 'registered', 'ok']]],
        ['agent', 'Finance Agent', 'Agent · delegated by CFO', 'ok', [['whitelist', 'agent registered', 'ok'], ['verify', 'GRADE chain', '1000']]],
        ['agent', 'Reporting Agent', 'Agent · delegated by Finance', 'ok', [['whitelist', 'agent registered', 'ok'], ['verify', 'GRADE chain', '1000']]],
      ], done: '3 identities verified', result: 'ok', badge: ['ok', 'Verified'], btn: 'View chain' },
    { kick: 'CHECKING ACCESS', title: ['What can they access?', 'Every action in scope.'], tags: ['Intent', 'Scope', 'CBAC', 'Policy'],
      dtitle: 'Context-based access.', desc: 'Each tool call is checked against the agent’s policy and the original intent.',
      actors: [
        ['app', 'Finance Agent → Salesforce', 'Read pipeline & bookings', 'ok', [['CBAC', 'intent match · read', 'allow'], ['verify', 'GRADE chain', '1000']]],
        ['app', 'Reporting Agent → Slack', 'Post to #board-prep', 'ok', [['CBAC', 'within policy', 'allow'], ['verify', 'GRADE chain', '1000']]],
        ['app', 'Forecast Agent → Gmail', 'Send to external mail ID', 'no', [['CBAC', 'out of scope · external mail', 'deny'], ['block', 'request stopped', 'denied']]],
      ], done: '2 allowed · 1 blocked', result: 'no', badge: ['live', 'Live'], btn: 'View policy' },
    { kick: 'RECORDING WORKFLOW', title: ['What happened?', 'Every step on record.'], tags: ['Provenance', 'Tamper-evident', 'Denials', 'Audit'],
      dtitle: 'Immutable provenance.', desc: 'The completed workflow is committed to the Provenance Layer, denials included.',
      actors: [
        ['record', 'Intent workflow', 'CFO · session s-91af', 'ok', [['build', 'final envelope', 'signed'], ['record', 'workflow card', 'ok']]],
        ['record', 'Reporting Agent', 'Board deck draft · Drive', 'ok', [['record', 'appended to card', 'ok']]],
        ['record', 'Forecast Agent', 'Denied request', 'no', [['record', 'denial recorded', 'ok'], ['audit', 'tamper-evident', 'ok']]],
      ], done: 'Workflow recorded', result: 'ok', badge: ['ok', 'Recorded'], btn: 'Open record' },
  ];
  const mark = st => (st === 'no' ? '<svg viewBox="0 0 12 12"><path d="M3.5 3.5l5 5M8.5 3.5l-5 5"/></svg>'
    : st === 'ok' ? '<svg viewBox="0 0 12 12"><path d="M2.6 6.3l2.3 2.3 4.5-4.9"/></svg>' : '');
  let duoRun = 0, duoDone = false;
  const pause = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === duoRun ? res() : rej('stop')), ms));
  function renderDuo(i) {
    const d = DUO[i]; if (!d) return;
    const id = ++duoRun;
    duoDone = false;
    $('dKick').textContent = d.kick;
    $('dTitle').innerHTML = `<span>${d.title[0]}</span> ${d.title[1]}`;
    $('dTags').innerHTML = d.tags.map(t => `<span>${t}</span>`).join('');
    $('dActors').innerHTML = d.actors.map(([ic, name, sub]) =>
      `<li><span class="duo__ic">${ICON[ic]}</span><span class="duo__who"><b>${name}</b><small>${sub}</small></span><span class="duo__st"></span><i class="duo__sweep"></i></li>`).join('');
    $('dDTitle').textContent = d.dtitle;
    $('dDesc').textContent = d.desc;
    $('dLog').innerHTML = '';
    $('dBadge').className = 'pcard__badge is-' + d.badge[0];
    $('dBadge').innerHTML = icon(d.badge[0]) + d.badge[1];
    const rows = [...$('dActors').children];
    const line = (who, [k, txt, code]) => {
      const bad = code === 'deny' || code === 'denied';
      $('dLog').insertAdjacentHTML('beforeend', `<li class="${bad ? 'is-no' : ''}"><span class="k">${k}</span><span class="t">${who} · ${txt}</span><span class="c">${code}</span></li>`);
      $('dLog').scrollTop = $('dLog').scrollHeight;
    };
    const finish = () => {
      rows.forEach((r, n) => { r.className = 'is-' + d.actors[n][3]; r.querySelector('.duo__st').innerHTML = mark(d.actors[n][3]); });
      $('dRun').className = 'duo__run is-done'; $('dRun').innerHTML = mark(d.result) + d.done; // outcome of the run, not of any single row
    };
    if (still || root.dataset.style !== 'dark') {
      d.actors.forEach(a => a[4].forEach(c => line(a[1].split(' → ')[0], c))); finish(); return;
    }
    $('dRun').className = 'duo__run'; $('dRun').innerHTML = '<i></i>Scanning…';
    (async () => {
      await pause(350, id);
      for (const [n, a] of d.actors.entries()) {
        rows[n].className = 'is-scan';
        for (const c of a[4]) { await pause(420, id); line(a[1].split(' → ')[0], c); }
        await pause(300, id);
        rows[n].className = 'is-' + a[3];
        rows[n].querySelector('.duo__st').innerHTML = mark(a[3]);
      }
      await pause(250, id);
      finish();
      duoDone = true;
      schedule(); // advance 1s after the scan is over
    })().catch(() => {});
  }

  // callouts sit left of the card, vertically aligned with the element they describe
  function placeCallouts(p) {
    const dark = root.dataset.style === 'dark';
    const rows = dark ? [...$('pcDiagram').querySelectorAll('.pdg__node')] : [...$('pcRows').children];
    const targetOf = t => (t === 'status' ? $('pcStatus') : t === 'foot' ? $(dark ? 'pcBadge' : 'pcFoot') : rows[t]);
    const cardTop = card.offsetTop;
    callouts.innerHTML = p.callouts.map(([label], i) => `<li style="--i:${i}">${label}<i></i></li>`).join('');
    [...callouts.children].forEach((li, i) => {
      const el = targetOf(p.callouts[i][1]);
      let y = cardTop, n = el;
      while (n && n !== card) { y += n.offsetTop; n = n.offsetParent; }
      li.style.top = (y + el.offsetHeight / 2) + 'px';
    });
  }

  let index = 0, timer = null, hovering = false;
  function show(i, animate = true) {
    index = i;
    duoDone = false; // the new tab must finish its own scan before advancing
    tabs.forEach((t, n) => { t.classList.toggle('is-active', n === i); t.setAttribute('aria-selected', n === i); });
    if (!animate || still) { render(PILLARS[i]); return; }
    root.classList.add('is-swapping');
    setTimeout(() => { render(PILLARS[i]); root.classList.remove('is-swapping'); }, 220);
  }
  const schedule = () => {
    clearTimeout(timer);
    if (still || hovering || !visible) return;
    const dark = root.dataset.style === 'dark';
    if (dark && !duoDone) return; // wait for the scan; finishing it calls schedule() again
    timer = setTimeout(() => { show((index + 1) % PILLARS.length); schedule(); }, dark ? AFTER_SCAN : HOLD);
  };
  tabs.forEach((t, n) => t.addEventListener('click', () => { show(n); schedule(); }));
  root.addEventListener('mouseenter', () => { hovering = true; clearTimeout(timer); });
  root.addEventListener('mouseleave', () => { hovering = false; schedule(); });

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting && root.offsetParent !== null; schedule(); }).observe(root);
  addEventListener('resize', () => placeCallouts(PILLARS[index]));
  // re-measure when the illustration is switched on from the Page options panel
  new MutationObserver(() => { if (root.offsetParent) { placeCallouts(PILLARS[index]); visible = true; schedule(); } })
    .observe(document.querySelector('.hero__card'), { attributes: true, attributeFilter: ['data-illus'] });

  new MutationObserver(() => { placeCallouts(PILLARS[index]); renderDuo(index); }).observe(root, { attributes: true, attributeFilter: ['data-style'] });

  show(0, false);
})();
