import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { VisibilityIcon, VisibilityOffIcon } from '../icons'
import { IconButton } from './IconButton'
import { Input } from './Input'

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  invalid?: boolean
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false)

    return (
      <div className="relative flex items-center w-full">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        <IconButton
          label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2.5"
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <VisibilityOffIcon size={18} />
          ) : (
            <VisibilityIcon size={18} />
          )}
        </IconButton>
      </div>
    )
  },
)
