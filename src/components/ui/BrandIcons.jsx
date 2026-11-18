/**
 * أيقونات الهوية البصرية لـ «مِيزان»
 * متطابقة مع أيقونة التطبيق الرسمية ومصممة لتبقى واضحة من 15px حتى 64px
 */

const TASBIH_BEADS = [
  [15.4, 8.8],
  [17.8, 11.4],
  [18.2, 14.9],
  [16.8, 18.2],
  [13.8, 20.1],
  [10.2, 20.1],
  [7.2, 18.2],
  [5.8, 14.9],
  [6.2, 11.4],
  [8.6, 8.8],
]

/**
 * شعار «مِيزان» — ميزان متوازن بكفّتين متقابلتين ونجمة توازن علوية.
 * @param {object} props
 * @param {number} [props.size=22]
 * @param {string} [props.accentColor] لون اختياري لرأس الميزان ونقطة الارتكاز
 */
export function MizanMark({ size = 22, accentColor, ...props }) {
  const jewel = accentColor || 'currentColor'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {/* رأس الميزان */}
      <path
        d="M12 2.4C12.35 3.55 12.85 4.05 13.85 4.4C12.85 4.75 12.35 5.25 12 6.4C11.65 5.25 11.15 4.75 10.15 4.4C11.15 4.05 11.65 3.55 12 2.4Z"
        fill={jewel}
      />

      {/* ذراع الميزان المتوازن */}
      <path
        d="M4.5 8.5Q8.25 7.6 12 8.25Q15.75 7.6 19.5 8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {/* العمود الأوسط */}
      <path
        d="M12 9.6V19.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* خيوط وكفّة اليسار */}
      <path
        d="M4.6 8.8L2.5 14M4.6 8.8L6.7 14"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M2 13.8H7.2C7.05 15.65 5.95 16.85 4.6 16.85C3.25 16.85 2.15 15.65 2 13.8Z"
        fill="currentColor"
      />

      {/* خيوط وكفّة اليمين */}
      <path
        d="M19.4 8.8L17.3 14M19.4 8.8L21.5 14"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M16.8 13.8H22C21.85 15.65 20.75 16.85 19.4 16.85C18.05 16.85 16.95 15.65 16.8 13.8Z"
        fill="currentColor"
      />

      {/* حلقة الارتكاز */}
      <circle cx="12" cy="8.35" r="1.45" fill={jewel} />

      {/* القاعدة المتدرجة */}
      <path
        d="M9.2 19.2H14.8M7.6 21H16.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * أيقونة السبحة — حلقة حبّات دائرية واضحة يتوّجها الشاهد والشرابة.
 */
export function TasbihIcon({ size = 22, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {/* الشرابة */}
      <path
        d="M12 5.4V3.4M12 3.5L10.5 2.1M12 3.5L13.5 2.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* الشاهد (الإمام) */}
      <rect x="10.85" y="5.1" width="2.3" height="3.7" rx="1.15" fill="currentColor" />
      {/* حبّات السبحة */}
      {TASBIH_BEADS.map(([cx, cy], idx) => (
        <circle key={idx} cx={cx} cy={cy} r="1.32" fill="currentColor" />
      ))}
    </svg>
  )
}

/**
 * أيقونة الميزانية — محفظة أنيقة بقفل دائري وخطوط متناغمة مع هوية مِيزان.
 */
export function BudgetIcon({ size = 22, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 7.5V6.2A2.2 2.2 0 0 1 7.2 4h10.3A1.8 1.8 0 0 1 19.3 5.8V7.5" />
      <rect x="3.2" y="7.5" width="17.6" height="12.5" rx="2.8" />
      <path d="M15.4 11.7H20.8V15.7H15.4a2 2 0 0 1 0-4Z" />
      <circle cx="15.8" cy="13.7" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  )
}
