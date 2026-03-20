import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconBarcode } from '../components/icons'
import './rebalance.css'

const API_URL = 'http://localhost:3000/api/analyze-shoe'

interface DamageRegion {
  label: string
  area: string
  severity: 'minor' | 'moderate' | 'severe'
  description: string
  bbox: [number, number, number, number]
}

const SEVERITY_COLOR: Record<string, string> = {
  minor: '#f59e0b',
  moderate: '#f97316',
  severe: '#ef4444',
}

export function RebalancePage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [damages, setDamages] = useState<DamageRegion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setDamages([])
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
    setDamages([])
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(API_URL, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)
      setDamages(data.damages ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }, [file])

  const reset = useCallback(() => {
    setPreview(null)
    setFile(null)
    setDamages([])
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

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
            <div className="rb-image-wrap">
              <img src={preview} alt="Uploaded shoe" className="rb-image" />
              {damages.map((d, i) => {
                const [x, y, w, h] = d.bbox
                const isHovered = hoveredIdx === i
                return (
                  <div
                    key={i}
                    className={`rb-bbox ${isHovered ? 'rb-bbox--hover' : ''}`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${w}%`,
                      height: `${h}%`,
                      borderColor: SEVERITY_COLOR[d.severity] ?? '#ef4444',
                    }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <span
                      className="rb-bbox__label"
                      style={{ background: SEVERITY_COLOR[d.severity] ?? '#ef4444' }}
                    >
                      {d.label}
                    </span>
                  </div>
                )
              })}
              {loading && (
                <div className="rb-image-overlay">
                  <div className="rb-spinner" />
                  <p>Analyzing damage…</p>
                </div>
              )}
            </div>

            <div className="rb-panel">
              <div className="rb-panel__actions">
                <button type="button" className="rb-btn rb-btn--primary" onClick={analyze} disabled={loading}>
                  {loading ? 'Analyzing…' : damages.length ? 'Re-analyze' : 'Analyze damage'}
                </button>
                <button type="button" className="rb-btn rb-btn--ghost" onClick={reset} disabled={loading}>
                  Upload new
                </button>
              </div>

              {error && <p className="rb-error">{error}</p>}

              {damages.length > 0 && (
                <div className="rb-damage-list">
                  <h2 className="rb-damage-list__title">
                    {damages.length} damage region{damages.length !== 1 ? 's' : ''} detected
                  </h2>
                  {damages.map((d, i) => (
                    <div
                      key={i}
                      className={`rb-damage-card ${hoveredIdx === i ? 'rb-damage-card--hover' : ''}`}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <div className="rb-damage-card__header">
                        <span
                          className="rb-damage-card__severity"
                          style={{ background: SEVERITY_COLOR[d.severity] }}
                        >
                          {d.severity}
                        </span>
                        <span className="rb-damage-card__area">{d.area}</span>
                      </div>
                      <h3 className="rb-damage-card__label">{d.label}</h3>
                      <p className="rb-damage-card__desc">{d.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {!loading && damages.length === 0 && !error && file && (
                <p className="rb-hint">Press "Analyze damage" to scan the shoe for wear and damage.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
