const waveCanvas = document.getElementById('waveCanvas');
const screenCanvas = document.getElementById('screenCanvas');
const ctxWave = waveCanvas.getContext('2d');
const ctxScreen = screenCanvas.getContext('2d');

// UI Elements
const slitsSlider = document.getElementById('slits');
const wavelengthSlider = document.getElementById('wavelength');
const rayleighToggle = document.getElementById('rayleigh-toggle');
const wavelength2Group = document.getElementById('group-lambda2');
const wavelength2Slider = document.getElementById('wavelength2');
const distanceSlider = document.getElementById('distance');
const widthSlider = document.getElementById('width');
const speedSlider = document.getElementById('speed');

const slitsVal = document.getElementById('slits-val');
const wavelengthVal = document.getElementById('wavelength-val');
const wavelength2Val = document.getElementById('wavelength2-val');
const distanceVal = document.getElementById('distance-val');
const widthVal = document.getElementById('width-val');
const speedVal = document.getElementById('speed-val');

const btnPlayPause = document.getElementById('btn-play-pause');
const btnReset = document.getElementById('btn-reset');
const colorPreview = document.getElementById('color-preview');
const colorPreview2 = document.getElementById('color-preview2');

const peakIntensityText = document.getElementById('peak-intensity');
const secondaryMaximaText = document.getElementById('secondary-maxima');
const resolvingPowerText = document.getElementById('resolving-power');
const fringeSpacingText = document.getElementById('fringe-spacing');
const diffractionWidthText = document.getElementById('diffraction-width');

// Offscreen canvas for fast wave field rendering
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');
const offscreenW = 240;
const offscreenH = 160;
offscreenCanvas.width = offscreenW;
offscreenCanvas.height = offscreenH;

// Simulation State
let isPlaying = true;
let time = 0;

const state = {
    N: 2,           // Number of slits (1 to 10)
    wavelength: 550,// nm (lambda 1)
    wavelength2: 570,// nm (lambda 2 for Rayleigh mode)
    rayleighMode: false,
    d: 40,          // um (slit separation)
    a: 5,           // um (slit width)
    speed: 1.0
};

function init() {
    resizeCanvases();
    updateFromSliders();
    window.addEventListener('resize', resizeCanvases);
    setupEventListeners();
    animate();
}

function resizeCanvases() {
    waveCanvas.width = waveCanvas.parentElement.clientWidth * window.devicePixelRatio;
    waveCanvas.height = 320 * window.devicePixelRatio;
    
    screenCanvas.width = screenCanvas.parentElement.clientWidth * window.devicePixelRatio;
    screenCanvas.height = 280 * window.devicePixelRatio;
}

// View Mode Buttons
const btnView2D = document.getElementById('btn-view-2d');
const btnView3D = document.getElementById('btn-view-3d');
const threeCard = document.getElementById('three-card');

let currentViewMode = '2D'; // '2D' or '3D'

function setupEventListeners() {
    const updateHandler = () => {
        updateFromSliders();
    };

    slitsSlider.addEventListener('input', updateHandler);
    wavelengthSlider.addEventListener('input', updateHandler);
    wavelength2Slider.addEventListener('input', updateHandler);
    distanceSlider.addEventListener('input', updateHandler);
    widthSlider.addEventListener('input', updateHandler);
    speedSlider.addEventListener('input', updateHandler);

    rayleighToggle.addEventListener('change', () => {
        state.rayleighMode = rayleighToggle.checked;
        wavelength2Group.style.display = state.rayleighMode ? 'flex' : 'none';
        updateFromSliders();
    });

    // 2D / 3D Mode Switching
    btnView2D.addEventListener('click', () => {
        currentViewMode = '2D';
        btnView2D.classList.add('active');
        btnView3D.classList.remove('active');
        
        waveCanvas.parentElement.parentElement.style.display = 'flex';
        screenCanvas.parentElement.parentElement.style.display = 'flex';
        threeCard.style.display = 'none';
    });

    btnView3D.addEventListener('click', () => {
        currentViewMode = '3D';
        btnView3D.classList.add('active');
        btnView2D.classList.remove('active');
        
        waveCanvas.parentElement.parentElement.style.display = 'none';
        screenCanvas.parentElement.parentElement.style.display = 'none';
        threeCard.style.display = 'flex';

        // Lazy initialize Three.js on first 3D click
        if (typeof initThreeScene === 'function') {
            initThreeScene();
            createBarrierGroup(state.N, state.d, state.a);
        }
    });

    btnPlayPause.addEventListener('click', () => {
        isPlaying = !isPlaying;
        btnPlayPause.textContent = isPlaying ? 'Pause' : 'Play';
        btnPlayPause.classList.toggle('primary', isPlaying);
    });

    btnReset.addEventListener('click', () => {
        slitsSlider.value = 2;
        wavelengthSlider.value = 550;
        wavelength2Slider.value = 570;
        rayleighToggle.checked = false;
        wavelength2Group.style.display = 'none';
        distanceSlider.value = 40;
        widthSlider.value = 5;
        speedSlider.value = 1;
        time = 0;
        if (!isPlaying) {
            isPlaying = true;
            btnPlayPause.textContent = 'Pause';
            btnPlayPause.classList.add('primary');
        }
        updateFromSliders();
    });
}

