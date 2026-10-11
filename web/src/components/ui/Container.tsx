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
        'w-full mx-auto px-3 pt-2 min-[576px]:max-w-[540px] min-[768px]:max-w-[720px] min-[992px]:max-w-[960px] min-[1200px]:max-w-[1140px] min-[1400px]:max-w-[1320px]',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  )
}
