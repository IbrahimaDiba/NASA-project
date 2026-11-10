// ============================================================================
// Lunar Horizon — NASA Terrain & Elevation Service
// Integrates real NASA LROC Color and LOLA DEM datasets
// ============================================================================

export interface LunarDEMMetadata {
  dataset: string;
  colorDataset: string;
  referenceRadiusKm: number;
  units: string;
  elevationMinMeters: number;
  elevationMaxMeters: number;
  elevationRangeMeters: number;
  elevationMinKm: number;
  elevationMaxKm: number;
  rawMin: number;
  rawMax: number;
  gridResolution: {
    width: number;
    height: number;
    degPerPixel: number;
    file: string;
    type: string;
  };
  displacementMaps: {
    lod2k: string;
    lod4k: string;
    normalizedRangeMeters: number;
    displacementScaleFactor: number;
  };
}

export interface LocalTerrainData {
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  elevations: Float32Array;
  minElevation: number;
  maxElevation: number;
  centerElevation: number;
  widthKm: number;
  resolution: number;
}

class LunarTerrainService {
  private meta: LunarDEMMetadata | null = null;
  private elevationGrid: Int16Array | null = null;
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        const metaRes = await fetch('/assets/moon/ldem_metadata.json');
        if (metaRes.ok) {
          this.meta = await metaRes.json();
        }

        const binRes = await fetch('/assets/moon/ldem_elevation_720x360.bin');
        if (binRes.ok) {
          const buffer = await binRes.arrayBuffer();
          this.elevationGrid = new Int16Array(buffer);
          this.isLoaded = true;
        }
      } catch (err) {
        console.warn('Could not load NASA LOLA elevation binary:', err);
      }
    })();

    return this.loadingPromise;
  }

  getMetadata(): LunarDEMMetadata | null {
    return this.meta;
  }

  /**
   * Sample real NASA LOLA elevation in meters at any latitude/longitude using bilinear interpolation
   */
  getElevation(lat: number, lon: number): number {
    if (!this.elevationGrid || !this.meta) {
      // Approximate fallback based on South Pole Aitken and highlands
      return -1000 + Math.sin(lat * Math.PI / 180) * 2000;
    }

    const { width, height } = this.meta.gridResolution;

    // Normalizing lon to [-180, 180]
    let nLon = lon;
    while (nLon > 180) nLon -= 360;
    while (nLon < -180) nLon += 360;

    // Clamping lat to [-90, 90]
    const cLat = Math.max(-90, Math.min(90, lat));

    // Convert to grid float coordinates
    const gx = ((nLon + 180) / 360) * (width - 1);
    const gy = ((90 - cLat) / 180) * (height - 1);

    const x0 = Math.floor(gx);
    const x1 = Math.min(width - 1, x0 + 1);
    const y0 = Math.floor(gy);
    const y1 = Math.min(height - 1, y0 + 1);

    const fx = gx - x0;
    const fy = gy - y0;

    const v00 = this.elevationGrid[y0 * width + x0];
    const v10 = this.elevationGrid[y0 * width + x1];
    const v01 = this.elevationGrid[y1 * width + x0];
    const v11 = this.elevationGrid[y1 * width + x1];

    // Bilinear interpolation
    const elev = (1 - fx) * (1 - fy) * v00 +
                 fx * (1 - fy) * v10 +
                 (1 - fx) * fy * v01 +
                 fx * fy * v11;

    return elev;
  }

  /**
   * Generate localized 3D terrain grid around a target landing site for Surface View
   */
  generateLocalTerrain(
    centerLat: number,
    centerLon: number,
    spanKm = 40,
    gridSize = 64
  ): LocalTerrainData {
    const numVerts = (gridSize + 1) * (gridSize + 1);
    const positions = new Float32Array(numVerts * 3);
    const uvs = new Float32Array(numVerts * 2);
    const elevations = new Float32Array(numVerts);
    const indices = new Uint16Array(gridSize * gridSize * 6);

    const kmPerDegLat = 1737.4 * (Math.PI / 180); // ~30.32 km per degree
    const halfSpan = spanKm / 2;
    const centerElev = this.getElevation(centerLat, centerLon);

    let minElev = Infinity;
    let maxElev = -Infinity;

    let vIdx = 0;
    let uvIdx = 0;

    for (let j = 0; j <= gridSize; j++) {
      const vFrac = j / gridSize;
      const yKm = (vFrac - 0.5) * spanKm;
      const dLat = yKm / kmPerDegLat;
      const lat = centerLat - dLat; // north is up

      // km per degree lon shrinks at poles: cos(lat)
      const latRad = (lat * Math.PI) / 180;
      const kmPerDegLon = Math.max(0.5, kmPerDegLat * Math.cos(latRad));

      for (let i = 0; i <= gridSize; i++) {
        const uFrac = i / gridSize;
        const xKm = (uFrac - 0.5) * spanKm;
        const dLon = xKm / kmPerDegLon;
        const lon = centerLon + dLon;

        const elevMeters = this.getElevation(lat, lon);
        if (elevMeters < minElev) minElev = elevMeters;
        if (elevMeters > maxElev) maxElev = elevMeters;

        elevations[j * (gridSize + 1) + i] = elevMeters;

        // Relative elevation in kilometers (scaled for visual relief at ground level)
        const relElevKm = (elevMeters - centerElev) / 1000;

        // Position: X = East-West, Y = Altitude, Z = North-South
        positions[vIdx] = xKm;
        positions[vIdx + 1] = relElevKm * 1.5; // subtle 1.5x relief factor for ground level
        positions[vIdx + 2] = yKm;
        vIdx += 3;

        // Texture coordinates mapped to global lunar coordinates
        const u = ((lon + 180) / 360 + 1) % 1;
        const v = Math.max(0, Math.min(1, (90 - lat) / 180));
        uvs[uvIdx] = u;
        uvs[uvIdx + 1] = 1 - v;
        uvIdx += 2;
      }
    }

    // Generate triangle indices
    let iIdx = 0;
    for (let j = 0; j < gridSize; j++) {
      for (let i = 0; i < gridSize; i++) {
        const a = j * (gridSize + 1) + i;
        const b = a + 1;
        const c = a + (gridSize + 1);
        const d = c + 1;

        indices[iIdx++] = a;
        indices[iIdx++] = c;
        indices[iIdx++] = b;

        indices[iIdx++] = b;
        indices[iIdx++] = c;
        indices[iIdx++] = d;
      }
    }

    return {
      positions,
      uvs,
      indices,
      elevations,
      minElevation: minElev,
      maxElevation: maxElev,
      centerElevation: centerElev,
      widthKm: spanKm,
      resolution: gridSize,
    };
  }
}

export const lunarTerrainService = new LunarTerrainService();
