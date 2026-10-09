import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'
import styles from './Skeleton.module.css'

export type SkeletonProps = {
  width?: string
  height?: string
  radius?: string
  className?: string
}

/** A neutral placeholder that keeps layout stable while data loads. */
export function Skeleton({
  width = '100%',
  height = '1rem',
  radius = 'var(--radius-sm)',
  className,
}: SkeletonProps) {
  const style: CSSProperties = { width, height, borderRadius: radius }

  return (
    <span
      className={cn(styles.skeleton, className)}
      style={style}
      aria-hidden="true"
    />
  )
}
