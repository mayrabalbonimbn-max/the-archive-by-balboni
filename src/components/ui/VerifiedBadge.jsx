export default function VerifiedBadge({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-label="Conta verificada"
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}
    >
      <circle cx="10" cy="10" r="10" fill="#E86CB4" />
      <path
        d="M5.5 10.5l3 3 6-6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
