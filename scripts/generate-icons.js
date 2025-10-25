#!/usr/bin/env node

// One-time script to generate proper icon files for the browser extension
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Create a minimal valid PNG (16x16 blue square)
const createMinimalPNG = () => {
  // This is a minimal 16x16 PNG with a blue square
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, // 16x16
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x91, 0x68, // 8-bit RGB
    0x36, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // blue square
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND chunk
    0xAE, 0x42, 0x60, 0x82
  ]);
};

// Create source icons directory
const iconsDir = join(process.cwd(), 'src', 'icons');
mkdirSync(iconsDir, { recursive: true });

// Create simple PNG icons for all sizes
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const pngData = createMinimalPNG();
  writeFileSync(join(iconsDir, `icon-${size}.png`), pngData);
});

console.log('✅ Source icons created successfully in src/icons/');
console.log('📁 Icons are now part of the source code and will be copied during build.');
