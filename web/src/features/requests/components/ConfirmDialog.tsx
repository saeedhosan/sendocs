import type { ReactNode } from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: ReactNode;
    confirmLabel: string;
    tone?: "default" | "danger";
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

/**
 * The single confirmation dialog for destructive actions.
 *
 * Cancel receives initial focus and the buttons are not a form, so Enter does
 * not confirm by accident.
 */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    tone = "danger",
    onCancel,
    onConfirm,
    busy = false,
}: ConfirmDialogProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    onCancel();
                }
            }}
        >
            <DialogContent
                showCloseButton={false}
                initialFocus={cancelRef}
                className="w-[calc(100vw-2rem)] max-w-md"
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        ref={cancelRef}
                        variant="secondary"
                        size="sm"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={tone === "danger" ? "destructive" : "default"}
                        size="sm"
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? <Spinner data-icon="inline-start" /> : null}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
