import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import styles from './Container.module.css'

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
    <Component className={cn(styles.container, className)} {...rest}>
      {children}
    </Component>
  )
}
