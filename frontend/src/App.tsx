import './App.css'
import nbHeroBg from './assets/nb-hero-bg.png'

function App() {
  return (
    <div className="page-shell">
      <header className="top-banner">
        <p>The 2010 now available in kids&apos; sizes. Shop now</p>
      </header>

      <nav className="main-nav">
        <div className="brand" aria-label="New Balance">
          <span>N</span>
          <span>B</span>
        </div>
        <ul className="nav-links">
          <li>New</li>
          <li>Men</li>
          <li>Women</li>
          <li>Kids</li>
          <li>Sale</li>
        </ul>
        <div className="nav-icons" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="icon-search">
            <circle cx="11" cy="11" r="6.2" />
            <line x1="15.8" y1="15.8" x2="20.2" y2="20.2" />
          </svg>
          <svg viewBox="0 0 24 24" className="icon-user">
            <circle cx="12" cy="8.1" r="3.1" />
            <path d="M5.6 19.2c1.8-3.1 4.2-4.5 6.4-4.5s4.6 1.4 6.4 4.5" />
          </svg>
          <svg viewBox="0 0 24 24" className="icon-bag">
            <rect x="6.8" y="8.8" width="10.4" height="10.4" rx="1.5" />
            <path d="M9.5 8.8c0-1.7 1.1-3 2.5-3s2.5 1.3 2.5 3" />
          </svg>
        </div>
      </nav>

      <section className="hero">
        <img
          className="hero-background"
          src={nbHeroBg}
          alt="New Balance shoe side profile"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Step into your new balance.</h1>
          <div className="hero-actions">
            <button type="button">Try New</button>
            <button type="button" className="secondary">
              Learn More
            </button>
          </div>
        </div>
        <div className="scan-area" aria-hidden="true">
          <span className="scan-line" />
          <span className="scan-glow" />
        </div>
      </section>
    </div>
  )
}

export default App
