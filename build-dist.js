// Copies frontend assets to dist/ for Tauri bundling
const fs = require('fs');
const path = require('path');

const root = __dirname;
const dist = path.join(root, 'dist');

// Ensure dist exists
if (!fs.existsSync(dist)) fs.mkdirSync(dist);

// Copy frontend files
const files = ['index.html', 'script.js', 'styles.css', 'favicon.svg'];
for (const file of files) {
    fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

// Copy libs/
const libsSrc = path.join(root, 'libs');
const libsDst = path.join(dist, 'libs');
if (!fs.existsSync(libsDst)) fs.mkdirSync(libsDst);
for (const file of fs.readdirSync(libsSrc)) {
    fs.copyFileSync(path.join(libsSrc, file), path.join(libsDst, file));
}

console.log('Frontend assets copied to dist/');
