// ============================================================================
// NASA Lunar Datasets Preprocessing Script
// Processes:
//   1. lroc_color_16bit_srgb_4k.tif (4096x2048 16-bit RGB) -> 4K & 2K WebP
//   2. ldem_16_uint.tif (5760x2880 16-bit uint) -> Displacement WebP & Elevation Grid
// ============================================================================

import { fromFile } from 'geotiff';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = 'public/assets/moon';
const COLOR_TIFF = path.join(ASSETS_DIR, 'lroc_color_16bit_srgb_4k.tif');
const DEM_TIFF = path.join(ASSETS_DIR, 'ldem_16_uint.tif');

async function processColorTexture() {
  console.log('>>> [1/3] Processing NASA LROC Color Texture...');
  
  // 4K Full Resolution WebP
  console.log('  Generating 4096x2048 WebP...');
  await sharp(COLOR_TIFF)
    .webp({ quality: 90, effort: 3 })
    .toFile(path.join(ASSETS_DIR, 'lroc_color_4k.webp'));
  
  // 2K LOD WebP
  console.log('  Generating 2048x1024 LOD WebP...');
  await sharp(COLOR_TIFF)
    .resize(2048, 1024, { fit: 'fill' })
    .webp({ quality: 86, effort: 3 })
    .toFile(path.join(ASSETS_DIR, 'lroc_color_2k.webp'));
    
  console.log('  ✓ Color textures created.');
}

