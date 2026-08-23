# 🔬 Physics Engineering Simulations Portfolio: N-Slit & 3D Optics Simulator

An interactive, high-fidelity physical optics simulation and WebGL 3D visualization platform developed as part of my **Physics Engineering** undergraduate portfolio.

This project models **Young's Double Slit**, **N-Slit Diffraction Gratings**, **Rayleigh Criterion for Spectral Resolution**, and **3D Wavefield Propagation** using rigorous analytical equations, numerical solvers, and real-time GPU-accelerated graphics.

---

## 🌟 Key Features

* **🎛️ Dynamic N-Slit Diffraction Grating ($N = 1$ to $10$):** Real-time transition from single-slit diffraction to multi-slit interference, demonstrating the $N^2$ peak intensity scaling and secondary maxima formation. According to user's choice of slit number, an interactive transition of the grating (both for 2D and 3D) can be observed. Based on the input values entered, a graph for screen intensity profile and photographic strip can be observed by the user.
* **🌐 3D WebGL Interactive Mode (Three.js):** 360-degree rotatable 3D wave surface mesh, 3D laser emitter, and dynamic barrier wall with `OrbitControls` for full spatial exploration.
* **🔬 Rayleigh Resolution Mode ($\lambda_1$ & $\lambda_2$):** Simulates the Rayleigh Criterion for spectral line separation and live Resolving Power calculation ($R = m \cdot N$).
* **🔴 Photographic Screen Strip View:** Real-time intensity profile matching physical laboratory camera/film projections and spectral line separation.
* **⚡ Decoupled Physics Engine:** Physics calculations (`physics.js`) are decoupled from rendering engines (`main.js` & `three_scene.js`) ensuring numerical stability and modular code design.

---

## 📐 Theoretical Physics & Mathematical Framework

### 1. N-Slit Intensity Distribution
The intensity profile $I(\theta)$ on the observation screen resulting from $N$ identical slits of width $a$ and slit separation $d$ is derived from the superposition of complex wave fields:

$$I(\theta) = I_0 \cdot \left[ \frac{\sin\left(\frac{N \pi d \sin\theta}{\lambda}\right)}{N \sin\left(\frac{\pi d \sin\theta}{\lambda}\right)} \right]^2 \cdot \text{sinc}^2\left(\frac{\pi a \sin\theta}{\lambda}\right)$$

Where:
*   $\beta = \frac{\pi d \sin\theta}{\lambda}$ represents the **multi-slit interference phase factor**.
*   $\alpha = \frac{\pi a \sin\theta}{\lambda}$ represents the **single-slit diffraction envelope phase factor**.
*   As $N \to \infty$, the principal maxima intensity scales with $I_{\text{max}} = I_0 \cdot N^2$, while $(N-2)$ secondary maxima appear between adjacent principal peaks.

---

### 2. Rayleigh Criterion & Resolving Power ($R$)
The Rayleigh criterion defines the limit of resolution where two adjacent spectral lines of wavelengths $\lambda_1$ and $\lambda_2$ are considered resolved when the principal maximum of $\lambda_1$ falls directly on the first minimum of $\lambda_2$:

$$R = \frac{\lambda}{\Delta\lambda} = m \cdot N$$

Where:
*   $\Delta\lambda = |\lambda_1 - \lambda_2|$ is the minimum resolvable wavelength difference.
*   $m$ is the diffraction order ($m = 1, 2, \dots$).
*   Increasing the number of illuminated slits $N$ sharpens the principal peaks, increasing the resolving power $R$ linearly.

---

### 3. Quantum Mechanical Interpretation

#### A. Wavelength ($\lambda$) and De Broglie Momentum
A decrease in wavelength ($\lambda \downarrow$) corresponds to an increase in the particle's momentum ($p \uparrow$) and energy ($E \uparrow$) via the de Broglie relation:
$$p = \frac{h}{\lambda}$$

Wavelength is inversely proportional to the wave number $k$:
$$k = \frac{2\pi}{\lambda}$$

A smaller wavelength increases $k$, forcing the wave function $\Psi(x) \propto e^{ikx}$ to oscillate at a **higher spatial frequency**. As $\lambda$ decreases, the fringe spacing $\Delta y = \frac{\lambda L}{d}$ shrinks, making the peaks of the probability density graph $P(y) = |\Psi(y)|^2$ tightly packed.

#### B. Slit Width ($a$) and Heisenberg's Uncertainty Principle
By Heisenberg's Uncertainty Principle:
$$\Delta x \cdot \Delta p_x \ge \frac{\hbar}{2}$$

Widening the slits ($a \uparrow$) decreases spatial uncertainty ($\Delta x \downarrow$) as the particle passes through the slit plane. Consequently, the momentum uncertainty in the transverse direction must decrease ($\Delta p_x \downarrow$). Because transverse momentum is constrained, particles scatter at smaller angles, causing the diffraction envelope $\text{sinc}^2(\alpha)$ to narrow.

---

## 📁 Repository Structure

```
physics-simulations/
├── README.md                      # Academic portfolio documentation
├── agent.py                       # Python simulation generator agent
├── .gitignore                     # Git tracking exclusions
└── double-slit/                   # Optics Simulation Module
    ├── index.html                 # UI Layout, MathJax TeX & Three.js imports
    ├── style.css                  # Dark-theme glassmorphic UI styling
    ├── physics.js                 # Pure physics engine & analytical N-slit solvers
    ├── main.js                    # 2D Canvas rendering & UI event loops
    └── three_scene.js             # Three.js 3D WebGL scene & OrbitControls
```

---

## 🚀 How to Run Locally

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/physics-simulations.git
   cd physics-simulations
   ```

2. **Open in Browser:**
   Simply double-click `double-slit/index.html` or open it using any modern web browser (Edge, Chrome, Firefox, Safari).

3. **Controls & Usage:**
   * **2D / 3D Toggle:** Switch between 2D wavefront canvas and 3D WebGL viewport at the top right.
   * **3D Viewport Controls:** Left-click + drag to rotate 360°, scroll wheel to zoom, right-click + drag to pan.
   * **Rayleigh Mode:** Enable the toggle switch to introduce a secondary wavelength ($\lambda_2$) and observe spectral line resolution as $N$ increases.
   * **N-Slit Slider:** Adjust $N$ from $1$ to $10$ to observe principal peak sharpening and secondary maxima.

---

## 💻 Tech Stack & Dependencies

* **Core Language:** JavaScript (ES6+), HTML5, CSS3
* **3D Graphics Engine:** Three.js (WebGL, OrbitControls)
* **Math Rendering:** MathJax (LaTeX TeX/TeX-MML-chtml)
* **Data Processing & Scripts:** Python 3.9+ (`numpy`, `matplotlib`, `requests`)
