import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SPACE_DIR = path.resolve('public/assets/space');

async function processTextures() {
  console.log('Processing space assets in', SPACE_DIR);

  // 1. Earth Day Texture
  const earthJpg = path.join(SPACE_DIR, 'texture de la terre.jpg');
  if (fs.existsSync(earthJpg)) {
    console.log('Generating Earth 4K & 2K WebP...');
    await sharp(earthJpg)
      .resize(4096, 2048, { fit: 'fill' })
      .webp({ quality: 88 })
      .toFile(path.join(SPACE_DIR, 'earth_day_4k.webp'));

    await sharp(earthJpg)
      .resize(2048, 1024, { fit: 'fill' })
      .webp({ quality: 80 })
      .toFile(path.join(SPACE_DIR, 'earth_day_2k.webp'));

    // Generate Specular Mask (water reflects, land doesn't)
    // Darken land and boost ocean contrast
    console.log('Generating Earth Specular Map...');
    await sharp(earthJpg)
      .resize(2048, 1024, { fit: 'fill' })
      .grayscale()
      .negate()
      .linear(1.4, -40)
      .webp({ quality: 75 })
      .toFile(path.join(SPACE_DIR, 'earth_specular_2k.webp'));
  }

  // 2. Sun Texture
  const sunJpg = path.join(SPACE_DIR, 'texture du soleil.jpg');
  if (fs.existsSync(sunJpg)) {
    console.log('Generating Sun 4K & 2K WebP...');
    await sharp(sunJpg)
      .resize(4096, 2048, { fit: 'fill' })
      .webp({ quality: 90 })
      .toFile(path.join(SPACE_DIR, 'sun_surface_4k.webp'));

    await sharp(sunJpg)
      .resize(2048, 1024, { fit: 'fill' })
      .webp({ quality: 82 })
      .toFile(path.join(SPACE_DIR, 'sun_surface_2k.webp'));
  }

  console.log('Asset preparation complete!');
}

processTextures().catch(console.error);
