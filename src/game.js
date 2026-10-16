
import * as THREE from "three";

const stage = document.querySelector("#three-stage");
const fallback = document.querySelector("#stage-fallback");

if (stage) {
  let renderer;
  let animationId = null;
  let resizeObserver;
  let disposed = false;

  try {
    // SCENE
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      38,
      1,
      0.1,
      100
    );

    camera.position.set(0, 2.4, 8.5);
    camera.lookAt(0, 0.25, 0);

    // RENDERER
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "default"
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.75)
    );

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    renderer.domElement.setAttribute(
      "aria-label",
      "Visual 3D PLAYVERSE. Geser untuk memutar objek."
    );

    renderer.domElement.style.touchAction = "pan-y";

    stage.appendChild(renderer.domElement);

    // LIGHTING
    scene.add(new THREE.HemisphereLight(
      0xffffff,
      0x8b83c9,
      2.1
    ));

    const keyLight = new THREE.DirectionalLight(
      0xffffff,
      3.0
    );

    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const purpleLight = new THREE.PointLight(
      0x8870ff,
      30,
      12
    );

    purpleLight.position.set(-3, 2, 2);
    scene.add(purpleLight);

    const warmLight = new THREE.PointLight(
      0xffb77b,
      22,
      10
    );

    warmLight.position.set(3, 1, -2);
    scene.add(warmLight);

    // MATERIALS
    const whiteMaterial = new THREE.MeshStandardMaterial({
      color: 0xfaf9ff,
      roughness: 0.25,
      metalness: 0.08
    });

    const purpleMaterial = new THREE.MeshStandardMaterial({
      color: 0x7964ff,
      roughness: 0.24,
      metalness: 0.15
    });

    const blueMaterial = new THREE.MeshStandardMaterial({
      color: 0x78baff,
      roughness: 0.22,
      metalness: 0.12
    });

    const orangeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffbd7a,
      roughness: 0.26,
      metalness: 0.08
    });

    // CENTRAL HERO OBJECT
    const hero = new THREE.Group();
    scene.add(hero);

    const coreGeometry = new THREE.BoxGeometry(
      1.55,
      1.55,
      1.55,
      3,
      3,
      3
    );

    const core = new THREE.Mesh(
      coreGeometry,
      purpleMaterial
    );

    core.position.y = 0.5;
    core.rotation.set(0.25, 0.2, 0.12);
    hero.add(core);

    // Inner white frame
    const innerFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.96, 0.96),
      whiteMaterial
    );

    innerFrame.position.copy(core.position);
    innerFrame.rotation.set(0.25, 0.2, 0.12);
    hero.add(innerFrame);

    // Decorative wireframe
    const wire = new THREE.Mesh(
      new THREE.BoxGeometry(1.92, 1.92, 1.92),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.24
      })
    );

    wire.position.y = 0.5;
    wire.rotation.set(0.25, 0.2, 0.12);
    hero.add(wire);

    // FLOATING ORBS
    const orbGeometry = new THREE.IcosahedronGeometry(
      0.32,
      2
    );

    function createOrb(material, position, scale = 1) {
      const orb = new THREE.Mesh(
        orbGeometry,
        material
      );

      orb.position.set(...position);
      orb.scale.setScalar(scale);
      scene.add(orb);

      return orb;
    }

    const orbs = [
      createOrb(orangeMaterial, [2.0, 1.5, 0.1], 0.85),
      createOrb(blueMaterial, [-2.0, -0.05, 0.3], 0.65),
      createOrb(whiteMaterial, [1.9, -0.2, -0.8], 0.42),
      createOrb(purpleMaterial, [-1.4, 1.8, -0.6], 0.42)
    ];

    // FLOATING PLATFORM
    const platform = new THREE.Group();
    scene.add(platform);

    const platformBase = new THREE.Mesh(
      new THREE.CylinderGeometry(
        1.75,
        2.05,
        0.22,
        64
      ),
      new THREE.MeshStandardMaterial({
        color: 0xb5a8ff,
        roughness: 0.32,
        metalness: 0.12
      })
    );

    platformBase.position.y = -0.82;
    platform.add(platformBase);

    const platformTop = new THREE.Mesh(
      new THREE.CylinderGeometry(
        1.55,
        1.75,
        0.09,
        64
      ),
      whiteMaterial
    );

    platformTop.position.y = -0.66;
    platform.add(platformTop);

    const platformRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.035, 8, 80),
      new THREE.MeshBasicMaterial({
        color: 0x8874ff
      })
    );

    platformRing.rotation.x = Math.PI / 2;
    platformRing.position.y = -0.7;
    platform.add(platformRing);

    // ORBITING RINGS
    const rings = [];

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(
          2.45 + i * 0.15,
          0.012,
          6,
          100
        ),
        new THREE.MeshBasicMaterial({
          color: i === 1 ? 0x8caaff : 0x9e91ff,
          transparent: true,
          opacity: 0.58 - i * 0.12
        })
      );

      ring.position.y = 0.15 + i * 0.13;
      ring.rotation.set(
        0.85 + i * 0.18,
        0.2 + i * 0.4,
        0.35
      );

      scene.add(ring);
      rings.push(ring);
    }

    // PARTICLES
    const particleCount = 220;
    const particlePositions = new Float32Array(
      particleCount * 3
    );

    let seed = 12345;

    function random() {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 2.1 + random() * 3.3;

      particlePositions[i * 3] =
        Math.cos(angle) * radius;

      particlePositions[i * 3 + 1] =
        (random() - 0.5) * 4.5;

      particlePositions[i * 3 + 2] =
        Math.sin(angle) * radius * 0.6 - 0.8;
    }

    const particleGeometry = new THREE.BufferGeometry();

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.035,
        transparent: true,
        opacity: 0.72,
        sizeAttenuation: true
      })
    );

    scene.add(particles);

    // POINTER / TOUCH INTERACTION
    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let targetRotationY = 0.35;
    let targetRotationX = 0.15;
    let lastInteraction = 0;

    const canvas = renderer.domElement;

    canvas.addEventListener("pointerdown", (event) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      lastInteraction = performance.now();

      canvas.style.cursor = "grabbing";
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!dragging) return;

      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;

      targetRotationY += dx * 0.009;
      targetRotationX += dy * 0.005;

      targetRotationX = THREE.MathUtils.clamp(
        targetRotationX,
        -0.65,
        0.65
      );

      previousX = event.clientX;
      previousY = event.clientY;
      lastInteraction = performance.now();
    });

    function stopDragging() {
      dragging = false;
      canvas.style.cursor = "grab";
    }

    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);
    canvas.addEventListener("lostpointercapture", stopDragging);

    canvas.style.cursor = "grab";

    // RESIZE
    function resize() {
      if (disposed) return;

      const width = stage.clientWidth;
      const height = stage.clientHeight;

      if (!width || !height) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height, false);
    }

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    resize();

    // ANIMATION
    const timer = new THREE.Timer();
    timer.connect(document);

    function animate() {
      if (disposed) return;

      timer.update();

      const delta = Math.min(timer.getDelta(), 0.04);
      const elapsed = timer.getElapsed();

      const idleTime =
        performance.now() - lastInteraction;

      // Smoothly return to the idle rotation after interaction.
      if (!dragging && idleTime > 2200) {
        targetRotationY +=
          (0.35 - targetRotationY) *
          (1 - Math.exp(-delta * 0.65));

        targetRotationX +=
          (0.15 - targetRotationX) *
          (1 - Math.exp(-delta * 0.65));
      }

      hero.rotation.y +=
        (targetRotationY - hero.rotation.y) *
        (1 - Math.exp(-delta * 5));

      hero.rotation.x +=
        (targetRotationX - hero.rotation.x) *
        (1 - Math.exp(-delta * 5));

      hero.position.y = Math.sin(elapsed * 1.15) * 0.12;

      core.rotation.y += delta * 0.18;
      innerFrame.rotation.y -= delta * 0.12;
      wire.rotation.y -= delta * 0.1;

      orbs.forEach((orb, index) => {
        const phase = elapsed * 0.8 + index * 1.6;

        orb.position.y +=
          (Math.sin(phase) * 0.035) *
          Math.min(delta * 60, 1);

        orb.rotation.x += delta * 0.22;
        orb.rotation.y += delta * (0.35 + index * 0.08);
      });

      platformRing.rotation.z += delta * 0.14;

      rings.forEach((ring, index) => {
        ring.rotation.y += delta * (0.08 + index * 0.035);
        ring.rotation.z += delta * 0.025;
      });

      particles.rotation.y = elapsed * 0.018;

      renderer.render(scene, camera);
    }

    // Hide the CSS fallback after successful renderer setup.
    if (fallback) fallback.hidden = true;

    renderer.setAnimationLoop(animate);

    // Pause rendering when the page is hidden.
    function onVisibilityChange() {
      if (document.hidden) {
        renderer.setAnimationLoop(null);
      } else if (!disposed) {
        timer.reset();
        renderer.setAnimationLoop(animate);
      }
    }

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    // Lifecycle cleanup.
    function cleanup() {
      if (disposed) return;
      disposed = true;

      renderer.setAnimationLoop(null);
      resizeObserver?.disconnect();

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );

      timer.dispose();

      scene.traverse((object) => {
        if (object.geometry) {
          object.geometry.dispose();
        }

        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

          materials.forEach((material) => {
            material.dispose();
          });
        }
      });

      renderer.dispose();
      renderer.domElement.remove();
    }

    window.addEventListener("pagehide", cleanup, {
      once: true
    });
  } catch (error) {
    console.error("PLAYVERSE 3D initialization failed:", error);

    if (renderer) {
      renderer.dispose();
      renderer.domElement.remove();
    }

    if (fallback) {
      fallback.hidden = false;
    }
  }
}