function updateFromSliders() {
    state.N = parseInt(slitsSlider.value, 10);
    state.wavelength = parseFloat(wavelengthSlider.value);
    state.wavelength2 = parseFloat(wavelength2Slider.value);
    state.d = parseFloat(distanceSlider.value);
    state.a = parseFloat(widthSlider.value);
    state.speed = parseFloat(speedSlider.value);

    // Update UI text
    slitsVal.textContent = `${state.N}`;
    wavelengthVal.textContent = `${state.wavelength} nm`;
    wavelength2Val.textContent = `${state.wavelength2} nm`;
    distanceVal.textContent = `${state.d} μm`;
    widthVal.textContent = `${state.a} μm`;
    speedVal.textContent = `${state.speed.toFixed(1)}x`;

    // Update color preview bars
    const color1 = wavelengthToRGB(state.wavelength);
    colorPreview.style.background = `rgb(${color1.r}, ${color1.g}, ${color1.b})`;

    const color2 = wavelengthToRGB(state.wavelength2);
    colorPreview2.style.background = `rgb(${color2.r}, ${color2.g}, ${color2.b})`;

    // Physics Notebook Calculations
    peakIntensityText.textContent = `${state.N * state.N}x (N²)`;
    const secCount = Math.max(0, state.N - 2);
    secondaryMaximaText.textContent = `${secCount} (N-2)`;
    const R = calculateResolvingPower(state.N, 1);
    resolvingPowerText.textContent = `${R} (m=1)`;

    const L = 1.0; // m
    const lambda_m = state.wavelength * 1e-9;
    const d_m = state.d * 1e-6;
    const a_m = state.a * 1e-6;

    const dy = (L * lambda_m) / d_m;
    const envelopeWidth = (2 * L * lambda_m) / a_m;

    fringeSpacingText.textContent = `~ ${(dy * 1000).toFixed(1)} mm`;
    diffractionWidthText.textContent = `~ ${(envelopeWidth * 1000).toFixed(1)} mm`;

    // Update 3D Barrier Mesh
    if (typeof createBarrierGroup === 'function' && isThreeInitialized) {
        createBarrierGroup(state.N, state.d, state.a);
    }
}

function animate() {
    if (isPlaying) {
        time += 0.15 * state.speed;
    }

    if (currentViewMode === '2D') {
        drawWaveField();
        drawScreenPattern();
    } else if (currentViewMode === '3D') {
        if (typeof updateThreeWaveSurface === 'function') {
            updateThreeWaveSurface(state, time);
        }
    }

    requestAnimationFrame(animate);
}

