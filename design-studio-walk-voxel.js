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
    badge: true,
    badgeColor: "#00bceb",
    lanyardColor: "#161b24",
    eyeColor: "#2b3a4a",
    glasses: false,
    glassesColor: "#1a202c",
    headAccessory: "none",
    height: 1
  });

  /** Outfit themes only — presets never include skin (applied separately in walk.js). */
  const AVATAR_PRESETS = Object.freeze([
    { id: "classic", label: "Classic", config: { hair: "#43301f", hairStyle: "cap", shirt: "#1289b0", pants: "#2d3748", shoes: "#191f2b", face: "friendly", badge: true, badgeColor: "#00bceb", lanyardColor: "#161b24", eyeColor: "#2b3a4a", glasses: false, headAccessory: "none", height: 1 } },
    { id: "cisco-blue", label: "Cisco Blue", config: { hair: "#1a1208", hairStyle: "cap", shirt: "#049fd9", pants: "#1e293b", shoes: "#0f172a", face: "friendly", badge: true, badgeColor: "#00bceb", lanyardColor: "#0b3044", eyeColor: "#1e3a5f", glasses: false, headAccessory: "headset", height: 1 } },
    { id: "business", label: "Business", config: { hair: "#2c1810", hairStyle: "short", shirt: "#1e293b", pants: "#0f172a", shoes: "#020617", face: "neutral", badge: true, badgeColor: "#64748b", lanyardColor: "#111827", eyeColor: "#334155", glasses: true, glassesColor: "#0f172a", headAccessory: "none", height: 1.02 } },
    { id: "night", label: "Night Ops", config: { hair: "#0a0a0a", hairStyle: "cap", shirt: "#14532d", pants: "#111827", shoes: "#000000", face: "friendly", badge: false, badgeColor: "#22c55e", lanyardColor: "#0a0f0a", eyeColor: "#4ade80", glasses: false, headAccessory: "hardhat", height: 0.98 } }
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
      if (input.badgeColor) base.badgeColor = hexInput(input.badgeColor, base.badgeColor);
      if (input.lanyardColor) base.lanyardColor = hexInput(input.lanyardColor, base.lanyardColor);
      if (input.eyeColor) base.eyeColor = hexInput(input.eyeColor, base.eyeColor);
      if (input.glassesColor) base.glassesColor = hexInput(input.glassesColor, base.glassesColor);
      if (["cap", "short", "bald"].includes(input.hairStyle)) base.hairStyle = input.hairStyle;
      if (["friendly", "smile", "neutral"].includes(input.face)) base.face = input.face;
      if (["none", "headset", "hardhat"].includes(input.headAccessory)) base.headAccessory = input.headAccessory;
      if (typeof input.badge === "boolean") base.badge = input.badge;
      if (typeof input.glasses === "boolean") base.glasses = input.glasses;
      if (input.height != null) {
        const h = Number(input.height);
        if (Number.isFinite(h)) base.height = Math.min(1.08, Math.max(0.92, h));
      }
    }
    return base;
  }

  function randomizeOutfit(baseConfig) {
    const skin = (baseConfig && baseConfig.skin) || DEFAULT_AVATAR_CONFIG.skin;
    const pick = arr => arr[(Math.random() * arr.length) | 0];
    const randHex = () => "#" + ((Math.random() * 0xffffff) | 0).toString(16).padStart(6, "0");
    return normalizeAvatarConfig({
      skin,
      hair: randHex(),
      shirt: randHex(),
      pants: randHex(),
      shoes: randHex(),
      badgeColor: randHex(),
      lanyardColor: randHex(),
      eyeColor: randHex(),
      glassesColor: randHex(),
      hairStyle: pick(["cap", "short", "bald"]),
      face: pick(["friendly", "smile", "neutral"]),
      badge: Math.random() > 0.35,
      glasses: Math.random() > 0.55,
      headAccessory: pick(["none", "none", "headset", "hardhat"]),
      height: 0.92 + Math.random() * 0.16
    });
  }

  /** Front-facing head texture: simple voxel face variants. */
  function avatarFaceTex(THREE, faceId = "friendly", skinHex = "#d8aa78", eyeHex = "#2b3a4a") {
    const eye = hexInput(eyeHex, "#2b3a4a");
    return makePixelTexture(THREE, (ctx, s) => {
      ctx.fillStyle = hexInput(skinHex, "#d8aa78");
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = "#c79566";
      ctx.fillRect(0, 0, s, 3);
      if (faceId === "neutral") {
        ctx.fillStyle = eye;
        ctx.fillRect(5, 7, 2, 2);
        ctx.fillRect(9, 7, 2, 2);
        ctx.fillStyle = "#6a4f38";
        ctx.fillRect(6, 11, 4, 1);
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(4, 7, 3, 2);
      ctx.fillRect(9, 7, 3, 2);
      ctx.fillStyle = eye;
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

  function addGlasses(THREE, head, frameMat) {
    const lensMat = blockMat(THREE, null, 0x9ecae8);
    const y = -0.04;
    const z = 0.39;
    head.add(part(THREE, 0.18, 0.14, 0.04, frameMat, -0.2, y, z));
    head.add(part(THREE, 0.12, 0.1, 0.02, lensMat, -0.2, y, z + 0.015));
    head.add(part(THREE, 0.18, 0.14, 0.04, frameMat, 0.2, y, z));
    head.add(part(THREE, 0.12, 0.1, 0.02, lensMat, 0.2, y, z + 0.015));
    head.add(part(THREE, 0.08, 0.03, 0.03, frameMat, 0, y + 0.02, z));
    head.add(part(THREE, 0.24, 0.04, 0.05, frameMat, -0.36, y + 0.02, 0.1));
    head.add(part(THREE, 0.24, 0.04, 0.05, frameMat, 0.36, y + 0.02, 0.1));
  }

  function addHeadAccessory(THREE, head, acc, mats) {
    if (acc === "headset") {
      head.add(part(THREE, 0.82, 0.08, 0.12, mats.strap, 0, 0.34, -0.28));
      head.add(part(THREE, 0.12, 0.22, 0.14, mats.strap, -0.38, 0.02, 0.08));
      head.add(part(THREE, 0.12, 0.22, 0.14, mats.strap, 0.38, 0.02, 0.08));
      head.add(part(THREE, 0.08, 0.08, 0.06, mats.badge, -0.38, -0.06, 0.1));
      head.add(part(THREE, 0.08, 0.08, 0.06, mats.badge, 0.38, -0.06, 0.1));
      return;
    }
    if (acc === "hardhat") {
      head.add(part(THREE, 0.92, 0.18, 0.92, mats.hat, 0, 0.42, 0));
      head.add(part(THREE, 0.98, 0.06, 0.98, mats.hatBrim, 0, 0.34, 0));
    }
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
    const strap = blockMat(THREE, null, hexColor(cfg.lanyardColor, 0x161b24));
    const badge = blockMat(THREE, null, hexColor(cfg.badgeColor, 0x00bceb));
    const glassesMat = blockMat(THREE, null, hexColor(cfg.glassesColor, 0x1a202c));
    const faceTex = avatarFaceTex(THREE, cfg.face, cfg.skin, cfg.eyeColor);
    const faceMat = blockMat(THREE, faceTex);

    // Head: face texture on the front (+Z) face only.
    const headMats = [skin, skin, skin, skin, faceMat, skin];
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.74, 0.74), headMats);
    head.position.y = 1.62;
    head.castShadow = true;
    addHair(THREE, head, hair, cfg.hairStyle);
    if (cfg.glasses) addGlasses(THREE, head, glassesMat);
    addHeadAccessory(THREE, head, cfg.headAccessory, {
      strap: blockMat(THREE, null, hexColor(cfg.lanyardColor, 0x161b24)),
      badge: blockMat(THREE, null, hexColor(cfg.badgeColor, 0x00bceb)),
      hat: blockMat(THREE, null, 0xfacc15),
      hatBrim: blockMat(THREE, null, 0xeab308)
    });
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
    g.scale.setScalar(cfg.height);
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
    DEFAULT_AVATAR_CONFIG, AVATAR_PRESETS, normalizeAvatarConfig, randomizeOutfit,
    makeAvatar, makeBlockViewmodel
  };
})();
