import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import styles from './IconButton.module.css'

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  children: ReactNode
}

/**
 * A square, icon-only button. `label` is required and becomes the accessible
 * name, since the icon itself is decorative.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, className, type = 'button', children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        className={cn(styles.iconButton, className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)
