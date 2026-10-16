/* Mariday — the constructor's cake in real 3D (three.js r158, js/vendor/three.min.js).
   Every tier is swept along its outline (round, heart or square), so the cream, the piped borders, the drips
   and the toppings all follow the shape. The cake turns on a porcelain stand: drag or flick it, on a mouse
   up/down tilts the view; «Обʼєм / Зверху» and the zoom are buttons. For the filling the cake is cut open:
   a wedge slides out and shows the layers of the chosen flavour.
   Coats: smooth, palette-knife strokes, ombré, velvet, marble, pearl; a drip in any colour (gold is metal) on top of any coat.
   The studio has a day and an evening light; candles can be blown out; butterflies circle the cake;
   on the size step the top shows how it would be cut for the guests.
   window.MaridayCake3D.create(host) → { update(design, fx), setCut(on), view(kind), zoom(dir), spin(), hop(),
     setMood("day"|"night"), blow() → bool, setPortions(n), setTextSize(k), snapshot({ clear }) } */
(function () {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    bounce: (t) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
    elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
  };
  // a seeded random, so the same design always gets the same sprinkles and drips
  const rng = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const R0 = rng(99);

  function create(host) {
    const THREE = window.THREE;
    if (!THREE) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
    } catch (e) {
      return null;
    }
    if (!renderer.getContext()) return null;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    host.__three = () => ({ scene, camera, renderer, cake, frame, zoomK, pitch });

    const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.environment = studioEnv(renderer);
    const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 60);

    const hemi = new THREE.HemisphereLight(0xfff6f2, 0xf0d6d6, 0.55);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff4ea, 2.2);
    key.position.set(-2.6, 5.2, 3.4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 0.5, far: 14 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 5;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe2e8, 0.7);
    rim.position.set(3, 2.4, -3.5);
    scene.add(rim);

    // the stand and the floor stay; the cake inside `turn` is rebuilt
    const world = new THREE.Group();
    scene.add(world);
    const turn = new THREE.Group();
    world.add(turn);
    const standGroup = new THREE.Group();
    turn.add(standGroup);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.13 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    world.add(floor);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: 0.55 }));
    blob.rotation.x = -Math.PI / 2;
    world.add(blob);

    /* ── state ── */
    let cake = null; // { group, slice, cream: [materials], top, maxR, height, text }
    let design = null;
    let cut = false, cutT = 0;
    let yaw = -0.5, yawVel = 0, pitch = 0.42, pitchTo = 0.42, zoomK = 1, zoomTo = 1;
    let frame = { y: 0.6, r: 1.6 }, frameTo = { y: 0.6, r: 1.6 };
    let dragging = false, lastX = 0, lastY = 0, idleAt = performance.now();
    let visible = true, running = false;
    let night = 0, nightTo = 0; // 0 = day, 1 = evening
    let blownAt = 0; // when the candles were blown out
    let portions = 0, portionsT = 0;
    const smoke = [];
    const tweens = [];
    const clips = []; // { plane, local, obj }
    const textCache = new Map();

    function tween(dur, fn, ez = ease.out, delay = 0) {
      const t = { t0: performance.now() + delay, dur, fn, ez };
      tweens.push(t);
      fn(0);
      kick();
      return t;
    }

    /* ── outlines: evenly spaced points, outward normals ── */
    function makePath(kind, R) {
      const raw = [];
      const N = 720;
      for (let i = 0; i < N; i++) {
        const t = (i / N) * TAU;
        let x, z;
        if (kind === "heart") {
          const k = (R * 1.1) / 16;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          x = hx * k;
          z = -(hy + 2.2) * k;
        } else if (kind === "square") {
          const c = Math.cos(t), s = Math.sin(t), p = 7;
          const r = (R * 0.9) / Math.pow(Math.pow(Math.abs(c), p) + Math.pow(Math.abs(s), p), 1 / p);
          x = r * c;
          z = r * s;
        } else if (kind === "flower") {
          // eight soft petals
          const r = R * 0.94 * (1 + 0.075 * Math.cos(8 * t));
          x = r * Math.cos(t);
          z = r * Math.sin(t);
        } else {
          x = R * Math.cos(t);
          z = R * Math.sin(t);
        }
        raw.push([x, z]);
      }
      // resample by arc length so the cream and the borders are even all round
      const cum = [0];
      for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(raw[i % N][0] - raw[i - 1][0], raw[i % N][1] - raw[i - 1][1]));
      const len = cum[N];
      const n = 256;
      let pts = [];
      let j = 0;
      for (let k = 0; k < n; k++) {
        const d = (k / n) * len;
        while (j < N - 1 && cum[j + 1] <= d) j++;
        const a = raw[j], b = raw[(j + 1) % N];
        const f = (d - cum[j]) / (cum[j + 1] - cum[j] || 1);
        pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
      }
      // a real heart has a soft tip and a soft dip: smooth the outline a little
      const passes = kind === "heart" ? 10 : kind === "square" || kind === "flower" ? 2 : 0;
      for (let s = 0; s < passes; s++) pts = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
        return [(a[0] + 2 * p[0] + b[0]) / 4, (a[1] + 2 * p[1] + b[1]) / 4];
      });
      let area = 0;
      for (let i = 0; i < n; i++) area += pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1];
      const sg = area > 0 ? 1 : -1;
      const P = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
        let tx = b[0] - a[0], tz = b[1] - a[1];
        const l = Math.hypot(tx, tz) || 1;
        tx /= l; tz /= l;
        return { x: p[0], z: p[1], nx: sg * tz, nz: -sg * tx };
      });
      let per = 0;
      for (let i = 0; i < n; i++) per += Math.hypot(P[(i + 1) % n].x - P[i].x, P[(i + 1) % n].z - P[i].z);
      const maxR = Math.max(...P.map((p) => Math.hypot(p.x, p.z)));
      const at = (u) => {
        const f = (((u % 1) + 1) % 1) * n;
        const i = Math.floor(f), w = f - i;
        const a = P[i % n], b = P[(i + 1) % n];
        const nx = lerp(a.nx, b.nx, w), nz = lerp(a.nz, b.nz, w), l = Math.hypot(nx, nz) || 1;
        return { x: lerp(a.x, b.x, w), z: lerp(a.z, b.z, w), nx: nx / l, nz: nz / l };
      };
      const ray = (ang) => {
        const dx = Math.cos(ang), dz = Math.sin(ang);
        let best = maxR;
        for (let i = 0; i < n; i++) {
          const a = P[i], b = P[(i + 1) % n];
          const ex = b.x - a.x, ez = b.z - a.z;
          const den = dx * ez - dz * ex;
          if (Math.abs(den) < 1e-9) continue;
          const t = (a.x * ez - a.z * ex) / den;
          const s = (a.x * dz - a.z * dx) / den;
          if (t > 0 && s >= 0 && s <= 1 && t < best + 1e-6) best = Math.min(best, t);
        }
        return best;
      };
      const inside = (x, z) => {
        let c = false;
        for (let i = 0, k = n - 1; i < n; k = i++) {
          const a = P[i], b = P[k];
          if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) c = !c;
        }
        return c;
      };
      return { P, n, per, maxR, at, ray, inside, kind };
    }

    /* ── geometry helpers ── */
    // checks the winding against the normals it was meant to have and turns the triangles if needed
    function finish(geo, idx) {
      const pos = geo.attributes.position, nor = geo.attributes.normal;
      if (nor && idx.length >= 3) {
        const v = (k) => new THREE.Vector3().fromBufferAttribute(pos, k);
        for (let t = 0; t < idx.length; t += 3) {
          const a = v(idx[t]), b = v(idx[t + 1]), c = v(idx[t + 2]);
          const g = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
          if (g.lengthSq() < 1e-12) continue;
          const want = new THREE.Vector3().fromBufferAttribute(nor, idx[t]);
          if (g.dot(want) < 0) for (let q = 0; q < idx.length; q += 3) [idx[q + 1], idx[q + 2]] = [idx[q + 2], idx[q + 1]];
          break;
        }
      }
      geo.setIndex(idx);
      return geo;
    }
    // a profile swept along the outline: [{o: offset along the normal, y, no, ny: the profile's normal}]
    // `tint(y)` → THREE.Color paints the vertices (the ombré)
    function sweep(path, prof, uRep = 6, vRep = 4, tint = null) {
      const { P, n } = path;
      const m = prof.length;
      const pos = [], nor = [], uv = [], idx = [], col = [];
      for (let i = 0; i <= n; i++) {
        const p = P[i % n];
        for (let j = 0; j < m; j++) {
          const q = prof[j];
          pos.push(p.x + p.nx * q.o, q.y, p.z + p.nz * q.o);
          const l = Math.hypot(q.no, q.ny) || 1;
          nor.push((p.nx * q.no) / l, q.ny / l, (p.nz * q.no) / l);
          uv.push((i / n) * uRep, q.y * vRep + (q.v || 0));
          if (tint) { const c = tint(q.y); col.push(c.r, c.g, c.b); }
        }
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < m - 1; j++) {
        const a = i * m + j, b = (i + 1) * m + j, c = (i + 1) * m + j + 1, d = i * m + j + 1;
        idx.push(a, d, b, b, d, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      if (tint) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      return finish(g, idx);
    }
    // the flat top of a tier (or a glaze), the outline pulled in by `inset`; `tint` is one colour for all of it
    function cap(path, inset, y, rep = 2.4, tint = null) {
      const ctr = path.P.map((p) => new THREE.Vector2(p.x - p.nx * inset, p.z - p.nz * inset));
      const tris = THREE.ShapeUtils.triangulateShape(ctr, []);
      const pos = [], nor = [], uv = [], idx = [], col = [];
      ctr.forEach((v) => { pos.push(v.x, y, v.y); nor.push(0, 1, 0); uv.push(v.x * rep * 0.5, v.y * rep * 0.5); if (tint) col.push(tint.r, tint.g, tint.b); });
      tris.forEach((t) => idx.push(t[0], t[1], t[2]));
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      if (tint) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      return finish(g, idx);
    }
    // a parametric surface fn(u, v) → [x, y, z], smooth normals
    function grid(nu, nv, fn, flip = false) {
      const pos = [], idx = [];
      for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) pos.push(...fn(i / nu, j / nv));
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const a = i * (nv + 1) + j, b = (i + 1) * (nv + 1) + j;
        if (flip) idx.push(a, a + 1, b, b, a + 1, b + 1);
        else idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }

    // piped shapes, made once: a shell (along x, sits on y=0, faces +z) and a dollop (a «kiss», up along y)
    const GEO = {};
    GEO.shell = grid(40, 24, (s, v) => {
      const phi = v * TAU;
      const head = s > 0.6 ? Math.sqrt(Math.max(0, 1 - Math.pow((s - 0.6) / 0.4, 2))) : Math.pow(s / 0.6, 0.7);
      const r = head * (1 + 0.2 * Math.cos(phi * 8 + s * 3.2));
      const yy = -Math.cos(phi), zz = Math.sin(phi);
      return [(s - 0.62) * 1.0, Math.max(-0.08, yy * r * 0.34 + 0.26 * head), zz * r * 0.32];
    });
    GEO.kiss = grid(36, 26, (v, s) => {
      const phi = v * TAU;
      const body = s < 0.14 ? 0.8 + 0.2 * Math.sin((s / 0.14) * Math.PI * 0.5) : Math.pow(1 - (s - 0.14) / 0.86, 0.85);
      const r = body * 0.5 * (1 + 0.12 * Math.cos(phi * 8 + s * 4));
      const curl = Math.pow(s, 3) * 0.14;
      return [Math.cos(phi) * r + curl, s * 0.9, Math.sin(phi) * r];
    }, true);
    GEO.cherry = (() => {
      const g = new THREE.SphereGeometry(1, 32, 24);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const dimple = y > 0.6 ? (y - 0.6) * 0.55 : 0;
        p.setXYZ(i, x * 1.02, (y - dimple) * 0.94, z);
      }
      g.computeVertexNormals();
      return g;
    })();
    GEO.sphere = new THREE.SphereGeometry(1, 20, 14);
    GEO.drip = new THREE.CapsuleGeometry(1, 1, 6, 14);
    GEO.sprinkle = new THREE.CapsuleGeometry(0.006, 0.026, 3, 6);
    GEO.macShell = new THREE.LatheGeometry([[0, 0], [0.062, 0], [0.07, 0.004], [0.072, 0.009], [0.068, 0.012], [0.07, 0.016], [0.062, 0.024], [0.045, 0.031], [0.02, 0.035], [0, 0.036]].map(([x, y]) => new THREE.Vector2(x, y)), 40);
    GEO.flame = (() => { const g = new THREE.SphereGeometry(1, 16, 12); g.scale(0.014, 0.034, 0.014); g.translate(0, 0.022, 0); return g; })();
    // a strawberry: a rounded cone, point down, and a leafy star on top
    GEO.straw = new THREE.LatheGeometry([[0, 0], [0.012, 0.004], [0.03, 0.02], [0.045, 0.045], [0.052, 0.07], [0.048, 0.088], [0.034, 0.1], [0.012, 0.106], [0, 0.107]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
    GEO.leaf = (() => {
      const s = new THREE.Shape();
      for (let i = 0; i <= 10; i++) {
        const a = (i / 10) * TAU, r = i % 2 ? 0.016 : 0.044;
        i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(r, 0);
      }
      const g = new THREE.ShapeGeometry(s);
      g.rotateX(-Math.PI / 2);
      return g;
    })();
    // a butterfly's wing (one side), the body sits at x = 0
    GEO.wing = (() => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.bezierCurveTo(0.02, 0.06, 0.09, 0.08, 0.085, 0.03);
      s.bezierCurveTo(0.082, 0.008, 0.05, 0.004, 0.03, 0);
      s.bezierCurveTo(0.07, -0.01, 0.07, -0.05, 0.045, -0.055);
      s.bezierCurveTo(0.025, -0.06, 0.01, -0.03, 0, 0);
      const g = new THREE.ShapeGeometry(s, 10);
      const p = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.09, (p.getY(i) + 0.06) / 0.14);
      return g;
    })();
    // a chocolate sail: a thin, slightly bent triangle
    GEO.shard = (() => {
      const g = new THREE.BoxGeometry(0.12, 0.24, 0.007, 6, 10, 1);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const t = (p.getY(i) + 0.12) / 0.24;
        p.setX(i, p.getX(i) * (1 - t * 0.9) + t * t * 0.02);
        p.setZ(i, p.getZ(i) + Math.sin(t * 2.2) * 0.022);
      }
      g.translate(0, 0.12, 0);
      g.computeVertexNormals();
      return g;
    })();

    /* ── textures made on a canvas ── */
    function canvasTex(w, h, draw, srgb = true) {
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      draw(c.getContext("2d"), w, h);
      const t = new THREE.CanvasTexture(c);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    }
    const TEX = {};
    // the faint unevenness of real buttercream
    TEX.noise = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
      const r = rng(7);
      for (let i = 0; i < 2600; i++) {
        const v = 110 + r() * 40 | 0;
        g.fillStyle = `rgba(${v},${v},${v},.35)`;
        g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 5, 0, TAU); g.fill();
      }
    }, false);
    TEX.noise.wrapS = TEX.noise.wrapT = THREE.RepeatWrapping;
    // strokes of a palette knife, round the cake
    TEX.strokes = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
      const r = rng(11);
      for (let i = 0; i < 70; i++) {
        const y = r() * h, x = r() * w, len = 120 + r() * 260, th = 6 + r() * 16;
        const gr = g.createLinearGradient(0, y - th, 0, y + th);
        gr.addColorStop(0, "rgba(128,128,128,0)");
        gr.addColorStop(0.45, `rgba(${170 + r() * 50 | 0},${170 + r() * 50 | 0},${170 + r() * 50 | 0},.55)`);
        gr.addColorStop(0.55, "rgba(70,70,70,.5)");
        gr.addColorStop(1, "rgba(128,128,128,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.ellipse(x, y, len / 2, th, (r() - 0.5) * 0.08, 0, TAU);
        g.fill();
        g.beginPath();
        g.ellipse(x - w, y, len / 2, th, 0, 0, TAU);
        g.ellipse(x + w, y, len / 2, th, 0, 0, TAU);
        g.fill();
      }
    }, false);
    TEX.strokes.wrapS = TEX.strokes.wrapT = THREE.RepeatWrapping;
    TEX.candle = canvasTex(64, 256, (g, w, h) => {
      g.fillStyle = "#fffaf3"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#e2849a";
      for (let y = -h; y < h * 2; y += 44) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 30); g.lineTo(w, y + 46); g.lineTo(0, y + 16); g.fill(); }
    });
    TEX.glow = canvasTex(128, 128, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(255,214,140,.9)"); gr.addColorStop(0.35, "rgba(255,170,80,.28)"); gr.addColorStop(1, "rgba(255,150,60,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    TEX.smoke = canvasTex(128, 128, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(235,228,226,.55)"); gr.addColorStop(0.6, "rgba(225,218,216,.18)"); gr.addColorStop(1, "rgba(220,214,212,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    // seeds on a strawberry
    TEX.straw = canvasTex(256, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, h, 0, 0);
      gr.addColorStop(0, "#d01b34"); gr.addColorStop(0.75, "#c7142c"); gr.addColorStop(1, "#f0b0a0");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      const r = rng(23);
      for (let y = 8; y < h - 10; y += 11) for (let x = (y % 22) / 2; x < w; x += 14) {
        g.fillStyle = "rgba(255,226,140,.95)";
        g.beginPath(); g.ellipse(x + r() * 3, y + r() * 3, 1.6, 2.6, 0, 0, TAU); g.fill();
        g.fillStyle = "rgba(120,0,20,.25)";
        g.beginPath(); g.arc(x + 1, y + 3, 2.4, 0, TAU); g.fill();
      }
    });
    // butterfly wings: a soft fill, a darker edge and two spots
    const wingTex = (hex) => canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = hex; g.fillRect(0, 0, w, h);
      const gr = g.createRadialGradient(0, h / 2, 10, 0, h / 2, w);
      gr.addColorStop(0, "rgba(255,255,255,.45)"); gr.addColorStop(0.7, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(60,10,30,.35)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,255,255,.75)";
      g.beginPath(); g.arc(w * 0.72, h * 0.32, 6, 0, TAU); g.arc(w * 0.5, h * 0.82, 4, 0, TAU); g.fill();
    });
    TEX.wings = ["#ef7f9f", "#a98fe0", "#6fa6e6", "#f0b93f"].map(wingTex);
    // marble: soft grey-blue veins and a thread of gold over the cream colour
    function marbleTexture(hex) {
      const k = "marble" + hex;
      if (textCache.has(k)) return textCache.get(k);
      const t = canvasTex(512, 512, (g, w, h) => {
        g.fillStyle = hex; g.fillRect(0, 0, w, h);
        const base = new THREE.Color(hex);
        const dark = base.getHSL({}).l < 0.45;
        const r = rng(41);
        const vein = (alpha, width, color) => {
          let x = r() * w, y = -20;
          const pts = [[x, y]];
          while (y < h + 20) {
            // veins run on a slant and wander a little
            const nx = x + 26 + (r() - 0.5) * 46, ny = y + 40 + r() * 50;
            pts.push([x + 13 + (r() - 0.5) * 60, (y + ny) / 2, nx, ny]);
            x = nx; y = ny;
          }
          g.strokeStyle = color.replace("A", alpha);
          g.lineWidth = width;
          g.lineCap = "round";
          // drawn a tile to each side too, so the seam round the cake is invisible
          [-w, 0, w].forEach((dx) => {
            g.beginPath();
            g.moveTo(pts[0][0] + dx, pts[0][1]);
            pts.slice(1).forEach(([cx, cy, px, py]) => g.quadraticCurveTo(cx + dx, cy, px + dx, py));
            g.stroke();
          });
        };
        g.filter = "blur(10px)";
        for (let i = 0; i < 6; i++) vein(0.14, 26 + r() * 30, dark ? "rgba(255,240,235,A)" : "rgba(90,80,105,A)");
        g.filter = "blur(1.4px)";
        for (let i = 0; i < 6; i++) vein(0.32, 1.4 + r() * 2.4, dark ? "rgba(255,245,240,A)" : "rgba(70,60,85,A)");
        g.filter = "none";
        for (let i = 0; i < 2; i++) vein(0.85, 1.8, "rgba(206,160,72,A)");
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      textCache.set(k, t);
      return t;
    }

    // the inside of the cake for the cut: sponge, cream and filling bands, the coat round the edge and on top
    function cutTexture(layers, coatHex) {
      const k = layers.join() + coatHex;
      if (textCache.has("cut" + k)) return textCache.get("cut" + k);
      const t = canvasTex(512, 512, (g, w, h) => {
        g.fillStyle = coatHex; g.fillRect(0, 0, w, h);
        const edge = w * 0.94, top = h * 0.055, bot = h * 0.02;
        const sponge = layers[0];
        const fills = layers.slice(1).length ? layers.slice(1) : ["#f7efe6"];
        const seq = [];
        for (let s = 0; s < 3; s++) {
          seq.push([sponge, 0.2, true]);
          if (s < 2) fills.forEach((c, i) => seq.push([c, i === fills.length - 1 && fills.length > 1 ? 0.05 : 0.06, false]));
        }
        const sum = seq.reduce((a, b) => a + b[1], 0);
        const H = h - top - bot;
        let y = h - bot;
        const r = rng(layers.length * 97 + layers[0].length);
        seq.forEach(([c, f, isSponge], si) => {
          const hh = (f / sum) * H;
          g.fillStyle = c;
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(edge, y);
          // a soft wavy line between layers
          for (let x = edge; x >= 0; x -= 16) g.lineTo(x, y - hh + Math.sin(x * 0.03 + si) * 2.2);
          g.closePath();
          g.fill();
          if (isSponge) {
            // crumbs and air in the sponge
            for (let i = 0; i < 520; i++) {
              const px = r() * edge, py = y - r() * hh;
              g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.18)" : "rgba(90,50,20,.14)";
              g.beginPath(); g.arc(px, py, 0.6 + r() * 2.2, 0, TAU); g.fill();
            }
          } else {
            g.fillStyle = "rgba(255,255,255,.12)";
            g.fillRect(0, y - hh, edge, hh * 0.35);
          }
          y -= hh;
        });
        // the cream coat: a band round the edge and over the top
        g.fillStyle = coatHex;
        g.fillRect(edge, 0, w - edge, h);
        g.fillRect(0, 0, w, top);
        g.fillStyle = "rgba(0,0,0,.05)";
        g.fillRect(edge - 2, top, 2, h - top);
      });
      textCache.set("cut" + k, t);
      return t;
    }

    const FONTS = {
      script: (s) => `${s}px "Great Vibes", "Caveat", cursive`,
      hand: (s) => `700 ${s * 0.92}px "Caveat", cursive`,
      serif: (s) => `italic 500 ${s * 0.72}px "Playfair Display", serif`,
      block: (s) => `600 ${s * 0.5}px "Unbounded", sans-serif`,
      lobster: (s) => `${s * 0.66}px "Lobster", cursive`,
      pacifico: (s) => `${s * 0.56}px "Pacifico", cursive`,
      marck: (s) => `${s * 0.86}px "Marck Script", cursive`,
      bad: (s) => `${s * 0.72}px "Bad Script", cursive`,
      amatic: (s) => `700 ${s * 0.92}px "Amatic SC", sans-serif`,
      comfortaa: (s) => `700 ${s * 0.54}px "Comfortaa", sans-serif`,
      cormorant: (s) => `italic 600 ${s * 0.8}px "Cormorant Garamond", serif`,
      dela: (s) => `${s * 0.5}px "Dela Gothic One", sans-serif`,
    };
    // a hand that has not been downloaded yet is fetched once, then the inscription is painted again
    const fontAsked = new Set();
    function textTexture(text, hex, font = "script") {
      const k = text + hex + font;
      if (textCache.has(k)) return textCache.get(k);
      const F = FONTS[font] || FONTS.script;
      if (document.fonts && !fontAsked.has(font) && !document.fonts.check(F(64), text)) {
        fontAsked.add(font);
        document.fonts.load(F(64), text).then(() => {
          [...textCache.keys()].forEach((key) => key.endsWith(font) && textCache.delete(key));
          paintText();
        }, () => {});
      }
      const t = canvasTex(1024, 384, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        let size = 190;
        g.font = F(size);
        while (g.measureText(text).width > w * 0.92 && size > 60) { size -= 8; g.font = F(size); }
        g.textAlign = "center";
        g.textBaseline = "middle";
        // piped letters: a darker edge, the colour, a sheen
        g.lineJoin = "round";
        g.strokeStyle = hex;
        g.lineWidth = size * 0.07;
        g.globalAlpha = 0.65;
        g.strokeText(text, w / 2, h / 2);
        g.globalAlpha = 1;
        g.fillStyle = hex;
        g.fillText(text, w / 2, h / 2);
        g.fillStyle = "rgba(255,255,255,.22)";
        g.fillText(text, w / 2 - 2, h / 2 - 3);
      });
      textCache.set(k, t);
      if (textCache.size > 40) textCache.delete(textCache.keys().next().value);
      return t;
    }

    /* ── materials ── */
    const mat = {
      cream(hex, coat) {
        const base = {
          color: hex,
          roughness: coat === "strokes" ? 0.5 : 0.58,
          sheen: 0.7,
          sheenRoughness: 0.7,
          sheenColor: new THREE.Color(0xffffff).multiplyScalar(0.35),
          bumpMap: coat === "strokes" ? TEX.strokes : TEX.noise,
          bumpScale: coat === "strokes" ? 2.2 : 0.35,
          envMapIntensity: 0.65,
        };
        // ombré: the colour lives in the vertices
        if (coat === "ombre") Object.assign(base, { color: 0xffffff, vertexColors: true });
        // velvet: sprayed, matt, with a bright sheen on the edges
        if (coat === "velvet") Object.assign(base, { roughness: 1, sheen: 1, sheenRoughness: 0.32, sheenColor: new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.55), bumpScale: 1.1, envMapIntensity: 0.4 });
        // marble: veins in a glossy fondant
        if (coat === "marble") {
          const map = marbleTexture(hex);
          Object.assign(base, { color: 0xffffff, map, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25, sheen: 0.2, bumpScale: 0.12, envMapIntensity: 0.9 });
        }
        // pearl: a soft rainbow shimmer
        if (coat === "pearl") Object.assign(base, { roughness: 0.22, metalness: 0.15, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [260, 760], clearcoat: 0.8, clearcoatRoughness: 0.12, sheen: 0.8, sheenRoughness: 0.4, sheenColor: new THREE.Color(0xdfe8ff), envMapIntensity: 1.4 });
        return new THREE.MeshPhysicalMaterial(base);
      },
      gold: () => new THREE.MeshPhysicalMaterial({ color: 0xd8b25a, metalness: 1, roughness: 0.2, clearcoat: 0.5, envMapIntensity: 1.6 }),
      piped: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.5, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff).multiplyScalar(0.3), envMapIntensity: 0.7 }),
      glaze: (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.2 }),
      porcelain: () => new THREE.MeshPhysicalMaterial({ color: 0xfbf6f3, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1 }),
      board: () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0.0, sheen: 0.3, envMapIntensity: 0.9 }),
    };

    function studioEnv(r) {
      const s = new THREE.Scene();
      const room = new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf6e8e6).multiplyScalar(0.42), side: THREE.BackSide }));
      s.add(room);
      const box = (w, h, d, x, y, z, k, tint = 0xffffff) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(k) }));
        m.position.set(x, y, z);
        s.add(m);
      };
      box(7, 0.2, 4, 0, 5.8, 0, 5.5);
      box(0.2, 4.5, 3.5, -5.8, 1.8, 1.2, 3.2);
      box(0.2, 3, 3, 5.8, 1.2, -1.5, 1.8, 0xffe0e6);
      box(4, 2.2, 0.2, 0, 1.4, 5.8, 2.2);
      box(12, 0.2, 12, 0, -5.8, 0, 0.5, 0xf2d6d6);
      const pm = new THREE.PMREMGenerator(r);
      const rt = pm.fromScene(s, 0.035);
      pm.dispose();
      return rt.texture;
    }
    function blobTexture() {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const g = c.getContext("2d");
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(80,20,25,.5)");
      gr.addColorStop(0.5, "rgba(80,20,25,.16)");
      gr.addColorStop(1, "rgba(80,20,25,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }

    /* ── the stand: a low porcelain cake stand with a board on it (built once per board size) ── */
    let standR = 0;
    function buildStand(boardR) {
      if (Math.abs(boardR - standR) < 1e-3) return;
      standR = boardR;
      standGroup.children.slice().forEach((c) => { standGroup.remove(c); c.geometry.dispose(); });
      const pr = boardR * 1.08;
      const prof = [
        [0, -0.62], [pr * 0.42, -0.62], [pr * 0.46, -0.6], [pr * 0.44, -0.57], [pr * 0.3, -0.54], [pr * 0.12, -0.49],
        [pr * 0.085, -0.4], [pr * 0.075, -0.24], [pr * 0.09, -0.15], [pr * 0.2, -0.1], [pr * 0.9, -0.075], [pr, -0.065],
        [pr * 1.01, -0.05], [pr * 0.99, -0.04], [pr * 0.96, -0.042], [0, -0.042],
      ].map(([x, y]) => new THREE.Vector2(x, y));
      const stand = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), mat.porcelain());
      stand.castShadow = true;
      stand.receiveShadow = true;
      standGroup.add(stand);
      const board = new THREE.Mesh(new THREE.CylinderGeometry(boardR, boardR, 0.03, 96), mat.board());
      board.position.y = -0.016;
      board.receiveShadow = true;
      board.castShadow = true;
      standGroup.add(board);
      floor.position.y = -0.62;
      blob.position.y = -0.618;
      blob.scale.setScalar(pr * 1.6);
    }

    /* ── the cake ── */
    function inst(geo, material, items, cast = true) {
      const m = new THREE.InstancedMesh(geo, material, Math.max(1, items.length));
      m.count = items.length;
      items.forEach((mx, i) => m.setMatrixAt(i, mx));
      m.instanceMatrix.needsUpdate = true;
      m.castShadow = cast;
      m.receiveShadow = true;
      return m;
    }
    const tmp = { m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), s: new THREE.Vector3(), x: new THREE.Vector3(), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3() };
    // a matrix that stands a thing on the outline at u: x along it, y up, z outwards
    function onPath(p, o, y, sx, sy, sz, tilt = 0, roll = 0) {
      tmp.z.set(p.nx, 0, p.nz);
      tmp.x.set(p.nz, 0, -p.nx);
      const basis = new THREE.Matrix4().makeBasis(tmp.x, tmp.y, tmp.z);
      if (tilt || roll) basis.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(tilt, 0, roll)));
      basis.scale(new THREE.Vector3(sx, sy, sz));
      basis.setPosition(p.x + p.nx * o, y, p.z + p.nz * o);
      return basis;
    }
    function ringOf(path, spacing, fn) {
      const count = Math.max(6, Math.round(path.per / spacing));
      return Array.from({ length: count }, (_, k) => fn(path.at(k / count), k, count));
    }

    function build(d) {
      const group = new THREE.Group();
      const creams = [];
      const parts = {};
      const tiers = d.tiers;
      const R = rng(d.seed || 3);
      let y0 = 0;
      const paths = [];
      tiers.forEach(([r, h], ti) => {
        const path = makePath(d.shape, r);
        paths.push({ path, y0, h });
        y0 += h;
      });
      const top = paths[paths.length - 1];
      const creamM = mat.cream(d.color, d.coat);
      creams.push(creamM);
      const decorM = mat.piped(d.decorColor);
      // what each choice put on the cake, so a new topping can drop in on its own
      const add = (key, obj) => (parts[key] = parts[key] || []).push(obj);
      // ombré: deep at the bottom, almost white at the top of the whole cake
      const Htot = y0;
      const deep = new THREE.Color(d.color), pale = new THREE.Color(d.color).lerp(new THREE.Color(0xffffff), 0.85);
      const ombre = d.coat === "ombre" ? (y) => new THREE.Color().copy(deep).lerp(pale, Math.pow(clamp(y / Htot, 0, 1), 1.35)) : null;
      const marble = d.coat === "marble";

      paths.forEach(({ path, y0: base, h }, ti) => {
        const tier = new THREE.Group();
        tier.position.y = base;
        const rr = Math.min(0.07, h * 0.08);
        const prof = [{ o: -0.012, y: 0, no: 0.4, ny: -1 }, { o: 0, y: 0.012, no: 1, ny: -0.15 }, { o: 0, y: h * 0.5, no: 1, ny: 0 }, { o: 0, y: h - rr, no: 1, ny: 0 }];
        for (let k = 1; k <= 7; k++) {
          const a = (k / 7) * Math.PI * 0.5;
          prof.push({ o: -rr + rr * Math.cos(a), y: h - rr + rr * Math.sin(a), no: Math.cos(a), ny: Math.sin(a) });
        }
        const side = new THREE.Mesh(sweep(path, prof, marble ? 2 : Math.round(path.per * 1.2), marble ? 0.9 : 1.4, ombre && ((y) => ombre(base + y))), creamM);
        const lid = new THREE.Mesh(cap(path, rr, h, marble ? 1.4 : 2.4, ombre && ombre(base + h)), creamM);
        [side, lid].forEach((m) => { m.castShadow = true; m.receiveShadow = true; tier.add(m); });
        group.add(tier);

        const isTop = ti === paths.length - 1;
        // the drip: a glossy glaze on top, a lip over the edge and drips down the side
        if (d.drip) {
          const gm = d.dripGold ? mat.gold() : mat.glaze(d.drip);
          const lipProf = [{ o: -0.004, y: h - 0.05, no: 0.2, ny: -1 }, { o: 0.012, y: h - 0.036, no: 1, ny: -0.4 }, { o: 0.016, y: h - 0.012, no: 1, ny: 0.2 }, { o: 0.006, y: h + 0.01, no: 0.5, ny: 1 }, { o: -rr * 0.7, y: h + 0.016, no: 0, ny: 1 }];
          const lip = new THREE.Mesh(sweep(path, lipProf), gm);
          const pool = new THREE.Mesh(cap(path, rr * 0.7, h + 0.016), gm);
          const drips = [];
          const count = Math.round(path.per / 0.11);
          for (let k = 0; k < count; k++) {
            if (R() < 0.18) continue;
            const p = path.at((k + R() * 0.4) / count);
            const len = h * (0.12 + Math.pow(R(), 1.6) * 0.42);
            const w = 0.018 + R() * 0.008;
            drips.push(onPath(p, 0.008, h - len / 2 - 0.02, w, len / 3, w * 0.75));
          }
          const dm = inst(GEO.drip, gm, drips);
          [lip, pool].forEach((m) => { m.castShadow = true; tier.add(m); });
          tier.add(dm);
        }

        // piped borders
        const dg = new THREE.Group();
        tier.add(dg);
        const shellsAt = (y, o, size, tilt) => dg.add(inst(GEO.shell, decorM, ringOf(path, size * 0.72, (p) => onPath(p, o, y, size * 1.25, size * 0.9, size * 0.95, tilt))));
        const kissesAt = (y, o, size, spacing) => dg.add(inst(GEO.kiss, decorM, ringOf(path, spacing, (p, k) => onPath(p, o, y, size, size * (0.95 + (k % 3) * 0.04), size))));
        const decor = d.decor;
        if (decor === "dots") kissesAt(h - 0.006, -0.06, 0.12, 0.105);
        if (decor === "shells" || decor === "garland" || decor === "frills") {
          shellsAt(h - 0.014, -0.05, decor === "frills" ? 0.22 : 0.19, -0.2);
          shellsAt(0.004, 0.024, decor === "frills" ? 0.22 : 0.2, 0.25);
        }
        if (decor === "garland") {
          // swags of piped cream round the side, a dollop where they hang
          const n = Math.max(5, Math.round(path.per / 0.5));
          const pts = [];
          const yA = h * 0.8, sag = h * 0.2;
          for (let k = 0; k < n; k++) for (let s = 0; s < 12; s++) {
            const t = s / 12;
            const p = path.at((k + t) / n);
            const o = 0.016 + 0.012 * Math.sin(Math.PI * t);
            pts.push(new THREE.Vector3(p.x + p.nx * o, yA - sag * Math.sin(Math.PI * t), p.z + p.nz * o));
          }
          const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, n * 40, 0.022, 10, true), decorM);
          tube.castShadow = true;
          dg.add(tube);
          dg.add(inst(GEO.kiss, decorM, Array.from({ length: n }, (_, k) => onPath(path.at(k / n), 0.01, yA - 0.03, 0.08, 0.07, 0.08, Math.PI / 2))));
          dg.add(inst(GEO.sphere, mat.glaze("#fff6ec"), Array.from({ length: n }, (_, k) => {
            const p = path.at((k + 0.5) / n);
            return onPath(p, 0.04, yA - sag - 0.035, 0.016, 0.016, 0.016);
          })));
        }
        if (decor === "frills") {
          // vintage: two rows of ruffles that fold in and out round the side
          [h * 0.74, h * 0.4].forEach((yr, ri) => {
            const folds = Math.round(path.per / 0.085);
            const w = h * 0.2;
            const g = grid(Math.round(path.per * 160), 6, (u, v) => {
              const p = path.at(u);
              const fold = Math.sin(u * folds * TAU + ri);
              const o = 0.006 + v * 0.07 * (0.75 + 0.45 * fold) + v * v * 0.02;
              const yy = yr - v * w + 0.012 * fold * v;
              return [p.x + p.nx * o, yy, p.z + p.nz * o];
            });
            const m = new THREE.Mesh(g, decorM.clone());
            m.material.side = THREE.DoubleSide;
            m.castShadow = true;
            dg.add(m);
            // a fine piped bead along the top of each ruffle
            dg.add(inst(GEO.sphere, decorM, ringOf(path, 0.035, (p) => onPath(p, 0.012, yr + 0.004, 0.017, 0.015, 0.017))));
          });
        }
        dg.traverse((m) => { if (m.isMesh) m.receiveShadow = true; });
        add("decor", dg);

        // gold leaf on every tier
        if (d.toppings.includes("gold")) {
          const gm = new THREE.MeshPhysicalMaterial({ color: 0xd8b25a, metalness: 1, roughness: 0.28, side: THREE.DoubleSide, envMapIntensity: 1.5 });
          const flakes = [];
          const count = Math.round(path.per * 9);
          for (let k = 0; k < count; k++) {
            const p = path.at(R());
            const s = 0.03 + R() * 0.05;
            flakes.push(onPath(p, 0.004, h * (0.15 + R() * 0.75), s, s * (0.6 + R() * 0.6), 1, 0, R() * TAU));
          }
          const leaf = new THREE.ShapeGeometry(new THREE.Shape([[0, 0], [0.6, 0.15], [1, 0.7], [0.55, 1], [0.1, 0.8], [-0.2, 0.4]].map(([x, y]) => new THREE.Vector2(x - 0.4, y - 0.5))));
          const g = new THREE.Group();
          g.add(inst(leaf, gm, flakes, false));
          tier.add(g);
          add("gold", g);
        }
        // satin bows round the bottom tier
        if (ti === 0 && d.toppings.includes("bows")) {
          const g = new THREE.Group();
          const n = clamp(Math.round(path.per / 0.95), 4, 9);
          for (let k = 0; k < n; k++) {
            const p = path.at((k + 0.5) / n);
            const b = bowMesh();
            b.applyMatrix4(onPath(p, 0.012, h * (d.decor === "garland" ? 0.42 : 0.56), 1, 1, 1));
            g.add(b);
          }
          tier.add(g);
          add("bows", g);
        }
        if (d.toppings.includes("sprinkles")) {
          const cols = ["#f5bcc8", "#fbe6b8", "#bcd6f3", "#ffffff", "#c2263f", "#9ed9b8"].map((c) => new THREE.Color(c));
          const items = [], colors = [];
          // round the base of every tier
          const cnt = Math.round(path.per * 46);
          for (let k = 0; k < cnt; k++) {
            const p = path.at(R());
            const yy = Math.pow(R(), 2.2) * h * 0.32 + 0.02;
            items.push(onPath(p, 0.008, yy, 1, 1, 1, R() * TAU, R() * TAU));
            colors.push(cols[(R() * cols.length) | 0]);
          }
          if (isTop) {
            const lim = path.maxR;
            for (let k = 0; k < 700 && items.length < cnt + 260; k++) {
              const x = (R() * 2 - 1) * lim, z = (R() * 2 - 1) * lim;
              if (!path.inside(x * 1.12, z * 1.12)) continue;
              if (d.text && Math.abs(x) < lim * 0.62 && z > -lim * 0.05 && z < lim * 0.5) continue;
              const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 2, R() * TAU, 0, "YXZ"));
              m.setPosition(x, h + 0.008, z);
              items.push(m);
              colors.push(cols[(R() * cols.length) | 0]);
            }
          }
          const m = inst(GEO.sprinkle, new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.6 }), items, false);
          colors.forEach((c, i) => m.setColorAt(i, c));
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
          const g = new THREE.Group();
          g.add(m);
          tier.add(g);
          add("sprinkles", g);
        }
        // sugar pearls: a strand round every tier, big and small in turn
        if (d.toppings.includes("pearls")) {
          const pm = new THREE.MeshPhysicalMaterial({ color: 0xfbf4ee, roughness: 0.16, clearcoat: 1, iridescence: 0.8, iridescenceIOR: 1.5, envMapIntensity: 1.3 });
          const yy = d.drip ? h * 0.3 : h * 0.22;
          const g = new THREE.Group();
          g.add(inst(GEO.sphere, pm, ringOf(path, 0.036, (p, k) => { const s = k % 2 ? 0.011 : 0.016; return onPath(p, s * 0.7, yy, s, s, s); })));
          tier.add(g);
          add("pearls", g);
        }
      });

      /* toppings on the top tier */
      const T = top.path, H = top.y0 + top.h, Rt = T.maxR;
      const rimY = H + (d.decor === "dots" ? 0.075 : d.decor === "none" ? 0.0 : 0.05) + (d.drip ? 0.016 : 0);
      const topY = H + (d.drip ? 0.018 : 0);
      const flames = [];
      const flyers = [];
      const polar = (ang, f) => { const r = T.ray(ang) * f; return [Math.cos(ang) * r, Math.sin(ang) * r]; };

      if (d.toppings.includes("cherries")) {
        const g = new THREE.Group();
        const n = clamp(Math.round(T.per / 0.42), 5, 12);
        const cm = mat.glaze("#9e0b1d");
        const sm = new THREE.MeshStandardMaterial({ color: 0x6b5a2a, roughness: 0.7 });
        for (let k = 0; k < n; k++) {
          const p = T.at((k + 0.5) / n);
          const c = new THREE.Group();
          const ball = new THREE.Mesh(GEO.cherry, cm);
          ball.scale.setScalar(0.058);
          ball.position.y = 0.05;
          ball.castShadow = true;
          c.add(ball);
          const lean = (R() - 0.5) * 0.5;
          const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.095, 0), new THREE.Vector3(0.01, 0.17, 0), new THREE.Vector3(0.05 + lean * 0.05, 0.21, 0.01)), 10, 0.0045, 5), sm);
          stem.castShadow = true;
          c.add(stem);
          c.position.set(p.x - p.nx * 0.075, rimY - 0.012, p.z - p.nz * 0.075);
          c.rotation.y = R() * TAU;
          g.add(c);
        }
        group.add(g);
        add("cherries", g);
      }
      if (d.toppings.includes("candles")) {
        const g = new THREE.Group();
        const cm = new THREE.MeshPhysicalMaterial({ map: TEX.candle, roughness: 0.4, clearcoat: 0.3 });
        const fm = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true });
        [[-0.32, -0.42], [0, -0.52], [0.32, -0.42]].forEach(([fx, fz], i) => {
          const c = new THREE.Group();
          const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.26, 16), cm);
          stick.position.y = 0.13;
          stick.castShadow = true;
          c.add(stick);
          const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.02, 4), new THREE.MeshBasicMaterial({ color: 0x222222 }));
          wick.position.y = 0.27;
          c.add(wick);
          const flame = new THREE.Mesh(GEO.flame, fm);
          flame.position.y = 0.272;
          c.add(flame);
          const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
          glow.scale.setScalar(0.16);
          glow.position.y = 0.3;
          c.add(glow);
          flames.push({ flame, glow, ph: i * 1.7 });
          c.position.set(fx * Rt, topY, fz * Rt);
          g.add(c);
        });
        const light = new THREE.PointLight(0xffb45a, 0.35, 1.6, 2);
        light.position.set(0, topY + 0.32, -0.45 * Rt);
        g.add(light);
        flames.light = light;
        group.add(g);
        add("candles", g);
      }
      /* fruit, berries, flowers and macarons: spread over the whole top and every ledge of a tiered cake
         (or laid as a wreath, or heaped in one bunch) — all the chosen ones mixed together */
      const SPREAD = ["strawberries", "berries", "flowers", "macarons"].filter((t) => d.toppings.includes(t));
      if (SPREAD.length) {
        const place = d.place || "all";
        const tk = d.textSize || 1;
        const hasText = !!String(d.text || "").trim();
        const tz = Rt * (T.kind === "heart" ? 0.06 : 0.16);
        // what already sits on the top: the inscription, the candles, the chocolate sails
        const busy = (x, z) => {
          if (hasText && Math.abs(x) < Rt * 0.66 * tk + 0.05 && Math.abs(z - tz) < Rt * 0.3 * tk + 0.06) return true;
          if (d.toppings.includes("candles") && [[-0.32, -0.42], [0, -0.52], [0.32, -0.42]].some(([cx, cz]) => Math.hypot(x - cx * Rt, z - cz * Rt) < 0.09)) return true;
          if (d.toppings.includes("shards") && x > -0.52 * Rt && x < 0.44 * Rt && z > -0.44 * Rt && z < 0.03 * Rt) return true;
          return false;
        };
        // keep clear of the piped border, the cherries and the meringues on the rim
        const inset = Math.max(d.decor === "none" ? 0.06 : 0.13, d.toppings.includes("cherries") ? 0.17 : 0, d.toppings.includes("meringues") ? 0.27 : 0) + 0.05;
        const slots = [];
        const put = (x, z, y) => { if (!busy(x, z)) slots.push({ x, z, y }); };
        if (place === "heap") {
          // one bunch, wherever the top is free: front left, back left, front right or back right
          const bunch = (ang) => {
            const [cx, cz] = polar(ang, 0.52);
            const pts = [];
            for (let i = 0; i < 14; i++) {
              const r = Math.sqrt((i + 0.5) / 14) * Rt * 0.36, a = i * 2.39996;
              const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
              if (Math.hypot(x, z) < T.ray(Math.atan2(z, x)) - inset && !busy(x, z)) pts.push({ x, z, y: topY });
            }
            return pts;
          };
          const best = [2.4, -2.4, 0.75, -0.75].map(bunch).reduce((a, b) => (b.length > a.length ? b : a));
          slots.push(...best);
        } else if (place === "ring") {
          const n = clamp(Math.round((TAU * Math.max(0.2, Rt - inset)) / 0.16), 8, 30);
          for (let k = 0; k < n; k++) {
            const a = (k / n) * TAU + 0.2;
            const r = Math.max(0.05, T.ray(a) - inset);
            put(Math.cos(a) * r, Math.sin(a) * r, topY);
          }
        } else {
          // a sunflower spiral covers the top evenly, right up to the border
          const use = Math.max(0.2, Rt - inset);
          const n = clamp(Math.round((Math.PI * use * use) / 0.042), 6, 56);
          for (let i = 0; i < n; i++) {
            const a = i * 2.39996 + 0.4;
            const r = Math.max(0, T.ray(a) - inset) * Math.sqrt((i + 0.5) / n);
            put(Math.cos(a) * r + (R() - 0.5) * 0.03, Math.sin(a) * r + (R() - 0.5) * 0.03, topY);
          }
        }
        // on a tiered cake the ledges between the tiers get their share too
        if (place !== "heap") paths.slice(0, -1).forEach(({ path, y0: b, h }, i) => {
          const up = paths[i + 1].path;
          const n = clamp(Math.round(path.per / 0.2), 8, 36);
          for (let k = 0; k < n; k++) {
            const a = ((k + 0.5) / n) * TAU;
            const outer = path.ray(a) - (d.decor === "none" ? 0.06 : 0.12), inner = up.ray(a) + 0.05;
            if (outer - inner < 0.05) continue;
            const r = (outer + inner) / 2;
            slots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: b + h + (d.drip ? 0.018 : 0) });
          }
        });
        const by = {};
        SPREAD.forEach((t) => (by[t] = []));
        slots.forEach((s, i) => by[SPREAD[i % SPREAD.length]].push(s));

        if (by.strawberries) {
          const g = new THREE.Group();
          const sm = new THREE.MeshPhysicalMaterial({ map: TEX.straw, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.15 });
          const lm = new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 0.6, side: THREE.DoubleSide });
          by.strawberries.forEach((p, i) => {
            // most lie on their side, every third stands up
            const up = i % 3 === 2;
            const s = new THREE.Group();
            const body = new THREE.Mesh(GEO.straw, sm);
            body.castShadow = true;
            const leaf = new THREE.Mesh(GEO.leaf, lm);
            leaf.position.y = 0.108;
            leaf.rotation.y = i;
            s.add(body, leaf);
            s.rotation.set(up ? (R() - 0.5) * 0.4 : Math.PI / 2 + (R() - 0.5) * 0.5, R() * TAU, 0, "YXZ");
            s.position.set(p.x, p.y + (up ? 0.01 : 0.05), p.z);
            s.scale.setScalar(up ? 0.85 : 0.95 + R() * 0.12);
            g.add(s);
          });
          group.add(g);
          add("strawberries", g);
        }
        if (by.berries) {
          const g = new THREE.Group();
          const rasp = new THREE.MeshPhysicalMaterial({ color: 0xb3173a, roughness: 0.4, clearcoat: 0.5, sheen: 0.3 });
          const blue = new THREE.MeshPhysicalMaterial({ color: 0x2f3a66, roughness: 0.55, sheen: 1, sheenColor: new THREE.Color(0x9aa6c8), sheenRoughness: 0.4 });
          const drup = [], bl = [];
          by.berries.forEach((p, i) => {
            // a raspberry with a blueberry or two beside it
            for (let a = 0; a < 26; a++) {
              const th = Math.acos(1 - 2 * ((a + 0.5) / 26) * 0.92), ph = a * 2.4;
              const m = new THREE.Matrix4().makeScale(0.019, 0.019, 0.019);
              m.setPosition(p.x + Math.sin(th) * Math.cos(ph) * 0.04, p.y + 0.045 + Math.cos(th) * 0.048, p.z + Math.sin(th) * Math.sin(ph) * 0.04);
              drup.push(m);
            }
            for (let k = 0; k <= i % 2; k++) {
              const a = R() * TAU;
              const m = new THREE.Matrix4().makeScale(0.032, 0.028, 0.032);
              m.setPosition(p.x + Math.cos(a) * 0.065, p.y + 0.028, p.z + Math.sin(a) * 0.065);
              bl.push(m);
            }
          });
          g.add(inst(GEO.sphere, rasp, drup));
          g.add(inst(GEO.sphere, blue, bl));
          group.add(g);
          add("berries", g);
        }
        if (by.flowers) {
          const g = new THREE.Group();
          const cols = ["#ffffff", "#f5bcc8", "#e2849a"];
          by.flowers.forEach((p, i) => g.add(flowerMesh(cols[i % 3], p.x, p.y + 0.02, p.z, 0.85 + R() * 0.45, R() * TAU)));
          group.add(g);
          add("flowers", g);
        }
        if (by.macarons) {
          const g = new THREE.Group();
          const fill = mat.piped("#fff7ef");
          const ms = ["#f5bcc8", "#cfe8dc", "#e9c6f0", "#fbe3a6"].map((c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xffffff).multiplyScalar(0.3) }));
          const fillGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.024, 32);
          by.macarons.forEach((p, i) => {
            const sm = ms[i % ms.length];
            const mac = new THREE.Group();
            const a = new THREE.Mesh(GEO.macShell, sm);
            const b = new THREE.Mesh(GEO.macShell, sm);
            b.rotation.x = Math.PI;
            b.position.y = 0.06;
            const f = new THREE.Mesh(fillGeo, fill);
            f.position.y = 0.03;
            [a, b, f].forEach((m) => { m.castShadow = true; mac.add(m); });
            // a little tilted, as if just set down
            mac.rotation.set(-0.42 - R() * 0.2, R() * TAU, 0, "YXZ");
            mac.position.set(p.x, p.y + 0.032, p.z);
            g.add(mac);
          });
          group.add(g);
          add("macarons", g);
        }
      }
      // meringue kisses on the rim, between the cherries
      if (d.toppings.includes("meringues")) {
        const mm = new THREE.MeshPhysicalMaterial({ color: 0xfffaf4, roughness: 0.75, sheen: 0.5, sheenColor: new THREE.Color(0xffffff).multiplyScalar(0.4) });
        const n = clamp(Math.round(T.per / 0.42), 5, 12);
        const g = new THREE.Group();
        g.add(inst(GEO.kiss, mm, Array.from({ length: n }, (_, k) => {
          const p = T.at(k / n);
          return onPath(p, -0.15, topY + (d.decor === "none" ? 0 : 0.01), 0.19, 0.2, 0.19);
        })));
        group.add(g);
        add("meringues", g);
      }
      // chocolate sails standing up at the back
      if (d.toppings.includes("shards")) {
        const dm = new THREE.MeshPhysicalMaterial({ color: 0x3b1b13, roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.2 });
        const wm = new THREE.MeshPhysicalMaterial({ color: 0xf3e6d2, roughness: 0.3, clearcoat: 0.5 });
        const g = new THREE.Group();
        [[-0.15, 0.95, -0.4, 0], [0.08, 1.2, 0.2, 1], [0.3, 0.85, 0.6, 0], [-0.38, 0.72, -0.9, 1]].forEach(([dx, s, ry, white]) => {
          const m = new THREE.Mesh(GEO.shard, white ? wm : dm);
          m.scale.setScalar(s * clamp(Rt, 0.7, 1.1));
          m.rotation.set(-0.12, ry, dx * 0.4);
          m.position.set(dx * Rt, topY, -0.2 * Rt + Math.abs(dx) * 0.2);
          m.castShadow = true;
          g.add(m);
        });
        group.add(g);
        add("shards", g);
      }
      // butterflies: wafer paper wings that flap round the cake
      if (d.toppings.includes("butterflies")) {
        const g = new THREE.Group();
        const bm = new THREE.MeshStandardMaterial({ color: 0x3d1d22, roughness: 0.6 });
        for (let k = 0; k < 4; k++) {
          const b = new THREE.Group();
          const wm = new THREE.MeshStandardMaterial({ map: TEX.wings[k % TEX.wings.length], side: THREE.DoubleSide, roughness: 0.7, transparent: true, opacity: 0.96 });
          const wl = new THREE.Group(), wr = new THREE.Group();
          const a = new THREE.Mesh(GEO.wing, wm), c = new THREE.Mesh(GEO.wing, wm);
          a.rotation.x = c.rotation.x = -Math.PI / 2;
          c.scale.x = -1;
          wl.add(a); wr.add(c);
          const body = new THREE.Mesh(GEO.sphere, bm);
          body.scale.set(0.006, 0.006, 0.04);
          b.add(wl, wr, body);
          // the first two rest on the cake, the others circle it
          const rest = k < 2;
          b.traverse((o) => { if (o.isMesh) o.castShadow = rest; });
          b.scale.setScalar(rest ? 1.9 + k * 0.3 : 2 + (k % 2) * 0.5);
          const ang = rest ? (k ? -0.3 : 2.0) : R() * TAU;
          const [x, z] = polar(ang, rest ? 0.5 : 1);
          flyers.push({ b, wl, wr, rest, ph: R() * TAU, ang, r: Rt * (1.25 + R() * 0.3), y: topY * (0.55 + R() * 0.5) + 0.12, sp: 0.35 + R() * 0.2, x, z, yy: rest ? topY + 0.01 : 0 });
          g.add(b);
        }
        group.add(g);
        add("butterflies", g);
      }

      // the inscription, piped on top towards the front
      const text = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.375), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
      text.rotation.x = -Math.PI / 2;
      text.renderOrder = 2;
      text.position.set(0, topY + 0.004, Rt * (T.kind === "heart" ? 0.06 : 0.16));
      text.scale.setScalar(Rt * 1.28 * (d.textSize || 1));
      group.add(text);

      // how it is cut for the guests: thin lines on the top, shown on the size step
      const cutLines = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
      cutLines.rotation.x = -Math.PI / 2;
      cutLines.renderOrder = 3;
      cutLines.position.y = topY + 0.006;
      cutLines.scale.setScalar(Rt * 1.05);
      cutLines.visible = false;
      group.add(cutLines);

      return { group, creams, parts, paths, top: H, topY, maxR: paths[0].path.maxR, text, textBase: Rt * 1.28, decorM, shapeTop: T, flames, flyers, cutLines, tiers: paths.length };
    }

    // n slices drawn from the middle to the edge of the top
    function portionTexture(T, n, S) {
      const k = `por${T.kind}${n}${S.toFixed(3)}`;
      if (textCache.has(k)) return textCache.get(k);
      const t = canvasTex(512, 512, (g, w, h) => {
        const px = (x) => ((x / S + 1) / 2) * w, pz = (z) => ((z / S + 1) / 2) * h;
        g.strokeStyle = "rgba(109,8,9,.55)";
        g.lineWidth = 2.2;
        g.setLineDash([7, 6]);
        g.lineCap = "round";
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU - Math.PI / 2;
          const r = T.ray(a) * 0.9;
          g.beginPath();
          g.moveTo(px(Math.cos(a) * r * 0.08), pz(Math.sin(a) * r * 0.08));
          g.lineTo(px(Math.cos(a) * r), pz(Math.sin(a) * r));
          g.stroke();
        }
        g.setLineDash([]);
        g.fillStyle = "rgba(109,8,9,.6)";
        g.beginPath(); g.arc(w / 2, h / 2, 4, 0, TAU); g.fill();
      });
      textCache.set(k, t);
      return t;
    }

    function bowMesh() {
      const g = new THREE.Group();
      const m = new THREE.MeshPhysicalMaterial({ color: 0xc2263f, roughness: 0.35, sheen: 1, sheenColor: new THREE.Color(0xff8fa3), sheenRoughness: 0.35, clearcoat: 0.3 });
      const loop = new THREE.TorusGeometry(0.032, 0.011, 10, 28);
      [-1, 1].forEach((s) => {
        const l = new THREE.Mesh(loop, m);
        l.scale.set(1.15, 0.72, 0.5);
        l.position.set(s * 0.036, 0.004, 0.004);
        l.rotation.z = s * 0.25;
        g.add(l);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.07, 0.004), m);
        tail.position.set(s * 0.016, -0.038, 0.008);
        tail.rotation.z = s * 0.35;
        g.add(tail);
      });
      const knot = new THREE.Mesh(GEO.sphere, m);
      knot.scale.set(0.015, 0.016, 0.012);
      knot.position.z = 0.01;
      g.add(knot);
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      return g;
    }
    function flowerMesh(hex, x, y, z, s, rot) {
      const g = new THREE.Group();
      const pm = new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.5, sheen: 0.6, sheenColor: new THREE.Color(0xffffff).multiplyScalar(0.3) });
      for (let i = 0; i < 5; i++) {
        const p = new THREE.Mesh(GEO.sphere, pm);
        const a = (i / 5) * TAU;
        p.scale.set(0.034, 0.012, 0.022);
        p.position.set(Math.cos(a) * 0.03, 0.012, Math.sin(a) * 0.03);
        p.rotation.y = -a;
        p.rotation.z = 0.25;
        p.castShadow = true;
        g.add(p);
      }
      const c = new THREE.Mesh(GEO.sphere, new THREE.MeshStandardMaterial({ color: 0xf2cf86, roughness: 0.6 }));
      c.scale.set(0.013, 0.01, 0.013);
      c.position.y = 0.022;
      g.add(c);
      g.position.set(x, y, z);
      g.scale.setScalar(s);
      g.rotation.y = rot;
      return g;
    }

    /* ── the cut: a wedge facing the front-right is clipped away and slides out as a slice ── */
    const WEDGE = 0.36; // half-angle
    const WC = Math.PI / 2; // local +z (the front)
    function wedgePlanes(keep) {
      const a1 = WC - WEDGE, a2 = WC + WEDGE;
      const n1 = new THREE.Vector3(Math.sin(a1), 0, -Math.cos(a1));
      const n2 = new THREE.Vector3(-Math.sin(a2), 0, Math.cos(a2));
      if (keep) { n1.negate(); n2.negate(); }
      return [new THREE.Plane(n1, 0), new THREE.Plane(n2, 0)];
    }
    function clipAll(root, keep, obj) {
      const local = wedgePlanes(keep);
      const planes = local.map((p) => p.clone());
      local.forEach((l, i) => clips.push({ plane: planes[i], local: l, obj }));
      root.traverse((o) => {
        if (!o.material || o.userData.noClip) return;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => { m.clippingPlanes = planes; m.clipIntersection = !keep; m.clipShadows = true; });
      });
    }
    // the two cut faces of every tier
    function cutFaces(c, d) {
      const g = new THREE.Group();
      const tex = cutTexture(d.layers, d.color);
      const fm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide });
      c.paths.forEach(({ path, y0, h }) => {
        [WC - WEDGE, WC + WEDGE].forEach((a) => {
          const r = path.ray(a);
          const dx = Math.cos(a), dz = Math.sin(a);
          const geo = new THREE.BufferGeometry();
          const top = h - 0.004;
          geo.setAttribute("position", new THREE.Float32BufferAttribute([0, y0, 0, dx * r, y0, dz * r, dx * r, y0 + top, dz * r, 0, y0 + top, 0], 3));
          geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
          geo.setIndex([0, 1, 2, 0, 2, 3]);
          geo.computeVertexNormals();
          const m = new THREE.Mesh(geo, fm);
          m.userData.noClip = true;
          m.receiveShadow = true;
          g.add(m);
        });
      });
      return g;
    }

    let slice = null, faces = null;
    function applyCut() {
      clips.length = 0;
      if (slice) { turn.remove(slice.group); disposeTree(slice.group); slice = null; }
      if (faces) { faces.parent?.remove(faces); disposeTree(faces); faces = null; }
      if (!cake) return;
      cake.group.traverse((o) => {
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.clippingPlanes = null; });
      });
      if (!cut) return;
      clipAll(cake.group, false, cake.group);
      faces = cutFaces(cake, design);
      cake.group.add(faces);
      slice = build(design);
      slice.text.visible = false;
      slice.cutLines.visible = false;
      slice.flyers.forEach((f) => (f.b.visible = false));
      slice.flames.forEach((f) => (f.flame.visible = f.glow.visible = false));
      if (slice.flames.light) slice.flames.light.intensity = 0;
      slice.group.add(cutFaces(slice, design));
      clipAll(slice.group, true, slice.group);
      turn.add(slice.group);
      placeSlice();
    }
    function placeSlice() {
      if (!slice) return;
      const k = ease.inOut(cutT);
      const dx = Math.cos(WC), dz = Math.sin(WC);
      slice.group.position.set(dx * 0.62 * cake.maxR * k, 0.05 * k, dz * 0.62 * cake.maxR * k);
      slice.group.rotation.y = -0.18 * k;
      slice.group.visible = cutT > 0.001;
    }

    function disposeTree(o) {
      o.traverse((x) => {
        if (x.geometry && !Object.values(GEO).includes(x.geometry)) x.geometry.dispose();
        if (x.material) (Array.isArray(x.material) ? x.material : [x.material]).forEach((m) => m.dispose());
      });
    }

    /* ── public: a new design ── */
    function designKey(d) {
      // the inscription is repainted on its own; only whether there is one (and how big) moves the toppings round it
      const has = !!String(d.text || "").trim();
      return JSON.stringify({ ...d, text: has, textColor: "", textFont: "", textSize: has ? d.textSize || 1 : 1 });
    }
    function update(d, fx = {}) {
      const prev = design;
      design = d;
      if (cake && prev && designKey(prev) === designKey(d)) {
        paintText();
        return;
      }
      const old = cake;
      cake = build(d);
      if (old) { turn.remove(old.group); disposeTree(old.group); }
      turn.add(cake.group);
      const boardR = Math.max(cake.maxR * 1.18 + 0.06, 0.9);
      buildStand(boardR);
      paintText();
      // frame the whole cake and most of its stand
      frameTo = { y: cake.top * 0.42 - 0.12, r: Math.max(boardR * 1.5, (cake.top + 0.9) * 0.66) };
      if (!old) frame = { ...frameTo };
      applyCut();
      paintPortions(true);
      // a little life for every change
      if (old && !reduce()) {
        if (fx.grow) {
          const k = old.maxR / cake.maxR;
          tween(700, (t) => cake && cake.group.scale.setScalar(lerp(k, 1, t)), ease.back);
        } else if (fx.drop && cake.parts[fx.drop]) {
          const gs = cake.parts[fx.drop];
          const y0 = gs.map((g) => g.position.y);
          tween(900, (t) => gs.forEach((g, i) => { g.position.y = y0[i] + lerp(1.4, 0, t); }), ease.bounce);
        } else if (fx.decor && cake.parts.decor) {
          const gs = cake.parts.decor;
          tween(560, (t) => gs.forEach((g) => g.scale.set(lerp(1.08, 1, t), lerp(0.2, 1, t), lerp(1.08, 1, t))), ease.back);
        } else if (fx.color && prev && !["ombre", "marble"].includes(d.coat)) {
          const from = new THREE.Color(prev.color), to = new THREE.Color(d.color);
          const c = new THREE.Color();
          tween(520, (t) => cake.creams.forEach((m) => m.color.copy(c.copy(from).lerp(to, t))), ease.inOut);
        } else if (fx.squash !== false) {
          const g = cake.group;
          tween(620, (t) => { const s = lerp(0.9, 1, t); g.scale.set(2 - s, s, 2 - s); }, ease.elastic);
        }
      }
      kick();
    }
    function paintText() {
      if (!cake) return;
      const txt = (design.text || "").trim();
      cake.text.visible = !!txt;
      if (!txt) return;
      const m = cake.text.material;
      m.map = textTexture(txt, design.textColor, design.textFont);
      m.needsUpdate = true;
      cake.text.scale.setScalar(cake.textBase * (design.textSize || 1));
      kick();
    }
    function paintPortions() {
      if (!cake) return;
      const on = portions > 0 && cake.tiers === 1;
      const cl = cake.cutLines;
      if (on) {
        cl.material.map = portionTexture(cake.shapeTop, portions, cake.maxR * 1.05);
        cl.material.needsUpdate = true;
        cl.visible = true;
      }
      kick();
    }
    // fonts may arrive after the first paint
    document.fonts?.ready.then(() => { textCache.clear(); paintText(); });

    /* ── rendering ── */
    function resize() {
      const w = host.clientWidth || 1, h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // a resized canvas is blank until it is drawn again: draw it at once, not on the next frame
      if (cake) { placeCamera(); renderer.render(scene, camera); }
      kick();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    function placeCamera() {
      const vf = (camera.fov * Math.PI) / 180;
      const fit = camera.aspect < 1 ? Math.atan(Math.tan(vf / 2) * camera.aspect) : vf / 2;
      const dist = (frame.r / Math.sin(fit)) / zoomK;
      const ty = frame.y + Math.sin(pitch) * 0.06;
      camera.position.set(0, ty + Math.sin(pitch) * dist, Math.cos(pitch) * dist);
      camera.lookAt(0, ty - 0.02, 0);
    }

    const C_WARM = new THREE.Color(0xffc48e), C_DUSK = new THREE.Color(0xb59cff);
    let last = performance.now();
    function loop(now) {
      running = false;
      const dt = Math.min(48, now - last) / 16.67;
      last = now;
      let busy = false;
      // tweens
      for (let i = tweens.length - 1; i >= 0; i--) {
        const t = tweens[i];
        const p = clamp((now - t.t0) / t.dur, 0, 1);
        if (now < t.t0) { busy = true; continue; }
        t.fn(t.ez(p));
        if (p >= 1) tweens.splice(i, 1);
        else busy = true;
      }
      // the turntable: drag, inertia and a slow idle turn
      if (!dragging) {
        const idle = now - idleAt > 2600 && !cut && !reduce();
        const target = idle ? 0.0035 : 0;
        yawVel = lerp(yawVel, target, idle ? 0.02 : 0.06);
        if (Math.abs(yawVel) > 1e-5) busy = true;
        if (idle) busy = true;
      }
      yaw += yawVel * dt;
      turn.rotation.y = yaw;
      pitch = lerp(pitch, pitchTo, 0.12);
      zoomK = lerp(zoomK, zoomTo, 0.14);
      frame.y = lerp(frame.y, frameTo.y, 0.1);
      frame.r = lerp(frame.r, frameTo.r, 0.1);
      if (Math.abs(pitch - pitchTo) > 1e-4 || Math.abs(zoomK - zoomTo) > 1e-4 || Math.abs(frame.r - frameTo.r) > 1e-4 || Math.abs(frame.y - frameTo.y) > 1e-4) busy = true;
      // the slice
      const ct = cut ? 1 : 0;
      if (Math.abs(cutT - ct) > 1e-3) {
        cutT = lerp(cutT, ct, 0.08);
        if (Math.abs(cutT - ct) < 2e-3) {
          cutT = ct;
          if (!cut) applyCut();
        }
        placeSlice();
        busy = true;
      }
      // day and evening
      if (Math.abs(night - nightTo) > 1e-3) {
        night = lerp(night, nightTo, 0.07);
        if (Math.abs(night - nightTo) < 2e-3) night = nightTo;
        busy = true;
      }
      hemi.intensity = lerp(0.55, 0.08, night);
      key.intensity = lerp(2.2, 0.7, night);
      key.color.setHex(0xfff4ea).lerp(C_WARM, night);
      rim.intensity = lerp(0.7, 1.3, night);
      rim.color.setHex(0xffe2e8).lerp(C_DUSK, night);
      renderer.toneMappingExposure = lerp(1.05, 0.62, night);
      blob.material.opacity = lerp(0.55, 0.75, night);
      const flames = cake ? cake.flames : [];
      // candles flicker; blown out they smoke for a moment and light again
      const lit = blownAt && now - blownAt < 3600 ? 0 : 1;
      flames.forEach((f) => {
        f.lit = lerp(f.lit ?? 1, lit, lit ? 0.06 : 0.35);
        const s = 1 + Math.sin(now * 0.018 + f.ph) * 0.08 + Math.sin(now * 0.041 + f.ph * 2) * 0.05;
        f.flame.scale.set(f.lit, s * f.lit, f.lit);
        f.flame.visible = f.lit > 0.02;
        f.glow.material.opacity = (0.75 + (s - 1) * 2) * f.lit * (1 + night * 0.4);
        f.glow.scale.setScalar(0.16 * (1 + night * 0.9));
      });
      if (flames.light) flames.light.intensity = (0.35 + night * 1.6) * (flames[0]?.lit ?? 1);
      if (flames.length) busy = true;
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        const k = (now - p.t0) / 2200;
        if (k >= 1) { scene.remove(p.s); p.s.material.dispose(); smoke.splice(i, 1); continue; }
        p.s.position.set(p.x + Math.sin(k * 6 + p.ph) * 0.03 * k, p.y + k * 0.5, p.z);
        p.s.scale.setScalar(0.05 + k * 0.22);
        p.s.material.opacity = Math.max(0, k < 0.1 ? k * 8 : (1 - k)) * 0.8;
        busy = true;
      }
      // butterflies: the resting ones open and close their wings, the others circle the cake
      if (cake && cake.flyers.length) {
        cake.flyers.forEach((f) => {
          if (f.rest) {
            const fl = 0.55 + Math.sin(now * 0.0028 + f.ph) * 0.35;
            f.wl.rotation.z = fl;
            f.wr.rotation.z = -fl;
            f.b.position.set(f.x, f.yy + 0.006, f.z);
            f.b.rotation.y = f.ph;
          } else {
            const a = f.ang + now * 0.00042 * f.sp;
            const fl = Math.sin(now * 0.028 + f.ph) * 0.95;
            f.wl.rotation.z = fl;
            f.wr.rotation.z = -fl;
            f.b.position.set(Math.cos(a) * f.r, f.y + Math.sin(now * 0.0021 + f.ph) * 0.09, Math.sin(a) * f.r);
            f.b.rotation.set(Math.sin(now * 0.003 + f.ph) * 0.2, -a, Math.sin(now * 0.002) * 0.25);
          }
        });
        busy = true;
      }
      // the slice lines on the top
      if (cake) {
        const to = portions > 0 && cake.tiers === 1 ? 1 : 0;
        if (Math.abs(portionsT - to) > 1e-3) {
          portionsT = lerp(portionsT, to, 0.12);
          if (Math.abs(portionsT - to) < 4e-3) portionsT = to;
          busy = true;
        }
        cake.cutLines.material.opacity = portionsT;
        cake.cutLines.visible = portionsT > 0.01;
      }
      placeCamera();
      turn.updateMatrixWorld(true);
      clips.forEach((c) => c.plane.copy(c.local).applyMatrix4(c.obj.matrixWorld));
      renderer.render(scene, camera);
      if (busy && visible) kick();
    }
    function kick() {
      if (running || !visible) return;
      running = true;
      requestAnimationFrame(loop);
    }
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(host);

    /* ── turning it by hand ── */
    const cv = renderer.domElement;
    cv.style.touchAction = "pan-y";
    let moved = 0, px = [];
    cv.addEventListener("pointerdown", (e) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      px = [[e.clientX, performance.now()]];
      yawVel = 0;
      idleAt = performance.now();
      cv.setPointerCapture?.(e.pointerId);
      host.classList.add("is-grab");
      kick();
    });
    cv.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      yaw += dx * 0.011;
      if (e.pointerType === "mouse") pitchTo = clamp(pitchTo + dy * 0.006, 0.02, 1.48);
      px.push([e.clientX, performance.now()]);
      if (px.length > 5) px.shift();
      idleAt = performance.now();
      host.dispatchEvent(new CustomEvent("cake:turn"));
      kick();
    });
    const up = () => {
      if (!dragging) return;
      dragging = false;
      host.classList.remove("is-grab");
      if (px.length > 1) {
        const [a, b] = [px[0], px[px.length - 1]];
        const dtm = Math.max(16, b[1] - a[1]);
        yawVel = clamp(((b[0] - a[0]) / dtm) * 16.67 * 0.011, -0.35, 0.35);
      }
      idleAt = performance.now();
      kick();
    };
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    host.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: [-0.3, 0], ArrowRight: [0.3, 0], ArrowUp: [0, 0.18], ArrowDown: [0, -0.18] }[e.key];
      if (!k) return;
      e.preventDefault();
      idleAt = performance.now();
      if (k[0]) tweenYaw(yaw + k[0], 380);
      if (k[1]) pitchTo = clamp(pitchTo + k[1], 0.02, 1.48);
      kick();
    });
    function tweenYaw(to, dur = 900) {
      const from = yaw;
      yawVel = 0;
      tween(dur, (t) => { yaw = lerp(from, to, t); idleAt = performance.now(); }, ease.inOut);
    }

    return {
      update,
      setCut(on) {
        if (on === cut) return;
        cut = on;
        if (on) {
          applyCut();
          // turn the cut towards the camera, a little to the side so both faces show
          const base = Math.round((yaw + 0.62) / TAU) * TAU - 0.62;
          if (!reduce()) tweenYaw(base, 900); else yaw = base;
          pitchTo = Math.max(pitchTo, 0.36);
        }
        idleAt = performance.now();
        kick();
      },
      view(kind) {
        pitchTo = kind === "top" ? 1.42 : 0.42;
        idleAt = performance.now();
        kick();
        return pitchTo;
      },
      zoom(dir) {
        zoomTo = clamp(+(zoomTo + dir * 0.15).toFixed(2), 0.7, 1.6);
        kick();
        return zoomTo;
      },
      spin() {
        if (reduce()) return;
        tweenYaw(yaw + TAU, 1400);
      },
      hop() {
        if (!cake || reduce()) return;
        const g = cake.group;
        tween(900, (t) => { g.position.y = Math.sin(t * Math.PI) * 0.35 * (1 - t * 0.3); }, (t) => t);
        tweenYaw(yaw + TAU, 1100);
      },
      setMood(kind) {
        nightTo = kind === "night" ? 1 : 0;
        if (reduce()) night = nightTo;
        kick();
      },
      // blow the candles out: smoke rises from every wick; false when there are none
      blow() {
        if (!cake || !cake.flames.length) return false;
        const now = performance.now();
        if (blownAt && now - blownAt < 3600) return true;
        blownAt = now;
        cake.flames.forEach((f, i) => {
          const v = new THREE.Vector3();
          f.flame.getWorldPosition(v);
          for (let k = 0; k < 3; k++) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, transparent: true, depthWrite: false, opacity: 0 }));
            scene.add(s);
            smoke.push({ s, x: v.x, y: v.y + 0.02, z: v.z, t0: now + k * 260 + i * 60, ph: R0() * TAU });
          }
        });
        kick();
        return true;
      },
      // the inscription grows or shrinks live while a slider is dragged; the next update() lays the toppings round it
      setTextSize(k) {
        if (!cake) return;
        cake.text.scale.setScalar(cake.textBase * k);
        kick();
      },
      setPortions(n) {
        portions = Math.max(0, Math.min(64, n | 0));
        paintPortions();
      },
      snapshot(opts = {}) {
        if (opts.clear === false) {
          placeCamera();
          renderer.render(scene, camera);
          return renderer.domElement.toDataURL("image/png");
        }
        renderer.setClearColor(0xfbf7f5, 1);
        placeCamera();
        renderer.render(scene, camera);
        const url = renderer.domElement.toDataURL("image/png");
        renderer.setClearColor(0x000000, 0);
        renderer.render(scene, camera);
        return url;
      },
      get canvas() { return cv; },
    };
  }

  window.MaridayCake3D = { create };
})();
