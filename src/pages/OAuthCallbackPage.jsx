import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store.jsx";

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useStore();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get("token");
    const isNew = params.get("isNew") === "1";

    if (!token) {
      navigate("/login");
      return;
    }

    loginWithToken(token).then((res) => {
      if (!res.ok) {
        navigate("/login");
        return;
      }
      navigate(isNew ? "/onboarding" : "/feed");
    });
  }, []);

  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }} />
        <p>Signing you in…</p>
      </div>
    </div>
  );
}
