import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconReturn } from '../components/icons'
import { ANGLE_INSTRUCTIONS, ShoeAnimation } from '../components/ShoeAnimation'
import './returns.css'

const API_URL = 'http://localhost:3000/api/assess-return'

const SLOTS = [
  { key: 'front', label: 'Front (Toe)', instruction: ANGLE_INSTRUCTIONS[0] },
  { key: 'lateral', label: 'Lateral Side', instruction: ANGLE_INSTRUCTIONS[1] },
  { key: 'back', label: 'Back (Heel)', instruction: ANGLE_INSTRUCTIONS[2] },
  { key: 'medial', label: 'Medial Side', instruction: ANGLE_INSTRUCTIONS[3] },
  { key: 'top', label: 'Top Down', instruction: ANGLE_INSTRUCTIONS[4] },
  { key: 'sole', label: 'Sole', instruction: ANGLE_INSTRUCTIONS[5] },
] as const

type SlotKey = (typeof SLOTS)[number]['key']

// Fake orders for the flow
const MOCK_ORDERS = [
  { id: 'NB-20260212-4821', name: 'New Balance 990v6', size: '10.5', color: 'Grey', date: 'Feb 12, 2026', price: '$199.99' },
  { id: 'NB-20260128-3305', name: 'Fresh Foam X Hierro v9', size: '10.5', color: 'Desert Clay / Earth Shadow / Urgent Red', date: 'Jan 28, 2026', price: '$149.99' },
  { id: 'NB-20260115-2190', name: 'New Balance FuelCell Rebel v4', size: '11', color: 'Neon Dragonfly', date: 'Jan 15, 2026', price: '$139.99' },
]

type Verdict = 'full_refund' | 'trade_in' | 'not_eligible'

interface AssessmentResult {
  verdict: Verdict
  confidence: number
  condition: string
  reasoning: string
  issues: string[]
}

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; bg: string; icon: string }> = {
  full_refund: { label: 'Full Refund', color: '#15803d', bg: '#f0fdf4', icon: '✓' },
  trade_in: { label: 'Trade-In Voucher', color: '#b45309', bg: '#fffbeb', icon: '↻' },
  not_eligible: { label: 'Not Eligible', color: '#b91c1c', bg: '#fef2f2', icon: '✕' },
}

type Step = 'select' | 'upload' | 'result'

