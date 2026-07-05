const INSTALL_DISMISS_KEY = "phrase_feed_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let androidInstallEvent: BeforeInstallPromptEvent | null = null;
const androidInstallListeners = new Set<() => void>();

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isIosSafari(): boolean {
  if (!isIos()) return false;
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/crios|fxios|edgios|opr\//i.test(ua);
}

export function needsSafariForInstall(): boolean {
  return isIos() && !isIosSafari();
}

export function canShowInstallPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandalonePwa()) return false;
  if (localStorage.getItem(INSTALL_DISMISS_KEY) === "1") return false;
  return true;
}

export function dismissInstallPrompt(): void {
  localStorage.setItem(INSTALL_DISMISS_KEY, "1");
}

export function subscribeAndroidInstall(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onReady = () => listener();
  androidInstallListeners.add(onReady);
  if (androidInstallEvent) onReady();

  const onBeforeInstall = (event: Event) => {
    event.preventDefault();
    androidInstallEvent = event as BeforeInstallPromptEvent;
    androidInstallListeners.forEach((cb) => cb());
  };

  window.addEventListener("beforeinstallprompt", onBeforeInstall);

  return () => {
    androidInstallListeners.delete(onReady);
    window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  };
}

export async function promptAndroidInstall(): Promise<boolean> {
  if (!androidInstallEvent) return false;
  await androidInstallEvent.prompt();
  const { outcome } = await androidInstallEvent.userChoice;
  androidInstallEvent = null;
  return outcome === "accepted";
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV !== "production") return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline shell is optional */
    });
  });
}
