import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, "..", "pages", "sabh", "adhkar.json");

// نتأكد إن الجدول فاضي
const count = db.prepare("SELECT COUNT(*) AS c FROM adhkar").get().c;

if (count > 0) {
  console.log(`الأذكار موجودة بالفعل (${count} ذكر)`);
  process.exit(0);
}

// نقرأ الـ JSON
const adhkar = JSON.parse(readFileSync(jsonPath, "utf-8"));

// نُدخل الأذكار
const insert = db.prepare(
  "INSERT INTO adhkar (id, text, default_target) VALUES (?, ?, ?)",
);

for (const zekr of adhkar) {
  insert.run(zekr.id, zekr.text, zekr.target ?? null);
}

console.log(`تمت إضافة ${adhkar.length} ذكر`);
