/*
 * DNA strand hero (from dna_strand_hero/dna.js, unchanged drawing code). The Page options panel's
 * "DNA strand" hero, set to: Ribbon · H1 · L3 showcase · S1 loop · M1 microscope off · T1 four lobes ·
 * B1 light · A2 new start · G1 binary · P2 metrics. Those choices live as data attributes on .dh
 * (where the original read them from <html>), so nothing here touches the rest of the page.
 */
/*
 * AgentDNA loop: Knowledge → Control → Record → Control → Knowledge
 *
 * A DNA double helix drawn in data (the agent_dna_new1 strand), seen side-on and running past
 * both screen edges. One turn is the figure-8:
 *   θ = π·(x − cx)/halfTurn,   strand A: y = cy + amp·sin θ, depth cos θ;   strand B mirrors it
 * The strands cross at the centre (Control); the lobes either side are Knowledge (left) and
 * Record (right); the outer crossings sit just past the edges. Each strand is a ribbon of fine
 * dotted threads with 0/1 glyphs riding in it; each base pair a column of binary digits.
 *
 * One transaction = a batch of comets riding strand A left to right through Knowledge, Control
 * and Record, then strand B back. Blank base pairs show as dotted columns from the start; every
 * transaction that comes back writes the next one, typing it in from the front strand to the
 * back. The helix keeps its length; the ribbons widen and gain threads as transactions add up.
 *
 *
 * Every version shares the same story and timing:
 *   ribbon   – navy-to-blue data threads on white
 *   scanline – the same scene drawn into a coarse off-screen grid, then re-drawn row by row
 *              as indigo bars: dense ink → long thick bars, faint ink → short dithered dashes
 *   halftone – the same off-screen grid sampled on a 45° dot screen: dot size follows ink
 *   metal    – the strands become liquid-chrome ribbons in WebGL (metal.js); everything
 *              else is drawn on a transparent canvas above them
 *   accretion – the ribbon scene as light on black, like a black hole's disc: denser fibres
 *              that add up to a white-hot core with peach-to-rose edges, streaks flowing round
 *   ascii    – the same off-screen grid set in type on a blue sky: dense ink → C Z, edges → ▽ △,
 *              over a soft blurred blue body; the crossing at Control glows yellow like a bloom's heart
 *   ascii-plain – the same type on the plain page, no sky; faint edge glyphs turn blue to show on white
 *   glow     – the same off-screen grid as a luminous band of flickering particle grain in brand
 *              blue on white: a wide soft bloom, a tighter body, white sparkles where it's densest
 *   slit     – the same off-screen grid cut into parallel diagonal slits on dark navy: tapered
 *              streaks whose width and heat (blue → cyan → white) follow density, in a wireframe frame
 *
 * Each .dna-hero section mounts its own instance, sized from the section, so it runs edge to
 * edge wherever it is placed. The pencil button switches which section is shown.
 *
 * Hero build: the sections fill the whole hero as its background, and the loop is fitted into
 * the [data-dna-band] slot in the hero's layout (between headline and call to action). The
 * shown style is mirrored onto <html data-variant> so the hero's type and buttons re-theme.
 */
