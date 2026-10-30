// Scale fixed-size widgets (hero diagram, console) down to fit narrow screens.
const fits = document.querySelectorAll('.fit');
function layoutFits() {
  fits.forEach((el) => {
    const w = +el.dataset.w, h = +el.dataset.h;
    const inner = el.querySelector('.fit__inner');
    el.style.width = '';
    const ps = getComputedStyle(el.parentElement), cs = getComputedStyle(el);
    const avail = el.parentElement.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)
      - parseFloat(cs.marginLeft) - parseFloat(cs.marginRight);
    const s = Math.min(+el.dataset.max || 1, avail / w); // data-max caps the size on wide screens
    inner.style.transform = s < 1 ? `scale(${s})` : '';
    el.style.height = `${h * s}px`;
    if (s < 1) el.style.width = `${w * s}px`;
  });
}
layoutFits();
addEventListener('resize', layoutFits);

// Auto-advancing lists: the active item's progress bar fills, then the next item activates.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('[data-cycle]').forEach((list) => {
  const items = [...list.querySelectorAll('.layer, .step, .tab')];
  const target = list.dataset.target && document.querySelector(list.dataset.target);
  let index = Math.max(0, +list.dataset.start || items.findIndex((i) => i.classList.contains('is-active')));

  function activate(i) {
    const item = items[i];
    items.forEach((item, n) => {
      item.classList.toggle('is-active', n === i);
      if (item.getAttribute('role') === 'tab') item.setAttribute('aria-selected', n === i);
    });
    index = i;
    if (target) {
      target.classList.add('is-swapping');
      setTimeout(() => {
        target.querySelector('h3').textContent = item.dataset.title;
        target.querySelector('p').textContent = item.dataset.body;
        target.classList.remove('is-swapping');
      }, 200);
    }
    // macOS window (section 5): retitle and pan the screenshot to what this tab is about
    if (item.dataset.path) {
      const title = document.getElementById('macTitle'), shot = document.getElementById('macShot');
      title.classList.add('swap');
      setTimeout(() => { title.textContent = item.dataset.path; title.classList.remove('swap'); }, 200);
      // a tab with its own screenshot (data-shot) shows it full-frame; the rest pan across the shared dashboard
      // a tab with a recording (data-video, Investigate) plays it from the start over the screenshot
      const video = document.getElementById('macVideo');
      if (video) {
        if (item.dataset.video) {
          if (!video.src.endsWith(item.dataset.video)) video.src = item.dataset.video;
          video.currentTime = 0;
          video.play().catch(() => {});
          video.classList.add('is-on');
        } else {
          video.classList.remove('is-on');
          setTimeout(() => video.pause(), 250);
        }
      }
      const src = item.dataset.shot || shot.getAttribute('src');
      shot.alt = 'AgentDNA dashboard, ' + item.textContent.trim() + ': ' + item.dataset.body;
      if (!shot.src.endsWith(src)) {
        shot.classList.add('swap');
        setTimeout(() => { shot.src = src; shot.classList.remove('swap'); }, 220);
      }
      shot.style.setProperty('--focus', item.dataset.shot ? '50% 0%' : item.dataset.focus);
      shot.style.setProperty('--zoom', item.dataset.shot ? 1 : item.dataset.zoom);
    }
  }

  items.forEach((item, n) => {
    item.addEventListener('click', () => activate(n));
    item.querySelector('.bar').addEventListener('animationend', () => {
      if (!reduceMotion) activate((index + 1) % items.length);
    });
  });

  // Pause while hovered or scrolled out of view.
  list.addEventListener('mouseenter', () => list.classList.add('is-paused'));
  list.addEventListener('mouseleave', () => list.classList.remove('is-paused'));
  new IntersectionObserver(([e]) => list.classList.toggle('is-paused', !e.isIntersecting)).observe(list);

  activate(index);
});

