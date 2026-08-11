import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useStore } from "../lib/store.jsx";
import Navbar from "./Navbar.jsx";
import LeftSidebar from "./LeftSidebar.jsx";
import RightSidebar from "./RightSidebar.jsx";
import BottomNav from "./BottomNav.jsx";
import WelcomeModal from "./WelcomeModal.jsx";

const mainStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
  minWidth: 0,
};

export default function Layout() {
  const { currentUser } = useStore();
  const [showWelcome, setShowWelcome] = useState(false);
  const location = useLocation(); // Gets the current route path

  useEffect(() => {
    if (!currentUser?.id) return;
    const key = `welcomed-${currentUser.id}`;
    if (!localStorage.getItem(key)) {
      setShowWelcome(true);
    }
  }, [currentUser?.id]);

  const dismissWelcome = () => {
    if (currentUser?.id) {
      localStorage.setItem(`welcomed-${currentUser.id}`, "1");
    }
    setShowWelcome(false);
  };

  // True if playing a game (e.g., /arcade/snake), but False on the main hub (/arcade)
  const isArcadeGame =
    location.pathname.startsWith("/arcade") &&
    location.pathname !== "/arcade" &&
    location.pathname !== "/arcade/";

  return (
    <>
      <Navbar />
      <div className="shell">
        <LeftSidebar />
        <main style={mainStyle}>
          <Outlet />
        </main>
        {/* Only render RightSidebar if NOT inside an actual game */}
        {!isArcadeGame && <RightSidebar />}
      </div>
      <BottomNav />
      {showWelcome && <WelcomeModal onClose={dismissWelcome} />}
    </>
  );
}
