import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  children?: ReactNode
}

/**
 * The one layout container, mirroring Bootstrap's `.container`: centered, with
 * a responsive max-width at each breakpoint and a fixed horizontal gutter. Every
 * page wraps its content in this, so all surfaces share the same measure.
 */
export function Container({
  as: Component = 'div',
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Component
      className={cn(
        'w-full mx-auto px-3 min-[576px]:max-w-135 min-[768px]:max-w-180 min-[992px]:max-w-240 min-[1200px]:max-w-285 min-[1400px]:max-w-330',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  )
}
