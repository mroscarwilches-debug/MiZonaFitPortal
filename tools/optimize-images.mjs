// Image optimization pipeline.
// Reads curated originals from SRC_DIR and writes responsive AVIF/WebP
// variants to OUT_DIR. Run through Docker (no local Node needed):
//   see docs/LOCAL_DEVELOPMENT.md → "Regenerating images"
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = process.env.SRC_DIR ?? '/src';
const OUT_DIR = process.env.OUT_DIR ?? '/out';

// slug → { file, widths }
const IMAGES = {
  hero:      { file: 'Wilches team-01488.jpg', widths: [640, 1080, 1600] },
  coach:     { file: 'Wilches team-01539.jpg', widths: [480, 960] },
  training:  { file: 'Wilches team-01219.jpg', widths: [480, 960] },
  nutrition: { file: 'Wilches team-01394.jpg', widths: [480, 960] },
  team:      { file: 'Wilches team-02078.jpg', widths: [480, 960] },
};

const FORMATS = [
  { ext: 'avif', options: { quality: 50 } },
  { ext: 'webp', options: { quality: 75 } },
];

mkdirSync(OUT_DIR, { recursive: true });

// Social sharing image: JPEG for maximum platform compatibility
const OG = { file: 'Wilches team-01488.jpg', width: 1200, height: 630 };
{
  const info = await sharp(path.join(SRC_DIR, OG.file))
    .rotate()
    .resize({ width: OG.width, height: OG.height, fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(OUT_DIR, 'og-image.jpg'));
  console.log(`og-image.jpg  ${(info.size / 1024).toFixed(0)} KB`);
}

for (const [slug, { file, widths }] of Object.entries(IMAGES)) {
  const srcPath = path.join(SRC_DIR, file);
  if (!existsSync(srcPath)) {
    console.error(`MISSING: ${srcPath}`);
    process.exitCode = 1;
    continue;
  }
  for (const width of widths) {
    for (const { ext, options } of FORMATS) {
      const outPath = path.join(OUT_DIR, `${slug}-${width}.${ext}`);
      const info = await sharp(srcPath)
        .rotate() // respect EXIF orientation
        .resize({ width, withoutEnlargement: true })
        .toFormat(ext, options)
        .toFile(outPath);
      console.log(`${slug}-${width}.${ext}  ${(info.size / 1024).toFixed(0)} KB`);
    }
  }
}
