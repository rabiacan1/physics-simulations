/**
 * three_scene.js - Three.js WebGL 3D Interactive Physics Engine
 * Renders a 3D animated wave surface, 3D laser emitter, N-slit barrier,
 * and 3D screen with OrbitControls for 360-degree interactive rotation.
 */

let threeScene, threeCamera, threeRenderer, threeControls;
let waveSurfaceMesh, barrierGroup, laserMesh, screenMesh;
let waveGeometry, waveMaterial;
let isThreeInitialized = false;

// 3D Scene Dimensions
const GRID_X = 100;
const GRID_Y = 60;
const SEGMENTS_X = 120;
const SEGMENTS_Y = 80;

function initThreeScene() {
    if (isThreeInitialized) return;

    const container = document.getElementById('three-wrapper');
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    // 1. Scene
    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x020204);

    // 2. Camera
    threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    threeCamera.position.set(0, -120, 130);
    threeCamera.lookAt(0, 20, 0);

    // 3. Renderer
    threeRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    threeRenderer.setSize(width, height);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeRenderer.shadowMap.enabled = true;
    container.appendChild(threeRenderer.domElement);

    // 4. OrbitControls
    threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
    threeControls.enableDamping = true;
    threeControls.dampingFactor = 0.05;
    threeControls.maxPolarAngle = Math.PI / 2 + 0.1; // Limit below ground view

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    threeScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, -100, 150);
    threeScene.add(dirLight);

    // 6. Build 3D Objects
    createLaserSource();
    createBarrierGroup(2, 40, 5);
    createObservationScreen();
    createWaveSurface();

    isThreeInitialized = true;

    // Handle Window Resize
    window.addEventListener('resize', onThreeWindowResize);
}

function onThreeWindowResize() {
    if (!isThreeInitialized) return;
    const container = document.getElementById('three-wrapper');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    threeCamera.aspect = width / height;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(width, height);
}

/**
 * Creates 3D Metallic Laser Emitter
 */
function createLaserSource() {
    const group = new THREE.Group();

    // Laser Box
    const boxGeo = new THREE.BoxGeometry(25, 40, 20);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    // Glowing Lens Ring
    const lensGeo = new THREE.CylinderGeometry(5, 5, 4, 32);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.y = 20;
    group.add(lens);

    group.position.set(0, -90, 0);
    threeScene.add(group);
    laserMesh = lens;
}

/**
 * Creates 3D Barrier Wall with N Slit Openings
 */
function createBarrierGroup(N, d, a) {
    if (barrierGroup) threeScene.remove(barrierGroup);

    barrierGroup = new THREE.Group();
    const barrierWidth = GRID_X * 1.4;
    const barrierHeight = 25;
    const barrierThickness = 3;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5 });

    // Map d and a to 3D scene coordinates
    const scale = 0.4;
    const pD = d * scale;
    const pA = Math.max(1.5, a * scale);

    const slitCenters = [];
    for (let i = 0; i < N; i++) {
        slitCenters.push((i - (N - 1) / 2) * pD);
    }

    let currentX = -barrierWidth / 2;

    for (let i = 0; i < N; i++) {
        const slitMin = slitCenters[i] - pA / 2;
        const slitMax = slitCenters[i] + pA / 2;

        if (slitMin > currentX) {
            const blockWidth = slitMin - currentX;
            const blockGeo = new THREE.BoxGeometry(blockWidth, barrierThickness, barrierHeight);
            const block = new THREE.Mesh(blockGeo, wallMat);
            block.position.set(currentX + blockWidth / 2, -20, barrierHeight / 2);
            barrierGroup.add(block);
        }
        currentX = slitMax;
    }

    // Rightmost barrier block
    if (barrierWidth / 2 > currentX) {
        const blockWidth = (barrierWidth / 2) - currentX;
        const blockGeo = new THREE.BoxGeometry(blockWidth, barrierThickness, barrierHeight);
        const block = new THREE.Mesh(blockGeo, wallMat);
        block.position.set(currentX + blockWidth / 2, -20, barrierHeight / 2);
        barrierGroup.add(block);
    }

    threeScene.add(barrierGroup);
}

