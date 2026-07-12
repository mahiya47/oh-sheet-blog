import { useState, useEffect } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "ohsheet_install_prompt_dismissed";

function getMobilePlatform() {
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  if (isIos) return "ios";
  if (isAndroid) return "android";
  return null; // desktop or unknown — don't show anything
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstallGate() {
  const [platform, setPlatform] = useState(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [waitingForPrompt, setWaitingForPrompt] = useState(true);

  useEffect(() => {
    const p = getMobilePlatform();
    const alreadyDismissed = sessionStorage.getItem(DISMISS_KEY) === "true";

    if (!p || isStandalone() || alreadyDismissed) {
      setVisible(false);
      return;
    }

    setPlatform(p);

    if (p === "android") {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setWaitingForPrompt(false);
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);

      // If Chrome doesn't consider this installable (or already fired
      // before we mounted), don't leave the user staring at a dead prompt —
      // just don't show the gate at all after a short grace period.
      const timeout = setTimeout(() => {
        setWaitingForPrompt(false);
      }, 1500);

      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timeout);
      };
    } else if (p === "ios") {
      setWaitingForPrompt(false);
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  const onInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  // Android: if we're still waiting to hear from beforeinstallprompt,
  // or it never fired at all, don't block the page with nothing to offer.
  if (platform === "android" && waitingForPrompt) return null;
  if (platform === "android" && !deferredPrompt) return null;
  if (!visible) return null;

  return (
    <div className="overlay">
      <div
        className="modal"
        style={{ maxWidth: 380, padding: "var(--space-6)" }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={dismiss}
          aria-label="Skip"
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 16px",
              borderRadius: "var(--radius-lg)",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "2rem" }}>👻</span>
          </div>
          <h3 style={{ marginBottom: 6 }}>Install Oh sheet!</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Get the full-screen app experience — faster, and right on your home
            screen.
          </p>
        </div>

        {platform === "android" && (
          <button
            type="button"
            className="btn btn-accent btn-block"
            onClick={onInstallClick}
          >
            <Download size={16} /> Install app
          </button>
        )}

        {platform === "ios" && (
          <ol
            style={{
              paddingLeft: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: "0.9rem",
              marginBottom: 16,
            }}
          >
            <li>
              Tap the <b>Share</b> button{" "}
              <Share size={14} style={{ verticalAlign: "middle" }} /> in
              Safari's toolbar
            </li>
            <li>
              Scroll down and tap <b>"Add to Home Screen"</b>
            </li>
            <li>
              Tap <b>"Add"</b> in the top right
            </li>
          </ol>
        )}

        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={dismiss}
          style={{ marginTop: 12 }}
        >
          Skip, continue to website
        </button>
      </div>
    </div>
  );
}
