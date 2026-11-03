#!/usr/bin/env node
/**
 * migrate-structure.mjs
 * -----------------------------------------------------------------
 * Reorganizes src files (renames + moves) and updates all relative imports
 * automatically (JS/JSX: import / export from / dynamic import / require,
 * and SCSS: @use / @forward / @import).
 *
 * Usage (from project root):
 * node migrate-structure.mjs            # Dry run (no changes)
 * node migrate-structure.mjs --apply    # Actually apply changes
 * node migrate-structure.mjs ./src --apply
 * -----------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const SRC = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'src');

/* ================================================================
 * 1) MOVES list - Edit as needed (paths relative to src)
 * ================================================================ */
const MOVES = [];

/** Helper: move a group of components (jsx + module.scss) from a dir to another */
function moveComponents(fromDir, toDir, names, exts = ['.jsx', '.module.scss']) {
  for (const name of names) {
    for (const ext of exts) {
      MOVES.push([`${fromDir}/${name}${ext}`, `${toDir}/${name}${ext}`]);
    }
  }
}

// (A) Fix Botton/Bottom -> Button
MOVES.push(['components/ui/Botton/Bottom.jsx', 'components/ui/Button/Button.jsx']);
MOVES.push(['components/ui/Botton/Botton.module.scss', 'components/ui/Button/Button.module.scss']);

// (B) Home page components -> pages/home/
moveComponents('pages', 'pages/home', ['Home', 'AppCard', 'ContinueCard', 'QuickStats']);

// (C) Sabh screen components -> components/zekr/sabh/
moveComponents('components/zekr', 'components/zekr/sabh', [
  'ActionButtons', 'AdhkarSelect', 'FocusMode', 'GroupModeView', 'GroupSelect', 'SabhModeTabs', 'Tabs', 'ZekrDisplay',
]);

// (D) Separate helpers and icons from transactions components
MOVES.push([
  'components/budget/transactions/transactionsHelpers.js',
  'components/budget/transactions/lib/transactionsHelpers.js',
]);
MOVES.push([
  'components/budget/transactions/transactionsIcons.jsx',
  'components/budget/icons/transactionsIcons.jsx',
]);

/* ================================================================
 * 2) Helper functions
 * ================================================================ */
const EXTS = ['.js', '.jsx', '.scss', '.css'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

const isFile = (p) => {
  try { return fs.statSync(p).isFile(); } catch { return false; }
};

/** Resolve import path to actual file + import type */
function resolveSpec(fromDir, spec) {
  const base = path.resolve(fromDir, spec);
  if (isFile(base)) return { file: base, kind: 'exact' };
  for (const ext of EXTS) {
    if (isFile(base + ext)) return { file: base + ext, kind: 'ext' };
  }
  const dir = path.dirname(base);
  const name = path.basename(base);
  for (const ext of ['.scss', '.css']) {
    const partial = path.join(dir, `_${name}${ext}`);
    if (isFile(partial)) return { file: partial, kind: 'partial' };
  }
  for (const idx of ['index.js', 'index.jsx']) {
    if (isFile(path.join(base, idx))) return { file: path.join(base, idx), kind: 'index' };
  }
  return null;
}

/** Build target path based on original import type */
function buildTarget(file, kind) {
  switch (kind) {
    case 'exact': return file;
    case 'ext': return file.slice(0, -path.extname(file).length);
    case 'partial': {
      const noExt = file.slice(0, -path.extname(file).length);
      return path.join(path.dirname(noExt), path.basename(noExt).replace(/^_/, ''));
    }
    case 'index': return path.dirname(file);
    default: return file;
  }
}

function relSpec(fromDir, target) {
  let rel = path.relative(fromDir, target).split(path.sep).join('/');
  if (rel === '') rel = '.';
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

const JS_RE = /(\b(?:from|import|require)\s*\(?\s*)(['"])(\.{1,2}(?:\/[^'"]*)?)\2/g;
const SCSS_RE = /(@(?:use|forward|import)\s+)(['"])(\.{1,2}(?:\/[^'"]*)?)\2/g;

/* ================================================================
 * 3) Execution
 * ================================================================ */
if (!fs.existsSync(SRC)) {
  console.error(`[ERROR] Directory not found: ${SRC}`);
  process.exit(1);
}

const moveMap = new Map();
for (const [from, to] of MOVES) {
  const a = path.join(SRC, from);
  const b = path.join(SRC, to);
  if (!isFile(a)) {
    console.warn(`[SKIP] Source not found: ${from}`);
    continue;
  }
  if (fs.existsSync(b)) {
    console.error(`[ERROR] Target already exists: ${to}`);
    process.exit(1);
  }
  moveMap.set(a, b);
}

const files = walk(SRC);
const contentEdits = [];
const unresolved = [];
let changedImports = 0;

for (const file of files) {
  const oldDir = path.dirname(file);
  const newDir = path.dirname(moveMap.get(file) ?? file);
  const original = fs.readFileSync(file, 'utf8');
  const re = ['.scss', '.css'].includes(path.extname(file)) ? SCSS_RE : JS_RE;

  const updated = original.replace(re, (match, pre, quote, spec) => {
    const res = resolveSpec(oldDir, spec);
    if (!res) {
      unresolved.push(`${path.relative(SRC, file)} -> ${spec}`);
      return match;
    }
    const newFile = moveMap.get(res.file) ?? res.file;
    if (newFile === res.file && newDir === oldDir) return match;

    const newSpec = relSpec(newDir, buildTarget(newFile, res.kind));
    if (newSpec === spec) return match;

    changedImports++;
    console.log(`  ${path.relative(SRC, file)}\n    ${spec} -> ${newSpec}`);
    return `${pre}${quote}${newSpec}${quote}`;
  });

  if (updated !== original) contentEdits.push({ file, content: updated });
}

console.log('\n========== SUMMARY ==========');
console.log(`Files to move/rename       : ${moveMap.size}`);
console.log(`Files with imports updated : ${contentEdits.length}`);
console.log(`Total imports updated      : ${changedImports}`);

if (unresolved.length) {
  console.log(`\n[WARNING] Unresolved relative imports (check manually):`);
  unresolved.forEach((u) => console.log('  ' + u));
}

if (!APPLY) {
  console.log('\n(Dry run) No changes made. Add --apply to execute.');
  process.exit(0);
}

// 1) Write updated imports in old file locations
for (const { file, content } of contentEdits) fs.writeFileSync(file, content);

// 2) Move files
let useGit = false;
try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: SRC, stdio: 'ignore' });
  useGit = true;
} catch { }

for (const [a, b] of moveMap) {
  fs.mkdirSync(path.dirname(b), { recursive: true });
  if (useGit) {
    try {
      execFileSync('git', ['mv', a, b], { cwd: SRC, stdio: 'ignore' });
      continue;
    } catch { }
  }
  fs.renameSync(a, b);
}

// 3) Remove empty old directories
for (const a of moveMap.keys()) {
  const dir = path.dirname(a);
  try {
    if (dir !== SRC && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch { }
}

console.log('\n[SUCCESS] Migration applied.');
console.log('Next steps:');
console.log(' 1) Open ui/Button/Button.jsx and rename the component Bottom to Button.');
console.log(' 2) Run: npm run dev (or npm run build) to verify no errors.');
