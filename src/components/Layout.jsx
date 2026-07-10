import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
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

  return (
    <>
      <Navbar />
      <div className="shell">
        <LeftSidebar />
        <main style={mainStyle}>
          <Outlet />
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
      {showWelcome && <WelcomeModal onClose={dismissWelcome} />}
    </>
  );
}
