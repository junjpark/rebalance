import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  IconBarcode,
  IconCard,
  IconFootScan,
  IconOrders,
  IconPerson,
  IconPin,
  IconReturn,
  IconSliders,
} from './icons'

const dead = (e: MouseEvent<HTMLAnchorElement>) => e.preventDefault()

export function AccountSidebar() {
  return (
    <aside>
      <ul className="account-sidebar">
        <li className="account-sidebar__item">
          <a href="#" className="account-sidebar__link account-sidebar__link--active" onClick={dead}>
            <IconOrders className="account-sidebar__icon" />
            Orders
          </a>
        </li>
        <li className="account-sidebar__item">
          <a href="#" className="account-sidebar__link" onClick={dead}>
            <IconPerson className="account-sidebar__icon" />
            Personal details
          </a>
        </li>
        <li className="account-sidebar__item">
          <a href="#" className="account-sidebar__link" onClick={dead}>
            <IconCard className="account-sidebar__icon" />
            Payments
          </a>
        </li>
        <li className="account-sidebar__item">
          <a href="#" className="account-sidebar__link" onClick={dead}>
            <IconPin className="account-sidebar__icon" />
            Addresses
          </a>
        </li>
        <li className="account-sidebar__item">
          <a href="#" className="account-sidebar__link" onClick={dead}>
            <IconSliders className="account-sidebar__icon" />
            Preferences
          </a>
        </li>
        <li className="account-sidebar__item">
          <a href="#" className="account-sidebar__link" onClick={dead}>
            <IconFootScan className="account-sidebar__icon" />
            3D foot scan
          </a>
        </li>
        <li className="account-sidebar__item">
          <Link to="/returns" className="account-sidebar__link account-sidebar__link--route">
            <IconReturn className="account-sidebar__icon" />
            Returns
          </Link>
        </li>
        <li className="account-sidebar__item">
          <Link to="/rebalance" className="account-sidebar__link account-sidebar__link--route">
            <IconBarcode className="account-sidebar__icon" />
            Rebalance
          </Link>
        </li>
        <li className="account-sidebar__item account-sidebar__logout-wrap">
          <div className="account-sidebar__logout-rule" aria-hidden />
          <a href="#" className="account-sidebar__link account-sidebar__logout" onClick={dead}>
            Log out
          </a>
        </li>
      </ul>
    </aside>
  )
}
