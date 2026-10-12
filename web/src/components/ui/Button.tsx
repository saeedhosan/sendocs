import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/cn";
import { SpinnerIcon } from "../icons";
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";

const BASE =
    "inline-flex items-center justify-center gap-1.5 rounded-md font-medium leading-5 whitespace-nowrap cursor-pointer transition-colors duration-150 disabled:opacity-[0.65] disabled:cursor-not-allowed";

const SIZES: Record<ButtonSize, string> = {
    md: "h-10 px-4 text-sm",
    sm: "h-8 px-3 text-[0.8125rem]",
};

const VARIANTS: Record<ButtonVariant, string> = {
    primary:
        "bg-primary text-on-primary shadow-sm enabled:hover:bg-primary-hover enabled:active:bg-primary-active",
    secondary: "bg-surface text-ink-secondary enabled:hover:bg-surface-subtle",
    ghost: "bg-transparent text-ink-secondary enabled:hover:bg-surface-muted enabled:hover:text-ink",
    danger: "bg-danger-surface text-danger-text enabled:hover:bg-[#ffe4e6]",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        variant = "primary",
        size = "md",
        loading = false,
        fullWidth = false,
        iconLeft,
        iconRight,
        disabled,
        className,
        type = "button",
        children,
        ...props
    },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cn(BASE, SIZES[size], VARIANTS[variant], fullWidth && "w-full", className)}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...props}
        >
            {loading ? (
                <SpinnerIcon className="animate-spin [animation-duration:0.6s]" size={16} />
            ) : (
                iconLeft && <span className="inline-flex items-center">{iconLeft}</span>
            )}
            {children}
            {!loading && iconRight && <span className="inline-flex items-center">{iconRight}</span>}
        </button>
    );
});
