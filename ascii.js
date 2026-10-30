// Footer background: the Figma ASCII DNA strand (node 498:10433), rebuilt in 3D and revolving.
(() => {
  const host = document.querySelector('.closing');
  const canvas = host && host.querySelector('.closing__ascii');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CW = 6, CH = 8;                       // character cell (css px): fine enough to carry the references' detail
  const RAMP = ' ;:+*?%S#@';                  // light → dense (the Figma strand's own characters)
  let cols = 0, rows = 0, W = 0, H = 0, seed = [], glyph = [], og = null, box = null, dnaBuf = null;

  // ---------- shapes, drawn in css px into a box ----------
  // DNA strand from Figma (node 498:10433, a 100×56 grid of 12px cells): a double helix on a diagonal
  // axis with chunky strands and slanted base-pair rungs. Rebuilt in 3D so it can revolve: `phase` turns it.
  const DNA = { w: 1200, h: 684, x0: 40, ax: 330, ay: 222, slope: .5, R: 113, halfTurn: 384, strand: 21, rungsPerHalf: 3 };
  function dna(g, b, phase = 0) {
    const s = Math.min(b.w / DNA.w, b.h / DNA.h), ox = b.x + (b.w - DNA.w * s) / 2, oy = b.y + (b.h - DNA.h * s) / 2;
    const th = Math.atan(DNA.slope), ux = Math.cos(th), uy = Math.sin(th), nx = -uy, ny = ux;
    const omega = Math.PI / (DNA.halfTurn / ux);                     // radians per px along the axis
    const s0 = (456 - DNA.ax) / ux;                                   // first crossing sits at x≈456, as in the frame
    const sMin = (DNA.x0 - DNA.ax) / ux, sMax = (DNA.w + 60 - DNA.ax) / ux;
    const at = (t, k) => {                                            // strand k at axis distance t
      const ang = omega * (t - s0) + phase + k * Math.PI;
      const off = Math.sin(ang) * DNA.R, z = Math.cos(ang);           // z: 1 = toward the viewer
      return { x: ox + (DNA.ax + t * ux + nx * off) * s, y: oy + (DNA.ay + t * uy + ny * off) * s, z };
    };
    const fade = t => Math.min(1, (t - sMin) / 160, (sMax - t) / 160);  // soft ends
    const pts = [];
    for (let t = sMin; t <= sMax; t += 6) for (const k of [0, 1]) pts.push({ ...at(t, k), f: fade(t) });
    // rungs: three per half turn, drawn behind the strands
    const step = (DNA.halfTurn / ux) / DNA.rungsPerHalf;
    g.lineCap = 'round';
    for (let t = s0 + step / 2 - Math.ceil((s0 - sMin) / step) * step; t <= sMax; t += step) {
      const p = at(t, 0), q = at(t, 1), f = fade(t); if (f <= 0) continue;
      g.globalAlpha = .72 * f; g.lineWidth = DNA.strand * 1.1 * s;   // chunky rungs, as in the Figma strand
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
    }
    // strands, back to front so the near side reads densest
    pts.sort((p, q) => p.z - q.z);
    for (const p of pts) {
      if (p.f <= 0) continue;
      const d = (p.z + 1) / 2;
      g.globalAlpha = (.3 + .7 * d) * p.f;
      g.beginPath(); g.arc(p.x, p.y, DNA.strand * (.7 + .3 * d) * s, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
  }
  const REVOLVE_MS = 7000;                                            // one full turn

  // ---------- build densities at grid resolution ----------
  function build() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = host.clientWidth; H = host.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / CW); rows = Math.ceil(H / CH);
    const off = document.createElement('canvas'); off.width = cols; off.height = rows;
    const g = og = off.getContext('2d', { willReadFrequently: true });
    // art lives in a wide band across the section, clear of the very edges
    box = { x: W * .06, y: H * .06, w: W * .88, h: H * .86 };
    // phones and tablets: fitting the width would shrink it to a sliver in a tall, narrow section, so it's
    // drawn wider than the screen (the sides run off) and centred behind the call to action above the footer
    if (W < 900) {
      const cta = host.querySelector('.cta'), ch = cta ? cta.offsetHeight : H * .45;
      const bw = W * (W < 480 ? 2.1 : 1.6), bh = bw * DNA.h / DNA.w;
      box = { x: (W - bw) / 2, y: Math.max(-bh * .1, ch * .55 - bh / 2), w: bw, h: bh };
    }
    dnaBuf = new Float32Array(cols * rows);
    seed = Float32Array.from({ length: cols * rows }, () => Math.random());
    glyph = Uint8Array.from({ length: cols * rows }, () => (Math.random() * 3) | 0);
  }

  function dnaAt(now) {
    og.setTransform(1, 0, 0, 1, 0, 0); og.clearRect(0, 0, cols, rows);
    og.setTransform(1 / CW, 0, 0, 1 / CH, 0, 0); og.fillStyle = og.strokeStyle = '#000';
    dna(og, box, (now / REVOLVE_MS) * Math.PI * 2);
    const px = og.getImageData(0, 0, cols, rows).data;
    for (let i = 0; i < dnaBuf.length; i++) dnaBuf[i] = px[i * 4 + 3] / 255;
    return dnaBuf;
  }

  // ---------- render ----------
  function frame(now) {
    const d = dnaAt(now);
    ctx.clearRect(0, 0, W, H);
    ctx.font = '500 8px "Space Grotesk", ui-monospace, monospace';
    ctx.textBaseline = 'top';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const v = d[i];
        if (v < .06) continue;
        let idx = Math.min(RAMP.length - 1, Math.max(1, Math.round(v * (RAMP.length - 1)) - 1 + glyph[i]));
        ctx.fillStyle = `rgba(110,152,255,${(.12 + .5 * v).toFixed(3)})`; // light blue, kept soft behind text
        ctx.fillText(RAMP[idx], c * CW, r * CH);
      }
    }
  }

  // ---------- loop: ~30fps, only while visible ----------
  let raf = 0, last = 0, t0 = 0, visible = false;
  const loop = now => {
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;
    last = now; frame(now - t0);
  };
  const start = () => { if (!raf && !still) { t0 = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  function init() {
    build();
    if (still) frame(0); else if (visible) frame(performance.now() - t0);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(host);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 150); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(init);
})();