/**
 * Creates 3D Observation Detection Screen
 */
function createObservationScreen() {
    const screenGeo = new THREE.PlaneGeometry(GRID_X * 1.4, 35);
    const screenMat = new THREE.MeshStandardMaterial({
        color: 0x050508,
        side: THREE.DoubleSide,
        roughness: 0.2
    });

    screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 70, 17.5);
    screenMesh.rotation.x = Math.PI / 2;
    threeScene.add(screenMesh);
}

/**
 * Creates 3D Animated Mesh Surface for Wave Amplitude
 */
function createWaveSurface() {
    waveGeometry = new THREE.PlaneGeometry(GRID_X * 1.4, 90, SEGMENTS_X, SEGMENTS_Y);

    // Enable vertex colors
    const count = waveGeometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    waveGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    waveMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        wireframe: true,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.85
    });

    waveSurfaceMesh = new THREE.Mesh(waveGeometry, waveMaterial);
    waveSurfaceMesh.position.set(0, 25, 0);
    threeScene.add(waveSurfaceMesh);
}

/**
 * Animates 3D Wave Surface Vertices in Real-Time
 */
function updateThreeWaveSurface(state, time) {
    if (!isThreeInitialized || !waveGeometry) return;

    const pos = waveGeometry.attributes.position;
    const colorAttr = waveGeometry.attributes.color;

    const N = state.N;
    const scale = 0.4;
    const pD = state.d * scale;
    const pA = state.a * scale;
    const pixelLambda = (state.wavelength / 550) * 10;
    const k = (2 * Math.PI) / pixelLambda;

    const colorRGB = wavelengthToRGB(state.wavelength);
    const cr = colorRGB.r / 255;
    const cg = colorRGB.g / 255;
    const cb = colorRGB.b / 255;

    // Slit Y coordinates on barrier (-20 Y)
    const slitCentersY = [];
    for (let i = 0; i < N; i++) {
        slitCentersY.push((i - (N - 1) / 2) * pD);
    }

    // Local Y value corresponding to World Y = -20 (Barrier position)
    // Mesh is offset by +25 in Y, so Local Y_barrier = -20 - 25 = -45
    const localBarrierY = -45;

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i); // Spatial X
        const y = pos.getY(i); // Propagation Y (-45 to +45)

        let Z = 0;

        if (y < localBarrierY) {
            // Plane wave traveling towards barrier (-45 local Y)
            Z = Math.cos(k * (y - localBarrierY) - time) * 3.0;
        } else {
            // Superposition of waves from N slit sources starting EXACTLY at barrier (localBarrierY)
            const distY = y - localBarrierY;
            for (let s = 0; s < N; s++) {
                const dx = x - slitCentersY[s];
                const dist = Math.sqrt(dx * dx + distY * distY);
                if (dist > 0) {
                    Z += (Math.cos(k * dist - time) / Math.sqrt(dist)) * 4.5;
                }
            }
            Z /= (N * 0.45);
        }

        // Update vertex height Z
        pos.setZ(i, Z);

        // Update vertex color based on wave amplitude
        const normZ = Math.min(1, Math.max(0, (Z + 4) / 8));
        colorAttr.setXYZ(i, cr * normZ, cg * normZ, cb * normZ);
    }

    pos.needsUpdate = true;
    colorAttr.needsUpdate = true;
    waveGeometry.computeVertexNormals();

    // Update Laser Emitter Lens Color
    if (laserMesh) {
        laserMesh.material.color.setRGB(cr, cg, cb);
    }

    // Render Scene with OrbitControls
    threeControls.update();
    threeRenderer.render(threeScene, threeCamera);
}
