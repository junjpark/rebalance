type IconProps = { className?: string }

export function IconOrders({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M4 11h16" strokeLinecap="round" />
    </svg>
  )
}

export function IconPerson({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M6 20v-1.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V20" strokeLinecap="round" />
    </svg>
  )
}

export function IconCard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" strokeLinecap="round" />
    </svg>
  )
}

export function IconPin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconSliders({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 7h4M15 7h5M4 12h10M14 12h6M4 17h7M13 17h7" strokeLinecap="round" />
      <circle cx="10" cy="7" r="1.75" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.75" fill="currentColor" stroke="none" />
      <circle cx="11" cy="17" r="1.75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconFootScan({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 4c-1 2-2 5-1 8 .5 2 2 3.5 3.5 5 1 1 1.5 2.5 1.5 4" strokeLinecap="round" />
      <path d="M12 3c0 3-.5 6 0 8 .8 3 3 5 4 7" strokeLinecap="round" />
      <path d="M16 4c1 2 2 5 1 8-.5 2-2 3.5-3.5 5-1 1-1.5 2.5-1.5 4" strokeLinecap="round" />
      <path d="M6 14l2 1M18 14l-2 1" strokeLinecap="round" />
    </svg>
  )
}

export function IconBarcode({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="2" y="4" width="1.2" height="16" rx="0.3" />
      <rect x="4.5" y="4" width="2" height="16" rx="0.3" />
      <rect x="7.5" y="4" width="1" height="16" rx="0.3" />
      <rect x="9.5" y="4" width="3" height="16" rx="0.3" />
      <rect x="13.5" y="4" width="1" height="16" rx="0.3" />
      <rect x="15.5" y="4" width="2.2" height="16" rx="0.3" />
      <rect x="18.5" y="4" width="1" height="16" rx="0.3" />
      <rect x="20.8" y="4" width="1.2" height="16" rx="0.3" />
    </svg>
  )
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15 15l5 5" strokeLinecap="round" />
    </svg>
  )
}

export function IconUserOutline({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M6.5 20.5v-.5a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v.5" strokeLinecap="round" />
    </svg>
  )
}

export function IconBag({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 8V6a4 4 0 0 1 8 0v2" strokeLinecap="round" />
      <rect x="5" y="8" width="14" height="13" rx="2" />
      <path d="M9 12v2M15 12v2" strokeLinecap="round" />
    </svg>
  )
}

