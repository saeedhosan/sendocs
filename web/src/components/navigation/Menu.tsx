import { Fragment } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { FOOTER_ITEMS, type MenuItemData } from './menu-items'

const ITEM_HEADER = 'text-ink-body transition-colors duration-150 hover:text-ink'
const ITEM_HEADER_ACTIVE = 'font-semibold text-primary'
const ITEM_FOOTER = 'transition-colors duration-150'
const ITEM_FOOTER_ACTIVE = 'font-medium text-ink-secondary'

export type MenuItemProps = {
  item: MenuItemData
  className?: string
  activeClassName?: string
}

/** A single entry: a navigation link that highlights when its route is active. */
export function MenuItem({ item, className, activeClassName }: MenuItemProps) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) => cn(className, isActive && activeClassName)}
    >
      {item.label}
    </NavLink>
  )
}

export type MenuProps = {
  items?: MenuItemData[]
  /** `header` styles a top-bar navigation; `footer` styles a legal link list. */
  variant?: 'header' | 'footer'
  /** The wrapper element. Defaults to `<nav>`; use `span`/`div` inside footers. */
  as?: 'nav' | 'div' | 'span' | 'p'
  ariaLabel?: string
  className?: string
  itemClassName?: string
  activeClassName?: string
  /** Highlight the entry whose route matches the current path. */
  highlightActive?: boolean
  /** A character drawn between entries. `null` (default) renders none. */
  separator?: string | null
  /** Also draw the separator before the first entry. */
  leadingSeparator?: boolean
  separatorClassName?: string
}

/** The one header/footer menu used on every surface. */
export function Menu({
  items = FOOTER_ITEMS,
  variant = 'footer',
  as = 'nav',
  ariaLabel,
  className,
  itemClassName,
  activeClassName,
  highlightActive = true,
  separator = null,
  leadingSeparator = false,
  separatorClassName,
}: MenuProps) {
  const Tag = as
  const isHeader = variant === 'header'
  const baseItem = isHeader ? ITEM_HEADER : ITEM_FOOTER
  const baseActive = isHeader ? ITEM_HEADER_ACTIVE : ITEM_FOOTER_ACTIVE

  return (
    <Tag
      aria-label={ariaLabel}
      className={className}
    >
      {items.map((item, index) => (
        <Fragment key={item.to}>
          {separator && (index > 0 || leadingSeparator) ? (
            <span aria-hidden="true" className={separatorClassName}>
              {separator}
            </span>
          ) : null}
          <MenuItem
            item={item}
            className={cn(
              baseItem,
              itemClassName,
              isHeader && index === items.length - 1 && 'pl-2',
            )}
            activeClassName={cn(
              highlightActive && baseActive,
              highlightActive && activeClassName,
            )}
          />
        </Fragment>
      ))}
    </Tag>
  )
}