// Phones and tablets: the menu button opens and closes the nav links (any link, Escape or a tap outside closes it).
const navEl = document.querySelector('.nav'), navMenu = document.querySelector('.nav__menu');
if (navEl && navMenu) {
  const setMenu = (o) => { navEl.classList.toggle('is-open', o); navMenu.setAttribute('aria-expanded', o); navMenu.setAttribute('aria-label', o ? 'Close menu' : 'Menu'); };
  navMenu.addEventListener('click', (e) => { e.stopPropagation(); setMenu(!navEl.classList.contains('is-open')); });
  navEl.querySelectorAll('.nav__links a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navEl.classList.contains('is-open')) { setMenu(false); navMenu.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 1100) setMenu(false); });
}

// The nav's CTA is secondary while a hero is on screen below the nav, primary once it has scrolled away.
const nav = document.querySelector('.nav');
if (nav) {
  const showing = new Set();
  const heroIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? showing.add(e.target) : showing.delete(e.target)));
    nav.classList.toggle('is-hero', showing.size > 0);
  }, { rootMargin: '-80px 0px 0px 0px' });
  document.querySelectorAll('.hero').forEach((h) => heroIO.observe(h));
}

// Draw the helix figures in once the layers section scrolls into view.
const layers = document.querySelector('.layers');
if (layers) {
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { layers.classList.add('is-visible'); obs.disconnect(); }
  }, { threshold: 0.35 }).observe(layers);
}

// Section 5: as the visitor scrolls, the frame pins and opens to full width; the headline gives way and
// the dock rises while the window scales up to fill the screen. Only transforms and clip-path change per frame.
(() => {
  const sec = document.querySelector('.protects');
  const stage = sec && sec.querySelector('.protects__stage');
  if (!stage) return;
  const head = stage.querySelector('.protects__head'), dock = stage.querySelector('.dock'), mac = stage.querySelector('.mac');
  const wide = matchMedia('(min-width: 1101px)');
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const NAV = 80, INSET = 24, TOP = 28, GAP = 20, BOTTOM = 28, SIDE = 24, FRAME = 1080;
  const smooth = t => t * t * (3 - 2 * t);
  let m = null, ticking = false, lastE = -1;

  function clear() {
    [stage, head, dock, mac].forEach(n => { n.style.transform = ''; n.style.clipPath = ''; n.style.opacity = ''; });
    m = null;
  }
  // layout reads happen only here (on load / resize), never during scroll
  function measure() {
    [head, dock, mac].forEach(n => { n.style.transform = ''; });
    const H = innerHeight - NAV, W = stage.clientWidth;
    const tMac = TOP + dock.offsetHeight + GAP;
    m = {
      dockShift: dock.offsetTop - TOP,
      macShift: mac.offsetTop - tMac,
      // settle as a natural ~1080px window, not edge to edge
      scale: Math.min((H - tMac - BOTTOM) / mac.offsetHeight, (Math.min(FRAME, W - SIDE * 2)) / mac.offsetWidth),
      travel: sec.offsetHeight - H,
    };
    lastE = -1;
  }
  function update() {
    ticking = false;
    if (!wide.matches) { if (m) clear(); return; }
    if (!m) measure();
    const pinned = NAV - sec.getBoundingClientRect().top;
    const p = still.matches ? 1 : Math.min(1, Math.max(0, pinned / (m.travel * .6)));
    const e = Math.round(smooth(p) * 1000) / 1000;
    if (e === lastE) return;
    lastE = e;
    const inset = INSET * (1 - e);
    stage.style.clipPath = `inset(${inset.toFixed(2)}px round ${inset.toFixed(2)}px)`;
    head.style.transform = `translate3d(0, ${(-m.dockShift * e).toFixed(2)}px, 0)`;
    head.style.opacity = Math.max(0, 1 - e * 1.8).toFixed(3);
    dock.style.transform = `translate3d(0, ${(-m.dockShift * e).toFixed(2)}px, 0)`;
    mac.style.transform = `translate3d(0, ${(-m.macShift * e).toFixed(2)}px, 0) scale(${(1 + (m.scale - 1) * e).toFixed(4)})`;
  }
  const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { m = null; queue(); });
  wide.addEventListener('change', () => { m = null; queue(); });
  addEventListener('load', () => { m = null; queue(); });
  update();
})();


