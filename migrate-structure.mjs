#!/usr/bin/env node
/**
 * migrate-structure.mjs
 * -----------------------------------------------------------------
 * يعيد تنظيم ملفات src (إعادة تسمية + نقل) ويحدّث كل الاستيرادات النسبية
 * تلقائيًا (JS/JSX: import / export from / dynamic import / require،
 * و SCSS: @use / @forward / @import).
 *
 * الاستخدام (من جذر المشروع):
 *   node migrate-structure.mjs            # تجربة فقط (Dry run) - لا يغيّر شيئًا
 *   node migrate-structure.mjs --apply    # تنفيذ فعلي
 *   node migrate-structure.mjs ./src --apply
 *
 * نصيحة: اعمل commit قبل التنفيذ، ليسهل التراجع (git checkout .).
 * يستخدم `git mv` تلقائيًا إن كان المشروع داخل مستودع git (للحفاظ على التاريخ).
 * -----------------------------------------------------------------
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const SRC = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'src');

/* ================================================================
 * 1) قائمة النقل - عدّلها كما تشاء (المسارات نسبة إلى src)
 * ================================================================ */
const MOVES = [];

/** ينقل مجموعة مكوّنات (jsx + module.scss) من مجلد إلى آخر */
function moveComponents(fromDir, toDir, names, exts = ['.jsx', '.module.scss']) {
  for (const name of names) {
    for (const ext of exts) {
      MOVES.push([`${fromDir}/${name}${ext}`, `${toDir}/${name}${ext}`]);
    }
  }
}

// (أ) تصحيح Botton/Bottom  ->  Button
MOVES.push(['components/ui/Botton/Bottom.jsx', 'components/ui/Button/Button.jsx']);
MOVES.push(['components/ui/Botton/Botton.module.scss', 'components/ui/Button/Button.module.scss']);

// (ب) مكوّنات صفحة Home  ->  pages/home/
moveComponents('pages', 'pages/home', ['Home', 'AppCard', 'ContinueCard', 'QuickStats']);

// (ج) مكوّنات شاشة السبحة  ->  components/zekr/sabh/
//     (لو كان Tabs مكوّنًا عامًا غير خاص بالسبحة احذفه من القائمة)
moveComponents('components/zekr', 'components/zekr/sabh', [
  'ActionButtons',
  'AdhkarSelect',
  'FocusMode',
  'GroupModeView',
  'GroupSelect',
  'SabhModeTabs',
  'Tabs',
  'ZekrDisplay',
]);

// (د) فصل المساعدات والأيقونات عن مكوّنات المعاملات
MOVES.push([
  'components/budget/transactions/transactionsHelpers.js',
  'components/budget/transactions/lib/transactionsHelpers.js',
]);
MOVES.push([
  'components/budget/transactions/transactionsIcons.jsx',
  'components/budget/icons/transactionsIcons.jsx',
]);

/* ================================================================
 * 2) أدوات مساعدة
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
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

/** يحلّل مسار الاستيراد إلى ملف فعلي + نوع الاستيراد (لنعيد بناءه بنفس الأسلوب) */
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

/** يبني المسار المستهدف (بدون امتداد/underscore/index) حسب نوع الاستيراد الأصلي */
function buildTarget(file, kind) {
  switch (kind) {
    case 'exact':
      return file;
    case 'ext':
      return file.slice(0, -path.extname(file).length);
    case 'partial': {
      const noExt = file.slice(0, -path.extname(file).length);
      return path.join(path.dirname(noExt), path.basename(noExt).replace(/^_/, ''));
    }
    case 'index':
      return path.dirname(file);
    default:
      return file;
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
 * 3) التنفيذ
 * ================================================================ */
if (!fs.existsSync(SRC)) {
  console.error(`✖ المجلد غير موجود: ${SRC}`);
  process.exit(1);
}

// خريطة النقل (مسار مطلق قديم -> جديد)
const moveMap = new Map();
for (const [from, to] of MOVES) {
  const a = path.join(SRC, from);
  const b = path.join(SRC, to);
  if (!isFile(a)) {
    console.warn(`⚠ تخطّي (المصدر غير موجود): ${from}`);
    continue;
  }
  if (fs.existsSync(b)) {
    console.error(`✖ الوجهة موجودة مسبقًا: ${to}`);
    process.exit(1);
  }
  moveMap.set(a, b);
}

const files = walk(SRC);
const contentEdits = []; // { file, content }
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
      unresolved.push(`${path.relative(SRC, file)}  ->  ${spec}`);
      return match;
    }
    const newFile = moveMap.get(res.file) ?? res.file;
    if (newFile === res.file && newDir === oldDir) return match; // لا تغيير

    const newSpec = relSpec(newDir, buildTarget(newFile, res.kind));
    if (newSpec === spec) return match;

    changedImports++;
    console.log(`  ${path.relative(SRC, file)}\n      ${spec}  ->  ${newSpec}`);
    return `${pre}${quote}${newSpec}${quote}`;
  });

  if (updated !== original) contentEdits.push({ file, content: updated });
}

console.log('\n──────────── الملخص ────────────');
console.log(`ملفات ستُنقل / تُعاد تسميتها : ${moveMap.size}`);
console.log(`ملفات ستتعدّل استيراداتها     : ${contentEdits.length}`);
console.log(`عدد الاستيرادات المعدّلة      : ${changedImports}`);
if (unresolved.length) {
  console.log(`\n⚠ استيرادات نسبية لم يمكن حلّها (راجعها يدويًا):`);
  unresolved.forEach((u) => console.log('   ' + u));
}

if (!APPLY) {
  console.log('\n(Dry run) لم يتم تغيير أي شيء. أضف --apply للتنفيذ.');
  process.exit(0);
}

// 1) اكتب الاستيرادات المحدّثة في أماكن الملفات القديمة
for (const { file, content } of contentEdits) fs.writeFileSync(file, content);

// 2) انقل الملفات
let useGit = false;
try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: SRC, stdio: 'ignore' });
  useGit = true;
} catch {}

for (const [a, b] of moveMap) {
  fs.mkdirSync(path.dirname(b), { recursive: true });
  if (useGit) {
    try {
      execFileSync('git', ['mv', a, b], { cwd: SRC, stdio: 'ignore' });
      continue;
    } catch {
      /* الملف غير متتبَّع في git، نكمل بالنقل العادي */
    }
  }
  fs.renameSync(a, b);
}

// 3) احذف المجلدات القديمة الفارغة
for (const a of moveMap.keys()) {
  const dir = path.dirname(a);
  try {
    if (dir !== SRC && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  } catch {}
}

console.log('\n✔ تم التنفيذ.');
console.log('الخطوات التالية:');
console.log('  1) افتح ui/Button/Button.jsx وغيّر اسم المكوّن Bottom إلى Button (وأي استيراد يستخدم الاسم القديم).');
console.log('  2) شغّل المشروع: npm run dev  (أو npm run build) وتأكد من عدم وجود أخطاء.');
