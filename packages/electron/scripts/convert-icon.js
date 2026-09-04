/**
 * Script to convert Logo.png to icon.ico for Windows Electron app.
 * Run with: node scripts/convert-icon.js
 *
 * This script:
 * 1. Resizes the logo to square dimensions with padding
 * 2. Converts to ICO format with multiple sizes for Windows
 */

import pngToIco from 'png-to-ico';
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '../../../Logo.png');
const outputDir = join(__dirname, '../assets');
const outputPath = join(outputDir, 'icon.ico');
const squarePngPath = join(outputDir, 'icon-square.png');

async function convertIcon() {
  console.log('Converting Logo.png to icon.ico...');
  console.log('Input:', inputPath);
  console.log('Output:', outputPath);

  try {
    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`Original size: ${metadata.width}x${metadata.height}`);

    // Calculate square size (use the larger dimension)
    const size = Math.max(metadata.width ?? 256, metadata.height ?? 256);

    // Create a square version with transparent background
    // Resize to 256x256 which is ideal for ICO files
    const squareBuffer = await sharp(inputPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }, // Transparent background
      })
      .png()
      .toBuffer();

    // Save square PNG (useful for other purposes)
    writeFileSync(squarePngPath, squareBuffer);
    console.log('Created square PNG:', squarePngPath);

    // Convert to ICO
    const icoBuffer = await pngToIco(squareBuffer);

    // Write ICO file
    writeFileSync(outputPath, icoBuffer);

    console.log('Successfully created icon.ico!');
    console.log('Icon files are ready in:', outputDir);
  } catch (error) {
    console.error('Error converting icon:', error);
    process.exit(1);
  }
}

convertIcon();
