import { useCallback, useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ModalContext } from "../context/ModalContext.jsx";
import { useStore } from "../lib/store.jsx";
import Navbar from "./Navbar.jsx";
import LeftSidebar from "./LeftSidebar.jsx";
import RightSidebar from "./RightSidebar.jsx";
import BottomNav from "./BottomNav.jsx";
import PostModal from "./PostModal.jsx";
import WelcomeModal from "./WelcomeModal.jsx";

const mainStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-5)",
  minWidth: 0,
};

export default function Layout() {
  const { currentUser } = useStore();
  const location = useLocation();
  const isChat = location.pathname.startsWith("/chat");
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
      <div className={`shell ${isChat ? "shell--chat" : ""}`}>
        <LeftSidebar />
        <main style={mainStyle}>
          <Outlet />
        </main>
        {!isChat && <RightSidebar />}
      </div>
      <BottomNav />
      {modalPostId && <PostModal postId={modalPostId} onClose={closeModal} />}
      {showWelcome && <WelcomeModal onClose={dismissWelcome} />}
    </ModalContext.Provider>
  );
}
