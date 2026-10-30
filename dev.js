// Section 6 (developer quick start): the three cards play in turn (install, copy key, wrap the agent),
// with the active card highlighted. Starts when scrolled into view; loops; still under reduced motion.
(() => {
  const sec = document.getElementById('quick-start');
  if (!sec) return;
  const cards = [...sec.querySelectorAll('.dcard')];
  const term = document.getElementById('devTerm');
  const key = document.getElementById('devKey');
  const copy = document.getElementById('devCopy');
  const code = document.getElementById('devCode');
  const events = document.getElementById('devEvents');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Content mirrors the AgentDNA Python SDK (github.com/agent-dna/agentdna, agent-dna 0.5.3):
  // pip package, AgentDNA(name, type, api_key=...), verify() → build() → record(), and its log events.
  const CMD = 'pip install agent-dna';
  const INSTALL = [
    ['c-dim', 'Collecting agent-dna'],
    ['c-dim', '  Downloading agent_dna-0.5.3-py3-none-any.whl'],
    ['c-ok', 'Successfully installed agent-dna-0.5.3'],
  ];
  const KEY_LEN = 20; // the key itself stays masked; its format is not shown publicly
  const CODE = [
    '<span class="k">from</span> agentdna <span class="k">import</span> <span class="f">AgentDNA</span>',
    '',
    'agent = <span class="f">AgentDNA</span>(<span class="s">"Assistant"</span>, <span class="s">"agent"</span>,',
    '                 api_key=API_KEY)',
    'code = agent.<span class="f">verify</span>(workflow)   <span class="d"># GRADE</span>',
    'wf = agent.<span class="f">build</span>(result, workflow)',
    'card_id, tx = agent.<span class="f">record</span>(wf)',
  ];
  const EVENTS = [
    '<b>✓</b> agentdna.init.success',
    '<b>✓</b> agentdna.verify.success · 1000',
    '<b>✓</b> agentdna.record.success · workflow card',
  ];

  let run = 0;
  const wait = (ms, id) => new Promise((res, rej) => setTimeout(() => (id === run ? res() : rej('stop')), ms));
  const activate = i => cards.forEach((c, n) => c.classList.toggle('is-active', n === i));

  function reset() {
    term.innerHTML = '<span class="c-p">~</span> <span class="caret"></span>';
    key.textContent = '';
    copy.textContent = 'Copy'; copy.classList.remove('copied');
    code.innerHTML = '<span class="caret"></span>';
    code.scrollTop = 0;
    events.innerHTML = '';
  }

  function finished() { // the end state, used for reduced motion
    term.innerHTML = `<span class="c-p">~</span> ${CMD}\n` + INSTALL.map(([c, t]) => `<span class="${c}">${t}</span>`).join('\n');
    key.textContent = '•'.repeat(KEY_LEN); copy.textContent = 'Copied'; copy.classList.add('copied');
    code.innerHTML = CODE.join('\n');
    events.innerHTML = EVENTS.map(e => `<li>${e}</li>`).join('');
    activate(2);
  }

  async function play(id) {
    reset();
    // 01 · install
    activate(0);
    await wait(500, id);
    let typed = '';
    for (const ch of CMD) {
      typed += ch;
      term.innerHTML = `<span class="c-p">~</span> ${typed}<span class="caret"></span>`;
      await wait(45, id);
    }
    await wait(350, id);
    let out = `<span class="c-p">~</span> ${CMD}`;
    for (const [c, t] of INSTALL) {
      out += `\n<span class="${c}">${t}</span>`;
      term.innerHTML = out;
      await wait(420, id);
    }
    term.innerHTML = out + `\n<span class="c-p">~</span> <span class="caret"></span>`;
    await wait(900, id);

    // 02 · copy the key
    activate(1);
    await wait(500, id);
    for (let i = 1; i <= KEY_LEN; i++) { // the key arrives from the dashboard, masked
      key.textContent = '•'.repeat(i);
      await wait(40, id);
    }
    await wait(500, id);
    copy.textContent = 'Copied'; copy.classList.add('copied');
    await wait(1200, id);

    // 03 · wrap the agent
    activate(2);
    await wait(400, id);
    const lines = [];
    for (const line of CODE) {
      lines.push(line);
      code.innerHTML = lines.join('\n') + '<span class="caret"></span>';
      code.scrollTop = code.scrollHeight; // follow the line being typed
      await wait(line ? 420 : 120, id);
    }
    code.innerHTML = lines.join('\n');
    for (const e of EVENTS) {
      await wait(600, id);
      events.insertAdjacentHTML('beforeend', `<li>${e}</li>`);
    }
    await wait(2600, id);
    play(id);
  }

  if (still) { finished(); return; }
  reset();
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { const id = ++run; play(id).catch(() => {}); }
    else { run++; reset(); activate(-1); }
  }, { threshold: 0.35 }).observe(sec);
})();
