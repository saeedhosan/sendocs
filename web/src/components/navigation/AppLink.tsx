import { forwardRef } from 'react'
import NProgress from 'nprogress'
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  type LinkProps,
  type NavLinkProps,
} from 'react-router-dom'

/**
 * Router `Link`/`NavLink` wrappers that enable browser View Transitions by
 * default (so every internal navigation cross-fades on supporting browsers)
 * and kick off the navigation progress bar as soon as a link is activated.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { onClick, ...props },
  ref,
) {
  return (
    <RouterLink
      ref={ref}
      viewTransition
      {...props}
      onClick={(event) => {
        NProgress.start()
        onClick?.(event)
      }}
    />
  )
})

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink({ onClick, ...props }, ref) {
    return (
      <RouterNavLink
        ref={ref}
        viewTransition
        {...props}
        onClick={(event) => {
          NProgress.start()
          onClick?.(event)
        }}
      />
    )
  },
)
