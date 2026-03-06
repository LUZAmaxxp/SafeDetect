import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ZONE_BASES = {
  front: [0,  0, -5.5],
  rear:  [0,  0,  5.5],
  left:  [-3.6, 0, 0],
  right: [ 3.6, 0, 0],
};

const ZONE_DEFS = {
  rear:  { size: [4.2, 0.02, 3.8], pos: [0, 0.02,  5.4], blind: true },
  front: { size: [4.0, 0.02, 3.0], pos: [0, 0.02, -5.4], blind: false },
  left:  { size: [3.0, 0.02, 7.5], pos: [-3.5, 0.02, 0], blind: true },
  right: { size: [3.0, 0.02, 7.5], pos: [ 3.5, 0.02, 0], blind: true },
};

const CAMERA_PRESETS = {
  default: { theta: 0.6,  phi: 1.0,  radius: 18 },
  rear:    { theta: 3.34, phi: 0.8,  radius: 15 },
  left:    { theta: 4.71, phi: 0.85, radius: 14 },
  right:   { theta: 1.57, phi: 0.85, radius: 14 },
};

// Material shorthand
const M = (hex, rough = 0.55, met = 0.45) =>
  new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: met });

function buildTruck() {
  const group = new THREE.Group();
  const add = (geo, mat, x, y, z) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Frame rails
  [-0.85, 0.85].forEach(x => add(new THREE.BoxGeometry(0.12, 0.18, 7.8), M(0x141414), x, 0.27, 0));
  // Cross members
  [[-2.4], [-0.5], [1.5], [3.0]].forEach(([z]) =>
    add(new THREE.BoxGeometry(2.2, 0.12, 0.18), M(0x141414), 0, 0.27, z)
  );

  // Chassis
  add(new THREE.BoxGeometry(2.3, 0.3, 7.8), M(0x1a1a1a, 0.8, 0.45), 0, 0.52, 0);

  // Cargo bed
  add(new THREE.BoxGeometry(2.1, 0.07, 4.0), M(0x1d1d1d, 0.85, 0.35), 0, 0.73, 1.7);
  [-1.06, 1.06].forEach(x => add(new THREE.BoxGeometry(0.07, 0.5, 4.0), M(0x1a1a1a, 0.9, 0.3), x, 1.0, 1.7));
  add(new THREE.BoxGeometry(2.1, 0.5, 0.07), M(0x1a1a1a, 0.9, 0.3), 0, 1.0, -0.3);
  add(new THREE.BoxGeometry(2.1, 0.42, 0.07), M(0x1a1a1a, 0.9, 0.3), 0, 0.96, 3.71);
  // Cargo ribs
  for (let i = 0; i < 5; i++)
    add(new THREE.BoxGeometry(2.1, 0.06, 0.06), M(0x252525, 0.9, 0.3), 0, 0.77, -0.05 + i * 0.85);

  // Cab body
  add(new THREE.BoxGeometry(2.2, 1.3, 2.3), M(0x282828, 0.5, 0.5), 0, 1.47, -2.45);
  // Cab roof
  add(new THREE.BoxGeometry(2.18, 0.07, 2.28), M(0x222222, 0.65, 0.4), 0, 2.15, -2.45);
  // Visor
  add(new THREE.BoxGeometry(2.2, 0.12, 0.09), M(0x111111, 0.9, 0.4), 0, 2.1, -1.32);
  // Windshield
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0a1420, roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.75 });
  add(new THREE.BoxGeometry(1.9, 0.88, 0.06), glassMat, 0, 1.65, -1.32);
  // Windshield divider
  add(new THREE.BoxGeometry(0.04, 0.88, 0.08), M(0x1a1a1a), 0, 1.65, -1.3);
  // Rear window
  add(new THREE.BoxGeometry(1.7, 0.5, 0.06), glassMat, 0, 1.72, -3.6);
  // Side windows
  [-1.11, 1.11].forEach(x => add(new THREE.BoxGeometry(0.06, 0.48, 1.4), glassMat, x, 1.72, -2.35));
  // Door seams
  [-1.12, 1.12].forEach(x => add(new THREE.BoxGeometry(0.03, 0.85, 0.03), M(0x111111, 1, 0.1), x, 1.25, -2.6));

  // Grille
  add(new THREE.BoxGeometry(1.9, 0.55, 0.09), M(0x101010, 0.9, 0.6), 0, 0.98, -3.62);
  for (let i = 0; i < 9; i++)
    add(new THREE.BoxGeometry(0.055, 0.52, 0.14), M(0x2a2a2a, 0.9, 0.8), -0.88 + i * 0.22, 0.98, -3.61);

  // Headlights & DRLs
  const headMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x999999, emissiveIntensity: 0.35 });
  const drlMat  = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xaaaaaa, emissiveIntensity: 0.5  });
  [-0.68, 0.68].forEach(x => {
    add(new THREE.BoxGeometry(0.38, 0.2,  0.09), headMat, x, 1.0,  -3.63);
    add(new THREE.BoxGeometry(0.38, 0.05, 0.09), drlMat,  x, 1.14, -3.63);
  });

  // Taillights
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x880000, emissive: 0x550000, emissiveIntensity: 0.6 });
  [-0.76, 0.76].forEach(x => add(new THREE.BoxGeometry(0.28, 0.18, 0.07), tailMat, x, 0.98, 3.67));

  // Bumpers
  add(new THREE.BoxGeometry(2.4, 0.26, 0.22), M(0x181818, 0.8, 0.6), 0, 0.68, -3.72);
  add(new THREE.BoxGeometry(2.4, 0.22, 0.20), M(0x181818, 0.8, 0.6), 0, 0.64,  3.76);

  // Side mirrors
  [-1.34, 1.34].forEach(x => {
    add(new THREE.BoxGeometry(0.1, 0.22, 0.35), M(0x202020, 0.6, 0.5), x, 1.92, -1.95);
    add(new THREE.BoxGeometry(0.06, 0.09, 0.3), M(0x1a1a1a, 0.7, 0.4), x > 0 ? 1.26 : -1.26, 1.92, -1.95);
  });

  // Exhaust stacks
  [-0.88, 0.88].forEach(x => {
    add(new THREE.CylinderGeometry(0.055, 0.07, 0.85, 10), M(0x1c1c1c, 0.8, 0.7), x, 2.5,  -2.7);
    add(new THREE.CylinderGeometry(0.08, 0.055, 0.05, 10), M(0x2a2a2a, 0.7, 0.8), x, 2.97, -2.7);
  });

  // Fuel tank
  const fuelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.2, 12), M(0x1e1e1e, 0.7, 0.5));
  fuelMesh.rotation.z = Math.PI / 2;
  fuelMesh.position.set(-1.22, 0.55, -0.3);
  group.add(fuelMesh);

  // Wheels
  const wheelPositions = [
    [-1.3, 0.44, -2.65], [1.3, 0.44, -2.65],
    [-1.3, 0.44,  1.45], [1.3, 0.44,  1.45],
    [-1.3, 0.44,  2.65], [1.3, 0.44,  2.65],
  ];
  wheelPositions.forEach(([wx, wy, wz]) => {
    const wg = new THREE.Group();
    wg.position.set(wx, wy, wz);

    const addW = (geo, mat, ox = 0, oy = 0, oz = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(ox, oy, oz);
      m.rotation.z = Math.PI / 2;
      m.castShadow = true;
      wg.add(m);
    };

    addW(new THREE.CylinderGeometry(0.44, 0.44, 0.30, 24), M(0x0e0e0e, 0.95, 0.1));
    addW(new THREE.CylinderGeometry(0.30, 0.30, 0.32, 24), M(0x181818, 0.95, 0.2));
    addW(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 18), M(0x1f1f1f, 0.8,  0.5));
    addW(new THREE.CylinderGeometry(0.12, 0.12, 0.34,  8), M(0x333333, 0.6,  0.9));

    // Lug nuts
    for (let n = 0; n < 6; n++) {
      const angle = (n / 6) * Math.PI * 2;
      const lug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.035, 6),
        M(0x444444, 0.7, 0.9)
      );
      lug.rotation.z = Math.PI / 2;
      const outerOffset = (wx < 0 ? -0.17 : 0.17);
      lug.position.set(outerOffset, Math.sin(angle) * 0.09, Math.cos(angle) * 0.09);
      wg.add(lug);
    }
    group.add(wg);
  });

  // Mud flaps
  const mudPositions = [
    [-1.16, 0.68, -2.95], [1.16, 0.68, -2.95],
    [-1.16, 0.68,  3.0 ], [1.16, 0.68,  3.0 ],
  ];
  mudPositions.forEach(([mx, my, mz]) =>
    add(new THREE.BoxGeometry(0.06, 0.45, 0.35), M(0x111111, 0.95, 0.1), mx, my, mz)
  );

  // Step bars
  [-1.16, 1.16].forEach(x =>
    add(new THREE.BoxGeometry(0.08, 0.07, 0.5), M(0x222222, 0.8, 0.7), x, 0.68, -2.45)
  );

  return group;
}