(() => {
  'use strict';
  const ROOT = document.querySelector('.dh');
  if (!ROOT) return;
  const params = new URLSearchParams(location.search);
  const SPEED = clamp(parseFloat(params.get('speed')) || 1, 0.25, 8);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const START_T = reduceMotion ? 8 : clamp(parseInt(params.get('skip'), 10) || 0, 0, 40);

  /* ---------- tuning ---------- */
  const TURN = 1.33;                // half a turn (crossing to crossing) ÷ the screen's half-width
  const PERSP = 0.05;               // a touch of perspective: the near strand reads a little larger
  const SPIN = (2 * Math.PI) / 7;   // the helix turns on its axis once every 7 s (rad/s)
  const SAMPLES = 320;
  const RUNG_GAP = 1 / 6;           // base-pair spacing, as a fraction of half a turn
  const FULL_AT = 8;                // transactions until the ribbons reach full thickness
  const THREADS = [1, 14];          // threads per strand: one at the start, doubling with each transaction up to the cap
  const RIBBON = [0.1, 0.27];       // ribbon width ÷ amp, first transaction → full
  const DOT = { size: 1.5, gap: 3.4, flow: 26 }; // thread dots and their drift along the strand (css px, px/s)
  const GLYPH_STEP = 40;            // a 0/1 rides each thread about this often (css px)
  const HEX_TILT = (13 * Math.PI) / 180;
  // the strands meeting at the centre: the helix holds still while a scan box the Control label's
  // width opens on the crossing, sweeps it top to bottom and back up, and folds shut (s)
  const HOLD = { open: 0.35, scan: 2.2, close: 0.35 };
  const HOLD_LEN = HOLD.open + HOLD.scan + HOLD.close;
  // the apps that pop up over the box and are scanned one by one while it is held: one on the
  // sweep down, the next on the sweep back up, carrying on through the list from hold to hold
  const APPS = [
    'logos/github.svg', 'scan/gmail.svg', 'scan/teams.svg', 'scan/slack.svg', 'scan/salesforce.svg',
    'logos/notion.svg', 'scan/snowflake.svg', 'logos/jira-original.svg', 'scan/drive-icon.svg',
    'scan/zendesk.svg', 'logos/figma-original.svg',
  ];
  const APPS_PER_HOLD = 2;
  // pencil → Agentinary → Agent: the 0s and 1s become this agent mark (Figma node 632:39,
  // boxicons robot; 21×21 view box, its own fill rule)
  const AGENT_D = 'M7.39112 8.70312C7.04496 8.70312 6.71299 8.88647 6.46822 9.21283C6.22345 9.53919 6.08594 9.98183 6.08594 10.4434C6.08594 10.9049 6.22345 11.3475 6.46822 11.6739C6.71299 12.0003 7.04496 12.1836 7.39112 12.1836C7.73728 12.1836 8.06925 12.0003 8.31402 11.6739C8.55879 11.3475 8.6963 10.9049 8.6963 10.4434C8.6963 9.98183 8.55879 9.53919 8.31402 9.21283C8.06925 8.88647 7.73728 8.70312 7.39112 8.70312ZM13.482 8.70312C13.1358 8.70312 12.8038 8.88647 12.5591 9.21283C12.3143 9.53919 12.1768 9.98183 12.1768 10.4434C12.1768 10.9049 12.3143 11.3475 12.5591 11.6739C12.8038 12.0003 13.1358 12.1836 13.482 12.1836C13.8281 12.1836 14.1601 12.0003 14.4049 11.6739C14.6496 11.3475 14.7872 10.9049 14.7872 10.4434C14.7872 9.98183 14.6496 9.53919 14.4049 9.21283C14.1601 8.88647 13.8281 8.70312 13.482 8.70312ZM6.95606 13.9239H13.917V15.6641H6.95606V13.9239Z M18.2745 9.57328V6.96292C18.2745 6.00578 17.4914 5.22267 16.5343 5.22267H11.3135V4.01321C11.5746 3.77827 11.7486 3.43022 11.7486 3.04737C11.7486 2.32517 11.1656 1.74219 10.4434 1.74219C9.7212 1.74219 9.13822 2.32517 9.13822 3.04737C9.13822 3.43022 9.31225 3.77827 9.57328 4.01321V5.22267H4.35255C3.39542 5.22267 2.61231 6.00578 2.61231 6.96292V9.57328C2.13374 9.57328 1.74219 9.96484 1.74219 10.4434V13.9239C1.74219 14.4025 2.13374 14.794 2.61231 14.794V17.4044C2.61231 18.3615 3.39542 19.1446 4.35255 19.1446H16.5343C17.4914 19.1446 18.2745 18.3615 18.2745 17.4044V14.794C18.7531 14.794 19.1446 14.4025 19.1446 13.9239V10.4434C19.1446 9.96484 18.7531 9.57328 18.2745 9.57328ZM4.35255 17.4044V6.96292H16.5343V17.4044H4.35255Z';
  window.DnaAgentPath = AGENT_D;
  const agentMode = () => ROOT.dataset.glyph === 'agent';
  // Binary-agent: 0s and 1s, shown as enlarged agent marks inside the Control hexagon
  const mixMode = () => ROOT.dataset.glyph === 'mix';
  // ASCII 2: binary everywhere, but the Control hexagon is a lens onto the strand: inside it the
  // helix is shown magnified, every digit set as the ASCII glyph below
  const ascii2Mode = () => ROOT.dataset.glyph === 'ascii-mix';
  const HEX_ZOOM = 2.4;
  // ASCII: every 0 and 1 becomes this one glyph (Noto Sans Bamum, loaded as a one-glyph subset)
  const ASCII_GLYPH = '\u{1680C}';
  const ASCII_FONT = '"Noto Sans Bamum"';
  window.DnaAsciiGlyph = { char: ASCII_GLYPH, font: ASCII_FONT };
  const asciiMode = () => ROOT.dataset.glyph === 'ascii';

  // data on white: each ribbon's threads run navy → blue across it; written base pairs are navy
  const INK = {
    bg: '#ffffff',
    threads: ['#14246b', '#3b6cf0'], heat: '#4f7df0', rung: '#14246b', rungIdle: '#8695c8',
    ink: '#0b1f4d',
    glow: '59,130,246', trail: '30,64,175',
    dust: '#3b6fd8', ui: 'rgba(11,31,77,',
    blend: 'source-over', lightBlend: 'source-over',
    clear: true, // hero: the card's own gradient shows behind the ink
    density: 1, alpha: 1,
  };

  // light on black (the accretion-disc look): threads add up, so dense bundles burn white;
  // each thread's colour runs white-hot at the core to dusky rose at the ribbon's edge
  const ACCRETION_TINTS = ['#fffaf4', '#ffeadb', '#ffd1bb', '#f7a994', '#e07f72', '#a9524c'];
  const ACCRETION = {
    bg: '#040203',
    tint: (frac) => ACCRETION_TINTS[Math.min(ACCRETION_TINTS.length - 1, Math.floor(Math.abs(frac) * 2 * ACCRETION_TINTS.length))],
    heat: '#ffffff', rung: '#ffeadb', rungIdle: '#a9524c',
    ink: '#ffffff',
    glow: '255,196,170', trail: '255,236,222',
    dust: '#ffcbb3', ui: 'rgba(255,232,220,',
    blend: 'lighter', lightBlend: 'lighter',
    density: 1.8, alpha: 0.6,
  };
  const PALETTES = { accretion: ACCRETION };
  // the microscope view on its dark background (pencil → Background → Dark): light threads on near-black
  const INK_DARK = {
    ...INK,
    threads: ['#6f9bff', '#d6e3ff'], heat: '#ffffff', rung: '#cfe0ff', rungIdle: '#3d4f86',
    ink: '#ffffff', glow: '120,160,255', trail: '196,214,255', dust: '#8fb4ff', ui: 'rgba(220,230,255,',
  };

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const approach = (cur, target, rate, dt) => {
    const next = cur + (target - cur) * (1 - Math.exp(-rate * dt));
    return Math.abs(target - next) < 1e-3 ? target : next;
  };
  const growthFor = (T) => Math.min(1, T / FULL_AT);
  const fibresFor = (T) => Math.min(THREADS[1], THREADS[0] * 2 ** T); // 1, 2, 4, 8, then 14
  const hexRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const mixRgb = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const rgbStr = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  // fixed per-glyph digit, so a 0 stays a 0 as it drifts
  const bit = (a, b, c) => {
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 9) & 1;
  };

  // scanline version: grid cell size (css px), bar heights per ink level (fraction of row height)
  const SCAN = {
    cell: 5, row: 9, cellMobile: 4, rowMobile: 7,
    ink: '#2f5bea', bg: '#f3f3f0',
    gain: 3.8,
    ribbon: 1.9,   // ribbons drawn wider so they read as solid bar bands
    bars: [0, 0.24, 0.44, 0.7],
  };
  // halftone version: dot screen pitch (css px)
  const HALF = {
    cell: 4, pitch: 6.5, pitchMobile: 5, angle: Math.PI / 4,
    ink: '#141414', bg: '#e2e3e0',
    gain: 2.2,
    ribbon: 1.5,
  };
  // metal version: base reflectance of each strand, thin-film sheen, resting key light
  const METAL = {
    colorA: '#F2F3F5', colorB: '#A9C1F2',
    iridescence: 0.2,
    halfWidth: 0.8,           // × w0
    restLight: { x: -0.45, y: 0.55 },
  };
  // ascii version: character cell (css px), sky, the soft colour body under the type, glyph sets
  const ASCII = {
    cell: 13, cellH: 15, cellMobile: 9, cellHMobile: 11,
    skyTop: '#21468c', skyBottom: '#7aa8de',
    body: [38, 108, 236], heart: [236, 196, 92],
    glyph: '#f2f7ff', heartGlyph: '#fff3cc',
    gain: 4.2,
    ribbon: 2.1,
    dense: ['C', 'C', 'Z'], mid: ['C', '▽', 'Z'], light: ['▽', '△'], faint: ['·', '△'],
    heartSet: ['☆', '(', ')', 'o', '△'],
  };
  // the same type without the sky: white page, glyphs off the blue body (and the hexagon) in blue
  const ASCII_PLAIN = {
    ...ASCII,
    skyTop: null,
    pageBg: '#ffffff',
    edgeGlyph: '#2a64d8',
    bodyMin: 0.14, // stray dust specks would blur into blotches on white
    outline: '#1e4fb8',
  };
  // glow version: particle cell (css px), bloom and body in brand blue, grain colours by density
  const GLOW = {
    cell: 3, cellMobile: 2.5,
    bg: '#ffffff',
    bloom: [47, 107, 240], bloomBlur: 26, bloomAlpha: 120,
    body: [37, 92, 222], bodyBlur: 5, bodyAlpha: 200,
    spark: '#f4f8ff', grain: '#2f6bf0', deep: '#0b1f4d',
    gain: 3.0, density: 0.9, flicker: 9,
    ribbon: 2.1,
  };
  // slit version: slit spacing and step along each slit (css px), slit angle, heat ramp
  const SLIT = {
    cell: 3, spacing: 6.5, spacingMobile: 5, step: 3,
    angle: (62 * Math.PI) / 180,
    bg: '#05040f',
    bloom: [26, 64, 255], bloomBlur: 24, bloomAlpha: 150,
    heat: [[0.24, '#1d3cff'], [0.44, '#3a7bff'], [0.64, '#8fd2ff'], [2, '#f2f8ff']],
    grid: 'rgba(214, 204, 168, 0.16)',
    outline: '#d6e4ff',
    gain: 3.0, width: 0.85,
    ribbon: 2.4,
  };
  const RIBBON_SCALE = {
    ribbon: 1, scanline: SCAN.ribbon, halftone: HALF.ribbon, metal: 1, accretion: 1.5,
    ascii: ASCII.ribbon, 'ascii-plain': ASCII_PLAIN.ribbon, glow: GLOW.ribbon, slit: SLIT.ribbon,
  };

  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  function inkLevel(v, x, y) {
    if (v < 0.14) return 0;
    if (v > 0.72) return 3;
    if (v > 0.4) return 2;
    return v > 0.14 + BAYER[(y & 3) * 4 + (x & 3)] * 0.26 ? 1 : 0;
  }
  const rand = (a, b) => a + Math.random() * (b - a);


    function mount(hero) {
    const variant = hero.dataset.variant || 'ribbon';
    const BASE = PALETTES[variant] || INK;
    const P = { ...BASE };
    // the ribbon style takes the dark palette when the microscope view sits on the dark background
    const darkScope = () => variant === 'ribbon' && ROOT.dataset.scope === 'lens' && ROOT.dataset.bg === 'dark';
    let darkNow = false;
    function applyPalette() {
      darkNow = darkScope();
      Object.assign(P, darkNow ? INK_DARK : BASE);
      HEAT = hexRgb(P.heat);
      makeGlow();
      makeGlyphs();
    }
    const canvas = hero.querySelector('.dna-stage');
    const band = ROOT.querySelector('[data-dna-band]');
    const mainCtx = canvas.getContext('2d');
    let ctx = mainCtx;

    // metal version: a WebGL canvas under the 2D one draws the strands (falls back to ink ribbons)
    let metal = null;
    const light = { ...METAL.restLight }, lightTarget = { ...METAL.restLight };
    if (variant === 'metal' && window.DnaMetal) {
      const glCanvas = document.createElement('canvas');
      glCanvas.className = 'dna-stage dna-stage--gl';
      glCanvas.setAttribute('aria-hidden', 'true');
      canvas.before(glCanvas);
      metal = window.DnaMetal.create(glCanvas);
      if (!metal) glCanvas.remove();
      // the key light follows the pointer across the section
      window.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width, y = 1 - (e.clientY - rect.top) / rect.height;
        const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
        lightTarget.x = inside ? (x * 2 - 1) * 0.9 : METAL.restLight.x;
        lightTarget.y = inside ? (y * 2 - 1) * 0.9 : METAL.restLight.y;
      }, { passive: true });
    }
    const core = hero.querySelector('.dna-core'); // Core: the tile held at the crossing
    const ui = {
      knowledge: hero.querySelector('.pillar--knowledge'),
      control: hero.querySelector('.pillar--control'),
      record: hero.querySelector('.pillar--record'),
    };
    // the app tiles: one element per app, placed each frame while the box is held open
    const appsEl = document.createElement('div');
    appsEl.className = 'dh-apps';
    const tiles = APPS.map((src) => {
      const tile = document.createElement('span');
      tile.className = 'dh-app';
      tile.innerHTML = `<img src="assets/${src}" alt="">`;
      appsEl.appendChild(tile);
      return tile;
    });
    hero.appendChild(appsEl);
    let appNext = 1; // the first hold starts on Gmail, with GitHub just scanned to its left

    /* ---------- state ---------- */
    let W = 0, H = 0, dpr = 1;
    let glowSprite = null;
    const S = {};
    const G = { phase: 0 };

    function reset(T = 0) {
      Object.assign(S, {
        t: 0,
        T,
        fil: fibresFor(T),
        grow: growthFor(T),
        reveal: T > 0 ? 1 : 0,
        comets: [],
        batchOn: false,
        nextBatchAt: 0.5,
        ride: 1,
        hexY: 0,
        hexTarget: 0,
        hexSign: 1,
        hexPrev: undefined,
        rungStart: new Map(),
        scanHits: [],
        ripples: [],
        lastScan: -1,
        kPulse: 0,
        rPulse: 0,
        hold: null,
      });
      seedRungs(-100);
      dirty = true;
    }

    /* ---------- geometry ---------- */
    // axis positions of the samples, left → right across one turn; scratch arrays for a thread
    G.xs = new Float32Array(SAMPLES);
    const TX = new Float32Array(SAMPLES), TY = new Float32Array(SAMPLES);
    const TZ = new Float32Array(SAMPLES), TS = new Float32Array(SAMPLES);

    // fixed geometry: only the ribbon width (w0) follows the transaction count
    // the showcase layout holds the helix in a box, one turn from tip to tip (like an ∞) in the
    // middle of the hero; every other layout runs it past both edges
    // the Core hero layout (Page options → Hero layout): the strands run in from both edges and meet
    // at a glossy AgentDNA tile in the middle, with no names, hexagon or scan pause
    const coreMode = () => ROOT.dataset.hlayout === 'core';
    const boxed = () => ROOT.dataset.layout === 'showcase' && !coreMode();
    // the microscope view (pencil → Microscope → Lens) stands the helix up the right of the hero,
    // many turns long and running off top and bottom, for lens.js to inspect
    const scoped = () => ROOT.dataset.scope === 'lens';
    // pencil → Twist: four lobes up the hero (default), or one long double-helix twist (two lobes)
    const twoLobes = () => ROOT.dataset.twist === 'double';
    const lensAmp = () => clamp(Math.min(W, H) * (W < 700 ? 0.1 : 0.085), 36, 100) * (twoLobes() ? 1.75 : 1);
    function helixSpan() {
      if (scoped()) {
        // two lobes: half a turn spans half the hero's height, measured along the tilted axis
        const along = H / Math.sin((W < 700 ? 64 : 72) * Math.PI / 180);
        return { halfW: Math.hypot(W, H) / 2 + 40, hp: twoLobes() ? along * 0.5 : lensAmp() * 2.5 };
      }
      if (!boxed()) return { halfW: W / 2, hp: (W / 2) * TURN };
      // the loop fits its slot's width, leaving room either side for the Know and Record labels
      // (the Showcase hero layout runs it wider: about two thirds of the card)
      const wide = ROOT.dataset.hlayout === 'showcase';
      const halfW = W < 700 ? W * 0.44 : Math.min(W * (wide ? 0.335 : 0.285), bandBox().width / 2 - 150);
      return { halfW: Math.max(halfW, 120), hp: Math.max(halfW, 120) };
    }
    // the band slot's left edge and width within the hero (the whole hero when there is none)
    function bandBox() {
      if (!band) return { left: 0, width: W };
      const r = band.getBoundingClientRect(), h = hero.getBoundingClientRect();
      return { left: r.left - h.left, width: r.width };
    }

    function layout() {
      const mobile = W < 700;
      // fit the helix (and its labels) into the band slot when there is one, else the whole section
      let top = 0, bandH = H;
      if (band) {
        const r = band.getBoundingClientRect(), h = hero.getBoundingClientRect();
        top = r.top - h.top;
        bandH = r.height;
      }
      // the loop and the Control label under it stay inside the slot (it can be short, e.g. the Framed layout's panel)
      const ampMax = band ? Math.min(bandH * 0.36, bandH / 2 - 64) : H * (mobile ? 0.17 : 0.25);
      G.lens = scoped();
      G.box = !G.lens && boxed();
      // centred on the band slot (the hero layouts can put it to one side)
      const bb = bandBox();
      G.cx = band && !mobile ? bb.left + bb.width / 2 : W / 2;
      G.cy = top + bandH * (G.box || coreMode() ? 0.5 : band ? 0.42 : mobile ? 0.46 : 0.48);
      G.angle = 0;
      if (G.lens) {
        // the axis leans up and to the right through a point right of centre
        G.cx = W * (mobile ? 0.7 : 0.66);
        G.cy = H * (mobile ? 0.34 : 0.5);
        // the axis runs from the top (where the loop starts, at Knowledge) down to the bottom left,
        // so the helix builds from the top
        G.angle = ((180 - (mobile ? 64 : 72)) * Math.PI) / 180;
      }
      ({ halfW: G.halfW, hp: G.hp } = helixSpan()); // half a turn: the outer crossings sit just past the edges, or at the tips
      G.span = G.lens ? G.halfW : G.hp; // how far along the axis the strands (and the comets' loop) run
      G.k = Math.PI / G.hp;
      G.amp = G.lens ? lensAmp() : Math.min(G.hp * (G.box ? (mobile ? 0.34 : ROOT.dataset.hlayout === 'showcase' ? 0.28 : 0.24) : 0.4), ampMax);
      G.ak = G.amp * G.k;              // the strands' steepest slope, at the crossings
      G.n = 1 / Math.hypot(1, G.ak);
      G.persp = metal && !G.lens ? 0 : PERSP; // the metal shader draws the strands flat
      G.w0 = G.amp * lerp(RIBBON[0], RIBBON[1], S.grow) * RIBBON_SCALE[variant]
        * (G.lens && twoLobes() ? 1.3 : 1); // the long double twist reads thin otherwise
      G.gap = rungGap(G.hp);
      for (let i = 0; i < SAMPLES; i++) G.xs[i] = G.cx - G.span + (2 * G.span * i) / (SAMPLES - 1);
      G.viewL = G.cx - G.halfW - 10; // the stretch of axis in view, for culling
      G.viewR = G.cx + G.halfW + 10;
      // labels sit just under the helix's lowest edge plus a small gap
      G.rowY = G.cy + G.amp + G.w0 * 0.7 + (mobile ? 14 : 16);
    }

    // helix space (axis x, y down from the axis, z toward the viewer; px) → screen, with a touch
    // of perspective; out.z is the depth in −1..1
    function project(x, y, z, out) {
      const f = 1 / (1 - (G.persp * z) / G.amp);
      out.x = G.cx + (x - G.cx) * f;
      out.y = G.cy + y * f;
      out.z = z / G.amp;
      return out;
    }

    // a point on strand `sign` (A = 1, B = −1) at axis position x, `across` px over the ribbon's
    // face and `lift` px out from the axis. The face lies on the cylinder, so a ribbon is seen
    // wide where the strands cross and edge-on at the top and bottom of each lobe.
    // boxed: 1 along the helix, fading to 0 over the last stretch at each end. The strands end
    // free, like a cut length of DNA, rather than being pinched together.
    function fadeAt(x) {
      if (!G.box) return 1;
      const k = clamp((1 - Math.abs(x - G.cx) / G.hp) / 0.12, 0, 1);
      return k * k * (3 - 2 * k);
    }
    // depth → alpha: the far side fades
    const depthAlpha = (x, z) => (0.22 + 0.78 * (z + 1) * 0.5) * fadeAt(x);

    // the helix's angle at axis position x: it turns on its axis, so the crossings travel along it
    // and each base pair swings from full length through nothing and back, like a spinning DNA loop
    const angleAt = (x) => G.k * (x - G.cx) - G.phase;

    function point(x, sign, across, lift, out) {
      const th = angleAt(x);
      const s = sign * Math.sin(th), c = sign * Math.cos(th);
      const r = G.amp + lift, a = across * G.n;
      return project(x - G.ak * a, r * s + c * a, r * c - s * a, out);
    }

    // loop parameter s ∈ [0,1]: first half rides strand A left→right, second half strand B right→left
    function loopToStrand(s) {
      if (newStart()) {
        if (s < 0.5) return { sign: S.ride, x: G.cx - G.span + 4 * G.span * s };
        return { sign: -S.ride, x: G.cx + G.span - 4 * G.span * (s - 0.5) };
      }
      if (s < 0.5) return { sign: 1, x: G.cx - G.span + 4 * G.span * s };
      return { sign: -1, x: G.cx + G.span - 4 * G.span * (s - 0.5) };
    }

    const _p = {};
    function loopPoint(s, frac, out) {
      const { sign, x } = loopToStrand(clamp(s, 0, 1));
      return point(x, sign, frac * G.w0, frac * frac * G.w0 * 0.5, out);
    }

    /* ---------- transactions ---------- */
    function launchBatch() {
      const n = 5 + Math.min(S.T, 6);
      const dur = Math.max(2.2, 3.4 - S.T * 0.1);
      S.comets = [];
      for (let i = 0; i < n; i++) {
        S.comets.push({
          delay: i === 0 ? 0 : i * 0.07 + Math.random() * 0.05,
          dur: dur * (i === 0 ? 1 : 0.96 + Math.random() * 0.08),
          frac: i === 0 ? 0 : (Math.random() - 0.5) * 0.9,
          size: i === 0 ? 1.15 : 0.65 + Math.random() * 0.45,
          s: -1,
          prev: -1,
        });
      }
      S.batchStart = S.t;
      S.batchOn = true;
      S.kPulse = 1;
    }

    const TRAIL = 0.07;

    // pencil → Start → New: everything as Old (the full loop, out on one strand to Record and back
    // on the other, the same spin), except that each request goes out on whichever strand is the
    // lower one as it crosses the centre, so it passes Control on its way from Knowledge to Record
    const newStart = () => !G.lens && ROOT.dataset.start === 'new';
    const loopEnd = () => 1;
    // New: a fixed starting angle for the spin, so the first request's strand (the one Old draws
    // first) is at the bottom as it crosses the centre: it launches at 0.5 s and gets there a
    // quarter of its 3.4 s run later
    const NEW_OFFSET = -Math.PI / 2 - (0.5 + 3.4 * 0.25) * SPIN;
    const spinPhase = (t) => t * SPIN + (newStart() ? NEW_OFFSET : 0);


    function updateComets() {
      let done = true;
      const end = loopEnd(), recordAt = 0.375;
      S.comets.forEach((c, i) => {
        c.prev = c.s;
        c.s = (S.t - S.batchStart - c.delay) / c.dur;
        if (c.s < end + TRAIL) done = false;
        if ((c.prev < 0.25 && c.s >= 0.25) || (end > 0.75 && c.prev < 0.75 && c.s >= 0.75)) scanHit();
        if (i === 0 && c.prev < recordAt && c.s >= recordAt) writeRecord(); // reaching Record
      });
      // the first pass draws the helix in behind it (on the one-pass start, both strands by its end)
      if (S.T === 0) S.reveal = Math.max(S.reveal, clamp(S.comets[0].s / end, 0, 1));
      if (done) completeTransaction();
    }

    function completeTransaction() {
      S.batchOn = false;
      S.comets = [];
      S.T += 1; // growth stops at FULL_AT; the transactions keep flowing
      S.reveal = 1;
      S.kPulse = 1;
      const seeded = seedRungs(S.t + 0.3);
      S.nextBatchAt = S.t + (seeded ? 1.1 : 0.2);

    }

    function scanHit() {
      if (S.t - S.lastScan < 0.25) return;
      S.lastScan = S.t;
      S.scanHits.push(S.t);
      S.ripples.push(S.t);
    }

    function writeRecord() {
      S.rPulse = 1;
    }

    /* ---------- base pairs ---------- */
    // the slots in view, left → right; every transaction that comes back writes the next blank one
    // base-pair spacing along the axis (a little closer in the microscope's long double twist)
    const rungGap = (hp) => hp * (scoped() && twoLobes() ? 1 / 6.5 : RUNG_GAP);
    function rungSlots() {
      const { halfW, hp } = helixSpan();
      const gap = rungGap(hp);
      // the microscope's tilted strand runs far off screen: only the pairs in view are counted
      const reach = scoped() ? H / 2 / Math.sin((W < 700 ? 64 : 72) * Math.PI / 180) + lensAmp() : halfW - 12;
      const n = Math.floor(reach / gap);
      const out = [];
      // the middle slot is left clear for the Control hexagon, except in the microscope view
      for (let k = -n; k <= n; k++) if (k !== 0 || scoped()) out.push(k);
      return out;
    }

    // returns true if a new base pair was scheduled
    // Every transaction writes the next blank base pairs, from Knowledge's end of the strand on:
    // one at a time on the loop, enough in the microscope view that the helix is complete by the
    // time it's fully grown (each one typing in just after the one before)
    function seedRungs(at) {
      const slots = rungSlots();
      const per = scoped() ? Math.ceil(slots.length / FULL_AT) : 1;
      let added = 0;
      for (const k of slots) {
        if (S.rungStart.size >= Math.min(S.T * per, slots.length)) break;
        if (S.rungStart.has(k)) continue;
        S.rungStart.set(k, at + added * 0.18);
        added++;
      }
      return added > 0;
    }

    // ripples run out along the helix from Control after every scan: heat 0..1 at axis x
    function heatAt(x) {
      let heat = 0;
      const d0 = Math.abs(x - G.cx), v = G.halfW * 1.125, sigma = G.halfW / 8;
      for (const t0 of S.ripples) {
        const age = S.t - t0;
        if (age < 0 || age > 2.6) continue;
        const d = (d0 - age * v) / sigma;
        const h = Math.exp(-0.5 * d * d) * (1 - age / 2.6);
        if (h > heat) heat = h;
      }
      return heat;
    }

    /* ---------- drawing ---------- */
    function drawBackground(t) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      if ((metal || P.clear) && ctx === mainCtx) {
        ctx.clearRect(0, 0, W, H); // the metal strands show through from the canvas below
      } else {
        ctx.fillStyle = P.bg;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.fillStyle = P.dust;
      if (!G.lens) for (const d of dust) { // the microscope view stays clean
        const x = (((d.x + t * d.vx) % 1) + 1) % 1 * W;
        const y = (((d.y + t * d.vy) % 1) + 1) % 1 * H;
        ctx.globalAlpha = d.a * 0.6 * (0.55 + 0.45 * Math.sin(t * d.tw + d.ph));
        ctx.fillRect(x, y, d.r, d.r);
      }
    }

    function strandRange(sIdx) {
      const last = SAMPLES - 1;
      if (S.reveal >= 1) return [0, last];
      if (sIdx === 0) return [0, Math.floor(clamp(S.reveal * 2, 0, 1) * last)];
      if (S.reveal <= 0.5) return [last, last];
      return [Math.ceil((1 - (S.reveal - 0.5) * 2) * last), last];
    }
    // whether both strands have been drawn in at axis x (strand B comes in last, from the right)
    const revealed = (x) => S.reveal >= 1 || (S.reveal > 0.5 && x >= G.cx + G.span - 4 * G.span * (S.reveal - 0.5));

    // the colour of a thread `tone` of the way across its ribbon (0 = one edge, 1 = the other)
    const toneRgb = (tone) => (P.tint ? hexRgb(P.tint(tone - 0.5)) : mixRgb(hexRgb(P.threads[0]), hexRgb(P.threads[1]), tone));
    let HEAT = hexRgb(P.heat);

    // 0/1 sprites: five tones across the ribbon, and the base pairs' ink, heat and refusal red
    const TONES = 5;
    const glyphs = {};
    function glyphSprite(rgb, digit, asAgent = agentMode(), asAscii = asciiMode()) {
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const g = c.getContext('2d');
      g.fillStyle = rgbStr(rgb);
      if (asAgent) {
        // the agent mark, filling the cell the way a digit does
        g.translate(16, 16.5);
        g.scale(1.48, 1.48);
        g.translate(-10.44, -10.44);
        g.fill(new Path2D(AGENT_D), 'evenodd');
        return c;
      }
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = '600 26px "Google Sans Code", ui-monospace, Menlo, monospace';
      if (asAscii) {
        // the glyph, scaled so its ink is as tall as a digit's
        const d = g.measureText('0');
        const digitH = d.actualBoundingBoxAscent + d.actualBoundingBoxDescent;
        g.font = `26px ${ASCII_FONT}`;
        const m = g.measureText(ASCII_GLYPH);
        const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || digitH;
        const k = digitH / h;
        g.font = `${(26 * k).toFixed(1)}px ${ASCII_FONT}`;
        const m2 = g.measureText(ASCII_GLYPH);
        g.textBaseline = 'alphabetic';
        g.fillText(ASCII_GLYPH, 16, 16 + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2);
        return c;
      }
      g.fillText(digit, 16, 17);
      return c;
    }
    let glyphMode = null;
    function makeGlyphs() {
      glyphMode = ROOT.dataset.glyph;
      const pair = (rgb) => [glyphSprite(rgb, '0'), glyphSprite(rgb, '1')];
      glyphs.tone = Array.from({ length: TONES }, (_, b) => pair(toneRgb(b / (TONES - 1))));
      glyphs.rung = pair(hexRgb(P.rung));
      glyphs.heat = pair(HEAT);
      // the agent marks the scan reveals (Binary-agent)
      // what the hexagon reveals: agents (Binary-agent), or the magnified ASCII glyphs (ASCII 2)
      const agent = (rgb) => glyphSprite(rgb, '', true, false);
      glyphs.toneAgent = Array.from({ length: TONES }, (_, b) => agent(toneRgb(b / (TONES - 1))));
      const ascii = (rgb) => [glyphSprite(rgb, '', false, true), glyphSprite(rgb, '', false, true)];
      glyphs.zoom = {
        tone: Array.from({ length: TONES }, (_, b) => ascii(toneRgb(b / (TONES - 1)))),
        rung: ascii(hexRgb(P.rung)),
        heat: ascii(HEAT),
      };
      dirty = true;
    }

    // the Control hexagon's radius (a little larger in ASCII 2, where it's a lens)
    const hexR = () => clamp(G.amp * 0.42, 26, 76) * (ascii2Mode() ? 1.35 : 1);

    // Binary-agent: 1 inside the Control hexagon (as drawn, tilted 13°, following the request in
    // the New start), easing to 0 across its rim; 0 everywhere else
    function inHex(x, y) {
      if (G.lens) return 0;
      const r = hexR();
      const dx = x - G.cx, dy = y - (G.cy + (S.hexY || 0));
      const c = Math.cos(-HEX_TILT), s = Math.sin(-HEX_TILT);
      const u = dx * c - dy * s, v = dx * s + dy * c;
      // pointy-top hexagon: its sides face 0°, ±60°
      const d = Math.max(Math.abs(u), Math.abs(u * 0.5 + v * 0.866), Math.abs(u * 0.5 - v * 0.866)) / (r * 0.866);
      return clamp((1 - d) / 0.14, 0, 1);
    }

    // ASCII 2: the helix again, magnified HEX_ZOOM× about the Control hexagon and clipped to it,
    // its digits set as the ASCII glyph (the hexagon's outline is drawn over it afterwards)
    function drawHexZoom(t) {
      const r = hexR();
      const hy = G.cy + (S.hexY || 0);
      ctx.save();
      ctx.translate(G.cx, hy);
      ctx.rotate(HEX_TILT);
      hexPath(r);
      ctx.rotate(-HEX_TILT);
      ctx.clip();
      ctx.globalCompositeOperation = 'source-over';
      const bg = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
      bg.addColorStop(0, 'rgba(255, 255, 255, 0.97)');
      bg.addColorStop(1, 'rgba(233, 237, 251, 0.97)');
      ctx.fillStyle = bg;
      ctx.globalAlpha = 1;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.scale(HEX_ZOOM, HEX_ZOOM);
      ctx.translate(-G.cx, -hy);
      G.zoomed = true;
      drawStrands(0, t);
      drawRungs(S.t);
      drawStrands(1, t);
      G.zoomed = false;
      ctx.restore();
    }

    // Strands: ribbons of fine dotted threads drifting the way the transactions go, with 0/1
    // glyphs riding in them. Drawn in two passes (the half of each strand behind the axis, then
    // the half in front) so the base pairs sit between them.
    function drawStrands(pass, t) {
      if (metal && !G.lens) return;
      const C = 8;
      const K = S.fil * P.density;
      const nT = Math.ceil(K - 1e-3);
      const flow = t * DOT.flow;
      const gsz = clamp(G.amp * 0.09, 7, 11);
      const span = 2 * G.span, x0 = G.cx - G.span;
      const wob = G.amp * 0.013;
      ctx.globalCompositeOperation = P.blend;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // drawn into a coarse grid (scanline, ascii…), dots would alias away: threads go solid, as wide
      // as a good share of a cell, and the grid supplies the texture
      ctx.lineWidth = G.cell ? Math.max(DOT.size, G.cell * 0.4) : DOT.size;
      ctx.setLineDash(G.cell ? [] : [0, DOT.gap]);
      for (let sIdx = 0; sIdx < 2; sIdx++) {
        const sign = sIdx ? -1 : 1; // A drifts left → right, B back
        const [lo, hi] = strandRange(sIdx);
        if (hi - lo < 1) continue;
        for (let i = 0; i < nT; i++) {
          const tn = (i + 0.5) / K - 0.5;
          const part = clamp(K - i, 0, 1);
          const across = tn * G.w0, lift = tn * tn * G.w0 * 0.5;
          const col = toneRgb(clamp(tn + 0.5, 0, 1));
          const colStr = rgbStr(col);
          let arc = 0;
          for (let j = lo; j <= hi; j++) {
            point(G.xs[j], sign, across, lift + wob * Math.sin(G.xs[j] * 0.01 + i * 0.8), _p);
            if (j > lo) arc += Math.hypot(_p.x - TX[j - 1], _p.y - TY[j - 1]);
            TX[j] = _p.x; TY[j] = _p.y; TZ[j] = _p.z; TS[j] = arc;
          }
          for (let i0 = lo; i0 < hi; i0 += C) {
            const i1 = Math.min(i0 + C, hi), mid = (i0 + i1) >> 1;
            const zm = TZ[mid];
            if ((zm >= 0) !== (pass === 1)) continue;
            if (Math.max(TX[i0], TX[i1]) < G.viewL || Math.min(TX[i0], TX[i1]) > G.viewR) continue;
            const xm = G.xs[mid];
            const shimmer = 0.78 + 0.22 * Math.sin(xm * 0.016 - sign * t * 5 + i * 1.7);
            const h = heatAt(xm);
            ctx.globalAlpha = clamp(part * P.alpha * depthAlpha(xm, zm) * shimmer + h * 0.4, 0, 1);
            ctx.strokeStyle = h > 0.02 ? rgbStr(mixRgb(col, HEAT, h * 0.85)) : colStr;
            ctx.lineDashOffset = TS[i0] - sign * flow;
            ctx.beginPath();
            ctx.moveTo(TX[i0], TY[i0]);
            for (let j = i0 + 1; j <= i1; j++) ctx.lineTo(TX[j], TY[j]);
            ctx.stroke();
          }

          // the glyphs riding this thread
          const tone = Math.round(clamp(tn + 0.5, 0, 1) * (TONES - 1));
          const set = (G.zoomed ? glyphs.zoom.tone : glyphs.tone)[tone], agentSet = glyphs.toneAgent[tone];
          const mix = mixMode();
          // Binary-agent: only the ribbon's middle thread shows its agent, so there is one across
          const middle = i === Math.min(nT - 1, Math.floor(K / 2));
          const xa = G.xs[lo], xb = G.xs[hi];
          const n = Math.floor(span / GLYPH_STEP);
          const seed = ((i * 0.618 + sIdx * 0.37) % 1) * GLYPH_STEP;
          for (let g = 0; g < n; g++) {
            const xg = x0 + ((((g * GLYPH_STEP + seed + sign * flow) % span) + span) % span);
            if (xg < xa || xg > xb) continue;
            point(xg, sign, across, lift + wob * Math.sin(xg * 0.01 + i * 0.8), _p);
            if ((_p.z >= 0) !== (pass === 1) || _p.x < G.viewL - gsz || _p.x > G.viewR + gsz) continue;
            const hg = heatAt(xg);
            const al = clamp(part * P.alpha * depthAlpha(xg, _p.z) * 0.95 + hg * 0.4, 0, 1);
            // Binary-agent: inside the Control hexagon the digits give way to the agents below
            const reveal = mix ? inHex(_p.x, _p.y) : 0;
            if (reveal < 1) {
              ctx.globalAlpha = al * (1 - reveal);
              ctx.drawImage(set[bit(i, g, sIdx)], _p.x - gsz / 2, _p.y - gsz / 2, gsz, gsz);
            }
          }
          // Binary-agent: a row of enlarged agents along the ribbon's middle thread, one after
          // another through the hexagon (never stacked across the ribbon), flowing with the strand
          if (mix && middle && !G.lens) {
            const z = gsz * 1.7, step = z * 0.95;
            const r = hexR() * 1.2;
            const off = (((sign * flow) % step) + step) % step;
            for (let xg = G.cx - r - step + off; xg <= G.cx + r; xg += step) {
              if (xg < xa || xg > xb) continue;
              point(xg, sign, across, lift + wob * Math.sin(xg * 0.01 + i * 0.8), _p);
              if ((_p.z >= 0) !== (pass === 1)) continue;
              const reveal = inHex(_p.x, _p.y);
              if (reveal <= 0) continue;
              const zz = z * (0.6 + 0.4 * reveal);
              ctx.globalAlpha = clamp(part * P.alpha * depthAlpha(xg, _p.z), 0, 1) * reveal;
              ctx.drawImage(agentSet, _p.x - zz / 2, _p.y - zz / 2, zz, zz);
            }
          }
        }
      }
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.globalCompositeOperation = P.lightBlend;
    }

    // how strongly passing comets light a base pair at axis x
    function cometPulse(x) {
      let pulse = 0;
      for (const c of S.comets) {
        if (c.s < 0 || c.s > 1) continue;
        const d = (loopToStrand(c.s).x - x) / 36;
        pulse += Math.exp(-d * d);
      }
      return Math.min(1.5, pulse);
    }

    // The metal rods: each written base pair is two halves, one hanging from each strand, meeting
    // with a small gap in the middle.
    function rungHalves(t) {
      const out = [];
      const a = {}, b = {};
      const gap = 3;
      for (const [k, start] of S.rungStart) {
        const p = clamp((t - start) / 0.9, 0, 1);
        if (p <= 0) continue;
        const pe = easeOut(p);
        const x = G.cx + k * G.gap;
        const th = angleAt(x);
        point(x, 1, 0, 0, a);
        point(x, -1, 0, 0, b);
        const inset = G.w0 * METAL.halfWidth * 0.45;
        const len = b.y - a.y;
        if (Math.abs(len) < inset * 2 + 8) continue;
        const dir = Math.sign(len);
        const mid = (a.y + b.y) / 2;
        const ya = a.y + dir * inset, yb = b.y - dir * inset;
        const boost = 1 + cometPulse(x) + (p < 1 ? Math.sin(p * Math.PI) * 0.6 : 0);
        out.push(
          { x, y0: ya, y1: lerp(ya, mid - dir * gap, pe), z: a.z, f: th, strand: 0, boost },
          { x, y0: yb, y1: lerp(yb, mid + dir * gap, pe), z: b.z, f: th + Math.PI, strand: 1, boost },
        );
      }
      return out;
    }

    // Base pairs: a blank one is a dotted column; a written one types itself in, front strand to
    // back, as three columns of binary digits that flash as they land
    function drawRungs(t) {
      const a = {}, b = {};
      const colGap = clamp(G.amp * 0.055, 4.5, 8);
      const rsz = clamp(G.amp * 0.1, 7, 12), pitch = rsz * 1.2;
      ctx.globalCompositeOperation = P.blend;
      for (const k of rungSlots()) {
        const x = G.cx + k * G.gap;
        if (!revealed(x)) continue;
        const th = angleAt(x), r = G.amp, fade = fadeAt(x);
        const ys = r * Math.sin(th), zs = r * Math.cos(th); // strand A's centre; B mirrors it
        const len = 2 * Math.abs(ys);
        const start = S.rungStart.get(k);
        const age = start === undefined ? -1 : t - start;
        const pulse = cometPulse(x);
        const h = heatAt(x);
        if (age < 0) {
          project(x, ys * 0.86, zs * 0.86, a);
          project(x, -ys * 0.86, -zs * 0.86, b);
          ctx.strokeStyle = h > 0.02 ? rgbStr(mixRgb(hexRgb(P.rungIdle), HEAT, h * 0.7)) : P.rungIdle;
          ctx.lineCap = 'round';
          ctx.lineWidth = G.cell ? Math.max(1.8, G.cell * 0.4) : 1.8;
          ctx.setLineDash(G.cell ? [] : [0, Math.max(4.5, (len * 0.86) / 24)]);
          ctx.globalAlpha = clamp(0.6 * P.alpha * (1 + pulse * 0.6) + h * 0.3, 0, 1) * fade;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);
          continue;
        }
        if (metal && !G.lens) continue; // the shader draws written pairs as metal rods
        const typed = clamp(age * 1.6, 0, 1);
        const flash = Math.max(Math.exp(-age * 1.8), h * 0.7, pulse * 0.4);
        if (G.cellW >= 8) {
          // set in type (ascii), single digits would vanish into their cells: solid columns instead
          ctx.strokeStyle = P.rung;
          ctx.lineCap = 'butt';
          ctx.lineWidth = G.cellW * 0.2;
          ctx.globalAlpha = 0.85 * P.alpha * fade;
          ctx.beginPath();
          for (let c = -1; c <= 1; c++) {
            project(x + c * colGap * 0.8, ys * 0.86, zs * 0.86, a);
            project(x + c * colGap * 0.8, ys * (0.86 - 1.72 * typed), zs * (0.86 - 1.72 * typed), b);
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
          ctx.stroke();
          continue;
        }
        const n = Math.round((len * 0.86) / pitch); // edge-on, a pair shrinks to nothing as it turns
        // three columns of digits; two of agents or ASCII glyphs (they're wider)
        const cols = agentMode() || asciiMode() || G.zoomed ? [-0.65, 0.65] : [-1, 0, 1];
        for (const c of cols) {
          for (let d = 0; d < n; d++) {
            const u = (d + 0.5) / n; // 0 at strand A, 1 at strand B
            if (u > typed) break;
            const q = 1 - 2 * lerp(0.07, 0.93, u);
            project(x + c * colGap, ys * q, zs * q, a);
            const al = (0.3 + 0.7 * (a.z + 1) * 0.5) * 0.92 * P.alpha * fade;
            const g = bit(k + 40, c + 2, d);
            const s = rsz * (a.z * G.persp + 1);
            if (flash < 0.98) {
              ctx.globalAlpha = al * (1 - flash);
              ctx.drawImage((G.zoomed ? glyphs.zoom : glyphs).rung[g], a.x - s / 2, a.y - s / 2, s, s);
            }
            if (flash > 0.02) {
              ctx.globalAlpha = al * flash;
              ctx.drawImage((G.zoomed ? glyphs.zoom : glyphs).heat[g], a.x - s / 2, a.y - s / 2, s, s);
            }
          }
        }
      }
      ctx.globalCompositeOperation = P.lightBlend;
    }

    function drawComets() {
      if (!S.batchOn) return;
      const segs = 22;
      const pt = {};
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(${P.trail},1)`;
      for (const c of S.comets) {
        if (c.s < 0) continue;
        let px = null, py = null, half = -1;
        for (let j = segs; j >= 0; j--) {
          const s = c.s - (TRAIL * j) / segs;
          if (s < 0 || s > 1) { px = null; continue; }
          // the loop hops strands at the far end: the trail breaks there rather than bridging the gap
          const h = s < 0.5 ? 0 : 1;
          if (h !== half) { px = null; half = h; }
          loopPoint(s, c.frac, pt);
          if (px !== null) {
            const k = 1 - j / segs;
            ctx.globalAlpha = k * k * 0.85 * fadeAt(loopToStrand(s).x);
            ctx.lineWidth = (0.3 + k * 1.9) * c.size;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
          }
          px = pt.x; py = pt.y;
        }
        if (c.s > loopEnd()) continue;
        loopPoint(c.s, c.frac, pt);
        const fade = fadeAt(loopToStrand(c.s).x); // boxed: comets fade out at one end of the helix and back in on the other strand
        const r = 16 * c.size;
        ctx.globalAlpha = 0.9 * fade;
        ctx.drawImage(glowSprite, pt.x - r, pt.y - r, r * 2, r * 2);
        ctx.globalAlpha = fade;
        ctx.fillStyle = P.ink;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.7 * c.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function dashedDrop(x, y0, y1, alpha) {
      if (G.box || coreMode() || y1 - y0 < 8) return; // boxed: the names sit beside the tips, nothing drops (and Core has no names)
      ctx.strokeStyle = `${P.ui}1)`;
      ctx.lineWidth = 1;
      ctx.globalAlpha = alpha;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Pillar 1: Knowledge, the left lobe: it glows as each transaction sets out
    function drawKnowledge() {
      const x = G.cx - G.hp / 2;
      G.knowledge = { x, y: G.cy };
      if (S.kPulse > 0 && variant !== 'glow') {
        const r = G.amp * 0.5 * (1 + S.kPulse);
        ctx.globalAlpha = S.kPulse * 0.45;
        ctx.drawImage(glowSprite, x - r, G.cy - r, r * 2, r * 2);
      }
      dashedDrop(x, G.cy + G.amp + G.w0 * 0.6 + 8, G.rowY - 14, 0.16);
    }

    function hexPath(r) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 3;
        const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    // Pillar 2: Control, a hexagon (tilted 13°, like the mark) on the crossing that scans every pass
    function drawControl(t) {
      if (G.lens || coreMode()) return; // the lens does the inspecting in the microscope view; Core's tile sits here instead
      const r = hexR();
      const last = S.scanHits.length ? t - S.scanHits[S.scanHits.length - 1] : 99;
      const hot = Math.max(0, 1 - last / 0.9);
      G.scanBox = r;
      const hy = G.cy + (S.hexY || 0); // rides the strands (see update)

      // grid versions: the hexagon stays out of the grid and is stroked on top afterwards
      // (see drawScanline / drawHalftone), so it stays crisp over the bars or dots
      const vector = ['scanline', 'halftone', 'ascii', 'ascii-plain', 'glow', 'slit'].includes(variant);
      const V = variant === 'scanline' ? { ink: SCAN.ink, bg: SCAN.bg }
        : variant === 'halftone' ? { ink: HALF.ink, bg: HALF.bg }
        : variant === 'glow' ? { ink: GLOW.deep, bg: null }
        : variant === 'slit' ? { ink: SLIT.outline, bg: null }
        : { ink: variant === 'ascii-plain' ? ASCII_PLAIN.outline : ASCII.glyph, bg: null }; // just the outline
      if (vector && ctx !== mainCtx) {
        dashedDrop(G.cx, hy + r + 8, G.rowY - 14, 0.16 + hot * 0.2);
        return;
      }
      const ink = vector ? V.ink : `${P.ui}1)`;
      const m = vector ? 0 : boxMorph(); // held at the crossing: the hexagon is becoming the scan box
      if (m > 0) drawMorph(r, hy, m, hot);

      ctx.save();
      ctx.translate(G.cx, hy);
      ctx.rotate(HEX_TILT);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      if (vector && V.bg) {
        // a lens: fade the bars inside, cut a clean channel for the outline
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = V.bg;
        hexPath(r);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = V.bg;
        ctx.lineWidth = 9;
        hexPath(r);
        ctx.stroke();
      }

      // outline + brighter corner brackets
      if (!m) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = vector ? 1.5 : 1;
        ctx.globalAlpha = vector ? 0.9 : 0.12 + hot * 0.25;
        hexPath(r);
        ctx.stroke();
        ctx.globalAlpha = vector ? 1 : 0.45 + hot * 0.5;
        ctx.lineWidth = vector ? 3 + hot * 1.5 : 1.3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a0 = -Math.PI / 2 + (i * Math.PI) / 3;
          const a1 = a0 - Math.PI / 3, a2 = a0 + Math.PI / 3;
          const vx = Math.cos(a0) * r, vy = Math.sin(a0) * r;
          const k = 0.24;
          ctx.moveTo(lerp(vx, Math.cos(a1) * r, k), lerp(vy, Math.sin(a1) * r, k));
          ctx.lineTo(vx, vy);
          ctx.lineTo(lerp(vx, Math.cos(a2) * r, k), lerp(vy, Math.sin(a2) * r, k));
        }
        ctx.stroke();
      }

      // per hit: an expanding hexagon and a sweep line clipped to the hexagon
      ctx.lineWidth = vector ? 1.5 : 1;
      S.scanHits = S.scanHits.filter((h) => t - h < 1.2);
      for (const h of S.scanHits) {
        const p = (t - h) / 1.2;
        ctx.globalAlpha = (1 - p) * (vector ? 0.8 : 0.6) * (1 - m);
        hexPath(lerp(r * 0.3, r * 1.8, easeOut(p)));
        ctx.stroke();
        if (p < 0.6) {
          const y = -r + 2 * r * easeOut(p / 0.6);
          ctx.save();
          hexPath(r);
          ctx.clip();
          ctx.globalAlpha = (1 - p / 0.6) * 0.85 * (1 - m);
          ctx.beginPath();
          ctx.moveTo(-r, y);
          ctx.lineTo(r, y);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();

      if (vector) return;
      if (hot > 0) {
        const g = r * (0.7 + hot * 0.5);
        ctx.globalAlpha = hot * 0.8;
        ctx.drawImage(glowSprite, G.cx - g, hy - g, g * 2, g * 2);
      }
      dashedDrop(G.cx, hy + r + 8, G.rowY - 14, 0.16 + hot * 0.2);
    }

    // Pillar 3: Record, the right lobe, where each transaction is written
    function drawRecord() {
      const x = G.cx + G.hp / 2;
      G.record = { x, y: G.cy };
      // a soft flash where the transaction is written (not as bars: glows dither into noise there)
      if (variant !== 'scanline' && S.rPulse > 0) {
        const r = G.amp * 0.5 * (1 + S.rPulse);
        ctx.globalAlpha = S.rPulse * 0.6;
        ctx.drawImage(glowSprite, x - r, G.cy - r, r * 2, r * 2);
      }
      dashedDrop(x, G.cy + G.amp + G.w0 * 0.6 + 8, G.rowY - 14, 0.16);
    }

    // the hold: the Control hexagon turns into a scan box the Control label's width, reaching from
    // the crossing's top to just above the label; a scan line sweeps it top to bottom, then it
    // turns back into the hexagon
    const smooth = (p) => p * p * (3 - 2 * p);
    function boxMorph() {
      if (S.hold === null || G.lens) return 0;
      const h = S.hold;
      return h < HOLD.open ? easeOut(h / HOLD.open)
        : h < HOLD.open + HOLD.scan ? 1 : 1 - smooth((h - HOLD.open - HOLD.scan) / HOLD.close);
    }
    const scanHalf = () => ({ hw: ui.control.offsetWidth / 2, hh: G.amp + G.w0 * 0.5 + 4 });

    // the hexagon (circumradius r, centred at hy) part way (m) to the box: both shapes sampled on
    // the same rays (the hexagon's corners and the box's), the radius on each ray blended
    function drawMorph(r, hy, m, hot) {
      const { hw, hh } = scanHalf();
      const cy = lerp(hy, G.cy, m), base = HEX_TILT * (1 - m) - Math.PI / 2;
      const apo = r * Math.cos(Math.PI / 6), SIX = Math.PI / 3, TAU = Math.PI * 2;
      const ca = Math.atan2(hh, hw);
      const rays = [];
      for (let i = 0; i < 6; i++) rays.push({ ang: base + i * SIX, hex: true });
      for (const ang of [-ca, ca, Math.PI - ca, Math.PI + ca]) rays.push({ ang, hex: false });
      for (const k of rays) k.ang = ((k.ang % TAU) + TAU) % TAU;
      rays.sort((p, q) => p.ang - q.ang);
      const pts = rays.map((k) => {
        const u = (((k.ang - base) % SIX) + SIX) % SIX;
        const c = Math.cos(k.ang), sn = Math.sin(k.ang);
        const rad = lerp(apo / Math.cos(u - Math.PI / 6), Math.min(hw / Math.max(Math.abs(c), 1e-6), hh / Math.max(Math.abs(sn), 1e-6)), m);
        return { x: G.cx + c * rad, y: cy + sn * rad, hex: k.hex };
      });
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.closePath();
      ctx.globalAlpha = m;
      ctx.fillStyle = 'rgba(59,108,240,0.06)';
      ctx.fill();
      ctx.strokeStyle = `${P.ui}1)`;
      ctx.lineWidth = 1;
      ctx.globalAlpha = lerp(0.12 + hot * 0.25, 0.16, m);
      ctx.stroke();
      // corner brackets: the hexagon's fade as the box's come in, each running toward its
      // neighbouring corners of the same shape
      for (const hex of [true, false]) {
        const own = pts.filter((q) => q.hex === hex);
        ctx.globalAlpha = hex ? (0.45 + hot * 0.5) * (1 - m) : 0.7 * m;
        if (ctx.globalAlpha <= 0.01) continue;
        ctx.lineWidth = hex ? 1.3 : 1.5;
        ctx.beginPath();
        own.forEach((q, i) => {
          const arm = (o) => {
            const d = Math.hypot(o.x - q.x, o.y - q.y) || 1, len = hex ? d * 0.24 : Math.min(16, d * 0.5);
            return { x: q.x + ((o.x - q.x) / d) * len, y: q.y + ((o.y - q.y) / d) * len };
          };
          const p0 = arm(own[(i + own.length - 1) % own.length]), p1 = arm(own[(i + 1) % own.length]);
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(q.x, q.y);
          ctx.lineTo(p1.x, p1.y);
        });
        ctx.stroke();
      }
      ctx.restore();
    }

    // the sweep through the box: a bright line down to the bottom and back up to the top, its soft
    // trail behind it (shortening to nothing as it turns at the bottom)
    function drawScanSweep() {
      if (S.hold === null || G.lens) return;
      const p = (S.hold - HOLD.open) / HOLD.scan;
      if (p <= 0 || p >= 1) return;
      const { hw, hh } = scanHalf();
      const x0 = G.cx - hw, y0 = G.cy - hh, bw = hw * 2, bh = hh * 2;
      const down = p < 0.5, u = down ? p * 2 : 2 - p * 2;
      const y = y0 + bh * smooth(u), fade = Math.min(1, p / 0.06, (1 - p) / 0.06);
      const tail = 40 * (4 * u * (1 - u)) * (down ? 1 : -1); // trail length follows the line's speed
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.rect(x0, y0, bw, bh);
      ctx.clip();
      if (Math.abs(tail) > 0.5) {
        const g = ctx.createLinearGradient(0, y - tail, 0, y);
        g.addColorStop(0, 'rgba(59,108,240,0)');
        g.addColorStop(1, 'rgba(59,108,240,0.22)');
        ctx.globalAlpha = fade;
        ctx.fillStyle = g;
        ctx.fillRect(x0, Math.min(y, y - tail), bw, Math.abs(tail));
      }
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#3b6cf0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + bw, y);
      ctx.stroke();
      ctx.restore();
    }

    // the carousel over the box: the app being scanned sits centred just above it, the one before
    // and the one after smaller, lower and faded either side; between the two sweeps (as the line
    // turns at the bottom) it slides one along, and each app is ticked once its sweep is done
    let appsShown = false;
    function placeApps() {
      const m = boxMorph();
      if (!m) {
        if (appsShown) for (const tile of tiles) { tile.style.opacity = '0'; tile.classList.remove('is-done'); }
        appsShown = false;
        return;
      }
      appsShown = true;
      const p = (S.hold - HOLD.open) / HOLD.scan;
      const c = S.holdApp + smooth(clamp((p - 0.42) / 0.16, 0, 1)); // the centred app, sliding one on at the turn
      const size = tiles[0].offsetWidth, step = size + (W < 700 ? 12 : 16);
      const top = G.cy - scanHalf().hh - (W < 700 ? 8 : 12) - size;
      const shown = new Set();
      for (let k = Math.floor(c) - 2; k <= Math.ceil(c) + 2; k++) {
        const d = k - c, ad = Math.abs(d), tile = tiles[((k % APPS.length) + APPS.length) % APPS.length];
        const alpha = m * clamp(1 - 0.55 * ad, 0, 1);
        if (alpha <= 0.01) continue;
        shown.add(tile);
        const scale = (1 - 0.2 * Math.min(ad, 2)) * (0.7 + 0.3 * m);
        const x = G.cx + d * step - size / 2, y = top + 10 * Math.min(ad, 2) ** 2 + (1 - m) * 12;
        tile.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        tile.style.opacity = alpha.toFixed(3);
        const done = k < S.holdApp || (k === S.holdApp && p >= 0.46) || (k === S.holdApp + 1 && p >= 0.97);
        tile.classList.toggle('is-done', done);
      }
      for (const tile of tiles) if (!shown.has(tile)) tile.style.opacity = '0';
    }

    function placeLabels() {
      if (G.lens) {
        hero.classList.add('is-placed');
        return;
      }
      // ASCII 2's larger hexagon can ride down onto the Control label: give it a little more room
      const ctlDrop = ascii2Mode() ? hexR() * 0.32 : 0;
      const place = (el, x, dy = 0) => {
        const w = el.offsetWidth;
        const lx = clamp(x - w / 2, 16, W - 16 - w);
        el.style.transform = `translate3d(${lx.toFixed(1)}px, ${(G.rowY + dy).toFixed(1)}px, 0)`;
      };
      if (G.box) {
        // the names sit off the tips like the stats in the reference: Knowledge level with the
        // left tip, Record off the right tip and a little lower (above and below on phones);
        // Control under the scan at the crossing
        const pin = (el, x, y) => { el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; };
        const k = ui.knowledge, r = ui.record, c = ui.control;
        pin(c, G.cx - c.offsetWidth / 2, G.cy + G.amp + G.w0 * 0.5 + (W < 700 ? 12 : 14) + ctlDrop);
        const gap = clamp(W * 0.018, 12, 30);
        if (W < 700) {
          pin(k, clamp(G.cx - G.hp, 16, W - 16 - k.offsetWidth), G.cy - G.amp - G.w0 - k.offsetHeight - 14);
          pin(r, clamp(G.cx + G.hp - r.offsetWidth, 16, W - 16 - r.offsetWidth), G.cy + G.amp + G.w0 + 14);
        } else {
          pin(k, G.cx - G.hp - gap - k.offsetWidth, G.cy - k.offsetHeight / 2);
          pin(r, G.cx + G.hp + gap, G.cy + G.amp * 0.3 - r.offsetHeight / 2);
        }
      } else {
        place(ui.knowledge, G.knowledge.x);
        place(ui.control, G.cx, ctlDrop);
        place(ui.record, G.record.x);
      }
      if (core) core.style.transform = `translate3d(${(G.cx - core.offsetWidth / 2).toFixed(1)}px, ${(G.cy - core.offsetHeight / 2).toFixed(1)}px, 0)`;
      hero.classList.add('is-placed');
    }

    /* ---------- particles ---------- */
    const dust = Array.from({ length: 110 }, () => ({
      x: Math.random(), y: Math.random(), vx: rand(-0.004, 0.004), vy: rand(-0.003, 0.001),
      r: rand(0.6, 1.6), a: rand(0.05, 0.28), tw: rand(0.4, 1.6), ph: rand(0, 6.28),
    }));

    function makeGlow() {
      const s = 64;
      const c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d');
      const rg = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      rg.addColorStop(0, `rgba(${P.glow},0.42)`);
      rg.addColorStop(0.25, `rgba(${P.glow},0.2)`);
      rg.addColorStop(0.6, `rgba(${P.glow},0.05)`);
      rg.addColorStop(1, `rgba(${P.glow},0)`);
      g.fillStyle = rg;
      g.fillRect(0, 0, s, s);
      glowSprite = c;
    }

    /* ---------- loop ---------- */
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth;
      H = hero.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      if (metal) metal.resize(W, H);
    }

    function update(dt) {
      // held at the centre crossing: nothing moves until the scan box has closed again
      if (S.hold !== null) {
        S.hold += dt;
        if (S.hold >= HOLD_LEN) S.hold = null;
        return;
      }
      // the strands cross at the centre each time the spin passes a multiple of π: stop exactly
      // there (not while the first transaction is still out: only once it has come back from Record to Know)
      if (!G.lens && !coreMode() && G.hp && !reduceMotion) {
        const n = Math.floor(spinPhase(S.t + dt) / Math.PI + 1e-6);
        if (n > Math.floor(spinPhase(S.t) / Math.PI + 1e-6) && S.T >= 1) {
          dt = (n * Math.PI - spinPhase(0)) / SPIN - S.t;
          S.hold = 0;
          S.holdApp = appNext;
          appNext += APPS_PER_HOLD;
        }
      }
      S.t += dt;
      S.kPulse = Math.max(0, S.kPulse - dt * 1.4);
      // the Control hexagon rides a strand at the centre, rising and falling with it as the helix
      // turns; it only changes strand where the two cross while a request is passing through that
      // crossing. The microscope view has its own lens and doesn't use this.
      if (!G.lens && G.hp) {
        const across = Math.sin(-spinPhase(S.t));
        // (not at first: only once each strand has grown to 8 threads)
        if (S.hexPrev !== undefined && Math.sign(across) !== Math.sign(S.hexPrev) && S.batchOn && fibresFor(S.T) >= 8) {
          // the strands meet at the centre: if a request is passing through right now, carry on
          // along the strand it's on; otherwise stay on this one
          for (const c of S.comets) {
            if (c.s < 0 || c.s > 1) continue;
            const { sign, x } = loopToStrand(c.s);
            if (Math.abs(x - G.cx) < G.hp * 0.18) { S.hexSign = sign; break; }
          }
        }
        S.hexPrev = across;
        S.hexTarget = (S.hexSign || 1) * G.amp * across * 0.9;
      } else S.hexTarget = 0;
      S.hexY = approach(S.hexY || 0, S.hexTarget || 0, 9, dt);
      S.rPulse = Math.max(0, S.rPulse - dt * 1.2);
      S.fil = approach(S.fil, fibresFor(S.T), 1.2, dt);
      S.grow = approach(S.grow, growthFor(S.T), 0.9, dt);
      if (S.ripples.length && S.t - S.ripples[0] > 2.6) S.ripples.shift();
      light.x = approach(light.x, lightTarget.x, 5, dt);
      light.y = approach(light.y, lightTarget.y, 5, dt);

      if (reduceMotion) return;
      if (S.batchOn) updateComets();
      else if (S.t >= S.nextBatchAt) {
        if (newStart()) {
          // New start: set off straight away, on whichever strand will be the lower one when the
          // request reaches the centre (strand A sits at y = amp·sin(−phase) there), so it passes
          // Control on its way from Knowledge to Record. The helix spins exactly as in Old.
          const dur = Math.max(2.2, 3.4 - S.T * 0.1);
          S.ride = S.T === 0 ? 1 : Math.sin(-spinPhase(S.t + dur * 0.25)) >= 0 ? 1 : -1;
        }
        launchBatch();
      }
    }

    function drawScene(t) {
      drawBackground(t);
      ctx.globalCompositeOperation = P.lightBlend;
      if (G.lens) {
        // the microscope view: the whole helix tilted up its axis
        ctx.save();
        ctx.translate(G.cx, G.cy);
        ctx.rotate(G.angle);
        ctx.translate(-G.cx, -G.cy);
      } else {
        drawKnowledge();
        drawRecord();
      }
      drawStrands(0, t);
      drawRungs(S.t);
      drawStrands(1, t);
      if (ascii2Mode() && !G.lens) drawHexZoom(t);
      drawControl(S.t);
      drawComets();
      if (ctx === mainCtx) drawScanSweep();
      if (G.lens) ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // draw the ink scene into a grid-sized buffer, then turn each grid row into bars
    let lo = null, loCtx = null;
    // renders the ink scene at grid resolution (cw × rh css px per pixel) and returns its pixels
    function sampleScene(t, cw, rh) {
      const cols = Math.ceil(W / cw), rows = Math.ceil(H / rh);
      if (!lo || lo.width !== cols || lo.height !== rows) {
        lo = document.createElement('canvas');
        lo.width = cols;
        lo.height = rows;
        loCtx = lo.getContext('2d', { willReadFrequently: true });
      }
      ctx = loCtx;
      ctx.setTransform(1 / cw, 0, 0, 1 / rh, 0, 0);
      G.cell = Math.max(cw, rh);
      G.cellW = cw;
      drawScene(t);
      G.cell = G.cellW = 0;
      return { cols, rows, px: loCtx.getImageData(0, 0, cols, rows).data };
    }
    const inkAt = (px, i) => 1 - (0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 255;

    function drawScanline(t) {
      const mobile = W < 700;
      const cw = mobile ? SCAN.cellMobile : SCAN.cell, rh = mobile ? SCAN.rowMobile : SCAN.row;
      const { cols, rows, px } = sampleScene(t, cw, rh);

      ctx = mainCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = SCAN.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = SCAN.ink;
      for (let y = 0; y < rows; y++) {
        const yc = y * rh + rh / 2;
        let level = 0, start = 0;
        for (let x = 0; x <= cols; x++) {
          let next = 0;
          if (x < cols) {
            const i = (y * cols + x) * 4;
            next = inkLevel(inkAt(px, i) * SCAN.gain, x, y);
          }
          if (next === level) continue;
          if (level > 0) {
            const h = SCAN.bars[level] * rh;
            ctx.fillRect(start * cw, yc - h / 2, (x - start) * cw - 1, h);
          }
          level = next;
          start = x;
        }
      }
      drawControl(S.t);
      ctx.globalAlpha = 1;
    }

    // draw the ink scene into a grid-sized buffer, then print it as a rotated dot screen
    let inkBuf = new Float32Array(0);
    function drawHalftone(t) {
      const mobile = W < 700;
      const cw = HALF.cell;
      const { cols, rows, px } = sampleScene(t, cw, cw);
      if (inkBuf.length !== cols * rows) inkBuf = new Float32Array(cols * rows);
      for (let i = 0; i < cols * rows; i++) inkBuf[i] = Math.min(1, inkAt(px, i * 4) * HALF.gain);

      ctx = mainCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = HALF.bg;
      ctx.fillRect(0, 0, W, H);

      // dots on a 45° screen; radius ∝ √ink so area tracks tone
      const p = mobile ? HALF.pitchMobile : HALF.pitch;
      const ca = Math.cos(HALF.angle), sa = Math.sin(HALF.angle);
      const n = Math.ceil(Math.hypot(W, H) / p / 2) + 1;
      const ox = W / 2, oy = H / 2, rMax = p * 0.62;
      ctx.fillStyle = HALF.ink;
      ctx.beginPath();
      for (let u = -n; u <= n; u++) {
        for (let v = -n; v <= n; v++) {
          const x = ox + (u * ca - v * sa) * p, y = oy + (u * sa + v * ca) * p;
          if (x < 0 || y < 0 || x >= W || y >= H) continue;
          const ink = inkBuf[((y / cw) | 0) * cols + ((x / cw) | 0)];
          if (ink < 0.04) continue;
          const r = rMax * Math.sqrt(ink);
          if (r < 0.45) continue;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      drawControl(S.t);
      ctx.globalAlpha = 1;
    }

    // draw the ink scene into a character-sized buffer, then set it in type on a sky: a blurred
    // colour body (blue, warming to yellow at the crossing) under glyphs chosen by ink density
    let tintCanvas = null, tintCtx = null, tintImg = null;
    const cellHash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0);
    function drawAscii(t, A) {
      const mobile = W < 700;
      const cw = mobile ? A.cellMobile : A.cell, ch = mobile ? A.cellHMobile : A.cellH;
      const { cols, rows, px } = sampleScene(t, cw, ch);

      ctx = mainCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (A.skyTop) {
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, A.skyTop);
        sky.addColorStop(1, A.skyBottom);
        ctx.fillStyle = sky;
      } else {
        ctx.fillStyle = A.pageBg;
      }
      ctx.fillRect(0, 0, W, H);

      // the soft body: one pixel per cell, scaled up smoothly and blurred
      if (!tintCanvas || tintCanvas.width !== cols || tintCanvas.height !== rows) {
        tintCanvas = document.createElement('canvas');
        tintCanvas.width = cols;
        tintCanvas.height = rows;
        tintCtx = tintCanvas.getContext('2d');
        tintImg = tintCtx.createImageData(cols, rows);
      }
      const heartR = clamp(G.amp * 0.42, 26, 76) * 1.3;
      const data = tintImg.data;
      const ink = new Float32Array(cols * rows);
      const warm = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const v = Math.min(1, inkAt(px, i * 4) * A.gain);
          const k = clamp(1 - Math.hypot((x + 0.5) * cw - G.cx, (y + 0.5) * ch - G.cy) / heartR, 0, 1);
          ink[i] = v;
          warm[i] = k;
          data[i * 4] = lerp(A.body[0], A.heart[0], k);
          data[i * 4 + 1] = lerp(A.body[1], A.heart[1], k);
          data[i * 4 + 2] = lerp(A.body[2], A.heart[2], k);
          data[i * 4 + 3] = v < (A.bodyMin || 0) ? 0 : Math.min(1, v * 1.8) * 235;
        }
      }
      tintCtx.putImageData(tintImg, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.filter = `blur(${Math.round(cw * 0.45)}px)`;
      ctx.drawImage(tintCanvas, 0, 0, cols * cw, rows * ch);
      ctx.restore();

      // the type
      ctx.font = `500 ${Math.round(ch * 0.74)}px "Google Sans Code", ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const v = ink[i];
          if (v < 0.07) continue;
          const heart = warm[i] > 0.35 && v > 0.15;
          const set = heart ? A.heartSet
            : v > 0.62 ? A.dense : v > 0.36 ? A.mid : v > 0.16 ? A.light : A.faint;
          // on the plain page, glyphs past the body's edge would be white on white
          ctx.fillStyle = heart ? A.heartGlyph : (A.edgeGlyph && v < 0.36 ? A.edgeGlyph : A.glyph);
          ctx.globalAlpha = 0.3 + 0.7 * v;
          ctx.fillText(set[cellHash(x, y) % set.length], (x + 0.5) * cw, (y + 0.5) * ch);
        }
      }
      ctx.globalAlpha = 1;
      drawControl(S.t);
      ctx.globalAlpha = 1;
    }

    // draw the ink scene into a particle-sized buffer, then light it: a wide bloom and a tighter
    // body (each one blurred pixel per cell), then flickering grain whose colour follows density
    let glowCanvas = null, glowCtx = null, glowImg = null, glowInk = new Float32Array(0), glowSoft = new Float32Array(0);
    // well-mixed per-cell, per-frame random in [0, 1), so the grain has no visible pattern
    const grainRand = (x, y, f) => {
      let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(f, 1274126177);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    function glowLayer(cols, rows, rgb, alpha) {
      const data = glowImg.data;
      for (let i = 0; i < cols * rows; i++) {
        data[i * 4] = rgb[0];
        data[i * 4 + 1] = rgb[1];
        data[i * 4 + 2] = rgb[2];
        data[i * 4 + 3] = Math.min(1, glowInk[i] * 1.6) * alpha;
      }
      glowCtx.putImageData(glowImg, 0, 0);
    }
    function drawGlow(t) {
      const mobile = W < 700;
      const cw = mobile ? GLOW.cellMobile : GLOW.cell;
      const { cols, rows, px } = sampleScene(t, cw, cw);
      if (!glowCanvas || glowCanvas.width !== cols || glowCanvas.height !== rows) {
        glowCanvas = document.createElement('canvas');
        glowCanvas.width = cols;
        glowCanvas.height = rows;
        glowCtx = glowCanvas.getContext('2d');
        glowImg = glowCtx.createImageData(cols, rows);
        glowInk = new Float32Array(cols * rows);
        glowSoft = new Float32Array(cols * rows);
      }
      for (let i = 0; i < cols * rows; i++) glowInk[i] = Math.min(1, inkAt(px, i * 4) * GLOW.gain);
      // the grain follows a smoothed density (5×5 box), so it fills the band, not single fibres
      const R = 2, tmp = glowSoft;
      for (let y = 0; y < rows; y++) {
        let acc = 0;
        const row = y * cols;
        for (let x = -R; x < cols; x++) {
          if (x + R < cols) acc += glowInk[row + x + R];
          if (x - R - 1 >= 0) acc -= glowInk[row + x - R - 1];
          if (x >= 0) tmp[row + x] = acc;
        }
      }
      const soft = new Float32Array(cols * rows);
      for (let x = 0; x < cols; x++) {
        let acc = 0;
        for (let y = -R; y < rows; y++) {
          if (y + R < rows) acc += tmp[(y + R) * cols + x];
          if (y - R - 1 >= 0) acc -= tmp[(y - R - 1) * cols + x];
          if (y >= 0) soft[y * cols + x] = Math.min(1, acc / 25 * 1.8);
        }
      }

      ctx = mainCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = GLOW.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      glowLayer(cols, rows, GLOW.bloom, GLOW.bloomAlpha);
      ctx.filter = `blur(${GLOW.bloomBlur}px)`;
      ctx.drawImage(glowCanvas, 0, 0, cols * cw, rows * cw);
      glowLayer(cols, rows, GLOW.body, GLOW.bodyAlpha);
      ctx.filter = `blur(${GLOW.bodyBlur}px)`;
      ctx.drawImage(glowCanvas, 0, 0, cols * cw, rows * cw);
      ctx.restore();

      // grain: each cell flickers on a few times a second, more often the denser it is
      const frame = Math.floor(t * GLOW.flicker);
      const dot = cw * 0.62;
      const buckets = [[], [], []];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const v = soft[y * cols + x];
          if (v < 0.14) continue; // no loose specks off the band
          if (grainRand(x, y, frame) > v * GLOW.density) continue;
          buckets[v > 0.6 ? 0 : v > 0.25 ? 1 : 2].push(x * cw, y * cw);
        }
      }
      const colours = [GLOW.spark, GLOW.grain, GLOW.deep];
      const alphas = [0.95, 0.75, 0.5];
      for (let b = 0; b < 3; b++) {
        const list = buckets[b];
        ctx.fillStyle = colours[b];
        ctx.globalAlpha = alphas[b];
        ctx.beginPath();
        for (let i = 0; i < list.length; i += 2) ctx.rect(list[i], list[i + 1], dot, dot);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawControl(S.t);
      ctx.globalAlpha = 1;
    }

    // separable box blur of a cols×rows field (radius R), clamped to [0, 1] after scaling
    function boxBlur(src, dst, tmp, cols, rows, R, scale) {
      const n = (2 * R + 1) * (2 * R + 1);
      for (let y = 0; y < rows; y++) {
        let acc = 0;
        const row = y * cols;
        for (let x = -R; x < cols; x++) {
          if (x + R < cols) acc += src[row + x + R];
          if (x - R - 1 >= 0) acc -= src[row + x - R - 1];
          if (x >= 0) tmp[row + x] = acc;
        }
      }
      for (let x = 0; x < cols; x++) {
        let acc = 0;
        for (let y = -R; y < rows; y++) {
          if (y + R < rows) acc += tmp[(y + R) * cols + x];
          if (y - R - 1 >= 0) acc -= tmp[(y - R - 1) * cols + x];
          if (y >= 0) dst[y * cols + x] = Math.min(1, (acc / n) * scale);
        }
      }
    }

    // the poster's frame: an outer border and an inner one joined like a tunnel, with vertex dots
    function drawWireframe() {
      const ox = W * 0.05, oy = H * 0.07, ix = W * 0.3, iy = H * 0.3;
      const outer = [[ox, oy], [W - ox, oy], [W - ox, H - oy], [ox, H - oy]];
      const inner = [[ix, iy], [W - ix, iy], [W - ix, H - iy], [ix, H - iy]];
      ctx.strokeStyle = SLIT.grid;
      ctx.fillStyle = SLIT.grid;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      const N = 8;
      for (let e = 0; e < 4; e++) {
        const [a0, a1] = [outer[e], outer[(e + 1) % 4]], [b0, b1] = [inner[e], inner[(e + 1) % 4]];
        for (let k = 0; k <= N; k++) {
          const u = k / N;
          const ax = lerp(a0[0], a1[0], u), ay = lerp(a0[1], a1[1], u);
          ctx.moveTo(ax, ay);
          ctx.lineTo(lerp(b0[0], b1[0], u), lerp(b0[1], b1[1], u));
          ctx.rect(ax - 1.5, ay - 1.5, 3, 3);
        }
        ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]);
        // a middle ring between the borders
        ctx.moveTo(lerp(a0[0], b0[0], 0.5), lerp(a0[1], b0[1], 0.5));
        ctx.lineTo(lerp(a1[0], b1[0], 0.5), lerp(a1[1], b1[1], 0.5));
      }
      ctx.stroke();
    }

    // draw the ink scene into a small buffer, then cut it into parallel diagonal slits: each
    // slit is a run of short quads whose width and colour follow the (smoothed) density
    let slitCanvas = null, slitCtx = null, slitImg = null;
    let slitInk = new Float32Array(0), slitSoft = new Float32Array(0), slitTmp = new Float32Array(0);
    function drawSlit(t) {
      const mobile = W < 700;
      const cw = SLIT.cell;
      const { cols, rows, px } = sampleScene(t, cw, cw);
      if (!slitCanvas || slitCanvas.width !== cols || slitCanvas.height !== rows) {
        slitCanvas = document.createElement('canvas');
        slitCanvas.width = cols;
        slitCanvas.height = rows;
        slitCtx = slitCanvas.getContext('2d');
        slitImg = slitCtx.createImageData(cols, rows);
        slitInk = new Float32Array(cols * rows);
        slitSoft = new Float32Array(cols * rows);
        slitTmp = new Float32Array(cols * rows);
      }
      for (let i = 0; i < cols * rows; i++) slitInk[i] = Math.min(1, inkAt(px, i * 4) * SLIT.gain);
      boxBlur(slitInk, slitSoft, slitTmp, cols, rows, 2, 1.7);

      ctx = mainCtx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = SLIT.bg;
      ctx.fillRect(0, 0, W, H);
      drawWireframe();

      // bloom behind the slits
      const data = slitImg.data;
      for (let i = 0; i < cols * rows; i++) {
        data[i * 4] = SLIT.bloom[0];
        data[i * 4 + 1] = SLIT.bloom[1];
        data[i * 4 + 2] = SLIT.bloom[2];
        data[i * 4 + 3] = slitSoft[i] * SLIT.bloomAlpha;
      }
      slitCtx.putImageData(slitImg, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.imageSmoothingEnabled = true;
      ctx.filter = `blur(${SLIT.bloomBlur}px)`;
      ctx.drawImage(slitCanvas, 0, 0, cols * cw, rows * cw);
      ctx.restore();

      // slits: lines along d, stacked along n; quads bucketed by heat so each colour is one fill
      const sp = mobile ? SLIT.spacingMobile : SLIT.spacing;
      const dx = Math.cos(SLIT.angle), dy = Math.sin(SLIT.angle);
      const nx = -dy, ny = dx;
      const L = Math.hypot(W, H) / 2 + sp;
      const cx = W / 2, cy = H / 2, ds = SLIT.step, maxW = sp * SLIT.width;
      const heat = SLIT.heat;
      const paths = heat.map(() => new Path2D());
      const sampleV = (x, y) => {
        if (x < 0 || y < 0 || x >= W || y >= H) return 0;
        return slitSoft[((y / cw) | 0) * cols + ((x / cw) | 0)];
      };
      for (let o = -L; o <= L; o += sp) {
        const bx = cx + nx * o, by = cy + ny * o;
        let px0 = 0, py0 = 0, w0 = 0;
        for (let sStep = -L; sStep <= L; sStep += ds) {
          const x = bx + dx * sStep, y = by + dy * sStep;
          const v = sampleV(x, y);
          const w = v > 0.08 ? maxW * Math.pow(v, 0.85) : 0;
          if (w0 > 0 || w > 0) {
            const vm = Math.max(v, 0.0001);
            let b = 0;
            while (vm > heat[b][0] && b < heat.length - 1) b++;
            const path = paths[b];
            const h0 = w0 / 2, h1 = w / 2;
            path.moveTo(px0 + nx * h0, py0 + ny * h0);
            path.lineTo(x + nx * h1, y + ny * h1);
            path.lineTo(x - nx * h1, y - ny * h1);
            path.lineTo(px0 - nx * h0, py0 - ny * h0);
            path.closePath();
          }
          px0 = x; py0 = y; w0 = w;
        }
      }
      ctx.globalCompositeOperation = 'lighter';
      heat.forEach(([, colour], b) => {
        ctx.fillStyle = colour;
        ctx.globalAlpha = 0.9;
        ctx.fill(paths[b]);
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      drawControl(S.t);
      ctx.globalAlpha = 1;
    }

    function render() {
      const t = reduceMotion ? 0 : S.t;
      layout();
      // New start: held so strand A runs upper left → bottom centre → right, swaying a little
      G.phase = spinPhase(t);
      if (variant === 'scanline') {
        drawScanline(t);
      } else if (variant === 'halftone') {
        drawHalftone(t);
      } else if (variant === 'ascii') {
        drawAscii(t, ASCII);
      } else if (variant === 'ascii-plain') {
        drawAscii(t, ASCII_PLAIN);
      } else if (variant === 'glow') {
        drawGlow(t);
      } else if (variant === 'slit') {
        drawSlit(t);
      } else if (metal && !G.lens) {
        metal.draw({
          time: t * 0.9 + 11,
          cx: G.cx, cy: G.cy, halfTurn: G.hp, amp: G.amp,
          halfWidth: G.w0 * METAL.halfWidth,
          reveal: S.reveal,
          iridescence: METAL.iridescence,
          light,
          colorA: METAL.colorA, colorB: METAL.colorB,
          rungs: rungHalves(S.t),
          rungRadius: Math.min(G.w0 * 0.45, G.gap * 0.12) + 1.5,
          boxed: G.box,
          phase: G.phase,
        });
        ctx = mainCtx;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(t);
      } else {
        ctx = mainCtx;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(t);
      }
      placeLabels();
      if (!G.lens) placeApps();
    }

    // Drawing stops while the hero is off screen, and for good under reduced motion (that still
    // frame is redrawn only when something invalidates it: a resize or restart).
    let last = performance.now();
    let onScreen = true;
    let dirty = true;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000) * SPEED;
      last = now;
      if (!hero.hidden && onScreen && W > 0 && H > 0) {
        const frozen = reduceMotion;
        if (frozen && S.scanHits.length) {
          S.scanHits = []; // the resting frame carries no half-finished scan rings
          dirty = true;
        }
        if (!frozen) update(dt);
        if (!frozen || dirty) {
          render();
          dirty = false;
        }
      }
      requestAnimationFrame(frame);
    }

    /* ---------- boot ---------- */
    makeGlow();
    makeGlyphs();
    if (document.fonts) {
      document.fonts.ready.then(makeGlyphs); // re-set the 0/1s in Google Sans Code
      document.fonts.load(`26px ${ASCII_FONT}`, ASCII_GLYPH).then(makeGlyphs).catch(() => {});
    }
    resize();
    reset(START_T);
    new ResizeObserver(() => { resize(); dirty = true; }).observe(hero);
    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      last = performance.now();
    }).observe(hero);
    document.addEventListener('visibilitychange', () => { last = performance.now(); });
    requestAnimationFrame((now) => { last = now; frame(now); });

    // re-measure on show: a section mounted while hidden has no size yet
    return {
      hero,
      restart: (T = 0) => {
        if (darkScope() !== darkNow) applyPalette();
        else if (ROOT.dataset.glyph !== glyphMode) makeGlyphs();
        resize(); reset(T); last = performance.now(); dirty = true;
      },
      // for lens.js: the helix's live geometry and which base pairs are written
      scope: () => ({
        G, written: S.rungStart, W, H, point,
        time: S.t, threads: S.fil,
        // how much of the helix has been drawn in: whether strand `sign` is there at axis x, and
        // whether the base pair at x is
        shown: (sign, x) => {
          if (S.reveal >= 1) return true;
          const last = SAMPLES - 1;
          const i = ((x - G.xs[0]) / (G.xs[last] - G.xs[0])) * last;
          const [lo, hi] = strandRange(sign > 0 ? 0 : 1);
          return hi > lo && i >= lo && i <= hi;
        },
        pairShown: (x) => revealed(x),
      }),
    };

  }

  ROOT.classList.add('js');

  /* ---------- page: the one ribbon stage, fixed to the chosen options (no review menu) ---------- */
  const loop = mount(ROOT.querySelector('.dna-hero'));

  // keep every headline line on one line: scale the type down until the widest line fits the
  // column (phones let lines wrap instead, so no fitting there)
  const title = ROOT.querySelector('.dh__title');
  function fitHeadline() {
    if (!title) return;
    title.style.setProperty('--fit', '1');
    if (window.innerWidth <= 640) return;
    const shown = title.querySelector('.dh__headline');
    if (!shown) return;
    const widest = Math.max(...[...shown.children].map((line) => line.scrollWidth));
    const fit = Math.min(1, (title.clientWidth - 2) / widest);
    title.style.setProperty('--fit', fit.toFixed(3));
  }
  window.addEventListener('resize', fitHeadline);
  if (document.fonts) document.fonts.ready.then(fitHeadline);
  fitHeadline();
  loop.restart(START_T);

  // the Page options panel calls this when the DNA hero is shown again (it has no size while hidden)
  window.DnaHero = { restart: () => { fitHeadline(); loop.restart(START_T); } };
})();
