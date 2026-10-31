import { useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "../../../components/icons";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MagicLink } from "../types";

export type LinkRevealProps = {
    open: boolean;
    link: MagicLink | null;
    onClose: () => void;
};

export function LinkReveal({ open, link, onClose }: LinkRevealProps) {
    const [copied, setCopied] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    async function copy() {
        if (!link) {
            return;
        }

        try {
            await navigator.clipboard.writeText(link.url);
            setCopied(true);
            setCopyFailed(false);
        } catch {
            setCopyFailed(true);
            inputRef.current?.select();
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    onClose();
                }
            }}
        >
            <DialogContent
                showCloseButton={false}
                initialFocus={inputRef}
                className="max-w-md"
            >
                <DialogHeader>
                    <DialogTitle>Your request is ready.</DialogTitle>
                    <DialogDescription>
                        Copy this link and send it to your client. The raw link is
                        shown once only.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <Input
                        ref={inputRef}
                        type="text"
                        readOnly
                        value={link?.url ?? ""}
                        onFocus={(event) => event.currentTarget.select()}
                        aria-label="Client portal link"
                        className="h-10 font-mono text-[13px]"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void copy()}
                        className="w-full sm:w-auto"
                    >
                        {copied ? (
                            <CheckIcon data-icon="inline-start" size={16} />
                        ) : (
                            <CopyIcon data-icon="inline-start" size={16} />
                        )}
                        {copied ? "Copied" : "Copy link"}
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    This link is shown only once.
                </p>
                {copyFailed ? (
                    <p className="text-xs text-muted-foreground" role="alert">
                        Copy failed - select the link above and copy it manually.
                    </p>
                ) : null}
                <p className="sr-only" aria-live="polite">
                    {copied ? "Copied to clipboard" : ""}
                </p>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
