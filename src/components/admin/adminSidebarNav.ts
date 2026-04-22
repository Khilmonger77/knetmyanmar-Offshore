import type { ComponentType } from 'react'
import {
  IconArrows,
  IconBank,
  IconBell,
  IconCard,
  IconInbox,
  IconLayout,
  IconLifebuoy,
  IconLoan,
  IconSearch,
  IconShield,
  IconSliders,
  IconUsers,
} from './AdminConsoleSidebarIcons'

/** Keep in sync with `ADMIN_CONSOLE_SIDEBAR_LEFT_CLASS` (Tailwind cannot see dynamic values). */
export const ADMIN_SIDEBAR_WIDTH_PX = 280

export const ADMIN_CONSOLE_SIDEBAR_PX = ADMIN_SIDEBAR_WIDTH_PX
export const ADMIN_CONSOLE_SIDEBAR_LEFT_CLASS = 'lg:left-[280px]'

type IconComponent = ComponentType<{ className?: string }>

export type SidebarNavItem =
  | {
      id: string
      kind: 'route'
      to: string
      end?: boolean
      label: string
      Icon: IconComponent
      iconTone: 'primary' | 'muted'
    }
  | {
      id: string
      kind: 'hash'
      to: string
      label: string
      Icon: IconComponent
      iconTone: 'primary' | 'muted'
    }

/**
 * Single source of truth for the desktop admin rail.
 */
export const ADMIN_SIDEBAR_PRIMARY_NAV: readonly SidebarNavItem[] = [
  {
    id: 'dashboard',
    kind: 'route',
    to: '/admin',
    end: true,
    label: 'Dashboard',
    Icon: IconLayout,
    iconTone: 'primary',
  },
  {
    id: 'users',
    kind: 'route',
    to: '/admin/users',
    label: 'User management',
    Icon: IconUsers,
    iconTone: 'primary',
  },
  {
    id: 'transactions',
    kind: 'route',
    to: '/admin/transactions',
    label: 'Transactions',
    Icon: IconArrows,
    iconTone: 'primary',
  },
  {
    id: 'search',
    kind: 'route',
    to: '/admin/search',
    label: 'Search',
    Icon: IconSearch,
    iconTone: 'primary',
  },
  {
    id: 'deposits-fees',
    kind: 'route',
    to: '/admin/deposits-fees',
    label: 'Deposits & fees',
    Icon: IconInbox,
    iconTone: 'primary',
  },
  {
    id: 'withdrawals',
    kind: 'route',
    to: '/admin/withdrawals',
    label: 'Withdrawals',
    Icon: IconBank,
    iconTone: 'primary',
  },
  {
    id: 'loans',
    kind: 'route',
    to: '/admin/loans',
    label: 'Loans',
    Icon: IconLoan,
    iconTone: 'primary',
  },
  {
    id: 'cards',
    kind: 'route',
    to: '/admin/cards',
    label: 'Cards',
    Icon: IconCard,
    iconTone: 'primary',
  },
  {
    id: 'kyc',
    kind: 'route',
    to: '/admin/kyc',
    label: 'KYC verification',
    Icon: IconShield,
    iconTone: 'primary',
  },
  {
    id: 'support',
    kind: 'route',
    to: '/admin/support',
    label: 'Support tickets',
    Icon: IconLifebuoy,
    iconTone: 'primary',
  },
  {
    id: 'otp-policy',
    kind: 'route',
    to: '/admin/otp-policy',
    label: 'OTP policy',
    Icon: IconBell,
    iconTone: 'primary',
  },
  {
    id: 'settings',
    kind: 'route',
    to: '/admin/settings',
    label: 'Settings',
    Icon: IconSliders,
    iconTone: 'primary',
  },
]
