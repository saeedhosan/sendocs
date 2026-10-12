export type MenuItemData = {
  label: string
  to: string
}

export const MENU_ITEMS: MenuItemData[] = [
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Contact', to: '/contact' },
  { label: 'Sign in', to: '/login' },
]

export const FOOTER_ITEMS: MenuItemData[] = MENU_ITEMS.slice(0, 3)