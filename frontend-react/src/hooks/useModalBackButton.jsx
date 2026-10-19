
import { useEffect, useRef } from 'react';

// الـ Stack العام لتتبع المودالات المفتوحة بالتسلسل
const stack = [];
let isListenerInitialized = false;

// دالة معالجة حدث الرجوع في المتصفح
function handlePopState(e) {
  const top = stack[stack.length - 1];
  if (!top) return;

  // إذا كان الـ state الحالي يخص المودال الموجود في قمة الستاك، فلا نغلقه
  if (e.state?.__modalId === top.id) return;

  // خلاف ذلك، فهذا يعني أن المستخدم ضغط زر الرجوع لإغلاق المودال العلوي
  top.poppedByBack = true;
  top.onClose();
}

function initGlobalListener() {
  if (isListenerInitialized) return;
  isListenerInitialized = true;
  window.addEventListener('popstate', handlePopState);
}

function removeGlobalListenerIfNeeded() {
  // إزالة الـ Listener إذا لم تعد هناك أي مودالات مفتوحة لتنظيف الذاكرة
  if (stack.length === 0 && isListenerInitialized) {
    window.removeEventListener('popstate', handlePopState);
    isListenerInitialized = false;
  }
}

export function useModalBackButton(isOpen, onClose) {
  const onCloseRef = useRef(onClose);

  // ضمان ثبات الـ ID طوال دورة حياة المودال وعدم تغيره مع إعادة الـ Renders أو Strict Mode
  const idRef = useRef(null);
  if (!idRef.current) {
    idRef.current = `modal-${Math.random().toString(36).substring(2, 9)}`;
  }

  // تحديث مرجع الـ callback دائمًا بدون إعادة تشغيل الـ Effect الأساسي
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    initGlobalListener();
    const currentId = idRef.current;

    const entry = {
      id: currentId,
      onClose: () => onCloseRef.current?.(),
      poppedByBack: false,
    };

    stack.push(entry);

    // إضافة حالة جديدة لـ History مع الاحتفاظ بالحالة السابقة
    window.history.pushState(
      { ...window.history.state, __modalId: currentId },
      ''
    );

    return () => {
      // إزالة المودال من الستاك عند إغلاقه أو إلغاء تثبيت المكون (Unmount)
      const idx = stack.indexOf(entry);
      if (idx !== -1) {
        stack.splice(idx, 1);
      }

      removeGlobalListenerIfNeeded();

      // إذا تم إغلاق المودال برمجياً (مثلاً الضغط على زر X أو Backdrop وليس زر الـ Back)
      // يجب علينا إزالة الـ History State الذي أضفناه يدويًا حتى لا يتخلف سجل المتصفح
      if (!entry.poppedByBack && window.history.state?.__modalId === currentId) {
        window.history.back();
      }
    };
  }, [isOpen]);
}

