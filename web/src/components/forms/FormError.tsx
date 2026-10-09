import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import styles from './FormError.module.css'

export type FormErrorProps = {
  id?: string
  className?: string
  children: ReactNode
}

export function FormError({ id, className, children }: FormErrorProps) {
  return (
    <p id={id} role="alert" className={cn(styles.error, className)}>
      {children}
    </p>
  )
}