async function processElevationData() {
  console.log('>>> [2/3] Processing NASA LOLA 16-bit DEM Data...');
  
  const tiff = await fromFile(DEM_TIFF);
  const image = await tiff.getImage();
  const width = image.getWidth();   // 5760
  const height = image.getHeight(); // 2880
  console.log(`  Source DEM dimensions: ${width}x${height}, 16-bit unsigned integer`);
  
  const rawData = (await image.readRasters())[0];
  const totalPixels = width * height;
  
  let rawMin = 65535;
  let rawMax = 0;
  
  // Compute exact min/max
  for (let i = 0; i < totalPixels; i++) {
    const v = rawData[i];
    if (v < rawMin) rawMin = v;
    if (v > rawMax) rawMax = v;
  }
  
  const elevMinMeters = rawMin * 0.5 - 10000.0;
  const elevMaxMeters = rawMax * 0.5 - 10000.0;
  const elevRangeMeters = elevMaxMeters - elevMinMeters;
  
  console.log(`  DEM Raw Min: ${rawMin}, Raw Max: ${rawMax}`);
  console.log(`  Elevation Range: ${elevMinMeters.toFixed(1)}m to +${elevMaxMeters.toFixed(1)}m (${(elevMinMeters/1000).toFixed(2)}km to +${(elevMaxMeters/1000).toFixed(2)}km)`);
  
  // Create Normalized 8-bit Displacement Buffer for GPU displacement map (2048x1024 and 4096x2048)
  // Normalization: (elev - elevMin) / (elevMax - elevMin)
  const targetW = 2048;
  const targetH = 1024;
  const dispBuffer = Buffer.alloc(targetW * targetH);
  
  for (let y = 0; y < targetH; y++) {
    const srcY = Math.floor((y / targetH) * height);
    const rowOffset = srcY * width;
    const destOffset = y * targetW;
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.floor((x / targetW) * width);
      const rawVal = rawData[rowOffset + srcX];
      const norm = (rawVal - rawMin) / (rawMax - rawMin);
      dispBuffer[destOffset + x] = Math.max(0, Math.min(255, Math.round(norm * 255)));
    }
  }
  
  console.log('  Generating 2048x1024 Displacement Map WebP...');
  await sharp(dispBuffer, { raw: { width: targetW, height: targetH, channels: 1 } })
    .webp({ quality: 92, effort: 3 })
    .toFile(path.join(ASSETS_DIR, 'ldem_displacement_2k.webp'));

  // Also create a 4096x2048 displacement map for high-fidelity zoom
  const targetW4k = 4096;
  const targetH4k = 2048;
  const dispBuffer4k = Buffer.alloc(targetW4k * targetH4k);
  for (let y = 0; y < targetH4k; y++) {
    const srcY = Math.floor((y / targetH4k) * height);
    const rowOffset = srcY * width;
    const destOffset = y * targetW4k;
    for (let x = 0; x < targetW4k; x++) {
      const srcX = Math.floor((x / targetW4k) * width);
      const rawVal = rawData[rowOffset + srcX];
      const norm = (rawVal - rawMin) / (rawMax - rawMin);
      dispBuffer4k[destOffset + x] = Math.max(0, Math.min(255, Math.round(norm * 255)));
    }
  }
  
  console.log('  Generating 4096x2048 Displacement Map WebP...');
  await sharp(dispBuffer4k, { raw: { width: targetW4k, height: targetH4k, channels: 1 } })
    .webp({ quality: 90, effort: 3 })
    .toFile(path.join(ASSETS_DIR, 'ldem_displacement_4k.webp'));

  // Create compact global elevation grid for instant client-side elevation queries:
  // 720 x 360 (0.5 degree resolution), stored as Int16 (meters)
  // Size: 720 * 360 * 2 bytes = 518 KB!
  const gridW = 720;
  const gridH = 360;
  const elevGrid = new Int16Array(gridW * gridH);
  
  for (let y = 0; y < gridH; y++) {
    const srcY = Math.floor((y / gridH) * height);
    const rowOffset = srcY * width;
    const destOffset = y * gridW;
    for (let x = 0; x < gridW; x++) {
      const srcX = Math.floor((x / gridW) * width);
      const rawVal = rawData[rowOffset + srcX];
      const meters = Math.round(rawVal * 0.5 - 10000.0);
      elevGrid[destOffset + x] = meters;
    }
  }
  
  const gridPath = path.join(ASSETS_DIR, 'ldem_elevation_720x360.bin');
  fs.writeFileSync(gridPath, Buffer.from(elevGrid.buffer));
  console.log(`  ✓ Global 720x360 elevation grid written (${(elevGrid.byteLength / 1024).toFixed(0)} KB)`);

  // Write Metadata JSON
  const meta = {
    dataset: 'NASA LOLA LDEM_16 (Lunar Orbiter Laser Altimeter)',
    colorDataset: 'NASA LROC Color 16-bit sRGB',
    referenceRadiusKm: 1737.4,
    units: 'half-meter with +10km offset (elevation_m = raw * 0.5 - 10000)',
    elevationMinMeters: elevMinMeters,
    elevationMaxMeters: elevMaxMeters,
    elevationRangeMeters: elevRangeMeters,
    elevationMinKm: elevMinMeters / 1000.0,
    elevationMaxKm: elevMaxMeters / 1000.0,
    rawMin,
    rawMax,
    gridResolution: {
      width: gridW,
      height: gridH,
      degPerPixel: 0.5,
      file: 'ldem_elevation_720x360.bin',
      type: 'Int16Array'
    },
    displacementMaps: {
      lod2k: 'ldem_displacement_2k.webp',
      lod4k: 'ldem_displacement_4k.webp',
      normalizedRangeMeters: elevRangeMeters,
      displacementScaleFactor: elevRangeMeters / (1737.4 * 1000.0) // ~ 0.01088 relative to unit sphere
    }
  };
  
  fs.writeFileSync(path.join(ASSETS_DIR, 'ldem_metadata.json'), JSON.stringify(meta, null, 2));
  console.log('  ✓ Metadata JSON written.');
}

async function run() {
  console.log('=== PREPARING REAL NASA MOON DATASETS ===');
  await processColorTexture();
  await processElevationData();
  console.log('=== PREPARATION COMPLETE ===');
}

run().catch(console.error);
