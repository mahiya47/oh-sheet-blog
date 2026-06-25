import { useCallback, useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ModalContext } from "../context/ModalContext.jsx";
import { useStore } from "../lib/store.jsx";
import Navbar from "./Navbar.jsx";
import LeftSidebar from "./LeftSidebar.jsx";
import RightSidebar from "./RightSidebar.jsx";
import BottomNav from "./BottomNav.jsx";
import BackToTop from "./BackToTop.jsx";
import PostModal from "./PostModal.jsx";
import WelcomeModal from "./WelcomeModal.jsx";
import ChatRoom from "./ChatRoom.jsx";

const mainStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
  minWidth: 0,
};

export default function Layout() {
  const { currentUser } = useStore();
  const [modalPostId, setModalPostId] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const openPost = useCallback((id) => setModalPostId(id), []);
  const closeModal = useCallback(() => setModalPostId(null), []);

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
    <ModalContext.Provider value={{ openPost }}>
      <Navbar />
      <div className="shell">
        <LeftSidebar />
        <main style={mainStyle}>
          <Outlet />
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
      <BackToTop />
      {modalPostId && <PostModal postId={modalPostId} onClose={closeModal} />}
      {showWelcome && <WelcomeModal onClose={dismissWelcome} />}
      <ChatRoom /> {/* 👈 added here */}
    </ModalContext.Provider>
  );
}
