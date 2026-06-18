import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';

// Guards every authenticated route. This is the React-Router replacement for
// the original checkUserAuth() that ran on every page and did hard redirects.
export default function ProtectedRoute() {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}
