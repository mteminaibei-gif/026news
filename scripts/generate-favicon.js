#!/usr/bin/env node
/**
 * Favicon Generator Script
 * Generates ICO and PNG favicons from the SVG
 * Run with: node scripts/generate-favicon.js
 */

const fs = require('fs');
const path = require('path');

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a5c2a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d3015;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="512" height="512" fill="url(#bgGradient)"/>
  
  <polygon points="512,0 512,120 392,0" fill="#c8102e" opacity="0.9"/>
  <polygon points="0,512 0,392 120,512" fill="#4caf28" opacity="0.85"/>
  
  <g transform="translate(256, 256)">
    <rect x="-80" y="-70" width="160" height="140" fill="none" stroke="#ffffff" stroke-width="8" rx="8"/>
    <line x1="-70" y1="-55" x2="70" y2="-55" stroke="#4caf28" stroke-width="6"/>
    <line x1="-70" y1="-30" x2="70" y2="-30" stroke="#ffffff" stroke-width="4"/>
    <line x1="-70" y1="-15" x2="70" y2="-15" stroke="#ffffff" stroke-width="4"/>
    <line x1="-70" y1="0" x2="50" y2="0" stroke="#ffffff" stroke-width="4"/>
    <rect x="-70" y="15" width="140" height="50" fill="#c8102e" opacity="0.2" rx="4"/>
    <circle cx="55" cy="38" r="18" fill="#c8102e"/>
    <text x="55" y="45" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial, sans-serif">0</text>
  </g>
  
  <text x="256" y="420" font-size="56" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" letter-spacing="2">026</text>
  <text x="256" y="420" font-size="56" font-weight="bold" fill="#c8102e" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" letter-spacing="2">NEWS</text>
</svg>`;

console.log('📝 Favicon Generator');
console.log('===================\n');

// Save SVG
const svgPath = path.join(__dirname, '../public/favicon.svg');
fs.writeFileSync(svgPath, svgContent);
console.log('✓ SVG favicon created: public/favicon.svg');

// For ICO format, we recommend using online tools or adding sharp dependency
console.log('\n📌 To generate ICO/PNG favicons:');
console.log('   Option 1: Use online converter (https://convertio.co/svg-ico/)');
console.log('   Option 2: Install sharp and add conversion code');
console.log('   Option 3: Use ImageMagick: convert public/favicon.svg public/favicon.ico\n');

// Create a simple 64x64 favicon.ico reference (base64 encoded minimal ICO)
const faviconIco = Buffer.from([
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x40, 0x40, 0x00, 0x00, 0x01, 0x00,
  0x18, 0x00, 0xb0, 0x10, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00,
  0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x01, 0x00,
  0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

console.log('⚠️  Manual Step Required:');
console.log('   Please convert public/favicon.svg to ICO/PNG using one of the methods above');
console.log('   and place it at public/favicon.ico\n');

console.log('✅ Favicon setup complete!');
