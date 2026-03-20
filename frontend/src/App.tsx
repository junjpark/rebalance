import './App.css'
import nbHeroBg from './assets/nb-hero-bg.png'
import { Link, Route, Routes } from 'react-router-dom'

function SiteHeader() {
  return (
    <>
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
    </>
  )
}

function HomePage() {
  return (
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
          <Link to="/learn-more" className="hero-link-button secondary">
            Learn More
          </Link>
        </div>
      </div>
      <div className="scan-area" aria-hidden="true">
        <span className="scan-line" />
        <span className="scan-glow" />
      </div>
    </section>
  )
}

function LearnMorePage() {
  return (
    <section className="learn-page">
      <div className="learn-hero">
        <p className="learn-eyebrow">Learn More</p>
        <h1>Smart footwear guidance from everyday wear.</h1>
        <p>
          Rebalance turns everyday shoe wear into meaningful insight about how your body
          moves.
        </p>
      </div>

      <div className="learn-content">
        <article>
          <p>
            By analyzing patterns in the soles of your shoes, it uncovers details that are
            typically only available through in-person gait analysis, making this level of
            understanding far more accessible.
          </p>
          <p>
            When you upload images of your shoes, Rebalance&apos;s system identifies key
            pressure zones and areas of breakdown. These are translated into a visual heatmap,
            showing where your feet apply the most and least force over time. This helps you
            better understand your natural movement patterns, such as whether you tend to
            overpronate, underpronate, or strike the ground in a specific way.
          </p>
          <p>
            What makes Rebalance especially powerful is its comparative database. Your results
            aren&apos;t viewed in isolation. They&apos;re matched against patterns from other users
            with similar wear profiles. By analyzing what shoes have worked best for people
            with comparable movement patterns, Rebalance can recommend footwear that is more
            likely to feel comfortable and supportive for you.
          </p>
          <p>
            Over time, as more users contribute data, recommendations become smarter and more
            personalized. This means better-fitting shoes, reduced discomfort, and potentially
            even a lower risk of injury, all without needing to visit a specialty store.
          </p>
          <p>
            Rebalance is designed to make expert-level footwear guidance simple, data-driven,
            and available to anyone with a smartphone.
          </p>
        </article>
      </div>
    </section>
  )
}

function App() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn-more" element={<LearnMorePage />} />
      </Routes>
    </div>
  )
}

export default App
