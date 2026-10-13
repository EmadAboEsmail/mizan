import express from "express";
import db from "./db.js";

const app = express();
app.use(express.json());
const PORT = 3000;

// مسار الترحيب
app.get("/", (req, res) => {
  res.send("Hello from Zekr backend!");
});

// الأذكار
app.get("/api/adhkar", (req, res) => {
  const adhkar = db.prepare("SELECT * FROM adhkar").all();
  res.json(adhkar);
});
// الأعداد الحالية
app.get("/api/counts", (req, res) => {
  const rows = db.prepare("SELECT zekr_id, count FROM counts").all();
  const counts = {};

  for (const row of rows) {
    counts[row.zekr_id] = row.count;
  }

  res.json(counts);
});

app.post("/api/clicks", (req, res) => {
  const { zekr_id } = req.body;

  if (!zekr_id) {
    return res.status(400).json({ error: "zekr_id مطلوب" });
  }

  const zekr = db.prepare("SELECT id FROM adhkar WHERE id = ?").get(zekr_id);
  if (!zekr) {
    return res.status(404).json({ error: "الذكر غير موجود" });
  }

  // transaction
  const addClick = db.transaction((id) => {
    const now = Date.now();

    // 1. سجّل الضغطة
    db.prepare("INSERT INTO clicks (zekr_id, timestamp) VALUES (?, ?)").run(
      id,
      now,
    );

    // 2. زوّد العدد
    db.prepare(
      `
      INSERT INTO counts (zekr_id, count) VALUES (?, 1)
      ON CONFLICT(zekr_id) DO UPDATE SET count = count + 1
    `,
    ).run(id);
  });

  addClick(zekr_id);

  const row = db
    .prepare("SELECT count FROM counts WHERE zekr_id = ?")
    .get(zekr_id);
  res.json({ count: row.count });
});
// تعديل الهدف
app.post("/api/targets", (req, res) => {
  const { zekr_id, target } = req.body;

  // التحقق
  if (!zekr_id || target === undefined) {
    return res.status(400).json({ error: "zekr_id و target مطلوبين" });
  }

  if (!Number.isInteger(target) || target < 1 || target > 10000) {
    return res
      .status(400)
      .json({ error: "target لازم يكون رقم صحيح من 1 لـ 10000" });
  }

  // التأكد إن الذكر موجود
  const zekr = db.prepare("SELECT id FROM adhkar WHERE id = ?").get(zekr_id);
  if (!zekr) {
    return res.status(404).json({ error: "الذكر غير موجود" });
  }

  // Upsert الهدف
  db.prepare(
    `
    INSERT INTO targets (zekr_id, target) VALUES (?, ?)
    ON CONFLICT(zekr_id) DO UPDATE SET target = excluded.target
  `,
  ).run(zekr_id, target);

  res.json({ ok: true });
});


// تصفير عدد ذكر
app.delete('/api/clicks/:zekr_id', (req, res) => {
  const { zekr_id } = req.params;

  // التأكد إن الذكر موجود
  const zekr = db.prepare('SELECT id FROM adhkar WHERE id = ?').get(zekr_id);
  if (!zekr) {
    return res.status(404).json({ error: 'الذكر غير موجود' });
  }

  // نصفّر العدد (Upsert)
  db.prepare(`
    INSERT INTO counts (zekr_id, count) VALUES (?, 0)
    ON CONFLICT(zekr_id) DO UPDATE SET count = 0
  `).run(zekr_id);

  res.json({ ok: true });
});









app.listen(PORT, () => {
  console.log(`السيرفر شغال على http://localhost:${PORT}`);
});