function buildZones() {
  const zoneObjects = {};
  Object.entries(ZONE_DEFS).forEach(([name, def]) => {
    const geo      = new THREE.BoxGeometry(...def.size);
    const fillMat  = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, opacity: 0, depthWrite: false });
    const fillMesh = new THREE.Mesh(geo, fillMat);
    fillMesh.position.set(...def.pos);

    const edgesGeo = new THREE.EdgesGeometry(geo);
    const edgeMat  = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.12 });
    const edges    = new THREE.LineSegments(edgesGeo, edgeMat);
    edges.position.set(...def.pos);

    zoneObjects[name] = { fillMesh, fillMat, edges, edgeMat, blind: def.blind };
  });
  return zoneObjects;
}

export default function useThreeScene(canvasRef, detections, cameraView) {
  const sceneRef    = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef   = useRef(null);
  const orbitRef    = useRef({ theta: 0.6, phi: 1.0, r: 18, drag: false, lastX: 0, lastY: 0 });
  const blipsRef    = useRef([]);
  const zoneObjRef  = useRef(null);
  const rafRef      = useRef(null);
  const clockRef    = useRef(new THREE.Clock());
  const truckRef    = useRef(null);

  // Initial scene setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setClearColor(0xf0f0f0, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf0f0f0, 0.018);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 120);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(8, 14, 6);
    sun.castShadow = true;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -12;
    sun.shadow.camera.right = sun.shadow.camera.top = 12;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-6, 6, -8);
    scene.add(fill);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({ color: 0xe4e4e4, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const grid = new THREE.GridHelper(50, 50, 0xbbbbbb, 0xcccccc);
    grid.material.transparent = true;
    grid.material.opacity = 0.8;
    scene.add(grid);

    // Zones
    const zones = buildZones();
    zoneObjRef.current = zones;
    Object.values(zones).forEach(z => { scene.add(z.fillMesh); scene.add(z.edges); });

    // Truck
    const truck = buildTruck();
    truckRef.current = truck;
    scene.add(truck);

    // Orbit controls (manual)
    const orbit = orbitRef.current;
    const onMouseDown = e => { orbit.drag = true; orbit.lastX = e.clientX; orbit.lastY = e.clientY; };
    const onMouseUp   = ()  => { orbit.drag = false; };
    const onMouseMove = e  => {
      if (!orbit.drag) return;
      orbit.theta -= (e.clientX - orbit.lastX) * 0.006;
      orbit.phi    = Math.max(0.18, Math.min(1.45, orbit.phi + (e.clientY - orbit.lastY) * 0.006));
      orbit.lastX = e.clientX;
      orbit.lastY = e.clientY;
    };
    const onWheel = e => {
      e.preventDefault();
      orbit.r = Math.max(8, Math.min(36, orbit.r + e.deltaY * 0.025));
    };
    let touchPrev = null;
    const onTouchStart = e => { touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const onTouchMove  = e => {
      if (!touchPrev) return;
      const dx = e.touches[0].clientX - touchPrev.x;
      const dy = e.touches[0].clientY - touchPrev.y;
      orbit.theta -= dx * 0.006;
      orbit.phi    = Math.max(0.18, Math.min(1.45, orbit.phi + dy * 0.006));
      touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { touchPrev = null; };

    canvas.addEventListener('mousedown',  onMouseDown);
    canvas.addEventListener('mouseup',    onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('mousemove',  onMouseMove);
    canvas.addEventListener('wheel',      onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: true });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: true });

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvas);

    // Render loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();

      // Subtle truck float
      if (truckRef.current) truckRef.current.position.y = Math.sin(t * 0.35) * 0.012;

      // Orbit camera
      const o = orbitRef.current;
      camera.position.set(
        o.r * Math.sin(o.phi) * Math.sin(o.theta),
        o.r * Math.cos(o.phi),
        o.r * Math.sin(o.phi) * Math.cos(o.theta)
      );
      camera.lookAt(0, 1.2, 0);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener('mousedown',  onMouseDown);
      canvas.removeEventListener('mouseup',    onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('mousemove',  onMouseMove);
      canvas.removeEventListener('wheel',      onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
      renderer.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate camera to preset when cameraView changes
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraView] || CAMERA_PRESETS.default;
    const orbit = orbitRef.current;
    const startTheta  = orbit.theta;
    const startPhi    = orbit.phi;
    const startR      = orbit.r;
    const targetTheta = preset.theta;
    const targetPhi   = preset.phi;
    const targetR     = preset.radius;
    const duration    = 600;
    const start       = performance.now();

    const animate = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      orbit.theta = startTheta + (targetTheta - startTheta) * ease;
      orbit.phi   = startPhi   + (targetPhi   - startPhi)   * ease;
      orbit.r     = startR     + (targetR     - startR)      * ease;
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [cameraView]);

  // Update zones + blips when detections change
  useEffect(() => {
    const scene = sceneRef.current;
    const zones = zoneObjRef.current;
    if (!scene || !zones) return;

    // Active zones
    const activeZones = new Set(detections.map(d => d.camera_zone));

    Object.entries(zones).forEach(([name, z]) => {
      const isActive = activeZones.has(name);
      if (isActive && z.blind) {
        z.fillMat.color.setHex(0xcc2222);
        z.fillMat.opacity = 0.10;
        z.edgeMat.color  = new THREE.Color(0xcc2222);
        z.edgeMat.opacity = 0.85;
      } else if (isActive) {
        z.fillMat.color.setHex(0x333333);
        z.fillMat.opacity = 0.06;
        z.edgeMat.color  = new THREE.Color(0x333333);
        z.edgeMat.opacity = 0.40;
      } else {
        z.fillMat.opacity = 0;
        z.edgeMat.opacity = z.blind ? 0.25 : 0.18;
        z.edgeMat.color  = new THREE.Color(z.blind ? 0xcc4444 : 0x999999);
      }
    });

    // Remove old blips
    blipsRef.current.forEach(m => {
      scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    blipsRef.current = [];

    // Add new blips
    detections.forEach((det, i) => {
      const base = ZONE_BASES[det.camera_zone] || ZONE_BASES.front;
      const blind = ['left', 'right', 'rear'].includes(det.camera_zone);
      const id = i + 1;
      const jx = Math.sin(id * 6.1) * 0.85;
      const jz = Math.cos(id * 3.7) * 0.65;

      const color = blind ? 0xcc2222 : 0x555555;

      // Sphere
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      sphere.position.set(base[0] + jx, 0.12, base[2] + jz);
      scene.add(sphere);
      blipsRef.current.push(sphere);

      // Ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 0.26, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(base[0] + jx, 0.01, base[2] + jz);
      scene.add(ring);
      blipsRef.current.push(ring);
    });
  }, [detections]);
}
