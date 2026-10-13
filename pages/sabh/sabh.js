// ===========================
// 1. Imports
// ===========================
import {
  getAdhkar,
  getCounts,
  getTargets,
  addClick,
  resetClick,
  setTarget,
} from "../../js/api.js";
// ===========================
//
// 2. DOM Elements
// ===========================
const but = document.querySelector("#button-click");
const zekrCount = document.querySelector(".zekr-count");
const zekrText = document.querySelector(".zekr-text");
const reset = document.querySelector("#button-reset");
const toggleBtn = document.querySelector(".theme-toggle");
const select = document.querySelector(".adhkar-select");

// ===========================
// 3. State
// ===========================
let allAdhkar = [];
let counts = {};
let currentZekrId = null;
let targets = {};

// ===========================
// 4. Functions
// ===========================

// الهدف الفعلي للذكر (المعدّل أو الافتراضي)
function getTarget(zekr) {
  return targets[zekr.id] ?? zekr.default_target ?? null;
}

// عدد الذكر الحالي
function getCurrentCount() {
  return counts[currentZekrId] || 0;
}

// تحديث شريط التقدم الدائري على زر "سبح"
function updateProgressRing(zekr) {
  const target = getTarget(zekr);
  const count = getCurrentCount();

  if (!target) {
    but.style.setProperty("--progress", "0%");
    return;
  }

  const percent = Math.min((count / target) * 100, 100);
  but.style.setProperty("--progress", `${percent}%`);
}

// تحديث الشاشة بالكامل (اسم الذكر + العدد + الهدف + الحلقة)
function updateZekrDisplay(zekr) {
  currentZekrId = zekr.id;
  zekrText.textContent = zekr.text;
  but.textContent = zekr.text;

  const count = getCurrentCount();
  const target = getTarget(zekr);

  if (target) {
    zekrCount.textContent = `${count} / ${target}`;
  } else {
    zekrCount.textContent = count;
  }

  updateProgressRing(zekr);
}
function switchTab(tabName) {
  const allTabs = document.querySelectorAll(".tab");
  const allContents = document.querySelectorAll(".tab-content");

  allTabs.forEach((t) => t.classList.remove("active"));
  allContents.forEach((c) => c.classList.remove("active"));

  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add("active");

  document
    .querySelector(`.tab-content[data-content="${tabName}"]`)
    .classList.add("active");
}
async function loadInitialData() {
  const [adhkar, countsData, targetsData] = await Promise.all([
    getAdhkar(),
    getCounts(),
    getTargets(),
  ]);

  return { adhkar, counts: countsData, targets: targetsData };
}
// ===========================
// 5. Event Listeners
// ===========================

// زر الثيم (تبديل + حفظ)
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
});
// زر "سبح"
but.addEventListener("click", async () => {
  const zekr = allAdhkar.find((z) => z.id === currentZekrId);
  const target = getTarget(zekr);
  const count = getCurrentCount();

  if (target && count >= target) return;

  // 1. Animation
  but.classList.add("clicked");
  setTimeout(() => but.classList.remove("clicked"), 150);

  // 2. تحديث فوري محليًا
  counts[currentZekrId] = count + 1;
  updateZekrDisplay(zekr);

  // 3. إرسال للسيرفر في الخلفية (بدون await)
  addClick(currentZekrId).catch((err) => {
    console.error("فشل تسجيل الضغطة:", err);
    // اختياري: نرجّع العدد للسابق
    // counts[currentZekrId] = count;
    // updateZekrDisplay(zekr);
  });
});// تعديل الهدف (بـ prompt مؤقتًا)
zekrCount.addEventListener("click", async () => {
  const zekr = allAdhkar.find((z) => z.id === currentZekrId);
  const currentTarget = getTarget(zekr);

  const input = prompt("الهدف الجديد:", currentTarget ?? "");
  if (input === null) return;

  const newTarget = Number(input);
  if (isNaN(newTarget) || newTarget < 1 || newTarget > 10000) {
    alert("الرجاء إدخال رقم صحيح بين 1 و 10000");
    return;
  }

  try {
    await setTarget(currentZekrId, newTarget);
    targets[currentZekrId] = newTarget;
    updateZekrDisplay(zekr);
  } catch (err) {
    console.error("فشل تعديل الهدف:", err);
  }
});
// زر "مسح"
reset.addEventListener("click", async () => {
  try {
    await resetClick(currentZekrId);
    counts[currentZekrId] = 0;
    const zekr = allAdhkar.find((z) => z.id === currentZekrId);
    updateZekrDisplay(zekr);
  } catch (err) {
    console.error("فشل تصفير العدد:", err);
  }
});
// تغيير الذكر من الـ select
select.addEventListener("change", () => {
  const selectedId = select.value;
  const selectedZekr = allAdhkar.find((z) => z.id === selectedId);
  updateZekrDisplay(selectedZekr);
});

// اختصار الكيبورد (Space = سبح)
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    but.click();
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    switchTab(tab.dataset.tab);
  });
});

// ===========================
// 6. Initialization
// ===========================

// استرجاع الثيم المحفوظ
// theme من localStorage (لسه بنستخدم storage للثيم)
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

loadInitialData()
  .then(({ adhkar, counts: countsData, targets: targetsData }) => {
    allAdhkar = adhkar;
    counts = countsData;
    targets = targetsData;

    adhkar.forEach((zekr) => {
      const option = document.createElement("option");
      option.textContent = zekr.text;
      option.value = zekr.id;
      select.appendChild(option);
    });

    updateZekrDisplay(allAdhkar[0]);
  })
  .catch((err) => {
    console.error("فشل تحميل البيانات:", err);
  });
