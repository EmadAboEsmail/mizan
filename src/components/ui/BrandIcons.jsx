/**
 * أيقونات مخصصة لهوية «مِيزان» الدافئة
 * مصممة بخطوط نظيفة تتكامل مع lucide-react
 */

/** شعار مِيزان — نجمة ثمانية هادئة ترمز للتوازن والسكينة */
export function MizanMark({ size = 22, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="5" y="5" width="14" height="14" rx="2.2" />
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2.2"
        transform="rotate(45 12 12)"
      />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** أيقونة السبحة — حلقة حبات متناغمة مع الشاهد */
export function TasbihIcon({ size = 22, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="13" r="6.5" strokeDasharray="1.5 3.6" strokeWidth="2.4" />
      <circle cx="12" cy="6.2" r="1.7" fill="currentColor" stroke="none" />
      <path d="M12 4.5V2.2" strokeWidth="1.8" />
      <path d="M10.4 2.4L12 4l1.6-1.6" strokeWidth="1.6" />
    </svg>
  )
}
