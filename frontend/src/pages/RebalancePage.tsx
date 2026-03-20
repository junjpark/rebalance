import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBarcode } from '../components/icons'
import './rebalance.css'

const API_URL = 'http://localhost:3000/api/analyze-shoe'

interface LocationResult {
  location: string
  damaged: boolean
  confidence: number
  damage_type: 'scratch' | 'hole' | 'tear' | null
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

function damageTypeColor(t: string | null) {
  if (t === 'hole') return '#dc2626'
  if (t === 'tear') return '#ea580c'
  if (t === 'scratch') return '#d97706'
  return '#a3a3a3'
}

export function RebalancePage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<AnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setResults(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const f = e.dataTransfer.files?.[0]
      if (f?.type.startsWith('image/')) handleFile(f)
    },
    [handleFile],
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const analyze = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResults(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(API_URL, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [file])

  const reset = useCallback(() => {
    setPreview(null)
    setFile(null)
    setResults(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const locations = results?.locations ?? []
  const damagedCount = locations.filter((l) => l.damaged).length
  const summary = results?.summary

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
        {!preview ? (
          <div
            className="rb-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="rb-upload__input"
              onChange={onFileChange}
            />
            <div className="rb-upload__icon-wrap">
              <svg className="rb-upload__icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="6" y="10" width="36" height="28" rx="3" />
                <circle cx="17" cy="22" r="3" />
                <path d="M6 34l10-10 8 8 6-6 12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="rb-upload__label">Upload an image</p>
            <p className="rb-upload__hint">Click or drag a shoe photo here</p>
          </div>
        ) : (
          <div className="rb-results">
            <div className="rb-image-col">
              <div className="rb-image-wrap">
                <img src={preview} alt="Uploaded shoe" className="rb-image" />
                {locations.map((loc, i) =>
                  loc.bbox && loc.damaged ? (
                    <div
                      key={i}
                      className={`rb-bbox ${hoveredIdx === i ? 'rb-bbox--hover' : ''}`}
                      style={{
                        left: `${loc.bbox[0]}%`,
                        top: `${loc.bbox[1]}%`,
                        width: `${loc.bbox[2]}%`,
                        height: `${loc.bbox[3]}%`,
                        borderColor: confidenceColor(loc.confidence),
                      }}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <span
                        className="rb-bbox__label"
                        style={{ background: confidenceColor(loc.confidence) }}
                      >
                        {loc.location} — {loc.confidence}%
                      </span>
                    </div>
                  ) : null,
                )}
                {loading && (
                  <div className="rb-image-overlay">
                    <div className="rb-spinner" />
                    <p>Scanning 6 locations…</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rb-panel">
              <div className="rb-panel__actions">
                <button type="button" className="rb-btn rb-btn--primary" onClick={analyze} disabled={loading}>
                  {loading ? 'Analyzing…' : results ? 'Re-analyze' : 'Analyze damage'}
                </button>
                <button type="button" className="rb-btn rb-btn--ghost" onClick={reset} disabled={loading}>
                  Upload new
                </button>
              </div>

              {error && <p className="rb-error">{error}</p>}

              {results && (
                <>
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
                              {loc.damage_type}
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
                </>
              )}

              {!loading && !results && !error && file && (
                <p className="rb-hint">Press "Analyze damage" to scan the shoe across 6 locations.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
