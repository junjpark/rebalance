import { useEffect, useState } from 'react'

const VIEWS = [
  { label: 'Front (Toe)', emoji: '👟', instruction: 'Toe pointing at camera' },
  { label: 'Lateral Side', emoji: '👞', instruction: 'Right side facing camera' },
  { label: 'Back (Heel)', emoji: '🥾', instruction: 'Heel facing camera' },
  { label: 'Medial Side', emoji: '👞', instruction: 'Left side facing camera' },
  { label: 'Top Down', emoji: '👟', instruction: 'Looking down at shoe' },
  { label: 'Sole', emoji: '🩴', instruction: 'Flip shoe over, sole up' },
] as const

// Simple line-art SVG for each of the 6 angles
function ShoeFront() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="40" cy="52" rx="22" ry="16" />
      <path d="M22 42c-2-8 0-18 8-24s12-8 20 0 10 16 8 24" />
      <path d="M30 50h20" strokeDasharray="3 3" opacity="0.4" />
    </svg>
  )
}

function ShoeSideRight() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 55h60" />
      <path d="M10 55c0-4 2-8 8-10l20-4c6-1 10-6 12-14 1-4 4-6 6-5s3 4 2 8l-4 12" />
      <path d="M70 55c0-3-1-5-3-6" />
      <path d="M10 55c0 3 2 5 5 5h50c3 0 5-2 5-5" />
    </svg>
  )
}

function ShoeBack() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 60h32" />
      <path d="M24 60V34c0-4 3-8 8-10h16c5 2 8 6 8 10v26" />
      <path d="M30 60V42c0-2 2-4 4-4h12c2 0 4 2 4 4v18" strokeDasharray="3 3" opacity="0.5" />
      <ellipse cx="40" cy="32" rx="6" ry="3" opacity="0.4" />
    </svg>
  )
}

function ShoeSideLeft() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M70 55H10" />
      <path d="M70 55c0-4-2-8-8-10l-20-4c-6-1-10-6-12-14-1-4-4-6-6-5s-3 4-2 8l4 12" />
      <path d="M10 55c0-3 1-5 3-6" />
      <path d="M70 55c0 3-2 5-5 5H15c-3 0-5-2-5-5" />
    </svg>
  )
}

function ShoeTop() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 68c-4 0-6-2-6-5V28c0-6 6-14 18-14s18 8 18 14v35c0 3-2 5-6 5" />
      <path d="M28 68h24" />
      <ellipse cx="40" cy="20" rx="12" ry="5" strokeDasharray="3 3" opacity="0.4" />
      <path d="M34 35l6 8 6-8" opacity="0.5" />
      <path d="M34 45l6 8 6-8" opacity="0.3" />
    </svg>
  )
}

function ShoeSole() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M28 12c-8 2-12 8-12 16v24c0 8 6 16 16 18h16c10-2 16-10 16-18V28c0-8-4-14-12-16" />
      <path d="M28 12h24" />
      <path d="M24 38h32" strokeDasharray="4 3" opacity="0.4" />
      <path d="M26 50h28" strokeDasharray="4 3" opacity="0.4" />
      <rect x="30" y="22" width="20" height="10" rx="3" opacity="0.25" />
      <rect x="28" y="55" width="24" height="8" rx="3" opacity="0.25" />
    </svg>
  )
}

const SHOE_SVGS = [ShoeFront, ShoeSideRight, ShoeBack, ShoeSideLeft, ShoeTop, ShoeSole]

export function ShoeAnimation() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setActive((n) => (n + 1) % 6), 2000)
    return () => clearInterval(id)
  }, [])

  const View = SHOE_SVGS[active]

  return (
    <div className="shoe-anim">
      <div className="shoe-anim__frame" key={active}>
        <View />
      </div>
      <div className="shoe-anim__label">{VIEWS[active].instruction}</div>
      <div className="shoe-anim__dots">
        {VIEWS.map((_, i) => (
          <span key={i} className={`shoe-anim__dot ${i === active ? 'shoe-anim__dot--active' : ''}`} />
        ))}
      </div>
    </div>
  )
}

export const ANGLE_LABELS = VIEWS.map((v) => v.label)
export const ANGLE_INSTRUCTIONS = VIEWS.map((v) => v.instruction)
