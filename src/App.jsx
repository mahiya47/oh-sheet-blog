import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import FeedPage from "./pages/FeedPage.jsx";
import FollowingPage from "./pages/FollowingPage.jsx";
import TrendingPage from "./pages/TrendingPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CreatePostPage from "./pages/CreatePostPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import StaticPage from "./pages/StaticPage.jsx";
import TagPage from "./pages/TagPage.jsx";
import NotFound from "./pages/NotFound.jsx";
import LeaderboardPage from "./pages/LeaderboardPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/verify/:token" element={<VerifyEmailPage />} />

        {/* Everything below requires a signed-in user */}
        <Route element={<ProtectedRoute />}>
          {/* Settings has its own full-width layout */}
          <Route path="/settings" element={<SettingsPage />} />

          {/* The rest share the three-column shell */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/following" element={<FollowingPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/create" element={<CreatePostPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tag/:name" element={<TagPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/about" element={<StaticPage page="about" />} />
            <Route path="/rules" element={<StaticPage page="rules" />} />
            <Route path="/privacy" element={<StaticPage page="privacy" />} />
            <Route
              path="/agreement"
              element={<StaticPage page="agreement" />}
            />
            <Route path="/admin" element={<AdminPage />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
