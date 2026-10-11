import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'w-full bg-surface border border-border rounded-md shadow-sm',
        className,
      )}
      {...props}
    />
  )
})
