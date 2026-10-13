// حفظ
export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// قراءة
export function load(key, fallback = null) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error(`خطأ في قراءة ${key}:`, e);
    return fallback;
  }
}

// حذف
export function remove(key) {
  localStorage.removeItem(key);
}

// مسح الكل
export function clear() {
  localStorage.clear();
}

// هل المفتاح موجود؟
export function has(key) {
  return localStorage.getItem(key) !== null;
}