// Nav: highlight the section under the middle of the screen; nothing on the hero or unlinked sections.
(() => {
  const links = [...document.querySelectorAll('.nav__links a[href^="#"]')];
  const map = new Map(links.map(a => [document.querySelector(a.getAttribute('href')), a]).filter(([s]) => s));
  const watched = [...document.querySelectorAll('.hero, .layers, .between, .cover, .protects, .dev, .closing')];
  function update() {
    const mid = innerHeight / 2;
    const here = watched.find(s => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
    const active = (here && map.get(here)) || null;
    links.forEach(a => (a === active ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  }
  addEventListener('scroll', update, { passive: true }); // cheap: seven rect reads
  addEventListener('resize', update);
  update();
})();

// Hero: two versions (logo band / metrics), chosen in the "Page options" panel behind the pencil button.
// The animation control stays 24px above whichever bar is showing.
(() => {
  const card = document.querySelector('.hero__card');
  const btn = document.getElementById('variantSwitch'), panel = document.getElementById('tweaksPanel');
  if (!card) return;
  const KEY = 'agentdna-hero-variant';
  const tabs = panel ? [...panel.querySelectorAll('[data-variant]')] : [];
  const nodeTabs = panel ? [...panel.querySelectorAll('[data-nodes]')] : [];
  const stage = document.getElementById('stage'), NKEY = 'agentdna-hero-nodes';
  const bar = () => card.querySelector(card.dataset.variant === 'stats' ? '.impact' : '.works');
  const place = () => { const b = bar(); card.style.setProperty('--impact-h', (b ? b.offsetHeight : 0) + 'px'); };
  const apply = v => {
    card.dataset.variant = v;
    tabs.forEach(t => t.setAttribute('aria-checked', t.dataset.variant === v));
    place();
  };
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  apply(saved === 'stats' ? 'stats' : 'logos');
  // hero illustration: scan animation (default) or the pillars card
  const illusTabs = panel ? [...panel.querySelectorAll('[data-illus]')] : [], IKEY = 'agentdna-hero-illus';
  const applyIllus = v => {
    card.dataset.illus = v;
    illusTabs.forEach(t => t.setAttribute('aria-checked', t.dataset.illus === v));
    if (typeof layoutFits === 'function') layoutFits();
  };
  let savedI = null;
  try { savedI = localStorage.getItem(IKEY); } catch (e) {}
  applyIllus(savedI === 'pillars' ? 'pillars' : 'scan');
  illusTabs.forEach(t => t.addEventListener('click', () => {
    applyIllus(t.dataset.illus);
    try { localStorage.setItem(IKEY, t.dataset.illus); } catch (e) {}
  }));

  // pillars card style: light (default) or dark
  const styleTabs = panel ? [...panel.querySelectorAll('[data-pstyle]')] : [], SKEY = 'agentdna-pillars-style';
  const pillarsEl = document.getElementById('pillars');
  const applyStyle = v => {
    if (pillarsEl) pillarsEl.dataset.style = v;
    styleTabs.forEach(t => t.setAttribute('aria-checked', t.dataset.pstyle === v));
  };
  let savedS = null;
  try { savedS = localStorage.getItem(SKEY); } catch (e) {}
  applyStyle(savedS === 'dark' ? 'dark' : 'light');
  styleTabs.forEach(t => t.addEventListener('click', () => {
    applyStyle(t.dataset.pstyle);
    try { localStorage.setItem(SKEY, t.dataset.pstyle); } catch (e) {}
  }));

  // agent node colour in the hero animation: navy (default) or white
  const applyNodes = v => {
    if (stage) stage.dataset.nodes = v;
    nodeTabs.forEach(t => t.setAttribute('aria-checked', t.dataset.nodes === v));
  };
  let savedN = null;
  try { savedN = localStorage.getItem(NKEY); } catch (e) {}
  applyNodes(savedN === 'white' ? 'white' : 'navy');
  nodeTabs.forEach(t => t.addEventListener('click', () => {
    applyNodes(t.dataset.nodes);
    try { localStorage.setItem(NKEY, t.dataset.nodes); } catch (e) {}
  }));
  tabs.forEach(t => t.addEventListener('click', () => {
    apply(t.dataset.variant);
    try { localStorage.setItem(KEY, t.dataset.variant); } catch (e) {}
  }));

  // which hero shows: the DNA strand (default) or the classic one with the options above
  const heroTabs = panel ? [...panel.querySelectorAll('[data-hero]')] : [], HKEY = 'agentdna-hero-kind';
  const dnaHero = document.querySelector('.hero--dna'), classicHero = document.querySelector('.hero--classic');
  const applyHero = (v, replay) => {
    if (!dnaHero || !classicHero) return;
    dnaHero.hidden = v !== 'dna';
    classicHero.hidden = v === 'dna';
    if (panel) panel.dataset.hero = v; // the classic hero's own options only show with it
    heroTabs.forEach(t => t.setAttribute('aria-checked', t.dataset.hero === v));
    if (v === 'dna') { if (window.DnaHero) window.DnaHero.restart(); }
    else {
      place();
      applyIllus(card.dataset.illus); // re-measures the illustration now that it has a size
      if (replay && window.ScanReplay) window.ScanReplay();
    }
  };
  let savedH = null;
  try { savedH = localStorage.getItem(HKEY); } catch (e) {}
  applyHero(savedH === 'classic' ? 'classic' : 'dna', true);
  heroTabs.forEach(t => t.addEventListener('click', () => {
    applyHero(t.dataset.hero, true);
    try { localStorage.setItem(HKEY, t.dataset.hero); } catch (e) {}
  }));

  // which Section 2 shows: the scroll-driven scan of the Formulas list (default) or Shapes
  // (a new key, so a choice saved while Shapes was the default doesn't hide the new one)
  const s2Tabs = panel ? [...panel.querySelectorAll('[data-s2]')] : [], S2KEY = 'agentdna-s2-kind-2';
  const s2Stage = document.getElementById('s2Stage');
  const shapesSec = s2Stage && s2Stage.closest('.s2'), formulasSec = document.querySelector('.fx');
  const applyS2 = v => {
    if (!shapesSec || !formulasSec) return;
    shapesSec.hidden = v === 'formulas';
    formulasSec.hidden = v !== 'formulas';
    s2Tabs.forEach(t => t.setAttribute('aria-checked', t.dataset.s2 === v));
    if (v === 'formulas' && window.S2Formulas) window.S2Formulas.refresh();
  };
  let savedS2 = null;
  try { savedS2 = localStorage.getItem(S2KEY); } catch (e) {}
  applyS2(savedS2 === 'shapes' ? 'shapes' : 'formulas');
  s2Tabs.forEach(t => t.addEventListener('click', () => {
    applyS2(t.dataset.s2);
    try { localStorage.setItem(S2KEY, t.dataset.s2); } catch (e) {}
  }));


  // the DNA hero's layout: Showcase (default), Centered or Core (dnahero.css); the helix refits on restart
  // (a new key, so a layout saved while Centered was the default doesn't hide the new default)
  const hlTabs = panel ? [...panel.querySelectorAll('[data-hlayout]')] : [], HLKEY = 'agentdna-hero-layout-3';
  const dh = document.querySelector('.dh');
  const applyHL = (v, replay) => {
    if (!dh || !hlTabs.some(t => t.dataset.hlayout === v)) v = 'showcase';
    if (dh) dh.dataset.hlayout = v;
    hlTabs.forEach(t => t.setAttribute('aria-checked', t.dataset.hlayout === v));
    if (replay && window.DnaHero) window.DnaHero.restart();
  };
  let savedHL = null;
  try { savedHL = localStorage.getItem(HLKEY); } catch (e) {}
  applyHL(savedHL);
  hlTabs.forEach(t => t.addEventListener('click', () => {
    applyHL(t.dataset.hlayout, true);
    try { localStorage.setItem(HLKEY, t.dataset.hlayout); } catch (e) {}
  }));

  // open / close the panel
  const open = o => { if (!panel) return; panel.hidden = !o; btn.setAttribute('aria-expanded', o); };
  btn && btn.addEventListener('click', e => { e.stopPropagation(); open(panel.hidden); });
  document.addEventListener('click', e => { if (panel && !panel.hidden && !e.target.closest('#tweaks')) open(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel && !panel.hidden) { open(false); btn.focus(); } });
  addEventListener('resize', place);
})();
