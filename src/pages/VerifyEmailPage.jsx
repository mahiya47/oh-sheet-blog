import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | error

  useEffect(() => {
    if (window.__verifyRan) return;
    window.__verifyRan = true;
    api
      .get(`/auth/verify/${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      {status === "verifying" && <h2>Verifying your email…</h2>}
      {status === "success" && (
        <>
          <h2>✅ Email verified!</h2>
          <p>Your blue tick is on its way.</p>
          <Link to="/">Go to feed</Link>
        </>
      )}
      {status === "error" && (
        <>
          <h2>❌ Invalid or expired link</h2>
          <p>You can resend a verification email from Settings.</p>
          <Link to="/settings">Go to Settings</Link>
        </>
      )}
    </div>
  );
}
