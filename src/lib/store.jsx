import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../api";
const CARD_COLORS = [
  "var(--c1)",
  "var(--c2)",
  "var(--c3)",
  "var(--c4)",
  "var(--c5)",
  "var(--c6)",
  "var(--c7)",
  "var(--c8)",
  "var(--c9)",
  "var(--c10)",
];
const randomColor = () =>
  CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("current-user");
    return saved ? JSON.parse(saved) : null;
  });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---- Auth ---------------------------------------------------------------

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      // decode basic info from token payload
      const payload = JSON.parse(atob(res.data.token.split(".")[1]));
      const user = { id: payload.userId, email: payload.email };
      localStorage.setItem("current-user", JSON.stringify(user));
      setCurrentUser(user);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  };

  const signup = async ({ username, email, password }) => {
    try {
      await api.post("/auth/register", { name: username, email, password });
      return await login(email, password);
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || "Signup failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("current-user");
    setCurrentUser(null);
    setPosts([]);
  };

  const loginAsDemo = async () => {
    return await login("test@test.com", "test1234");
  };

  // ---- Posts ---------------------------------------------------------------

  const getFeed = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/posts");
      const normalized = res.data.map((post) => ({
        ...post,
        color: randomColor(),
        likeCount: post.likeCount ?? 0,
        commentCount: post.commentCount ?? 0,
        likedByMe: post.likedByMe ?? false,
        author: {
          ...post.author,
          username: post.author?.email?.split("@")[0],
          displayName: post.author?.email?.split("@")[0],
        },
      }));
      setPosts(normalized);
      return normalized;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getPost = async (id) => {
    try {
      const res = await api.get(`/posts/${id}`);
      return res.data;
    } catch {
      return null;
    }
  };

  const createPost = async (content) => {
    try {
      const res = await api.post("/posts", {
        title: content.slice(0, 50),
        content,
      });
      setPosts((prev) => [{ ...res.data, color: randomColor() }, ...prev]);
      return res.data.id;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Comments ------------------------------------------------------------

  const getComments = async (postId) => {
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      return res.data;
    } catch {
      return [];
    }
  };

  const addComment = async (postId, content) => {
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content });
      return res.data;
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      await api.delete(`/posts/${postId}/comments/${commentId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleLike = async (postId, currentlyLiked) => {
    try {
      if (currentlyLiked) {
        await api.delete(`/posts/${postId}/like`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
      // update the post in local state so the UI reacts instantly
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                likedByMe: !currentlyLiked,
                likeCount: p.likeCount + (currentlyLiked ? -1 : 1),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Stubs (keep components working) ------------------------------------
  const toggleFollow = () => {};
  const updateProfile = () => {};
  const getUserPosts = () => [];
  const getFollowingFeed = () => [];
  const getProfile = () => null;
  const getTrending = () => [];
  const getFollowingSidebar = () => [];
  const getFollowCounts = () => ({ following: 0, followers: 0 });
  const isFollowing = () => false;
  const search = () => ({ posts: [], users: [] });
  const resetDemo = () => {};

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        loading,
        posts,
        login,
        signup,
        logout,
        loginAsDemo,
        getFeed,
        getPost,
        createPost,
        deletePost,
        getComments,
        addComment,
        deleteComment,
        toggleLike,
        toggleFollow,
        updateProfile,
        getUserPosts,
        getFollowingFeed,
        getProfile,
        getTrending,
        getFollowingSidebar,
        getFollowCounts,
        isFollowing,
        search,
        resetDemo,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
