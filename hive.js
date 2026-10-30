// Integrations honeycomb: every spot takes turns showing an AI model (white tile)
// or an app (dark tile); one tile settles as another lights up elsewhere.
(() => {
  const hive = document.getElementById('hive');
  const field = document.getElementById('hiveField');
  if (!hive || !field) return;

  // the field is tilted −13° (CSS), so it carries extra rows/columns to keep the corners filled
  const COLS = 10, ROWS = 5;
  const W = 124, STEP_X = 152, STEP_Y = 131, OFFSET = STEP_X / 2;
  const LIT = 6;            // tiles showing a logo at any moment
  const SWAP_MS = 1500;     // one hand-off per beat

  const AI = [
    ['logos/openai.svg', 'OpenAI'], ['logos/anthropic.svg', 'Anthropic'], ['logos/googlegemini.svg', 'Gemini'],
    ['logos/perplexity.svg', 'Perplexity'], ['logos/huggingface.svg', 'Hugging Face'],
  ];
  const APPS = [
    ['scan/slack.svg', 'Slack'], ['logos/figma-original.svg', 'Figma'], ['scan/gmail.svg', 'Gmail'],
    ['scan/salesforce.svg', 'Salesforce'], ['scan/drive-icon.svg', 'Google Drive'], ['logos/jira-original.svg', 'Jira'],
    ['scan/snowflake.svg', 'Snowflake'], ['scan/zendesk.svg', 'Zendesk', true], ['logos/notion.svg', 'Notion', true],
    ['logos/github.svg', 'GitHub', true],
  ];

  // ---- build the grid ----
  const tiles = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = document.createElement('div');
      t.className = 'hx';
      t.style.left = c * STEP_X + (r % 2 ? OFFSET : 0) + 'px';
      t.style.top = r * STEP_Y + 'px';
      t.innerHTML = '<svg viewBox="0 0 124 143.18" aria-hidden="true"><use class="hx__base" href="#hxShape"/><use class="hx__dark" href="#hxShape"/><use class="hx__edge" href="#hxShape"/></svg><img alt="">';
      t.dataset.r = r; t.dataset.c = c;
      field.appendChild(t);
      tiles.push(t);
    }
  }

  // Tiles near the faded edges are rarely seen; favour the visible middle but still visit everywhere.
  // weight by where a tile actually lands on screen once the field is tilted −13°
  const TILT = 13 * Math.PI / 180, FW = (COLS - 1) * STEP_X + OFFSET + W, FH = (ROWS - 1) * STEP_Y + 143;
  const weight = t => {
    const x = +t.style.left.slice(0, -2) + W / 2 - FW / 2, y = +t.style.top.slice(0, -2) + 72 - FH / 2;
    const sx = x * Math.cos(TILT) - y * Math.sin(TILT), sy = x * Math.sin(TILT) + y * Math.cos(TILT);
    const dx = sx / 600, dy = sy / 190;                              // visible core of the masked area
    return Math.max(.15, 1 - (dx * dx + dy * dy));
  };
  const usable = t => weight(t) > .45;
  const pick = list => {
    const total = list.reduce((s, t) => s + weight(t), 0);
    let x = Math.random() * total;
    for (const t of list) { x -= weight(t); if (x <= 0) return t; }
    return list[list.length - 1];
  };

  // logos come round in turn, alternating AI and app
  let ai = 0, app = 0, nextIsAi = true;
  const shown = new Set();
  function nextLogo() {
    const pool = nextIsAi ? AI : APPS;
    let i = nextIsAi ? ai : app, tries = 0;
    while (shown.has(pool[i % pool.length][0]) && tries++ < pool.length) i++;
    const logo = pool[i % pool.length];
    if (nextIsAi) ai = i + 1; else app = i + 1;
    const kind = nextIsAi ? 'is-ai' : 'is-app';
    nextIsAi = !nextIsAi;
    return { logo, kind };
  }

  const lit = [];  // oldest first
  function lightUp(t) {
    const { logo: [src, name, monoLight], kind } = nextLogo();
    const img = t.querySelector('img');
    img.src = 'assets/' + src;
    img.alt = name;
    img.classList.toggle('mono-light', !!monoLight);
    t.classList.remove('is-ai', 'is-app');
    t.classList.add(kind, 'on');
    shown.add(src);
    t._src = src;
    lit.push(t);
  }
  function settle(t) {
    t.classList.remove('on');
    shown.delete(t._src);
    lit.splice(lit.indexOf(t), 1);
  }

  // Free, visible spots that pass `prefer`; if none do, any free visible spot.
  function spots(prefer) {
    const open = tiles.filter(t => usable(t) && !t.classList.contains('on'));
    const best = open.filter(prefer);
    return best.length ? best : open;
  }

  // a new spot never neighbours the tile that just went dark, so the motion keeps travelling
  const near = (a, b) => Math.abs(a.offsetLeft - b.offsetLeft) <= STEP_X + 1 && Math.abs(a.offsetTop - b.offsetTop) <= STEP_Y + 1;
  function swap() {
    const out = lit[0];
    settle(out);
    lightUp(pick(spots(t => t !== out && !near(t, out))));
  }

  // initial scatter: spread out where possible
  for (let i = 0; i < LIT; i++) lightUp(pick(spots(t => !lit.some(l => near(l, t)))));

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let timer = null;
  const start = () => { if (!timer) timer = setInterval(swap, SWAP_MS); };
  const stop = () => { clearInterval(timer); timer = null; };
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hive);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
})();
