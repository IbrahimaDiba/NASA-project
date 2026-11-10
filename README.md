# NASA-project — Lunar Horizon

> **Aerospace Flight Operations & Mission Planning Console for NASA CLPS & Artemis Programs**

Lunar Horizon is an advanced mission planning platform designed to evaluate lunar landing sites, solar illumination profiles, Direct-to-Earth (DTE) communication margins, and topographic hazards using authentic NASA LROC, LOLA DEM, and CGI Moon Kit datasets.

---

## 🚀 Key Capabilities

- **3D Sun & Earth Celestial Simulator (`/simulator`)**:
  - Photorealistic 360° observatory of the lunar South Pole.
  - Authentic 4K NASA Sun photosphere (`texture du soleil.jpg`).
  - 4K Earth with specular ocean reflection, dynamic phase illumination, and atmosphere.
  - Ephemeris calculations for Sun and Earth topocentric elevation/azimuth with terrain dip correction.
  - Dual viewpoint mode: Astronaut First-Person Ground View vs Orbital View.

- **3D Site Explorer (`/explorer`)**:
  - Global lunar globe utilizing the NASA 8K LROC mosaic and LOLA topographic relief (256×256 displacement mesh).
  - High-density sampling of LOLA 16-bit DEM elevation.
  - Interactive site markers for Artemis III, CLPS Nova-C, VIPER, Chang'e 4, and historic Apollo landings.
  - Surface Mesh mode rendering local 40×40 km digital elevation terrain with touching CLPS lander.

- **Scenario Comparison Matrix (`/comparison`)**:
  - Multi-scenario trade-off matrix evaluating alternative sites in the same region.
  - Alternative launch dates & slip analysis for schedule resilience.
  - Comparison of illumination duty cycles, continuous DTE link availability, and topographic slopes.

- **Mission Timeline & AI Advisor (`/timeline`, `/advisor`)**:
  - Chronological lunar day/night cycles, thermal extremes, and landing window feasibility.
  - Mission safety scoring and autonomous recommendation engine.

---

## 🛠️ Tech Stack

- **Framework**: React 19, Vite 6, TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons
- **3D Engine**: Three.js, React Three Fiber, React Three Drei
- **Data & Charts**: Recharts, Zustand, NASA PDS / LOLA DEM

---

## 📦 Getting Started

```bash
# Clone the repository
git clone https://github.com/IbrahimaDiba/NASA-project.git
cd NASA-project

# Install dependencies
npm install

# Start local development server
npm run dev

# Production build
npm run build
```
