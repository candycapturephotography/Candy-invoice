/**
 * Script to copy the built web app to the electron dist folder.
 * Run after building the web app: cd packages/web && pnpm build
 *
 * This is used when electron-vite cannot build the renderer due to
 * the web app's own build dependencies.
 */

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const webDistPath = join(__dirname, '../../web/dist');
const electronRendererPath = join(__dirname, '../dist/renderer');

function copyWebDist() {
  console.log('Copying web app dist to electron renderer...');
  console.log('Source:', webDistPath);
  console.log('Destination:', electronRendererPath);

  // Check if web dist exists
  if (!existsSync(webDistPath)) {
    console.warn('Warning: Web dist folder does not exist.');
    console.warn('Please build the web app first: cd packages/web && pnpm build');
    console.warn('Creating empty renderer folder...');

    // Create an empty renderer folder with a placeholder
    if (!existsSync(electronRendererPath)) {
      mkdirSync(electronRendererPath, { recursive: true });
    }

    // Create a placeholder HTML file for development
    const placeholderHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CandyCapture Photography</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%);
      color: #831843;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      color: #E91E63;
      margin-bottom: 1rem;
    }
    p {
      color: #9D174D;
    }
    code {
      background: #FBCFE8;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🍬 CandyCapture Photography</h1>
    <p>Web app not built yet.</p>
    <p>Run <code>cd packages/web && pnpm build</code> first.</p>
  </div>
</body>
</html>`;
    writeFileSync(join(electronRendererPath, 'index.html'), placeholderHtml);
    console.log('Created placeholder index.html');
    return;
  }

  // Remove existing renderer folder if it exists
  if (existsSync(electronRendererPath)) {
    rmSync(electronRendererPath, { recursive: true });
    console.log('Removed existing renderer folder.');
  }

  // Create renderer directory
  mkdirSync(electronRendererPath, { recursive: true });

  // Copy web dist to renderer
  cpSync(webDistPath, electronRendererPath, { recursive: true });
  console.log('Successfully copied web app to electron renderer!');
}

copyWebDist();
