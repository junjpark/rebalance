import type { MouseEvent } from 'react'
import { IconBag, IconSearch, IconUserOutline } from './icons'

const dead = (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault()
const noopBtn = (e: MouseEvent<HTMLButtonElement>) => e.preventDefault()

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a href="#" className="site-header__logo" onClick={dead} aria-label="Home">
          <span className="site-header__nb">NB</span>
        </a>
        <nav className="site-header__nav" aria-label="Primary">
          <a href="#" onClick={dead}>
            New
          </a>
          <a href="#" onClick={dead}>
            Men
          </a>
          <a href="#" onClick={dead}>
            Women
          </a>
          <a href="#" onClick={dead}>
            Kids
          </a>
          <a href="#" onClick={dead}>
            Sale
          </a>
        </nav>
        <div className="site-header__tools">
          <button type="button" className="site-header__icon-btn" aria-label="Search" onClick={noopBtn}>
            <IconSearch className="site-header__tool-icon" />
          </button>
          <button type="button" className="site-header__icon-btn" aria-label="Account" onClick={noopBtn}>
            <IconUserOutline className="site-header__tool-icon" />
          </button>
          <button type="button" className="site-header__icon-btn" aria-label="Cart" onClick={noopBtn}>
            <IconBag className="site-header__tool-icon" />
          </button>
        </div>
      </div>
    </header>
  )
}
