import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ModalContext } from '../context/ModalContext.jsx';
import Navbar from './Navbar.jsx';
import LeftSidebar from './LeftSidebar.jsx';
import RightSidebar from './RightSidebar.jsx';
import BottomNav from './BottomNav.jsx';
import BackToTop from './BackToTop.jsx';
import PostModal from './PostModal.jsx';

const mainStyle = { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', minWidth: 0 };

// The three-column shell shared by every signed-in page. Defined once here,
// instead of being copy-pasted into 11 HTML files like the original.
export default function Layout() {
  const [modalPostId, setModalPostId] = useState(null);
  const openPost = useCallback((id) => setModalPostId(id), []);
  const closeModal = useCallback(() => setModalPostId(null), []);

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
    </ModalContext.Provider>
  );
}
