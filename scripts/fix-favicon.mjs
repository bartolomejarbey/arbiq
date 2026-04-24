import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'app/icon.png';

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log(`Source: ${meta.width}x${meta.height} ${meta.format}`);

  // Trim transparent padding around the logo so it fills the canvas at small sizes.
  const trimmed = await sharp(SRC)
    .trim({ threshold: 10 })
    .toBuffer();
  const trimMeta = await sharp(trimmed).metadata();
  console.log(`After trim: ${trimMeta.width}x${trimMeta.height}`);

  // Now embed onto a square canvas with a small breathing room (~6%),
  // then export multiple sizes.
  const padding = Math.round(Math.max(trimMeta.width, trimMeta.height) * 0.06);
  const canvas = Math.max(trimMeta.width, trimMeta.height) + padding * 2;

  const padded = await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: trimmed, gravity: 'center' }])
    .png()
    .toBuffer();

  // app/icon.png — Next.js auto-detects, generates <link rel="icon">
  await sharp(padded).resize(512, 512).png({ quality: 90 }).toFile('app/icon.png');
  console.log('Wrote app/icon.png (512×512, trimmed + 6% padding)');

  // app/apple-icon.png — iOS home screen, 180×180 minimum
  await sharp(padded).resize(180, 180).png({ quality: 90 }).toFile('app/apple-icon.png');
  console.log('Wrote app/apple-icon.png (180×180)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