export function ReturnsPage() {
  const [step, setStep] = useState<Step>('select')
  const [selectedOrder, setSelectedOrder] = useState<(typeof MOCK_ORDERS)[number] | null>(null)
  const [files, setFiles] = useState<Record<SlotKey, File | null>>({
    front: null, lateral: null, back: null, medial: null, top: null, sole: null,
  })
  const [previews, setPreviews] = useState<Record<SlotKey, string | null>>({
    front: null, lateral: null, back: null, medial: null, top: null, sole: null,
  })
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Record<SlotKey, HTMLInputElement | null>>({
    front: null, lateral: null, back: null, medial: null, top: null, sole: null,
  })

  const filledCount = Object.values(files).filter(Boolean).length
  const allFilled = filledCount === 6

  const handleFile = useCallback((key: SlotKey, f: File) => {
    setFiles((prev) => ({ ...prev, [key]: f }))
    setError(null)
    const reader = new FileReader()
    reader.onload = () =>
      setPreviews((prev) => ({ ...prev, [key]: reader.result as string }))
    reader.readAsDataURL(f)
  }, [])

  const submit = useCallback(async () => {
    if (!allFilled) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      for (const slot of SLOTS) {
        form.append(slot.key, files[slot.key]!)
      }
      if (selectedOrder) {
        form.append('shoe_name', selectedOrder.name)
        form.append('colorway', selectedOrder.color)
      }
      const res = await fetch(API_URL, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      setResult(data)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment failed')
    } finally {
      setLoading(false)
    }
  }, [allFilled, files])

  const startOver = useCallback(() => {
    setStep('select')
    setSelectedOrder(null)
    setFiles({ front: null, lateral: null, back: null, medial: null, top: null, sole: null })
    setPreviews({ front: null, lateral: null, back: null, medial: null, top: null, sole: null })
    setResult(null)
    setError(null)
    for (const ref of Object.values(inputRefs.current)) {
      if (ref) ref.value = ''
    }
  }, [])

  return (
    <div className="ret">
      <header className="ret-header">
        <Link to="/" className="ret-header__back" aria-label="Back to account">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="ret-header__brand">
          <IconReturn className="ret-header__icon" />
          <span className="ret-header__title">Returns</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="ret-progress">
        {(['select', 'upload', 'result'] as Step[]).map((s, i) => (
          <div key={s} className={`ret-progress__step ${step === s ? 'ret-progress__step--active' : ''} ${(['select', 'upload', 'result'].indexOf(step) > i) ? 'ret-progress__step--done' : ''}`}>
            <span className="ret-progress__num">{i + 1}</span>
            <span className="ret-progress__label">
              {s === 'select' ? 'Select Item' : s === 'upload' ? 'Upload Photos' : 'Verdict'}
            </span>
          </div>
        ))}
      </div>

      <main className="ret-main">
        {/* Step 1: Select order */}
        {step === 'select' && (
          <div className="ret-step">
            <h2 className="ret-step__title">Which item are you returning?</h2>
            <p className="ret-step__subtitle">Select the order containing the item you'd like to return.</p>
            <div className="ret-orders">
              {MOCK_ORDERS.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`ret-order ${selectedOrder?.id === order.id ? 'ret-order--selected' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="ret-order__main">
                    <span className="ret-order__name">{order.name}</span>
                    <span className="ret-order__meta">Size {order.size} · {order.color}</span>
                  </div>
                  <div className="ret-order__right">
                    <span className="ret-order__price">{order.price}</span>
                    <span className="ret-order__date">{order.date}</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="ret-btn ret-btn--primary ret-btn--lg"
              disabled={!selectedOrder}
              onClick={() => setStep('upload')}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Upload 6 photos */}
        {step === 'upload' && (
          <div className="ret-step">
            <div className="ret-step__order-badge">
              Returning: <strong>{selectedOrder?.name}</strong> — {selectedOrder?.id}
            </div>

            <ShoeAnimation />

            <h2 className="ret-step__title">Photograph your shoe from 6 angles</h2>
            <p className="ret-step__subtitle">
              We'll assess the condition to determine your return eligibility.
            </p>

            <div className="ret-slot-grid">
              {SLOTS.map((slot, i) => {
                const preview = previews[slot.key]
                return (
                  <div
                    key={slot.key}
                    className={`ret-slot ${preview ? 'ret-slot--filled' : ''}`}
                    onClick={() => inputRefs.current[slot.key]?.click()}
                  >
                    <input
                      ref={(el) => { inputRefs.current[slot.key] = el }}
                      type="file"
                      accept="image/*"
                      className="ret-slot__input"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFile(slot.key, f)
                      }}
                    />
                    {preview ? (
                      <img src={preview} alt={slot.label} className="ret-slot__thumb" />
                    ) : (
                      <>
                        <span className="ret-slot__number">{i + 1}</span>
                        <span className="ret-slot__label">{slot.label}</span>
                        <span className="ret-slot__hint">{slot.instruction}</span>
                      </>
                    )}
                    {preview && <span className="ret-slot__check">✓</span>}
                  </div>
                )
              })}
            </div>

            {error && <p className="ret-error">{error}</p>}

            <div className="ret-step__actions">
              <button
                type="button"
                className="ret-btn ret-btn--ghost"
                onClick={() => setStep('select')}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                className="ret-btn ret-btn--primary ret-btn--lg"
                onClick={submit}
                disabled={!allFilled || loading}
              >
                {loading ? 'Assessing condition…' : `Submit for assessment (${filledCount}/6)`}
              </button>
            </div>

            {loading && (
              <div className="ret-loading">
                <div className="ret-loading__track"><div className="ret-loading__fill" /></div>
                <p>Analyzing shoe condition across all 6 angles…</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Verdict */}
        {step === 'result' && result && (
          <div className="ret-step">
            <div className="ret-step__order-badge">
              Returning: <strong>{selectedOrder?.name}</strong> — {selectedOrder?.id}
            </div>

            {(() => {
              const cfg = VERDICT_CONFIG[result.verdict]
              return (
                <div className="ret-verdict" style={{ borderColor: cfg.color, background: cfg.bg }}>
                  <span className="ret-verdict__icon" style={{ background: cfg.color }}>{cfg.icon}</span>
                  <div className="ret-verdict__body">
                    <h2 className="ret-verdict__label" style={{ color: cfg.color }}>{cfg.label}</h2>
                    <p className="ret-verdict__condition">{result.condition}</p>
                  </div>
                  <div className="ret-verdict__confidence">
                    <span className="ret-verdict__pct">{result.confidence}%</span>
                    <span className="ret-verdict__conf-label">confidence</span>
                  </div>
                </div>
              )
            })()}

            <div className="ret-reasoning">
              <h3 className="ret-reasoning__title">Assessment Details</h3>
              <p className="ret-reasoning__text">{result.reasoning}</p>

              {result.issues.length > 0 && (
                <div className="ret-issues">
                  <h4 className="ret-issues__title">Issues Found</h4>
                  <ul className="ret-issues__list">
                    {result.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {result.verdict === 'full_refund' && (
              <div className="ret-next-step">
                <p>Your item qualifies for a <strong>full refund</strong>. Print a return label and ship the item back within 14 days.</p>
                <button type="button" className="ret-btn ret-btn--primary ret-btn--lg" disabled>
                  Print return label
                </button>
              </div>
            )}

            {result.verdict === 'trade_in' && (
              <div className="ret-next-step">
                <p>This item shows some wear but can still be resold. You're eligible for a <strong>trade-in voucher</strong> toward your next purchase.</p>
                <button type="button" className="ret-btn ret-btn--primary ret-btn--lg" disabled>
                  Accept trade-in voucher
                </button>
              </div>
            )}

            {result.verdict === 'not_eligible' && (
              <div className="ret-next-step">
                <p>Unfortunately, this item has damage beyond what we can accept for return or trade-in.</p>
              </div>
            )}

            <div className="ret-step__actions">
              <button type="button" className="ret-btn ret-btn--ghost" onClick={startOver}>
                Start a new return
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
