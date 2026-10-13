import { forwardRef, useState } from "react";
import type { ComponentProps } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "../lib/cn";
import { Input } from "./ui/input";

export type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
  visibilityButtonClassName?: string;
};

/**
 * Password field with a show/hide toggle, built on shadcn's `Input`.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { className, visibilityButtonClassName, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative flex items-center w-full">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          className={cn(
            "absolute right-1.5 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            visibilityButtonClassName,
          )}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </button>
      </div>
    );
  },
);