function drawWaveField() {
    const w = waveCanvas.width;
    const h = waveCanvas.height;
    ctxWave.clearRect(0, 0, w, h);

    // 1. Compute wave field on offscreen canvas for performance
    const imgData = offscreenCtx.createImageData(offscreenW, offscreenH);
    const data = imgData.data;

    const slitX = Math.floor(offscreenW * 0.2); // Slit position at 20% of width
    const centerY = offscreenH / 2;

    // Map physical parameters to pixel space
    const scale = 50 / 100;
    const pixelD = state.d * scale;
    const pixelA = state.a * scale;
    const pixelLambda = (state.wavelength / 550) * 12;

    const k = (2 * Math.PI) / pixelLambda;

    // Define N slit sources dynamically
    const numSourcesPerSlit = 4;
    const sources = [];
    const slitCenters = [];

    const N = state.N;
    for (let i = 0; i < N; i++) {
        const slitCenterY = centerY + (i - (N - 1) / 2) * pixelD;
        slitCenters.push(slitCenterY);

        for (let s = 0; s < numSourcesPerSlit; s++) {
            const offset = (numSourcesPerSlit > 1) 
                ? (s / (numSourcesPerSlit - 1) - 0.5) * pixelA 
                : 0;
            sources.push({ x: slitX, y: slitCenterY + offset });
        }
    }

    const color = wavelengthToRGB(state.wavelength);

    for (let y = 0; y < offscreenH; y++) {
        for (let x = 0; x < offscreenW; x++) {
            const idx = (y * offscreenW + x) * 4;
            let amplitude = 0;

            if (x < slitX) {
                // Plane wave propagating to the right
                amplitude = Math.cos(k * x - time);
            } else {
                // Superposition of waves from all N slit sources
                for (let s = 0; s < sources.length; s++) {
                    const dx = x - sources[s].x;
                    const dy = y - sources[s].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        amplitude += (Math.cos(k * dist - time) / Math.sqrt(dist)) * 1.5;
                    }
                }
                // Normalize amplitude contribution by N
                amplitude /= (N * numSourcesPerSlit * 0.4);
            }

            const intensity = Math.min(1, Math.max(0, (amplitude + 1) / 2));
            
            data[idx] = color.r * intensity;
            data[idx + 1] = color.g * intensity;
            data[idx + 2] = color.b * intensity;
            data[idx + 3] = 255;
        }
    }

    offscreenCtx.putImageData(imgData, 0, 0);

    // 2. Draw scaled offscreen wave field to main canvas
    ctxWave.imageSmoothingEnabled = true;
    ctxWave.drawImage(offscreenCanvas, 0, 0, w, h);

    // 3. Draw physical barrier overlay with N slit openings
    const barrierX = (slitX / offscreenW) * w;
    ctxWave.fillStyle = 'rgba(10, 10, 12, 0.95)';
    ctxWave.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctxWave.lineWidth = 2;

    let currentY = 0;
    for (let i = 0; i < N; i++) {
        const sTop = ((slitCenters[i] - pixelA / 2) / offscreenH) * h;
        const sBottom = ((slitCenters[i] + pixelA / 2) / offscreenH) * h;

        // Fill barrier block above this slit
        if (sTop > currentY) {
            ctxWave.fillRect(barrierX - 6, currentY, 12, sTop - currentY);
            
            ctxWave.beginPath();
            ctxWave.moveTo(barrierX - 6, currentY); ctxWave.lineTo(barrierX - 6, sTop);
            ctxWave.moveTo(barrierX + 6, currentY); ctxWave.lineTo(barrierX + 6, sTop);
            ctxWave.stroke();
        }
        currentY = sBottom;
    }

    // Fill barrier block from last slit to bottom
    if (h > currentY) {
        ctxWave.fillRect(barrierX - 6, currentY, 12, h - currentY);
        
        ctxWave.beginPath();
        ctxWave.moveTo(barrierX - 6, currentY); ctxWave.lineTo(barrierX - 6, h);
        ctxWave.moveTo(barrierX + 6, currentY); ctxWave.lineTo(barrierX + 6, h);
        ctxWave.stroke();
    }

    // Draw labels
    ctxWave.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctxWave.font = '12px Outfit';
    ctxWave.fillText('Laser Source', 20, 30);
    ctxWave.fillText(`N=${N} Slit Barrier`, barrierX + 15, 30);
    ctxWave.fillText('Observation Screen', w - 130, 30);
}

