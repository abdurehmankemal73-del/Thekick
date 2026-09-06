"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "@/i18n/provider";

const DISMISS_KEY = "the-kick-pwa-dismissed";
const SHOW_EVENT = "thekick-show-install";
const BIP_EVENT = "thekick-bip";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __THE_KICK_DEFERRED_PROMPT?: BeforeInstallPromptEvent;
  }
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isIosSafari() {
  return isIosDevice() && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDismiss() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function requestInstallHelp() {
  window.dispatchEvent(new Event(SHOW_EVENT));
}

function readDeferredPrompt() {
  return window.__THE_KICK_DEFERRED_PROMPT ?? null;
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
  const [mode, setMode] = useState<"hidden" | "ios" | "safari-needed" | "android" | "android-menu">("hidden");

  function showForPlatform(event?: BeforeInstallPromptEvent | null) {
    if (isStandaloneDisplay()) {
      setMode("hidden");
      return;
    }
    const next = event ?? readDeferredPrompt();
    if (next) {
      setPromptEvent(next);
      setMode("android");
      return;
    }
    if (isIosDevice() && !isIosSafari()) {
      setMode("safari-needed");
      return;
    }
    if (isIosSafari()) {
      setMode("ios");
      return;
    }
    setMode("android-menu");
  }

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    const next = readDeferredPrompt();
    if (next) {
      setPromptEvent(next);
      setMode("android");
    } else if (!wasDismissed()) {
      if (isIosDevice() && !isIosSafari()) setMode("safari-needed");
      else if (isIosSafari()) setMode("ios");
    }

    const onBip = () => {
      const captured = readDeferredPrompt();
      if (!captured) return;
      setPromptEvent(captured);
      setMode("android");
    };
    const onShow = () => showForPlatform();
    window.addEventListener(BIP_EVENT, onBip);
    window.addEventListener(SHOW_EVENT, onShow);

    const timer = window.setTimeout(() => {
      if (isStandaloneDisplay() || wasDismissed() || readDeferredPrompt() || isIosDevice()) return;
      setMode((current) => (current === "hidden" ? "android-menu" : current));
    }, 2500);

    if ("serviceWorker" in navigator) {
      const secure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (secure) {
        void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      }
    }

    return () => {
      window.removeEventListener(BIP_EVENT, onBip);
      window.removeEventListener(SHOW_EVENT, onShow);
      window.clearTimeout(timer);
    };
  }, []);

  function close() {
    persistDismiss();
    setMode("hidden");
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    window.__THE_KICK_DEFERRED_PROMPT = undefined;
    setPromptEvent(null);
    if (choice.outcome === "accepted") persistDismiss();
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  if (mode === "ios") {
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

  if (mode === "safari-needed") {
    return (
      <InstallBanner title={t("installOpenSafari")} body={t("installOpenSafariBody")} onClose={close} />
    );
  }

  if (mode === "android") {
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

  return (
    <InstallBanner title={t("installAndroidMenu")} body={t("installAndroidMenuBody")} onClose={close} />
  );
}

export function Pwa() {
  return <InstallPrompt />;
}
