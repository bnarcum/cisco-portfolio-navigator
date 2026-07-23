/**
 * Design Studio Walk — 3D floor built only from diagram node + link positions
 */
(function () {
  "use strict";

  const WOOL = {
    cat6: 0xc2a060, cat6a: 0xd4b878, hdmi: 0x3eb489, usb: 0x44bb88,
    "fiber-sm": 0x5ca8e8, "fiber-mm": 0x6eb8ff, speaker: 0xb888e8, control: 0xd8a0ff,
    default: 0x9aa0a8
  };

  const ZONE_PAD = {
    rack: 0x4ab8d8, ceiling: 0x9b7bd4, display: 0x5a9e3a, table: 0xc8a060,
    wall: 0x7a8a9a, default: 0x6a8a72
  };

  function makePixelTexture(THREE, drawFn, size = 16) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    drawFn(canvas.getContext("2d"), size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function grassTop(THREE) {
    return makePixelTexture(THREE, (ctx, s) => {
      ctx.fillStyle = "#5a9e3a";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = i % 2 ? "#4d8f32" : "#6bb048";
        ctx.fillRect((Math.random() * s) | 0, (Math.random() * s) | 0, 1, 1);
      }
    });
  }

  function blockMat(THREE, tex, color) {
    return new THREE.MeshLambertMaterial({ map: tex || null, color: color ?? 0xffffff });
  }

  function woolMat(THREE, media) {
    return blockMat(THREE, null, WOOL[media] || WOOL.default);
  }

  /** Flat painted strip along one diagram link (exact from → to). */
  function addLinkPath(THREE, scene, ax, az, bx, bz, mat, width = 1.5) {
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz) || 0.1;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.06, width),
      mat
    );
    mesh.position.set((ax + bx) / 2, 0.04, (az + bz) / 2);
    mesh.rotation.y = Math.atan2(dx, dz);
    scene.add(mesh);
    return mesh;
  }

  /**
   * Floor + link strips + device pads — positions come from diagram layout only.
   * No corner pillars or decorative geometry.
   */
  function addDiagramWorld(THREE, scene, bounds, graph, disposables) {
    const grass = grassTop(THREE);
    disposables.push(grass);

    const pad = 6;
    const w = Math.max(bounds.maxX - bounds.minX + pad * 2, 16);
    const d = Math.max(bounds.maxZ - bounds.minZ + pad * 2, 16);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.5, d),
      blockMat(THREE, grass)
    );
    floor.position.set(cx, -0.25, cz);
    scene.add(floor);

    // Link routes are drawn by walk.js makeCableRun (clean glowing lanes with
    // traveling packets), so the world only provides the floor + device pads.
    (graph?.chambers || []).forEach(ch => {
      const px = ch.pos.x, pz = ch.pos.z;
      if (!Number.isFinite(px) || !Number.isFinite(pz)) return;
      const accent = ZONE_PAD[ch.zone] || ZONE_PAD.default;
      const padMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.08, 28),
        blockMat(THREE, null, accent)
      );
      padMesh.position.set(px, 0.05, pz);
      scene.add(padMesh);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.07, 8, 28),
        blockMat(THREE, null, accent)
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.set(px, 0.12, pz);
      scene.add(rim);
    });
  }

  function setBlockSky(THREE, scene) {
    const tex = makePixelTexture(THREE, (ctx, s) => {
      for (let y = 0; y < s; y++) {
        const t = y / s;
        ctx.fillStyle = `rgb(${80 + t * 40 | 0},${160 + t * 60 | 0},${255 - t * 20 | 0})`;
        ctx.fillRect(0, y, s, 1);
      }
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 5; i++) {
        const cx = 3 + i * 3;
        ctx.fillRect(cx, 3 + (i % 2), 3, 1);
      }
    }, 32);
    scene.background = tex;
    scene.fog = new THREE.Fog(0x9ec8f0, 48, 110);
    return tex;
  }

  const DEFAULT_AVATAR_CONFIG = Object.freeze({
    skin: "#d8aa78",
    hair: "#43301f",
    hairStyle: "cap",
    shirt: "#1289b0",
    pants: "#2d3748",
    shoes: "#191f2b",
    face: "friendly",
    badge: true
  });

  const AVATAR_PRESETS = Object.freeze([
    { id: "engineer", label: "Field Engineer", config: { ...DEFAULT_AVATAR_CONFIG } },
    { id: "customer", label: "Customer", config: { skin: "#c68642", hair: "#1a1208", hairStyle: "short", shirt: "#4a5568", pants: "#1a202c", shoes: "#111827", face: "smile", badge: false } },
    { id: "executive", label: "Executive", config: { skin: "#e0b890", hair: "#2c1810", hairStyle: "short", shirt: "#1e293b", pants: "#0f172a", shoes: "#020617", face: "neutral", badge: true } },
    { id: "night", label: "Night Ops", config: { skin: "#8d5524", hair: "#0a0a0a", hairStyle: "cap", shirt: "#14532d", pants: "#111827", shoes: "#000000", face: "friendly", badge: false } }
  ]);

  function hexColor(v, fallback) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const s = String(v || "").trim().replace(/^#/, "");
    if (!/^[0-9a-f]{6}$/i.test(s)) return fallback;
    return parseInt(s, 16);
  }

  function hexInput(v, fallback = "#000000") {
    const n = hexColor(v, null);
    if (n == null) return fallback;
    return "#" + n.toString(16).padStart(6, "0");
  }

  function normalizeAvatarConfig(input) {
    const base = { ...DEFAULT_AVATAR_CONFIG };
    if (input && typeof input === "object") {
      if (input.skin) base.skin = hexInput(input.skin, base.skin);
      if (input.hair) base.hair = hexInput(input.hair, base.hair);
      if (input.shirt) base.shirt = hexInput(input.shirt, base.shirt);
      if (input.pants) base.pants = hexInput(input.pants, base.pants);
      if (input.shoes) base.shoes = hexInput(input.shoes, base.shoes);
      if (["cap", "short", "bald"].includes(input.hairStyle)) base.hairStyle = input.hairStyle;
      if (["friendly", "smile", "neutral"].includes(input.face)) base.face = input.face;
      if (typeof input.badge === "boolean") base.badge = input.badge;
    }
    return base;
  }

  /** Front-facing head texture: simple voxel face variants. */
  function avatarFaceTex(THREE, faceId = "friendly", skinHex = "#d8aa78") {
    return makePixelTexture(THREE, (ctx, s) => {
      ctx.fillStyle = hexInput(skinHex, "#d8aa78");
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = "#c79566";
      ctx.fillRect(0, 0, s, 3);
      if (faceId === "neutral") {
        ctx.fillStyle = "#2b3a4a";
        ctx.fillRect(5, 7, 2, 2);
        ctx.fillRect(9, 7, 2, 2);
        ctx.fillStyle = "#6a4f38";
        ctx.fillRect(6, 11, 4, 1);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(4, 7, 3, 2);
      ctx.fillRect(9, 7, 3, 2);
      ctx.fillStyle = "#2b3a4a";
      ctx.fillRect(5, 7, 2, 2);
      ctx.fillRect(10, 7, 2, 2);
      ctx.fillStyle = "#6a4f38";
      ctx.fillRect(4, 5, 3, 1);
      ctx.fillRect(9, 5, 3, 1);
      ctx.fillStyle = faceId === "smile" ? "#8b4513" : "#a06a4e";
      if (faceId === "smile") {
        ctx.fillRect(5, 11, 6, 1);
        ctx.fillRect(4, 10, 1, 1);
        ctx.fillRect(11, 10, 1, 1);
      } else {
        ctx.fillRect(6, 11, 4, 1);
      }
    }, 16);
  }

  function part(THREE, w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  }

  function pivotGroup(THREE, x, y, z) {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    return p;
  }

  /**
   * Polished voxel "field engineer" — head with a face, hair, collared Cisco-blue
   * shirt with a lanyard badge, sleeves with hands, and pants with shoes. Limbs hang
   * off shoulder/hip pivots so walk.js can drive a natural walk cycle. Group origin
   * sits at the feet; eyes land near EYE_HEIGHT (1.62) for a clean 1st/3rd swap.
   */
  function addHair(THREE, head, hairMat, style) {
    if (style === "bald") return;
    head.add(part(THREE, 0.8, 0.26, 0.82, hairMat, 0, 0.3, 0));
    if (style === "short") return;
    head.add(part(THREE, 0.8, 0.46, 0.16, hairMat, 0, 0.02, -0.33));
    head.add(part(THREE, 0.18, 0.16, 0.1, hairMat, -0.28, 0.18, 0.3));
    head.add(part(THREE, 0.18, 0.16, 0.1, hairMat, 0.28, 0.18, 0.3));
  }

  function makeAvatar(THREE, config) {
    const cfg = normalizeAvatarConfig(config);
    const g = new THREE.Group();
    g.userData.kind = "avatar";
    g.userData.avatarConfig = cfg;

    const skin = blockMat(THREE, null, hexColor(cfg.skin, 0xd8aa78));
    const shirtCol = hexColor(cfg.shirt, 0x1289b0);
    const shirt = blockMat(THREE, null, shirtCol);
    const shirtDark = blockMat(THREE, null, ((shirtCol >> 1) & 0x7f7f7f));
    const pants = blockMat(THREE, null, hexColor(cfg.pants, 0x2d3748));
    const shoe = blockMat(THREE, null, hexColor(cfg.shoes, 0x191f2b));
    const hair = blockMat(THREE, null, hexColor(cfg.hair, 0x43301f));
    const strap = blockMat(THREE, null, 0x161b24);
    const badge = blockMat(THREE, null, 0x00bceb);
    const faceTex = avatarFaceTex(THREE, cfg.face, cfg.skin);
    const faceMat = blockMat(THREE, faceTex);

    // Head: face texture on the front (+Z) face only.
    const headMats = [skin, skin, skin, skin, faceMat, skin];
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.74, 0.74), headMats);
    head.position.y = 1.62;
    head.castShadow = true;
    addHair(THREE, head, hair, cfg.hairStyle);
    g.add(head);

    // Torso with collar, belt, optional lanyard + badge.
    const torso = part(THREE, 0.86, 0.92, 0.44, shirt, 0, 0.86, 0);
    torso.add(part(THREE, 0.86, 0.12, 0.46, shirtDark, 0, 0.4, 0));
    torso.add(part(THREE, 0.9, 0.12, 0.48, strap, 0, -0.46, 0));
    if (cfg.badge) {
      torso.add(part(THREE, 0.06, 0.5, 0.02, strap, 0.06, 0.16, 0.23));
      torso.add(part(THREE, 0.2, 0.26, 0.05, strap, 0.06, -0.12, 0.24));
      torso.add(part(THREE, 0.15, 0.2, 0.07, badge, 0.06, -0.12, 0.25));
    }
    g.add(torso);

    // Legs on hip pivots (pivot at hip height; mesh hangs below).
    const hipL = pivotGroup(THREE, -0.2, 0.82, 0);
    hipL.add(part(THREE, 0.34, 0.64, 0.34, pants, 0, -0.32, 0));
    hipL.add(part(THREE, 0.36, 0.16, 0.48, shoe, 0, -0.66, 0.06));
    g.add(hipL);
    const hipR = pivotGroup(THREE, 0.2, 0.82, 0);
    hipR.add(part(THREE, 0.34, 0.64, 0.34, pants, 0, -0.32, 0));
    hipR.add(part(THREE, 0.36, 0.16, 0.48, shoe, 0, -0.66, 0.06));
    g.add(hipR);

    // Arms on shoulder pivots, with skin hands at the cuffs.
    const shoulderL = pivotGroup(THREE, -0.56, 1.28, 0);
    shoulderL.add(part(THREE, 0.3, 0.6, 0.3, shirt, 0, -0.32, 0));
    shoulderL.add(part(THREE, 0.3, 0.18, 0.3, skin, 0, -0.7, 0));
    g.add(shoulderL);
    const shoulderR = pivotGroup(THREE, 0.56, 1.28, 0);
    shoulderR.add(part(THREE, 0.3, 0.6, 0.3, shirt, 0, -0.32, 0));
    shoulderR.add(part(THREE, 0.3, 0.18, 0.3, skin, 0, -0.7, 0));
    g.add(shoulderR);

    g.userData.parts = { head, torso, legL: hipL, legR: hipR, armL: shoulderL, armR: shoulderR };
    return g;
  }

  function makeBlockViewmodel(THREE, camera, config) {
    const cfg = normalizeAvatarConfig(config);
    const g = new THREE.Group();
    g.userData.kind = "viewmodel";
    const skin = blockMat(THREE, null, hexColor(cfg.skin, 0xd4a574));
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), skin);
    arm.position.set(0.28, -0.2, -0.45);
    g.add(arm);
    const item = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.18), blockMat(THREE, null, hexColor(cfg.shirt, 0x02c8ff)));
    item.position.set(0.12, -0.05, -0.55);
    g.add(item);
    camera.add(g);
    return g;
  }

  window.__DS_WALK_VOXEL = {
    WOOL, woolMat, addDiagramWorld, setBlockSky,
    DEFAULT_AVATAR_CONFIG, AVATAR_PRESETS, normalizeAvatarConfig,
    makeAvatar, makeBlockViewmodel
  };
})();
