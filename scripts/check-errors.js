const fs = require('fs');
const path = require('path');

function findFiles(dir, ext) {
  const results = [];
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory() && !f.name.startsWith('.') && f.name !== 'node_modules' && f.name !== '.next') results.push(...findFiles(full, ext));
    else if (f.name.endsWith(ext)) results.push(full);
  }
  return results;
}

const issues = [];
for (const file of findFiles('.', '.tsx')) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // border: 'none' or border: '0' + longhand
    if (/border:\s*'none'/.test(line) || /border:\s*'0'/.test(line)) {
      for (let j = i+1; j < Math.min(i + 10, lines.length); j++) {
        if (/border(Bottom|Top|Left|Right)(Color|Width)?:/.test(lines[j])) {
          issues.push({ file: file.replace(/\\/g,'/'), line: i+1, longhandLine: j+1, issue: 'border:none + longhand', detail: lines[j].trim() });
          break;
        }
      }
    }
    // border shorthand + borderColor (not borderWidth/borderStyle which we use intentionally)
    if (/border:\s*'[^']*\d+px/.test(line)) {
      for (let j = i+1; j < Math.min(i + 12, lines.length); j++) {
        if (/borderColor:/.test(lines[j])) {
          issues.push({ file: file.replace(/\\/g,'/'), line: i+1, longhandLine: j+1, issue: 'border shorthand + borderColor', detail: lines[j].trim() });
          break;
        }
      }
    }
    // Also check: boxShadow spread with border shorthand
    if (/border:\s*'[^']*\d+px/.test(line)) {
      for (let j = i+1; j < Math.min(i + 12, lines.length); j++) {
        if (/boxShadow:/.test(lines[j]) && !/\.forEach|\.map/.test(lines[j])) {
          // boxShadow is fine with border, skip
        }
      }
    }
  }
}

console.log('=== BORDER CONFLICTS ===');
if (issues.length === 0) console.log('None found.');
else issues.forEach(i => console.log(i.file + ':' + i.line + ' -> L' + i.longhandLine + ' | ' + i.issue + ': ' + i.detail));

// Check useSearchParams without Suspense
console.log('\n=== useSEARCHPARAMS WITHOUT SUSPENSE ===');
const filesUsingUSP = [];
for (const file of findFiles('.', '.tsx')) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('useSearchParams')) {
    // Check if wrapped in Suspense
    const hasSuspense = content.includes('<Suspense') || content.includes('suspense');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('useSearchParams')) {
        filesUsingUSP.push({ file: file.replace(/\\/g,'/'), line: i+1, hasSuspense });
      }
    }
  }
}
filesUsingUSP.forEach(f => {
  const status = f.hasSuspense ? 'OK (has Suspense)' : 'MISSING SUSPENSE';
  console.log(f.file + ':' + f.line + ' - ' + status);
});

// Check for useEffect without deps
console.log('\n=== useEffect WITHOUT DEPENDENCY ARRAY ===');
for (const file of findFiles('.', '.tsx')) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/useEffect\(\(\)\s*=>/.test(lines[i])) {
      // Find closing of useEffect - look for })  or }), [ without ] before
      let foundEnd = false;
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        if (/^\s*\}\)$/.test(lines[j]) || /^\s*\}\s*\)$/.test(lines[j])) {
          // No deps array!
          console.log(file.replace(/\\/g,'/') + ':' + (i+1) + ' - useEffect without deps (ends at L' + (j+1) + ')');
          foundEnd = true;
          break;
        }
        if (/^\s*\},\s*\[/.test(lines[j])) {
          foundEnd = true;
          break;
        }
      }
    }
  }
}

// Check for duplicate keys in .map
console.log('\n=== POTENTIAL DUPLICATE KEYS ===');
for (const file of findFiles('.', '.tsx')) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/\.map\(/.test(lines[i])) {
      // Find the key prop in next few lines
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        if (/key=\{[^}]*\}/.test(lines[j])) {
          const keyMatch = lines[j].match(/key=\{([^}]*)\}/);
          if (keyMatch) {
            const keyExpr = keyMatch[1].trim();
            // Flag if key is just a string variable (not index, not composite)
            if (/^[a-z_]+\.[a-z_]+$/.test(keyExpr) || /^[a-z_]+$/.test(keyExpr)) {
              // These are fine if unique from DB
            }
          }
          break;
        }
      }
    }
  }
}
