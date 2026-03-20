import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBarcode } from '../components/icons'
import { ANGLE_INSTRUCTIONS, ShoeAnimation } from '../components/ShoeAnimation'
import './rebalance.css'

const API_URL = 'http://localhost:3000/api/analyze-shoe'

const SLOTS = [
  { key: 'front', label: 'Front (Toe)', instruction: ANGLE_INSTRUCTIONS[0] },
  { key: 'lateral', label: 'Lateral Side', instruction: ANGLE_INSTRUCTIONS[1] },
  { key: 'back', label: 'Back (Heel)', instruction: ANGLE_INSTRUCTIONS[2] },
  { key: 'medial', label: 'Medial Side', instruction: ANGLE_INSTRUCTIONS[3] },
  { key: 'top', label: 'Top Down', instruction: ANGLE_INSTRUCTIONS[4] },
  { key: 'sole', label: 'Sole', instruction: ANGLE_INSTRUCTIONS[5] },
] as const

type SlotKey = (typeof SLOTS)[number]['key']

interface LocationResult {
  location: string
  damaged: boolean
  confidence: number
  damage_type: 'structural' | 'surface_wear' | 'sole_degradation' | 'missing_parts' | null
  description: string
  bbox: [number, number, number, number] | null
}

interface AnalysisResponse {
  locations: LocationResult[]
  summary: Record<string, number>
}

function confidenceColor(c: number) {
  if (c >= 80) return '#ef4444'
  if (c >= 50) return '#f97316'
  return '#f59e0b'
}

const DAMAGE_TYPE_LABEL: Record<string, string> = {
  structural: 'Structural',
  surface_wear: 'Surface Wear',
  sole_degradation: 'Sole Degradation',
  missing_parts: 'Missing Parts',
}

function damageTypeColor(t: string | null) {
  if (t === 'structural') return '#dc2626'
  if (t === 'surface_wear') return '#d97706'
  if (t === 'sole_degradation') return '#ea580c'
  if (t === 'missing_parts') return '#7c3aed'
  return '#a3a3a3'
}

