import { createContext, useContext, useState, useCallback } from "react";
import api from "../api";

const CARD_COLORS = [
  "#ff3e3e",
  "#3e54ff",
  "#3eff8b",
  "#fff03e",
  "#ff3eef",
  "#3efaff",
  "#ffa53e",
  "#9d3eff",
  "#ff3e96",
  "#c4ff3e",
  "#ff6b3e",
  "#3eff5e",
  "#3eb0ff",
  "#e03eff",
  "#ffd23e",
  "#3effd2",
  "#ff8c3e",
  "#7c3eff",
  "#3e7bff",
  "#b6ff3e",
  "#ff3e6b",
  "#3effa0",
  "#ff5e3e",
  "#a83eff",
  "#3effc4",
  "#ff3ec4",
  "#5eff3e",
  "#3e96ff",
  "#ffb83e",
  "#c43eff",
  "#3efff0",
  "#ff7a3e",
  "#8cff3e",
  "#ff3e7a",
  "#3e3eff",
  "#ffe03e",
  "#3eff7a",
  "#ff3ed2",
  "#3ed2ff",
  "#a8ff3e",
  "#ff5e8c",
  "#6b3eff",
  "#3effb0",
  "#ffa03e",
  "#ff3eb0",
  "#3e8cff",
  "#d2ff3e",
  "#ff8c5e",
];
const randomColor = () =>
  CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)];

