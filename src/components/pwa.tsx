"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";

const DISMISS_KEY = "the-kick-pwa-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

function InstallBanner({
  title,
  body,
  action,
  onClose,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div
        role="dialog"
        aria-labelledby="pwa-install-title"
        className="mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-lg"
      >
        <div className="min-w-0 flex-1">
          <p id="pwa-install-title" className="font-display text-sm">
            {title}
          </p>
          <p className="mt-1 text-sm text-muted">{body}</p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-ink"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <Icon icon={X} />
        </button>
      </div>
    </div>
  );
}

function InstallPrompt() {
  const { t } = useI18n();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;

    if (isIosSafari()) {
      setShowIos(true);
      setHidden(false);
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function close() {
    dismiss();
    setHidden(true);
    setPromptEvent(null);
    setShowIos(false);
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") dismiss();
    close();
  }

  if (hidden) return null;

  if (showIos) {
    return (
      <InstallBanner
        title={t("installIosTitle")}
        body={t("installIosBody")}
        action={
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-red">
            <Icon icon={Share} />
            {t("installIosTitle")}
          </p>
        }
        onClose={close}
      />
    );
  }

  if (!promptEvent) return null;

  return (
    <InstallBanner
      title={t("installApp")}
      body={t("installAppBody")}
      action={
        <Button size="sm" onClick={install}>
          <Icon icon={Download} />
          {t("installNow")}
        </Button>
      }
      onClose={close}
    />
  );
}

export function Pwa() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const secure =
      window.location.protocol === "https:" || window.location.hostname === "localhost";
    if (!secure) return;
    if (process.env.NODE_ENV !== "production" && window.location.hostname === "localhost") {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  }, []);

  return <InstallPrompt />;
}
