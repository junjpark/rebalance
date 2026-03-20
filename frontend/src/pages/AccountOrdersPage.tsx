import { useState } from 'react'
import { AccountSidebar } from '../components/AccountSidebar'
import { SiteHeader } from '../components/SiteHeader'
import '../account.css'

export function AccountOrdersPage() {
  const [tab, setTab] = useState<'online' | 'instore'>('online')

  return (
    <>
      <SiteHeader />
      <div className="account-page">
        <nav className="account-breadcrumb" aria-label="Breadcrumb">
          <span className="account-breadcrumb__current">My Account</span>
          <span className="account-breadcrumb__sep">/</span>
          <span>Orders</span>
        </nav>
        <div className="account-layout">
          <AccountSidebar />
          <main className="orders-main">
            <h1 className="orders-main__title">Orders</h1>
            <div className="orders-tabs" role="tablist" aria-label="Order type">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'online'}
                className={`orders-tabs__btn${tab === 'online' ? ' orders-tabs__btn--active' : ''}`}
                onClick={() => setTab('online')}
              >
                Online
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'instore'}
                className={`orders-tabs__btn${tab === 'instore' ? ' orders-tabs__btn--active' : ''}`}
                onClick={() => setTab('instore')}
              >
                In-store
              </button>
            </div>
            <div className="orders-empty">
              <p>You haven&apos;t placed any orders yet.</p>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
