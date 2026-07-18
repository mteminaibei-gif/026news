const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

// Only target <Image from="next/image" with fill prop, add sizes if missing + loading="lazy"
// Also target <Image with width/height for loading="lazy"
let count = 0;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // Find all <Image ... /> tags (multi-line possible)
  const tagRegex = /<Image\b([\s\S]*?)\/>/g;
  let match;
  const replacements = [];

  while ((match = tagRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const attrs = match[1];

    // Skip if this is not a next/image import (check import at top of file - skip if not present)
    // But we already know it's from next/image if it's imported

    // Only add sizes to fill images
    const hasFill = /\bfill\b/.test(attrs);
    const hasSizes = /\bsizes\b/.test(attrs);
    const hasLoading = /\bloading\b/.test(attrs);
    const hasPriority = /\bpriority\b/.test(attrs);

    let newTag = fullTag;

    // Add sizes for fill images
    if (hasFill && !hasSizes) {
      // Determine appropriate sizes based on likely use
      let sizes = "";
      if (hasPriority || newTag.includes("aspect-video") || newTag.includes("hero")) {
        sizes = 'sizes="100vw"';
      } else if (newTag.includes("w-14") || newTag.includes("w-12") || newTag.includes("w-10") || newTag.includes("w-[48px]")) {
        sizes = 'sizes="56px"';
      } else if (newTag.includes("w-20")) {
        sizes = 'sizes="80px"';
      } else if (newTag.includes("w-24")) {
        sizes = 'sizes="96px"';
      } else if (newTag.includes("sm:w-24")) {
        sizes = 'sizes="96px"';
      } else if (newTag.includes("max-w")) {
        sizes = 'sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"';
      } else if (newTag.includes("object-contain")) {
        sizes = 'sizes="48px"';
      } else {
        sizes = 'sizes="(max-width: 640px) 100vw, 50vw"';
      }
      newTag = newTag.replace("/>", ` ${sizes}/>`);
    }

    // Add loading="lazy" - but only for non-priority, non-avatar images
    if (!hasLoading && !hasPriority && hasFill) {
      // Skip small thumbnails (likely above fold)
      const smallSize = newTag.includes('sizes="56px"') || newTag.includes('sizes="48px"') || newTag.includes('sizes="40px"') || newTag.includes('sizes="32px"');
      if (!smallSize) {
        newTag = newTag.replace("/>", ' loading="lazy"/>');
      }
    }

    if (newTag !== fullTag) {
      replacements.push({ from: fullTag, to: newTag });
    }
  }

  // Apply replacements in reverse order to maintain positions
  for (const r of replacements.reverse()) {
    // Only replace once (first occurrence)
    const idx = content.indexOf(r.from);
    if (idx !== -1) {
      content = content.slice(0, idx) + r.to + content.slice(idx + r.from.length);
      changed = true;
      count++;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log("FIXED:", path.relative(ROOT, filePath));
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "scripts") walkDir(full);
    } else if (entry.name.endsWith(".tsx")) {
      // Check if file imports from next/image
      const content = fs.readFileSync(full, "utf8");
      if (content.includes('from "next/image"') || content.includes("from 'next/image'")) {
        processFile(full);
      }
    }
  }
}

walkDir(path.join(ROOT, "app"));
walkDir(path.join(ROOT, "components"));

console.log("\nDone! Fixed " + count + " Image components.");