export function RebalancePage() {
  const [files, setFiles] = useState<Record<SlotKey, File | null>>({
    front: null, lateral: null, back: null, medial: null, top: null, sole: null,
  })
  const [previews, setPreviews] = useState<Record<SlotKey, string | null>>({
    front: null, lateral: null, back: null, medial: null, top: null, sole: null,
  })
  const [results, setResults] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [activeImage, setActiveImage] = useState<SlotKey | null>(null)
  const inputRefs = useRef<Record<SlotKey, HTMLInputElement | null>>({
    front: null, lateral: null, back: null, medial: null, top: null, sole: null,
  })

  const filledCount = Object.values(files).filter(Boolean).length
  const allFilled = filledCount === 6

  const handleFile = useCallback((key: SlotKey, f: File) => {
    setFiles((prev) => ({ ...prev, [key]: f }))
    setResults(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = () =>
      setPreviews((prev) => ({ ...prev, [key]: reader.result as string }))
    reader.readAsDataURL(f)
  }, [])

  const analyze = useCallback(async () => {
    if (!allFilled) return
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const form = new FormData()
      for (const slot of SLOTS) {
        form.append(slot.key, files[slot.key]!)
      }
      const res = await fetch(API_URL, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [allFilled, files])

  const reset = useCallback(() => {
    setFiles({ front: null, lateral: null, back: null, medial: null, top: null, sole: null })
    setPreviews({ front: null, lateral: null, back: null, medial: null, top: null, sole: null })
    setResults(null)
    setError(null)
    setActiveImage(null)
    for (const ref of Object.values(inputRefs.current)) {
      if (ref) ref.value = ''
    }
  }, [])

  const locations = results?.locations ?? []
  const damagedCount = locations.filter((l) => l.damaged).length
  const summary = results?.summary

  // Map location results back to slots for image overlay
  const locBySlot: Record<SlotKey, LocationResult | undefined> = {
    front: locations.find((l) => l.location === 'Toe Box - Lateral'),
    lateral: locations.find((l) => l.location === 'Lateral Midsole'),
    back: locations.find((l) => l.location === 'Heel Counter'),
    medial: locations.find((l) => l.location === 'Medial Forefoot'),
    top: locations.find((l) => l.location === 'Toe Box - Medial'),
    sole: locations.find((l) => l.location === 'Outsole - Toe'),
  }

  return (
    <div className="rb">
      <header className="rb-header">
        <Link to="/" className="rb-header__back" aria-label="Back to account">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="rb-header__brand">
          <IconBarcode className="rb-header__icon" />
          <span className="rb-header__title">Rebalance</span>
        </div>
      </header>

      <main className="rb-main">
        {!results ? (
          <div className="rb-upload-flow">
            <ShoeAnimation />

            <h2 className="rb-upload-flow__title">Upload 6 photos of your shoe</h2>
            <p className="rb-upload-flow__subtitle">
              Photograph the shoe from each angle shown above
            </p>

            <div className="rb-slot-grid">
              {SLOTS.map((slot, i) => {
                const preview = previews[slot.key]
                return (
                  <div
                    key={slot.key}
                    className={`rb-slot ${preview ? 'rb-slot--filled' : ''}`}
                    onClick={() => inputRefs.current[slot.key]?.click()}
                  >
                    <input
                      ref={(el) => { inputRefs.current[slot.key] = el }}
                      type="file"
                      accept="image/*"
                      className="rb-slot__input"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFile(slot.key, f)
                      }}
                    />
                    {preview ? (
                      <img src={preview} alt={slot.label} className="rb-slot__thumb" />
                    ) : (
                      <>
                        <span className="rb-slot__number">{i + 1}</span>
                        <span className="rb-slot__label">{slot.label}</span>
                        <span className="rb-slot__hint">{slot.instruction}</span>
                      </>
                    )}
                    {preview && <span className="rb-slot__check">✓</span>}
                  </div>
                )
              })}
            </div>

            <div className="rb-upload-flow__actions">
              <button
                type="button"
                className="rb-btn rb-btn--primary rb-btn--lg"
                onClick={analyze}
                disabled={!allFilled || loading}
              >
                {loading ? 'Analyzing 6 images…' : `Analyze damage (${filledCount}/6)`}
              </button>
              {filledCount > 0 && (
                <button type="button" className="rb-btn rb-btn--ghost" onClick={reset} disabled={loading}>
                  Clear all
                </button>
              )}
            </div>

            {error && <p className="rb-error">{error}</p>}

            {loading && (
              <div className="rb-loading-bar">
                <div className="rb-loading-bar__track">
                  <div className="rb-loading-bar__fill" />
                </div>
                <p className="rb-loading-bar__text">Scanning all 6 angles for scratches, holes, and tears…</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rb-results-multi">
            {/* Image gallery */}
            <div className="rb-gallery">
              <div className="rb-gallery__main">
                {activeImage && previews[activeImage] ? (
                  <div className="rb-image-wrap">
                    <img src={previews[activeImage]!} alt={activeImage} className="rb-image" />
                    {locBySlot[activeImage]?.damaged && locBySlot[activeImage]?.bbox && (
                      <div
                        className="rb-bbox rb-bbox--hover"
                        style={{
                          left: `${locBySlot[activeImage]!.bbox![0]}%`,
                          top: `${locBySlot[activeImage]!.bbox![1]}%`,
                          width: `${locBySlot[activeImage]!.bbox![2]}%`,
                          height: `${locBySlot[activeImage]!.bbox![3]}%`,
                          borderColor: confidenceColor(locBySlot[activeImage]!.confidence),
                        }}
                      >
                        <span
                          className="rb-bbox__label"
                          style={{ background: confidenceColor(locBySlot[activeImage]!.confidence) }}
                        >
                          {locBySlot[activeImage]!.location} — {locBySlot[activeImage]!.confidence}%
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rb-gallery__placeholder">
                    <p>Select a photo below to inspect</p>
                  </div>
                )}
              </div>
              <div className="rb-gallery__thumbs">
                {SLOTS.map((slot) => {
                  const loc = locBySlot[slot.key]
                  return (
                    <button
                      key={slot.key}
                      type="button"
                      className={`rb-gallery__thumb-btn ${activeImage === slot.key ? 'rb-gallery__thumb-btn--active' : ''} ${loc?.damaged ? 'rb-gallery__thumb-btn--damaged' : ''}`}
                      onClick={() => setActiveImage(slot.key)}
                    >
                      <img src={previews[slot.key]!} alt={slot.label} />
                      {loc?.damaged && <span className="rb-gallery__thumb-badge">!</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Results panel */}
            <div className="rb-panel">
              <div className="rb-panel__actions">
                <button type="button" className="rb-btn rb-btn--primary" onClick={analyze} disabled={loading}>
                  {loading ? 'Analyzing…' : 'Re-analyze'}
                </button>
                <button type="button" className="rb-btn rb-btn--ghost" onClick={reset} disabled={loading}>
                  Start over
                </button>
              </div>

              <div className="rb-summary-banner">
                <span className="rb-summary-banner__count">{damagedCount}</span>
                <span className="rb-summary-banner__text">
                  of 6 locations show damage
                </span>
              </div>

              <div className="rb-location-list">
                {locations.map((loc, i) => (
                  <div
                    key={i}
                    className={`rb-loc-card ${hoveredIdx === i ? 'rb-loc-card--hover' : ''} ${loc.damaged ? 'rb-loc-card--damaged' : ''}`}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <div className="rb-loc-card__top">
                      <span className={`rb-loc-card__status ${loc.damaged ? 'rb-loc-card__status--bad' : 'rb-loc-card__status--ok'}`}>
                        {loc.damaged ? '●' : '○'}
                      </span>
                      <span className="rb-loc-card__name">{loc.location}</span>
                      {loc.damage_type && (
                        <span
                          className="rb-loc-card__type"
                          style={{ background: damageTypeColor(loc.damage_type) }}
                            >
                              {DAMAGE_TYPE_LABEL[loc.damage_type] ?? loc.damage_type}
                            </span>
                      )}
                    </div>
                    {loc.damaged && (
                      <div className="rb-loc-card__confidence">
                        <div className="rb-loc-card__bar">
                          <div
                            className="rb-loc-card__bar-fill"
                            style={{
                              width: `${loc.confidence}%`,
                              background: confidenceColor(loc.confidence),
                            }}
                          />
                        </div>
                        <span className="rb-loc-card__pct">{loc.confidence}%</span>
                      </div>
                    )}
                    <p className="rb-loc-card__desc">{loc.description}</p>
                  </div>
                ))}
              </div>

              {summary && (
                <div className="rb-freq">
                  <h3 className="rb-freq__title">Damage frequency</h3>
                  <div className="rb-freq__grid">
                    {Object.entries(summary).map(([loc, count]) => (
                      <div key={loc} className="rb-freq__row">
                        <span className="rb-freq__loc">{loc}</span>
                        <span className={`rb-freq__count ${count > 0 ? 'rb-freq__count--pos' : ''}`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