function drawScreenPattern() {
    const w = screenCanvas.width;
    const h = screenCanvas.height;
    ctxScreen.clearRect(0, 0, w, h);

    const color1 = wavelengthToRGB(state.wavelength);
    const colorStr1 = `rgb(${color1.r}, ${color1.g}, ${color1.b})`;

    const color2 = wavelengthToRGB(state.wavelength2);
    const colorStr2 = `rgb(${color2.r}, ${color2.g}, ${color2.b})`;

    const centerY = h / 2;
    
    // Scaling factors for analytical N-slit formula
    const L = 180;
    const d_scale = 0.15;
    const a_scale = 0.15;
    const lambda_scale1 = state.wavelength * 0.001;
    const lambda_scale2 = state.wavelength2 * 0.001;

    const intensities1 = [];
    const intensities2 = [];

    for (let y = 0; y < h; y++) {
        const theta = Math.atan((y - centerY) / L);
        const sinTheta = Math.sin(theta);

        // Lambda 1 calculation
        const beta1 = (Math.PI * state.d * d_scale * sinTheta) / lambda_scale1;
        const alpha1 = (Math.PI * state.a * a_scale * sinTheta) / lambda_scale1;
        intensities1.push(calculateNSlitIntensity(state.N, beta1, alpha1));

        // Lambda 2 calculation (if Rayleigh mode is active)
        if (state.rayleighMode) {
            const beta2 = (Math.PI * state.d * d_scale * sinTheta) / lambda_scale2;
            const alpha2 = (Math.PI * state.a * a_scale * sinTheta) / lambda_scale2;
            intensities2.push(calculateNSlitIntensity(state.N, beta2, alpha2));
        }
    }

    // 1. Draw Intensity Graph for Lambda 1
    ctxScreen.beginPath();
    ctxScreen.strokeStyle = colorStr1;
    ctxScreen.lineWidth = 2.5;

    const grad1 = ctxScreen.createLinearGradient(0, 0, w * 0.6, 0);
    grad1.addColorStop(0, 'rgba(0,0,0,0)');
    grad1.addColorStop(1, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.25)`);
    ctxScreen.fillStyle = grad1;

    for (let y = 0; y < h; y++) {
        const x = intensities1[y] * (w * 0.5);
        if (y === 0) ctxScreen.moveTo(x, y);
        else ctxScreen.lineTo(x, y);
    }
    
    ctxScreen.lineTo(0, h); ctxScreen.lineTo(0, 0); ctxScreen.closePath();
    ctxScreen.fill();
    ctxScreen.stroke();

    // 2. Draw Intensity Graph for Lambda 2 (if Rayleigh mode enabled)
    if (state.rayleighMode) {
        ctxScreen.beginPath();
        ctxScreen.strokeStyle = colorStr2;
        ctxScreen.lineWidth = 2.0;
        ctxScreen.setLineDash([4, 3]);

        for (let y = 0; y < h; y++) {
            const x = intensities2[y] * (w * 0.5);
            if (y === 0) ctxScreen.moveTo(x, y);
            else ctxScreen.lineTo(x, y);
        }
        ctxScreen.stroke();
        ctxScreen.setLineDash([]);
    }

    // Draw central axis line
    ctxScreen.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctxScreen.setLineDash([5, 5]);
    ctxScreen.beginPath();
    ctxScreen.moveTo(0, centerY); ctxScreen.lineTo(w, centerY);
    ctxScreen.stroke();
    ctxScreen.setLineDash([]);

    // 3. Draw Physical Screen Projection Band (Right side photographic view)
    const screenBandX = w * 0.68;
    const screenBandW = w * 0.28;

    ctxScreen.fillStyle = '#020204';
    ctxScreen.fillRect(screenBandX, 0, screenBandW, h);

    for (let y = 0; y < h; y++) {
        const i1 = intensities1[y];
        if (state.rayleighMode) {
            const i2 = intensities2[y];
            // Blend colors of both wavelengths on photographic strip
            const r = Math.min(255, color1.r * i1 + color2.r * i2);
            const g = Math.min(255, color1.g * i1 + color2.g * i2);
            const b = Math.min(255, color1.b * i1 + color2.b * i2);
            const alpha = Math.min(1, i1 + i2);
            ctxScreen.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
        } else {
            ctxScreen.fillStyle = `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${i1})`;
        }
        ctxScreen.fillRect(screenBandX, y, screenBandW, 1);
    }

    // Draw screen borders
    ctxScreen.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctxScreen.lineWidth = 1.5;
    ctxScreen.strokeRect(screenBandX, 0, screenBandW, h);

    // Labels
    ctxScreen.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctxScreen.font = '12px Outfit';
    ctxScreen.fillText('Intensity Profile', 15, 25);
    ctxScreen.fillText(state.rayleighMode ? 'Rayleigh Spectrum View' : 'Photographic Strip', screenBandX + 5, 25);
}

// Initialize on load
window.onload = init;