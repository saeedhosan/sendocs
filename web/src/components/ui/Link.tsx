import { NavLink, type NavLinkProps } from 'react-router-dom'
import { cn } from '../../lib/cn'

const BASE = 'inline-flex items-center justify-center gap-1.5 rounded-md border font-medium leading-5 whitespace-nowrap cursor-pointer transition-colors duration-150 disabled:opacity-[0.65] disabled:cursor-not-allowed'

export interface LinkProps extends Omit<NavLinkProps, 'className'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  primary: 'bg-primary text-on-primary border-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-ink border-border hover:bg-surface-muted',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-muted',
}

const sizes = {
  sm: 'min-h-8 px-3 text-sm',
  md: 'min-h-8 px-3.5 text-[0.8125rem]',
}

export function Link({ className, variant = 'primary', size = 'md', ...props }: LinkProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          BASE,
          sizes[size],
          variants[variant],
          isActive && 'bg-primary text-on-primary border-primary',
          className,
        )
      }
      {...props}
    />
  )
}