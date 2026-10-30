// Hero scan animation: copied from animation/animation_scan_1 2/animation.js.
(() => {
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const scanner = $('scanner');
  const scanBox = $('scanBox');
  const checkRig = $('checkRig');
  const tether = $('tether');
  const provScroll = $('provScroll');
  const provList = $('provList');
  const verified = $('verified');
  const deniedTag = $('deniedTag');
  const deniedWire = $('deniedWire');
  const gmailTile = $('gmailTile');
  const summary = $('summary');
  const chkIdentity = $('chkIdentity');
  const chkScope = $('chkScope');
  const badges = [...stage.querySelectorAll('.badge')];
  const nodes = [...stage.querySelectorAll('.node')];
  const tiles = [...stage.querySelectorAll('.tile')];
  const wirePaths = [...stage.querySelectorAll('.wire')];

  // (Scaling to the page is handled by the .fit wrapper in script.js.)

  // ---- Traveling pulses: one overlay path per wire, lit once its link is verified ----
  const pulseLayer = $('pulses');
  const pulses = {};
  wirePaths.forEach(w => {
    const p = w.cloneNode(false);
    p.removeAttribute('id');
    p.removeAttribute('style');
    p.removeAttribute('pathLength');
    p.setAttribute('class', 'pulse' + (w.id === 'deniedWire' ? ' red' : ''));
    pulseLayer.appendChild(p);
    pulses[w.id] = p;
  });
  const lightWire = (id, red) => {
    $(id).classList.add(red ? 'red' : 'ok');
    pulses[id].classList.add('on');
  };
  // which wire each badge sits on
  const BADGE_WIRE = {
    bFinance: 'wUserFin', bForecast: 'wFinFore', bReporting: 'wFinRep',
    bSalesforce: 'wSalesforce', bZendesk: 'wZendesk', bSnowflake: 'wSnowflake',
    bDrive: 'wDrive', bSlack: 'wSlack',
  };

  // ---- Envelope routes (Figma wire paths; `from` = where the wire leaves its node) ----
  const ROUTES = {
    toFinance:   { d: 'M179 233 H294.65' },
    toForecast:  { d: 'M309.27 232.67 H352.34 C360.17 231.9 378.97 225.1 391.5 203.95 C407.16 177.52 425.11 172.63 432.61 171.98', from: { x: 384, y: 213 } },
    toReporting: { d: 'M344.32 232.79 C354.11 231.92 375.1 235.36 387.39 251.39 C402.4 270.97 418.39 293.81 438.62 292.83', from: { x: 384, y: 249 } },
    salesforce:  { d: 'M458 232.67 H616.34 C624.17 231.9 642.97 225.09 655.5 203.95 C671.16 177.52 696 172.65 703.5 172' },
    zendesk:     { d: 'M458 233 H703' },
    snowflake:   { d: 'M458 232.79 H608.32 C618.11 231.92 639.1 235.36 651.39 251.39 C666.4 270.97 683.8 294.48 704.03 293.5' },
    drive:       { d: 'M571.01 294.01 C571.01 294.01 607.27 293.08 615.32 294.01 C623.38 294.93 642.72 303.24 655.61 329.03 C671.73 361.27 697.29 367.21 705.01 368.01', from: { x: 594, y: 294 } },
    slack:       { d: 'M573.02 294.84 C573.02 294.84 609.28 292.95 617.33 294.84 C625.39 296.72 644.73 313.57 657.62 365.91 C673.74 431.33 699.3 443.39 707.02 445', from: { x: 594, y: 294.5 } },
    gmail:       { d: 'M571 166.99 H615.32 C623.37 166.07 642.71 157.76 655.6 131.97 C671.72 99.73 697.28 93.79 705 92.99', from: { x: 594, y: 167 } },
  };

  // ---- Scan order: agents one at a time, then each agent's apps together ----
  // identity / permission are the provenance entries written as each check resolves.
  const STEPS = [
    {
      target: 'nFinance', envelope: { route: ROUTES.toFinance, badge: 'bFinance' },
      identity:   { ts: '12:04:22', title: 'Finance agent identity verified', sub: 'Agent DNA matched · delegated by CFO' },
      permission: { ok: true, ts: '12:04:22', title: 'Finance agent permission verified', sub: 'Salesforce · Zendesk · Snowflake in scope' },
    },
    {
      // Finance agent's apps are scanned together
      targets: ['tSalesforce', 'tZendesk', 'tSnowflake'], group: true,
      envelopes: [
        { route: ROUTES.salesforce, badge: 'bSalesforce' },
        { route: ROUTES.zendesk, badge: 'bZendesk' },
        { route: ROUTES.snowflake, badge: 'bSnowflake' },
      ],
      permission: { ok: true, logs: [
        { ts: '12:04:22', title: 'Salesforce access granted', sub: 'Finance agent · read pipeline & bookings', targets: ['tSalesforce', 'bSalesforce'] },
        { ts: '12:04:23', title: 'Zendesk access granted', sub: 'Finance agent · read escalated tickets', targets: ['tZendesk', 'bZendesk'] },
        { ts: '12:04:23', title: 'Snowflake access granted', sub: 'Finance agent · query revenue warehouse', targets: ['tSnowflake', 'bSnowflake'] },
      ] },
    },
    {
      target: 'nReporting', envelope: { route: ROUTES.toReporting, badge: 'bReporting' },
      identity:   { ts: '12:04:23', title: 'Reporting agent identity verified', sub: 'Agent DNA matched · delegated by Finance agent' },
      permission: { ok: true, ts: '12:04:23', title: 'Reporting agent permission verified', sub: 'Google Drive · Slack in scope' },
    },
    {
      // Reporting agent's apps are scanned together
      targets: ['tDrive', 'tSlack'], group: true,
      envelopes: [
        { route: ROUTES.drive, badge: 'bDrive' },
        { route: ROUTES.slack, badge: 'bSlack' },
      ],
      permission: { ok: true, logs: [
        { ts: '12:04:23', title: 'Google Drive access granted', sub: 'Reporting agent · write board deck draft', targets: ['tDrive', 'bDrive'] },
        { ts: '12:04:23', title: 'Slack access granted', sub: 'Reporting agent · post to #board-prep', targets: ['tSlack', 'bSlack'] },
      ] },
    },
    {
      // Forecast agent's identity passes; its scope check stays open while
      // the scanner follows its request out to Gmail.
      target: 'nForecast', envelope: { route: ROUTES.toForecast, badge: 'bForecast' },
      identity:   { ts: '12:04:23', title: 'Forecast agent identity verified', sub: 'Agent DNA matched · delegated by Finance agent' },
      permission: 'pending',
    },
    {
      target: 'gmailTile', carry: true, envelope: { route: ROUTES.gmail, blockAt: { x: 626, y: 164 } },
      permission: {
        ok: false, ts: '12:04:23', denied: true,
        title: 'Forecast agent request denied',
        sub: 'Tried to access an external mailbox and send data to an external mail ID',
        red: 'Out of scope and permissions',
        targets: ['nForecast', 'deniedWire', 'deniedTag'],
      },
    },
  ];

  // ---- helpers ----
  let runId = 0;
  const cancelled = id => id !== runId;

  // Seeking: when a Provenance entry is clicked the run restarts in "fast"
  // mode — every wait, move and check resolves instantly — until that entry
  // is about to be written, then it plays on normally from there.
  let fast = false;
  let seekTo = -1;
  let logCount = 0;
  function exitFast() {
    fast = false;
    void stage.offsetWidth;
    stage.classList.remove('no-anim');
  }

  // ---- Pausable clock: `clock()` stops advancing while paused, so waits and tweens freeze ----
  let paused = false, pausedAt = 0, pausedTotal = 0;
  const clock = () => (paused ? pausedAt : performance.now()) - pausedTotal;
  const timers = new Set(); // pending waits: { due, res, rej, id, h }
  function arm(t) { t.h = setTimeout(() => { timers.delete(t); cancelled(t.id) ? t.rej('cancelled') : t.res(); }, Math.max(0, t.due - clock())); }
  function setPaused(p) {
    if (p === paused) return;
    if (p) { pausedAt = performance.now(); paused = true; timers.forEach(t => clearTimeout(t.h)); }
    else { pausedTotal += performance.now() - pausedAt; paused = false; timers.forEach(arm); }
    stage.classList.toggle('is-paused', p);
    stage.getAnimations({ subtree: true }).forEach(a => (p ? a.pause() : a.play()));
  }
  const wait = (sec, id) => fast
    ? (cancelled(id) ? Promise.reject('cancelled') : Promise.resolve())
    : new Promise((res, rej) => { const t = { due: clock() + sec * 1000, res, rej, id }; timers.add(t); if (!paused) arm(t); });
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const rectOf = n => ({ x: n.offsetLeft, y: n.offsetTop, w: n.offsetWidth, h: n.offsetHeight });
  // Bounding box of one or more elements
  const boundsOf = els => {
    const rs = els.map(rectOf);
    const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y));
    return { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y };
  };

  // ---- Border scanner geometry ----
  const PAD = 11; // brackets sit this far outside the item

  // Checks HUD: the logo sits over the tether (23px in from the pill's left
  // edge); the pill stays inside the frame and clear of Provenance.
  // logo centre = 12px padding + half the 32px logo; width is measured since the bar fits its content
  const BAR_H = 44, BAR_Y = 10, LOGO_X = 28;
  const BAR_W = checkRig.querySelector('.checks').offsetWidth || 360;
  const PROV_X = 835; // Provenance sits on the right; the HUD stays clear of it
  const BAR_MIN_X = 8, BAR_MAX_X = PROV_X - BAR_W - 16;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  let frame = null;
  function setFrame(r) {
    frame = r;
    const bx = r.x - PAD, by = r.y - PAD, bw = r.w + PAD * 2, bh = r.h + PAD * 2;
    Object.assign(scanBox.style, { left: bx + 'px', top: by + 'px', width: bw + 'px', height: bh + 'px' });
    scanBox.style.setProperty('--arm', Math.max(10, Math.min(20, Math.min(bw, bh) * 0.3)) + 'px');

    // Tether drops into the item 62px from its left edge, or its centre for narrow items.
    const tx = bx + Math.min(62, bw / 2);
    const barX = clamp(tx - LOGO_X, BAR_MIN_X, BAR_MAX_X);
    const barY = Math.max(0, Math.min(BAR_Y, by - 6 - BAR_H)); // lift the HUD if the item is near the top
    checkRig.style.transform = `translate(${barX}px, ${barY}px)`;
    const top = barY + BAR_H;
    tether.style.transform = `translate(${tx}px, ${top}px)`;
    tether.style.height = Math.max(0, by - top) + 'px';
  }

  function frameTo(els, sec, id) {
    const from = frame, to = boundsOf(els);
    if (fast) { setFrame(to); return Promise.resolve(); }
    return new Promise((res, rej) => {
      const t0 = clock();
      const step = () => {
        if (cancelled(id)) return rej('cancelled');
        if (paused) return requestAnimationFrame(step);
        const p = Math.min(1, (clock() - t0) / (sec * 1000)), e = easeInOut(p);
        setFrame({
          x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e,
          w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e,
        });
        if (p < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
  }

  // ---- Envelopes: a request travelling along a wire ----
  const wires = stage.querySelector('.wires');
  const SVGNS = 'http://www.w3.org/2000/svg';
  const ENVELOPE_SVG =
    '<svg viewBox="0 0 20 14"><rect class="body" x=".6" y=".6" width="18.8" height="12.8" rx="1.6"/>' +
    '<path class="flap" d="M1.2 1.4L10 8l8.8-6.6"/></svg>';

  // Arc length along `path` closest to point p.
  function lengthNear(path, p) {
    const L = path.getTotalLength();
    let best = L, bestD = Infinity;
    for (let i = 0; i <= 240; i++) {
      const l = (L * i) / 240;
      const q = path.getPointAtLength(l);
      const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (d < bestD) { bestD = d; best = l; }
    }
    return best;
  }

  const badgeCenter = b => ({ x: b.offsetLeft + b.offsetWidth / 2, y: b.offsetTop + b.offsetHeight / 2 });

  // Fly an envelope along `route` until it reaches `stop`, then resolve with it.
  function sendEnvelope(route, stop, sec, id) {
    const path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', route.d);
    path.setAttribute('fill', 'none');
    wires.appendChild(path);
    const start = route.from ? lengthNear(path, route.from) : 0;
    const end = lengthNear(path, stop);

    const env = el('div', 'envelope');
    env.innerHTML = ENVELOPE_SVG;
    stage.appendChild(env);
    const place = l => {
      const q = path.getPointAtLength(l);
      env.style.left = q.x + 'px';
      env.style.top = q.y + 'px';
    };
    place(start);
    env.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
      { duration: 220, easing: 'cubic-bezier(.3,1.6,.5,1)' });

    return new Promise((res, rej) => {
      const t0 = clock() + 120;
      const step = () => {
        if (cancelled(id)) { env.remove(); path.remove(); return rej('cancelled'); }
        if (paused) return requestAnimationFrame(step);
        const p = Math.max(0, Math.min(1, (clock() - t0) / (sec * 1000)));
        place(start + (end - start) * easeInOut(p));
        if (p < 1) requestAnimationFrame(step);
        else { path.remove(); res(env); }
      };
      requestAnimationFrame(step);
    });
  }

  // Envelope travels to its badge spot (or its block point) and waits there
  // until the scan is complete.
  async function sendAndHold(env, id, sec) {
    if (fast) return null;
    const stop = env.blockAt || badgeCenter($(env.badge));
    const n = await sendEnvelope(env.route, stop, sec, id);
    n.classList.add('holding');
    return n;
  }

  // Scan complete: the envelope flips over and becomes the green check badge,
  // and the wire it travelled lights up.
  async function landEnvelope(n, badge) {
    if (n) {
      n.classList.remove('holding');
      await n.animate(
        [{ transform: 'none', opacity: 1 }, { transform: 'rotateY(90deg) scale(.8)', opacity: 0 }],
        { duration: 180, easing: 'ease-in', fill: 'forwards' }).finished;
      n.remove();
    }
    badge.classList.add('on');
    if (n) badge.classList.add('from-env');
    const wire = BADGE_WIRE[badge.id];
    if (wire) lightWire(wire);
  }

  // …or it is rejected: turns red, shakes and is discarded.
  async function rejectEnvelope(n) {
    if (!n) return;
    n.classList.remove('holding');
    n.classList.add('bad');
    await n.animate(
      [{ translate: '0 0' }, { translate: '-4px 0' }, { translate: '4px 0' }, { translate: '-3px 0' }, { translate: '0 0' }],
      { duration: 380 }).finished;
    n.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.4)' }],
      { duration: 300, delay: 500, fill: 'forwards' }).finished.then(() => n.remove());
  }

  // ---- Provenance log ----
  function writeLog(ev) {
    const index = logCount++;
    if (fast && index === seekTo) exitFast(); // the clicked moment plays normally
    const ok = ev.ok ?? !ev.denied;
    const li = el('li', 'log' + (ev.denied ? ' denied' : ok ? ' ok' : ''));
    li.dataset.index = index;
    li.title = 'Replay from here';
    li.appendChild(el('span', 'dot'));
    const t = el('p', 't');
    t.appendChild(el('span', 'title', ev.title));
    t.appendChild(el('span', 'ts', ev.ts));
    li.appendChild(t);
    li.appendChild(el('p', 's', ev.sub));
    if (ev.red) li.appendChild(el('p', 's red', ev.red));
    li._targets = ev.targets || [];

    // Follow the newest entry unless the viewer has scrolled up to read.
    const pinned = provScroll.scrollTop + provScroll.clientHeight >= provScroll.scrollHeight - 24;
    provList.appendChild(li);
    void li.offsetWidth;
    li.classList.add('show');
    if (pinned) provScroll.scrollTo({ top: provScroll.scrollHeight, behavior: fast ? 'instant' : 'smooth' });
  }

  // Hovering an entry highlights the element it talks about.
  let focused = [];
  const clearFocus = () => { focused.forEach(n => n.classList.remove('focus')); focused = []; };
  provList.addEventListener('mouseover', e => {
    const li = e.target.closest('.log');
    clearFocus();
    if (!li) return;
    focused = li._targets.map($).filter(Boolean);
    focused.forEach(n => n.classList.add('focus'));
  });
  provList.addEventListener('mouseleave', clearFocus);

  // ---- Checks HUD ----
  const resetChecks = () => [chkIdentity, chkScope].forEach(c => c.classList.remove('on', 'fail', 'busy'));
  const resolveCheck = (box, ok) => {
    box.classList.remove('busy');
    box.classList.add(ok ? 'on' : 'fail');
  };

  // One full sweep of the brackets (down and back up). Checks show as busy
  // while it runs and only resolve once it has finished.
  const SCAN_SEC = 1.4;
  async function scan(id, boxes) {
    boxes.forEach(b => b.classList.add('busy'));
    stage.classList.remove('scanning');
    void stage.offsetWidth; // restart the sweep
    stage.classList.add('scanning');
    await wait(SCAN_SEC, id);
    stage.classList.remove('scanning');
  }

  // ---- Reset / play ----
  function reset() {
    runId++;
    clearFocus();
    stage.classList.add('no-anim');
    stage.classList.remove('flow-on', 'settled', 'scanning', 'focusing', 'fade');
    scanner.classList.remove('on', 'fail');
    checkRig.classList.remove('on');
    tether.classList.remove('on');
    resetChecks();
    provList.textContent = '';
    provScroll.scrollTop = 0;
    [...badges, verified, deniedTag, summary].forEach(n => n.classList.remove('on', 'from-env', 'lit'));
    [...nodes, ...tiles].forEach(n => n.classList.remove('hit', 'hit-red', 'scan-target'));
    wirePaths.forEach(w => w.classList.remove('ok', 'red'));
    Object.values(pulses).forEach(p => p.classList.remove('on'));
    gmailTile.classList.remove('blocked');
    stage.querySelectorAll('.envelope').forEach(n => n.remove());
    setFrame(boundsOf([$('nUser')]));
    void stage.offsetWidth; // flush so transitions replay
    stage.classList.remove('no-anim');
  }

  async function runStep(step, id) {
    const ids = step.targets || [step.target];
    const targets = ids.map($);
    const perm = step.permission;
    const envs = step.envelopes || [step.envelope];
    const links = envs.filter(e => e.badge).map(e => e.badge);
    const linkBadges = links.map($);

    if (!step.carry) resetChecks();
    linkBadges.forEach(b => b.classList.add('lit'));

    // Frame glides to the item (or group) while envelopes travel down their wires
    const travelling = envs.map((env, i) => wait(i * 0.08, id).then(() => sendAndHold(env, id, 0.75)));
    const [, ...held] = await Promise.all([frameTo(targets, 0.8, id), ...travelling]);

    // Scan the item; nothing resolves until the sweep is complete
    targets.forEach(n => n.classList.add('scan-target'));
    await scan(id, step.carry ? [chkScope] : [chkIdentity, chkScope]);

    // Envelopes land: verified links become badges
    await Promise.all(envs.map((env, i) => env.blockAt ? null : landEnvelope(held[i], $(env.badge))));

    if (!step.carry) {
      resolveCheck(chkIdentity, true);
      if (step.identity) writeLog({ ...step.identity, targets: [...ids, ...links] });
      await wait(0.35, id);
    }

    if (perm === 'pending') {
      // scope stays open — resolved when the request reaches its destination
    } else {
      resolveCheck(chkScope, perm.ok);
      targets.forEach(n => n.classList.add(perm.ok ? 'hit' : 'hit-red'));
      if (!perm.ok) {
        envs.forEach((env, i) => env.blockAt && rejectEnvelope(held[i]));
        scanner.classList.add('fail');
        $('nForecast').classList.add('hit-red');
        lightWire('deniedWire', true);
        deniedTag.classList.add('on', 'lit');
        gmailTile.classList.add('blocked');
      }
      if (perm.logs) {
        // one entry per app in the group
        for (const [i, log] of perm.logs.entries()) {
          if (i) await wait(0.3, id);
          writeLog(log);
        }
      } else {
        writeLog({ ...perm, targets: [...ids, ...links, ...(perm.targets || [])] });
      }
    }

    await wait(0.6, id);
    if (perm.ok !== false) targets.forEach(n => n.classList.remove('hit', 'scan-target'));
    linkBadges.forEach(b => b.classList.remove('lit'));
  }

  async function play(seek = -1) {
    setPaused(false);
    setState('playing');
    reset();
    const id = runId;
    logCount = 0;
    seekTo = seek;
    fast = seek >= 0;
    if (fast) stage.classList.add('no-anim'); // build up to the moment without transitions
    try {
      // 0 – 0.2s: only the provenance heading is visible
      await wait(0.2, id);
      stage.classList.add('flow-on');
      await wait(1.1, id);
      stage.classList.add('settled');

      // Scanner appears around User Prompts
      const user = $('nUser');
      scanner.classList.add('on');
      checkRig.classList.add('on');
      tether.classList.add('on');
      stage.classList.add('focusing');
      await wait(0.4, id);
      user.classList.add('scan-target');
      writeLog({ ok: false, ts: '12:04:21', title: 'Intent initiated', sub: 'CFO · session s-91af', targets: ['nUser'] });
      await scan(id, [chkIdentity, chkScope]);
      resolveCheck(chkIdentity, true);
      verified.classList.add('on', 'lit');
      writeLog({ ts: '12:04:22', title: 'User verified', sub: 'Board intelligence build · within CFO role', targets: ['nUser', 'verified'] });
      await wait(0.35, id);
      resolveCheck(chkScope, true);
      user.classList.add('hit');
      writeLog({ ts: '12:04:22', title: 'User scope verified', sub: 'Board intelligence request · in scope', targets: ['nUser'] });
      await wait(0.6, id);
      user.classList.remove('hit', 'scan-target');
      verified.classList.remove('lit');

      for (const step of STEPS) await runStep(step, id);

      // Bring everything back so the whole result is visible
      await wait(1.2, id);
      stage.classList.remove('focusing');
      deniedTag.classList.remove('lit');
      scanner.classList.remove('on');
      checkRig.classList.remove('on');
      tether.classList.remove('on');
      await wait(0.4, id);
      // the run's outcome closes the Provenance log, right after the last incident
      const row = el('li', 'log-summary');
      const pill = summary.cloneNode(true);
      pill.removeAttribute('id');
      row.appendChild(pill);
      provList.appendChild(row);
      void row.offsetWidth;
      pill.classList.add('on');
      provScroll.scrollTo({ top: provScroll.scrollHeight, behavior: 'smooth' });

      // Plays once and rests on the result. Clicking a Provenance entry replays from that moment.
      setState('done');
    } catch (e) {
      if (e !== 'cancelled') throw e;
    }
  }

  // Click a Provenance entry to continue the animation from that moment.
  // ---- Play / pause / replay control ----
  const ctrl = document.getElementById('scanCtrl');
  let state = 'playing';
  function setState(s) {
    state = s;
    if (!ctrl) return;
    ctrl.dataset.state = s;
    ctrl.setAttribute('aria-label', { playing: 'Pause animation', paused: 'Play animation', done: 'Replay animation' }[s]);
  }
  ctrl && ctrl.addEventListener('click', () => {
    if (state === 'playing') { setPaused(true); setState('paused'); }
    else if (state === 'paused') { setPaused(false); setState('playing'); }
    else play();
  });

  provList.addEventListener('click', e => {
    const li = e.target.closest('.log.show');
    if (li) play(+li.dataset.index);
  });
  // the Page options panel replays the run when the classic hero is switched back on
  window.ScanReplay = () => play();
  play();
})();
