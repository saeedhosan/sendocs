import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorState } from "../../../components/feedback";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Footer } from "../../../layouts/components/Footer";
import { Header } from "../../../layouts/components/Header";
import { ApiError } from "../../../lib/api/client";
import { portalApi } from "../api";
import { CompleteBanner } from "../components/CompleteBanner";
import { CompletedItemsList } from "../components/CompletedItemsList";
import { DeadLinkScreen } from "../components/DeadLinkScreen";
import { PortalItemRow } from "../components/PortalItemRow";
import { progressLabel, remainingLabel, uploadPercent } from "../progress";
import type { PortalView } from "../types";
import { useUploadQueue } from "../useUploadQueue";

type PortalStatus = "loading" | "ready" | "dead" | "error";

/**
 * The single client-portal screen.
 *
 * The token is a credential read once from the path and held in memory only; it
 * is never written to storage, a cookie, or the query string. A `410` — for an
 * unknown, malformed, expired, revoked, or tampered link — always swaps to the
 * one dead-link screen, with nothing about the request revealed.
 */
export function PortalPage() {
    const { token = "" } = useParams();
    const [view, setView] = useState<PortalView | null>(null);
    const [status, setStatus] = useState<PortalStatus>("loading");
    const [reload, setReload] = useState(0);
    const [announcement, setAnnouncement] = useState("");

    const actionRefs = useRef(new Map<string, HTMLButtonElement>());
    const previousBusy = useRef(0);

    const handleUploaded = useCallback((next: PortalView) => {
        setView(next);
        setAnnouncement(
            next.status === "complete"
                ? `All ${next.total} documents uploaded.`
                : `${next.uploaded} of ${next.total} uploaded.`,
        );
    }, []);

    const handleDeadLink = useCallback(() => {
        setStatus("dead");
    }, []);

    // A silent re-read used on tab focus and after a 409 duplicate.
    const refetch = useCallback(() => {
        portalApi
            .view(token)
            .then(setView)
            .catch((error: unknown) => {
                if (error instanceof ApiError && error.status === 410) {
                    setStatus("dead");
                }
            });
    }, [token]);

    const { transfers, failures, queued, enqueue } = useUploadQueue({
        token,
        onUploaded: handleUploaded,
        onDuplicate: refetch,
        onDeadLink: handleDeadLink,
    });

    // Initial load, and every manual retry.
    useEffect(() => {
        const controller = new AbortController();

        portalApi
            .view(token, controller.signal)
            .then((data) => {
                setView(data);
                setStatus("ready");
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }

                if (error instanceof ApiError && error.status === 410) {
                    setStatus("dead");
                    return;
                }

                setStatus("error");
            });

        return () => controller.abort();
    }, [token, reload]);

    // Revalidate on tab focus or return, so a link revoked elsewhere surfaces.
    useEffect(() => {
        if (status !== "ready") {
            return;
        }

        function onVisibility() {
            if (document.visibilityState === "visible") {
                refetch();
            }
        }

        window.addEventListener("focus", refetch);
        document.addEventListener("visibilitychange", onVisibility);

        return () => {
            window.removeEventListener("focus", refetch);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [refetch, status]);

    const busy = Object.keys(transfers).length + queued.length;

    // When a batch finishes, move focus to the first item that failed.
    useEffect(() => {
        const wasBusy = previousBusy.current;
        previousBusy.current = busy;

        if (wasBusy === 0 || busy > 0) {
            return;
        }

        const firstFailed = view?.items.find((item) => failures[item.id]);

        if (firstFailed) {
            actionRefs.current.get(firstFailed.id)?.focus();
        }
    }, [busy, failures, view]);

    if (status === "dead") {
        return (
            <div className="flex flex-col min-h-screen bg-surface-muted">
                <Header mode="auth" />
                <main className="w-full mx-auto px-3 min-[576px]:max-w-135 min-[768px]:max-w-180 min-[992px]:max-w-240 min-[1200px]:max-w-285 min-[1400px]:max-w-330 flex flex-col gap-6 mt-20">
                    <DeadLinkScreen />
                </main>
                <Footer />
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex items-center justify-center min-h-screen py-8 px-4 bg-surface-muted">
                <ErrorState
                    title="We could not load this page"
                    message="Check your connection and try again."
                    action={
                        <button
                            type="button"
                            className="min-h-9 px-4 border border-border rounded-md bg-surface text-sm font-medium text-ink cursor-pointer hover:bg-surface-muted"
                            onClick={() => {
                                setStatus("loading");
                                setReload((value) => value + 1);
                            }}
                        >
                            Retry
                        </button>
                    }
                />
            </div>
        );
    }

    if (status === "loading" || view === null) {
        return (
            <div className="flex items-center justify-center min-h-screen py-8 px-4 bg-surface-muted">
                <Spinner aria-label="Loading your documents" className="size-6" />
            </div>
        );
    }

    const complete = view.status === "complete";
    const remaining = view.total - view.uploaded;

    return (
        <div className="flex flex-col min-h-screen">
            <Header mode="auth" />

            <main className="w-full mx-auto px-3 min-[576px]:max-w-135 min-[768px]:max-w-180 min-[992px]:max-w-240 min-[1200px]:max-w-285 min-[1400px]:max-w-330 flex flex-col gap-6 mt-20">
                <p className="sr-only" role="status" aria-live="polite">
                    {announcement}
                </p>

                {complete ? (
                    <>
                        <CompleteBanner uploaded={view.uploaded} total={view.total} />

                        <CompletedItemsList items={view.items} />

                        <p className="mt-6 text-xs text-center text-ink-muted">
                            No further action is required. You may safely close this browser window.
                        </p>
                    </>
                ) : (
                    <>
                        <section className="mb-6">
                            <h1 className="text-xl font-semibold leading-[1.4] tracking-[-0.015em] text-ink [overflow-wrap:anywhere] sm:text-2xl sm:leading-8 md:text-3xl md:leading-9">
                                {view.title}
                            </h1>
                            <p className="mt-1 text-sm leading-5 text-ink-secondary sm:mt-1.5 sm:text-base sm:leading-6">
                                Please upload each requested document.
                            </p>

                            <div className="mt-4">
                                <div className="flex flex-wrap items-baseline justify-between gap-1 mb-2">
                                    <h2 className="text-sm font-semibold text-ink">
                                        {progressLabel(view.uploaded, view.total)}
                                    </h2>
                                    <span className="text-[0.8125rem] text-ink-muted">
                                        {remainingLabel(remaining)}
                                    </span>
                                </div>
                                <Progress
                                    value={uploadPercent(view.uploaded, view.total)}
                                    aria-label={progressLabel(view.uploaded, view.total)}
                                />
                            </div>
                        </section>

                        <ul
                            className="list-none mt-5 mb-0 p-0 border border-border rounded-[10px] bg-surface overflow-hidden"
                            aria-label="Required documents"
                        >
                            {view.items.map((item) => (
                                <PortalItemRow
                                    key={item.id}
                                    item={item}
                                    percent={transfers[item.id]}
                                    queued={queued.includes(item.id)}
                                    failure={failures[item.id]}
                                    onPick={enqueue}
                                    actionRef={(node) => {
                                        if (node) {
                                            actionRefs.current.set(item.id, node);
                                        } else {
                                            actionRefs.current.delete(item.id);
                                        }
                                    }}
                                />
                            ))}
                        </ul>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
