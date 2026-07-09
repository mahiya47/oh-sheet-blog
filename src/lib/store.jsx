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
      let name = payload.email?.split("@")[0];
      let username = payload.email?.split("@")[0];
      let avatarUrl = null;
      let coverUrl = null;
      let gender = "";
      let orientation = "";
      let showGender = false;
      let showOrientation = false;
      let birthday = null;
      let emailVerified = false;
      let createdAt = null;
      let score = 0;
      let githubUrl = null;
      let instagramUrl = null;
      let linkedinUrl = null;
      let twitterUrl = null;
      try {
        const profileRes = await api.get(`/users/${payload.userId}`);
        name = profileRes.data.name || name;
        emailVerified = profileRes.data.emailVerified || false;
        username = profileRes.data.username || username;
        avatarUrl = profileRes.data.avatarUrl || null;
        coverUrl = profileRes.data.coverUrl || null;
        gender = profileRes.data.gender || "";
        orientation = profileRes.data.orientation || "";
        showGender = profileRes.data.showGender || false;
        showOrientation = profileRes.data.showOrientation || false;
        birthday = profileRes.data.birthday || null;
        createdAt = profileRes.data.createdAt || null;
        score = profileRes.data.score || 0;
        githubUrl = profileRes.data.githubUrl || null;
        instagramUrl = profileRes.data.instagramUrl || null;
        linkedinUrl = profileRes.data.linkedinUrl || null;
        twitterUrl = profileRes.data.twitterUrl || null;
      } catch {}
      const user = {
        id: payload.userId,
        email: payload.email,
        username,
        displayName: name,
        avatarUrl,
        coverUrl,
        gender,
        orientation,
        showGender,
        showOrientation,
        birthday,
        emailVerified,
        createdAt,
        score,
        githubUrl,
        instagramUrl,
        linkedinUrl,
        twitterUrl,
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

  const loginWithToken = async (token) => {
    try {
      localStorage.setItem("token", token);
      const payload = JSON.parse(atob(token.split(".")[1]));

      let name = payload.email?.split("@")[0];
      let username = payload.email?.split("@")[0];
      let avatarUrl = null;
      let coverUrl = null;
      let gender = "";
      let orientation = "";
      let showGender = false;
      let showOrientation = false;
      let birthday = null;
      let emailVerified = false;
      let createdAt = null;
      let score = 0;
      let githubUrl = null;
      let instagramUrl = null;
      let linkedinUrl = null;
      let twitterUrl = null;
      let googleId = null;
      let githubId = null;

      try {
        const profileRes = await api.get(`/users/${payload.userId}`);
        name = profileRes.data.name || name;
        emailVerified = profileRes.data.emailVerified || false;
        username = profileRes.data.username || username;
        avatarUrl = profileRes.data.avatarUrl || null;
        coverUrl = profileRes.data.coverUrl || null;
        gender = profileRes.data.gender || "";
        orientation = profileRes.data.orientation || "";
        showGender = profileRes.data.showGender || false;
        showOrientation = profileRes.data.showOrientation || false;
        birthday = profileRes.data.birthday || null;
        createdAt = profileRes.data.createdAt || null;
        score = profileRes.data.score || 0;
        githubUrl = profileRes.data.githubUrl || null;
        instagramUrl = profileRes.data.instagramUrl || null;
        linkedinUrl = profileRes.data.linkedinUrl || null;
        twitterUrl = profileRes.data.twitterUrl || null;
        googleId = profileRes.data.googleId || null;
        githubId = profileRes.data.githubId || null;
      } catch {}

      const user = {
        id: payload.userId,
        email: payload.email,
        username,
        displayName: name,
        avatarUrl,
        coverUrl,
        gender,
        orientation,
        showGender,
        showOrientation,
        birthday,
        emailVerified,
        createdAt,
        score,
        githubUrl,
        instagramUrl,
        linkedinUrl,
        twitterUrl,
        googleId,
        githubId,
      };
      localStorage.setItem("current-user", JSON.stringify(user));
      setCurrentUser(user);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Sign-in failed" };
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

  const [nextCursor, setNextCursor] = useState(null);

  const getFeed = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/posts");
      const normalized = res.data.posts.map(normalizePost);
      setPosts(normalized);
      setNextCursor(res.data.nextCursor);
      return normalized;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMorePosts = useCallback(async () => {
    if (!nextCursor) return false;
    try {
      const res = await api.get(`/posts?cursor=${nextCursor}`);
      const normalized = res.data.posts.map(normalizePost);
      setPosts((prev) => [...prev, ...normalized]);
      setNextCursor(res.data.nextCursor);
      return !!res.data.nextCursor;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [nextCursor]);

  const getPost = async (id) => {
    try {
      const res = await api.get(`/posts/${id}`);
      return res.data;
    } catch {
      return null;
    }
  };

  const createPost = async (
    content,
    tags = [],
    imageUrl = "",
    repostOfId = null,
  ) => {
    try {
      const res = await api.post("/posts", {
        title: content.slice(0, 50),
        content,
        tags,
        imageUrl,
        repostOfId,
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

  const editPost = async (postId, content) => {
    try {
      const res = await api.put(`/posts/${postId}`, {
        content,
        title: content.slice(0, 50) || "sheet",
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, content: res.data.content, title: res.data.title }
            : p,
        ),
      );
      return true;
    } catch (err) {
      console.error(err);
      return false;
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

  const addComment = async (postId, content, parentId = null) => {
    try {
      const res = await api.post(`/posts/${postId}/comments`, {
        content,
        parentId,
      });
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
      if (err.response?.status !== 400) console.error(err);
    }
  };

  // ---- Search --------------------------------------------------------------

  const search = (raw) => {
    const q = (raw || "").trim().toLowerCase();
    if (!q) return { posts: [], users: [] };
    const matchedPosts = posts.filter(
      (p) =>
        p.content?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q),
    );
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

  const searchLive = async (q) => {
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      return {
        users: res.data.users || [],
        tags: res.data.tags || [],
        posts: (res.data.posts || []).map(normalizePost),
      };
    } catch {
      return { users: [], tags: [], posts: [] };
    }
  };

  // ---- Sorting -------------------------------------------------------------

  const sortPosts = (list, sort) => {
    const arr = [...list];
    if (sort === "new")
      return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "top") return arr.sort((a, b) => b.likeCount - a.likeCount);
    return arr.sort(
      (a, b) =>
        b.likeCount + b.commentCount - (a.likeCount + a.commentCount) ||
        new Date(b.createdAt) - new Date(a.createdAt),
    );
  };

  // ---- Trending ------------------------------------------------------------

  const getTrending = (limit = 4) =>
    [...posts]
      .sort(
        (a, b) =>
          b.likeCount + b.commentCount - (a.likeCount + a.commentCount) ||
          new Date(b.createdAt) - new Date(a.createdAt),
      )
      .slice(0, limit);

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

  // ---- Follows -------------------------------------------------------------

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
      return res.data;
    } catch (err) {
      console.error(err);
      return { followers: 0, following: 0, isFollowing: false };
    }
  };

  const getFollowers = async (userId) => {
    try {
      const res = await api.get(`/follows/${userId}/followers`);
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

  const getFollowingList = async (userId) => {
    try {
      const res = await api.get(`/follows/${userId}/following`);
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

  const getSuggestedUsers = async () => {
    try {
      const res = await api.get("/users/suggestions");
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

  const blockUser = async (userId) => {
    try {
      await api.post(`/blocks/${userId}`);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const unblockUser = async (userId) => {
    try {
      await api.delete(`/blocks/${userId}`);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const getBlockedUsers = async () => {
    try {
      const res = await api.get("/blocks");
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

  const getBlockStatus = async (userId) => {
    try {
      const res = await api.get(`/blocks/${userId}/status`);
      return res.data;
    } catch {
      return { iBlockedThem: false, theyBlockedMe: false };
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete("/auth/me");
      logout();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || "Could not delete account",
      };
    }
  };

  // ---- Profile -------------------------------------------------------------

  const updateProfile = async ({
    name,
    bio,
    username,
    avatarUrl,
    coverUrl,
    gender,
    orientation,
    showGender,
    showOrientation,
    birthday,
    pronouns,
    githubUrl,
    instagramUrl,
    linkedinUrl,
    twitterUrl,
    currentCity,
    work,
    education,
  }) => {
    try {
      const res = await api.put("/users/me", {
        name,
        bio,
        username,
        avatarUrl,
        coverUrl,
        gender,
        orientation,
        showGender,
        showOrientation,
        birthday,
        pronouns,
        githubUrl,
        instagramUrl,
        linkedinUrl,
        twitterUrl,
        currentCity,
        work,
        education,
      });
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
  const resendVerification = async () => {
    try {
      await api.post("/auth/resend-verification");
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.message || "Could not send email",
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

  // ---- Notifications ---------------------------------------------------

  const getNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      return res.data.map((n) => ({
        ...n,
        actor: {
          ...n.actor,
          displayName: n.actor?.name || n.actor?.email?.split("@")[0],
          username: n.actor?.username || n.actor?.email?.split("@")[0],
        },
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const getUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      return res.data.count;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  const markNotificationsRead = async () => {
    try {
      await api.put("/notifications/read");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      return true;
    } catch (err) {
      console.error(err);
      return false;
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

  // ---- DMs -------------------------------------------------------------

  const getConversations = async () => {
    try {
      const res = await api.get("/dms");
      return res.data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const getDmThread = async (userId) => {
    try {
      const res = await api.get(`/dms/${userId}`);
      return res.data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const sendDm = async (userId, content) => {
    const res = await api.post(`/dms/${userId}`, { content });
    return res.data;
  };

  const getDmUnread = async () => {
    try {
      const res = await api.get("/dms/unread-count");
      return res.data.count;
    } catch {
      return 0;
    }
  };

  // ---- Chat ----------------------------------------------------------------

  const getChatMessages = async () => {
    try {
      const res = await api.get("/chat");
      return res.data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const sendChatMessage = async (content) => {
    const res = await api.post("/chat", { content });
    return res.data;
  };

  const getChatUnread = async () => {
    try {
      const res = await api.get("/chat");
      const messages = res.data || [];
      if (messages.length === 0) return 0;
      const lastSeen = localStorage.getItem("chat-last-seen");
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
      return messages.filter(
        (m) =>
          new Date(m.createdAt).getTime() > lastSeenTime &&
          m.userId !== currentUser?.id,
      ).length;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  const markChatSeen = () => {
    localStorage.setItem("chat-last-seen", new Date().toISOString());
  };

  // ---- Stubs ---------------------------------------------------------------

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
        editPost,
        getComments,
        addComment,
        deleteComment,
        toggleLike,
        toggleFollow,
        getFollowInfo,
        getFollowers,
        getFollowingList,
        updateProfile,
        getUserPosts,
        resendVerification,
        getFollowingFeed,
        getProfile,
        getLeaderboard,
        getPostsByTag,
        getTrending,
        getTrendingTags,
        sortPosts,
        getChatUnread,
        markChatSeen,
        getFollowingSidebar,
        getSuggestedUsers,
        getFollowCounts,
        isFollowing,
        search,
        searchLive,
        loadMorePosts,
        resetDemo,
        getChatMessages,
        sendChatMessage,
        getNotifications,
        getUnreadCount,
        markNotificationsRead,
        deleteNotification,
        getConversations,
        getDmThread,
        sendDm,
        getDmUnread,
        blockUser,
        unblockUser,
        getBlockedUsers,
        getBlockStatus,
        deleteAccount,
        loginWithToken,
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