// Shared helper: turn a raw backend post into the shape the UI expects
const normalizePost = (post) => ({
  ...post,
  color: randomColor(),
  likeCount: post.likeCount ?? 0,
  commentCount: post.commentCount ?? 0,
  likedByMe: post.likedByMe ?? false,
  author: {
    ...post.author,
    username: post.author?.username || post.author?.email?.split("@")[0],
    displayName: post.author?.name || post.author?.email?.split("@")[0],
  },
});

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
      const payload = JSON.parse(atob(res.data.token.split(".")[1]));

      // fetch the real profile (name, bio) from the backend
      let name = payload.email?.split("@")[0];
      let username = payload.email?.split("@")[0];
      let avatarUrl = null;
      try {
        const profileRes = await api.get(`/users/${payload.userId}`);
        name = profileRes.data.name || name;
        username = profileRes.data.username || username;
        avatarUrl = profileRes.data.avatarUrl || null;
      } catch {
        // if it fails, fall back to email-based values
      }

      const user = {
        id: payload.userId,
        email: payload.email,
        username,
        displayName: name,
        avatarUrl,
      };
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
      await api.post("/auth/register", {
        name: username,
        username,
        email,
        password,
      });
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

  const loginAsDemo = async () => login("test@test.com", "test1234");

  // ---- Posts ---------------------------------------------------------------

  const getFeed = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/posts");
      const normalized = res.data.map(normalizePost);
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

  const createPost = async (content, tags = [], imageUrl = "") => {
    try {
      const res = await api.post("/posts", {
        title: content.slice(0, 50),
        content,
        tags,
        imageUrl,
      });
      setPosts((prev) => [normalizePost(res.data), ...prev]);
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

  // ---- Likes ---------------------------------------------------------------

  const toggleLike = async (postId, currentlyLiked) => {
    // optimistically flip the main feed state
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

    try {
      if (currentlyLiked) {
        await api.delete(`/posts/${postId}/like`);
      } else {
        await api.post(`/posts/${postId}/like`);
      }
    } catch (err) {
      // 400 = already in that state on the server; ignore it (UI is already correct).
      // Any other error: log it.
      if (err.response?.status !== 400) {
        console.error(err);
      }
    }
  };

  // ---- Search (real, uses posts already in state) -------------------------

  const search = (raw) => {
    const q = (raw || "").trim().toLowerCase();
    if (!q) return { posts: [], users: [] };
    const matchedPosts = posts.filter(
      (p) =>
        p.content?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q),
    );
    // de-duplicate authors of matched posts as a simple "users" result
    const seen = new Set();
    const users = [];
    for (const p of matchedPosts) {
      if (p.author && !seen.has(p.author.id)) {
        seen.add(p.author.id);
        users.push(p.author);
      }
    }
    return { posts: matchedPosts, users };
  };

  // ---- Sorting (shared across feed/following/trending/tag pages) ----------

  const sortPosts = (list, sort) => {
    const arr = [...list];
    if (sort === "new") {
      return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (sort === "top") {
      return arr.sort((a, b) => b.likeCount - a.likeCount);
    }
    // hot = likes + comments, then newest
    return arr.sort(
      (a, b) =>
        b.likeCount + b.commentCount - (a.likeCount + a.commentCount) ||
        new Date(b.createdAt) - new Date(a.createdAt),
    );
  };

  // ---- Trending (real, sorts posts by engagement) -------------------------

  const getTrending = (limit = 4) =>
    [...posts]
      .sort(
        (a, b) =>
          b.likeCount + b.commentCount - (a.likeCount + a.commentCount) ||
          new Date(b.createdAt) - new Date(a.createdAt),
      )
      .slice(0, limit);

  // count tag usage across loaded posts, return the most-used
  const getTrendingTags = (limit = 5) => {
    const counts = {};
    for (const p of posts) {
      for (const pt of p.tags || []) {
        const name = pt.tag?.name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  };

  const toggleFollow = async (userId, currentlyFollowing) => {
    try {
      if (currentlyFollowing) {
        await api.delete(`/follows/${userId}`);
      } else {
        await api.post(`/follows/${userId}`);
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };
  const getFollowInfo = async (userId) => {
    try {
      const res = await api.get(`/follows/${userId}`);
      return res.data; // { followers, following, isFollowing }
    } catch (err) {
      console.error(err);
      return { followers: 0, following: 0, isFollowing: false };
    }
  };

  const getFollowingFeed = useCallback(async () => {
    try {
      const res = await api.get("/posts/following");
      const normalized = res.data.map(normalizePost);
      setPosts(normalized);
      return normalized;
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  const getFollowingSidebar = async (limit = 3) => {
    try {
      const res = await api.get("/posts/following");
      return res.data.map(normalizePost).slice(0, limit);
    } catch (err) {
      console.error(err);
      return [];
    }
  };
  const updateProfile = async ({ name, bio, username, avatarUrl }) => {
    try {
      const res = await api.put("/users/me", {
        name,
        bio,
        username,
        avatarUrl,
      });
      // update currentUser locally so the UI reflects the new values
      const updated = {
        ...currentUser,
        ...res.data,
        username: res.data.username || res.data.email?.split("@")[0],
        displayName: res.data.name || res.data.email?.split("@")[0],
      };
      setCurrentUser(updated);
      localStorage.setItem("current-user", JSON.stringify(updated));
      return { ok: true };
    } catch (err) {
      console.error(err);
      return {
        ok: false,
        error: err.response?.data?.message || "Update failed",
      };
    }
  };

  const getProfile = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}`);
      const u = res.data;
      return {
        ...u,
        username: u.username || u.email?.split("@")[0],
        displayName: u.name || u.email?.split("@")[0],
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const getLeaderboard = async () => {
    try {
      const res = await api.get("/users/leaderboard");
      return res.data.map((u) => ({
        ...u,
        username: u.username || u.email?.split("@")[0],
        displayName: u.name || u.email?.split("@")[0],
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const getPostsByTag = async (name) => {
    try {
      const res = await api.get(`/tags/${encodeURIComponent(name)}/posts`);
      return res.data.map(normalizePost);
    } catch (err) {
      console.error(err);
      return [];
    }
  };
  // ---- Stubs still needing a backend (follow / profile) -------------------
  const getUserPosts = (userId) => posts.filter((p) => p.author?.id === userId);
  const getFollowCounts = () => ({ following: 0, followers: 0 });
  const isFollowing = () => false;
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
        getFollowInfo,
        updateProfile,
        getUserPosts,
        getFollowingFeed,
        getProfile,
        getLeaderboard,
        getPostsByTag,
        getTrending,
        getTrendingTags,
        sortPosts,
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
