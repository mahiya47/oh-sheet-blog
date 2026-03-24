const API_BASE = 'https://nonpolarizing-chronoscopic-flavia.ngrok-free.dev/api';
const neobrutalistColors = ["#FF3E3E", "#3E54FF", "#3EFF8B", "#FFF03E", "#FF3EEF", "#3EFAFF", "#FFA53E", "#9D3EFF", "#FF3E96", "#C4FF3E"];

async function apiFetch(endpoint, options = {}) {
    const savedUserId = localStorage.getItem('oh_sheet_user_id');
    const headers = {
        "ngrok-skip-browser-warning": "69420",
        "Content-Type": "application/json"
    };
    if (savedUserId) headers["X-User-ID"] = savedUserId;

    return fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: headers
    });
}

async function checkUserAuth() {
    const overlay = document.getElementById("loading-overlay");
    const userId = localStorage.getItem('oh_sheet_user_id');
    const path = window.location.pathname;
    const currentPage = path.split("/").pop();
    const publicPages = ["index.html", "create-account.html", ""];

    if (!userId || userId === 'null') {
        if (!publicPages.includes(currentPage)) window.location.href = "index.html";
        if (overlay) overlay.remove();
        return;
    }

    try {
        const response = await apiFetch('/auth-status');
        const data = await response.json();
        if (data.isLoggedIn && publicPages.includes(currentPage)) {
            window.location.href = "feed.html";
        } else if (!data.isLoggedIn && !publicPages.includes(currentPage)) {
            localStorage.removeItem('oh_sheet_user_id');
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Auth error:", error);
    } finally {
        if (overlay) overlay.remove();
    }
}
checkUserAuth();

document.addEventListener("DOMContentLoaded", async () => {
    initUserNav();

    const mainFeed = document.getElementById("main-feed");
    const trendingContainer = document.getElementById("trending-container");
    const profilePage = document.getElementById("profile-page-container");
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.querySelector(".login-form");
    const publishBtn = document.querySelector(".publish-btn");
    const pfpInput = document.getElementById("pfp-input");
    const searchInput = document.getElementById("global-search");
    const postModal = document.getElementById("post-modal");
    const followingSidebar = document.getElementById("following-sidebar-container");
    const followingFeedContainer = document.getElementById("following-feed");
    const saveSettingsBtn = document.getElementById("save-settings-btn");
    const navTabs = document.querySelectorAll(".nav-tab");

    if (followingSidebar) fetchFollowingSidebar();
    if (mainFeed) fetchMainFeed();
    if (trendingContainer) fetchTrendingSidebar();
    if (profilePage) fetchUserProfile();
    if (followingFeedContainer) fetchFollowingFeed();
    
    if (saveSettingsBtn) {
        loadSettingsData();
        saveSettingsBtn.addEventListener("click", updateUserSettings);
    }

    if (navTabs.length > 0) {
        navTabs.forEach(tab => {
            tab.addEventListener("click", (e) => {
                e.preventDefault();
                const sectionId = tab.getAttribute("data-section");
                document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".settings-section").forEach(s => s.classList.remove("active"));
                tab.classList.add("active");
                const targetSection = document.getElementById(`${sectionId}-section`);
                if (targetSection) targetSection.classList.add("active");
            });
        });
    }

    if (signupForm) signupForm.addEventListener("submit", handleSignUp);
    if (loginForm) loginForm.addEventListener("submit", handleSignIn);
    checkUserAuth();
    if (publishBtn) publishBtn.addEventListener("click", createNewPost);
    if (pfpInput) pfpInput.addEventListener("change", uploadProfilePicture);

    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const query = e.target.value.trim();
                query !== "" ? performGlobalSearch(query) : fetchMainFeed();
            }
        });
    }

    if (postModal) {
        postModal.addEventListener("click", (e) => {
            if (e.target === postModal) closePostModal();
        });
    }

    setupGlobalInteractions();
});

async function handleSignUp(e) {
    e.preventDefault();
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                "ngrok-skip-browser-warning": "69420"
            },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert("Account created! Please login.");
            window.location.href = "index.html";
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Signup error:", error);
        alert("Registration failed. Check console (F12) for details.");
    }
}

async function handleSignIn(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    const response = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok && data.user) {
        localStorage.setItem('oh_sheet_user_id', data.user.id);
        window.location.href = "feed.html";
    } else {
        alert("Login failed");
    }
}

async function updateUserSettings() {
    const displayName = document.getElementById("settings-display-name").value;
    const bio = document.getElementById("settings-bio").value;

    try {
        const response = await fetch(`${API_BASE}/user/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ display_name: displayName, bio: bio })
        });
        if (response.ok) {
            alert("Settings saved successfully!");
            window.location.href = "profile.html";
        } else {
            const data = await response.json();
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error(error);
    }
}

async function loadSettingsData() {
    try {
        const response = await fetch(`${API_BASE}/user/me`, { credentials: 'include' });
        if (!response.ok) return;
        const { profile, email } = await response.json();
        if (profile) {
            const displayNameInput = document.getElementById("settings-display-name");
            const bioInput = document.getElementById("settings-bio");
            const emailInput = document.getElementById("settings-email");
            const pfpPreview = document.getElementById("settings-pfp-preview");
            if (displayNameInput) displayNameInput.value = profile.display_name || "";
            if (bioInput) bioInput.value = profile.bio || "";
            if (emailInput) emailInput.value = email || "";
            if (pfpPreview && profile.avatar_url) pfpPreview.src = profile.avatar_url;
        }
    } catch (error) {
        console.error(error);
    }
}

async function initUserNav() {
    try {
        const response = await apiFetch('/user/me');
        if (!response.ok) return;
        const { profile } = await response.json();
        if (profile) {
            const navUser = document.getElementById("nav-username");
            const navPfp = document.getElementById("nav-user-pfp");
            if (navUser) navUser.innerText = profile.username;
            if (navPfp && profile.avatar_url) navPfp.src = profile.avatar_url;
        }
    } catch (error) {
        console.error("Navigation init failed:", error);
    }
}

async function uploadProfilePicture(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
        const response = await fetch(`${API_BASE}/user/upload-pfp`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await response.json();
        if (response.ok) {
            const settingsPreview = document.getElementById("settings-pfp-preview");
            if (settingsPreview) settingsPreview.src = data.avatar_url;
            alert("Profile picture updated!");
        }
    } catch (error) {
        alert("Upload failed.");
    }
}

async function fetchUserProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('id') || 'me';
    try {
        const response = await fetch(`${API_BASE}/users/${targetUserId}`, { credentials: 'include' });
        const { profile, sessionUser, isFollowing } = await response.json();
        if (profile) {
            document.getElementById("profile-display-name").innerText = profile.display_name || profile.username;
            document.getElementById("profile-handle").innerText = "@" + profile.username;
            document.getElementById("profile-bio-text").innerText = profile.bio || "No bio yet.";
            if (profile.avatar_url) document.getElementById("profile-main-pfp").src = profile.avatar_url;
            fetchFollowCounts(profile._id);
            const actionArea = document.getElementById("profile-actions-area");
            if (actionArea) {
                if (sessionUser && sessionUser.id === profile._id) {
                    actionArea.innerHTML = `<button class="profile-edit-btn" onclick="window.location.href='setting.html'">Edit Profile</button>`;
                } else if (sessionUser) {
                    const style = isFollowing ? 'background: #FF3E3E; color: black;' : 'background: white; color: black;';
                    actionArea.innerHTML = `<button class="profile-edit-btn" style="${style}" onclick="toggleFollow('${profile._id}', this)">${isFollowing ? 'Unfollow' : 'Follow'}</button>`;
                }
            }
            fetchUserPosts(profile._id);
        }
    } catch (error) {
        console.error(error);
    }
}

async function fetchMainFeed() {
    try {
        const response = await fetch(`${API_BASE}/posts`);
        const posts = await response.json();
        renderFeed(posts, false, "main-feed");
    } catch (error) {
        console.error(error);
    }
}

async function fetchTrendingSidebar() {
    const container = document.getElementById("trending-container");
    if (!container) return;
    try {
        const response = await fetch(`${API_BASE}/posts/trending`);
        const trends = await response.json();
        container.innerHTML = "";
        trends.forEach(item => {
            const div = document.createElement("article");
            div.className = "trending-row";
            div.innerHTML = `<div class="trending-content"><span class="trending-meta">u/${item.author?.username || 'anon'} • ${item.likesCount} likes</span><p class="trending-tag">${item.content.substring(0, 35)}...</p></div>`;
            container.appendChild(div);
        });
    } catch (error) {
        console.error(error);
    }
}

async function fetchUserPosts(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/posts`);
        const posts = await response.json();
        renderFeed(posts, false, "user-posts-feed");
    } catch (error) {
        console.error(error);
    }
}

async function renderFeed(posts, isSearch = false, containerId = "main-feed") {
    let container = document.getElementById(containerId);
    if (!container) return;
    const loader = container.querySelector("#feed-loader");
    if (loader) loader.remove();
    container.innerHTML = isSearch ? `<div style="color: #3EFF8B; padding: 10px; font-weight: bold;">Results: ${posts.length} found</div>` : '';
    if (!posts || posts.length === 0) {
        container.innerHTML += `<div style="color: white; text-align: center; padding: 40px; border: 2px dashed #444; border-radius: 12px; margin-top: 20px;"><i class="fa-solid fa-sheet-plastic" style="font-size: 2rem; color: #444; margin-bottom: 10px;"></i><p>No sheets found here yet.</p></div>`;
        return;
    }
    const authRes = await fetch(`${API_BASE}/auth-status`, { credentials: 'include' });
    const { user } = await authRes.json();
    posts.forEach((post) => {
        const isLiked = user ? post.likes.includes(user.id) : false;
        const color = neobrutalistColors[Math.floor(Math.random() * neobrutalistColors.length)];
        const article = document.createElement("article");
        article.className = "sheet-card";
        article.onclick = (e) => { if (!e.target.closest('.footer-stat') && !e.target.closest('.more-options') && !e.target.closest('a')) openPostModal(post._id); };
        article.innerHTML = `
            <div class="sheet-header" style="background-color: ${color}">
                <a href="profile.html?id=${post.author?._id}" class="user-meta">
                    <img src="${post.author?.avatar_url || 'img/dp.jpg'}" class="sheet-pfp">
                    <div class="user-names">
                        <span class="display-name" style="color:black">${post.author?.display_name || 'User'}</span>
                        <span class="username" style="color:rgba(0,0,0,0.6)">@${post.author?.username} • ${formatDate(post.created_at)}</span>
                    </div>
                </a>
                <div class="more-options">
                    <i class="fa-solid fa-ellipsis"></i>
                    <div class="dropdown-content">
                        <a href="profile.html?id=${post.author?._id}"><i class="fa-regular fa-user"></i> Visit Profile</a>
                        <a href="javascript:void(0)" onclick="handleReport('${post._id}')"><i class="fa-regular fa-flag"></i> Report</a>
                        ${user && user.id === post.author?._id ? `<a href="javascript:void(0)" onclick="toggleOptions('${post._id}', '${post.author?._id}', event)" style="color: #FF3E3E;"><i class="fa-regular fa-trash-can"></i> Delete</a>` : ''}
                    </div>
                </div>
            </div>
            <div class="sheet-content"><p>${post.content}</p></div>
            <div class="sheet-footer">
                <div class="footer-stat" onclick="handleComment('${post._id}')"><i class="fa-regular fa-comment"></i> <span>${post.commentsCount || 0}</span></div>
                <div class="footer-stat" onclick="handleRepost('${post._id}')"><i class="fa-solid fa-arrows-rotate"></i> <span>Repost</span></div>
                <div class="footer-stat" onclick="handleLike('${post._id}', this)"><i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color: #FF3E3E' : ''}"></i> <span class="like-count">${post.likes?.length || 0}</span></div>
                <div class="footer-stat" onclick="handleShare('${post._id}')"><i class="fa-solid fa-share-nodes"></i> <span>Share</span></div>
            </div>`;
        container.appendChild(article);
    });
}

async function fetchFollowingFeed() {
    try {
        const response = await fetch(`${API_BASE}/posts/following`, { credentials: 'include' });
        if (response.status === 404) {
            document.getElementById("following-feed").innerHTML = `<div style="color: white; text-align: center; padding: 40px; border: 2px dashed #444;"><p>You aren't following anyone yet!</p><a href="feed.html" style="color: #3EFF8B;">Go explore posts</a></div>`;
            return;
        }
        const posts = await response.json();
        renderFeed(posts, false, "following-feed");
    } catch (error) {
        console.error(error);
    }
}

async function toggleFollow(targetUserId, btnElement) {
    try {
        const response = await fetch(`${API_BASE}/users/${targetUserId}/follow`, { method: 'POST', credentials: 'include' });
        const data = await response.json();
        if (data.isFollowing) {
            btnElement.innerText = "Unfollow";
            btnElement.style.background = "#FF3E3E";
        } else {
            btnElement.innerText = "Follow";
            btnElement.style.background = "white";
        }
        fetchFollowCounts(targetUserId);
    } catch (error) {
        alert(error.message);
    }
}

async function fetchFollowCounts(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/follow-counts`);
        const { followingCount, followersCount } = await response.json();
        const f1 = document.getElementById("following-count");
        const f2 = document.getElementById("followers-count");
        if (f1) f1.innerText = followingCount;
        if (f2) f2.innerText = followersCount;
    } catch (error) {
        console.error(error);
    }
}

async function fetchFollowingSidebar() {
    const container = document.getElementById("following-sidebar-container");
    if (!container) return;
    try {
        const response = await fetch(`${API_BASE}/posts/following-recent`, { credentials: 'include' });
        if (!response.ok) {
            container.innerHTML = "<p style='padding:15px; color:#888;'>Sign in to see following activity.</p>";
            return;
        }
        const posts = await response.json();
        container.innerHTML = "";
        if (posts.length === 0) {
            container.innerHTML = "<p style='padding:15px; color:#888;'>Not following anyone yet.</p>";
            return;
        }
        posts.forEach(post => {
            const div = document.createElement("article");
            div.className = "trending-row";
            div.innerHTML = `<div class="trending-content"><span class="trending-meta">u/${post.author?.username || 'anon'}</span><p class="trending-tag">${post.content.substring(0, 40)}...</p></div>`;
            container.appendChild(div);
        });
    } catch (error) {
        console.error(error);
    }
}

async function toggleOptions(postId, postUserId, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!confirm("Are you sure?")) return;
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}`, { method: 'DELETE', credentials: 'include' });
        if (response.ok) window.location.reload();
    } catch (error) {
        alert("Delete failed.");
    }
}

async function handleLike(postId, element) {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/like`, { method: 'POST', credentials: 'include' });
        const data = await response.json();
        const heart = element.querySelector('i');
        const count = element.querySelector('.like-count');
        if (data.isLiked) {
            heart.classList.replace('fa-regular', 'fa-solid');
            heart.style.color = "#FF3E3E";
        } else {
            heart.classList.replace('fa-solid', 'fa-regular');
            heart.style.color = "";
        }
        count.innerText = data.likesCount;
    } catch (error) {
        console.error(error);
    }
}

async function handleRepost(postId) {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/repost`, { method: 'POST', credentials: 'include' });
        if (response.ok) window.location.reload();
    } catch (error) {
        alert("Repost failed.");
    }
}

function handleShare(postId) {
    const url = `${window.location.origin}${window.location.pathname}?id=${postId}`;
    navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
}

async function handleComment(postId) {
    const body = prompt("Enter comment:");
    if (!body) return;
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content: body })
        });
        if (response.ok) window.location.reload();
    } catch (error) {
        alert("Comment failed.");
    }
}

async function createNewPost(e) {
    e.preventDefault();
    const content = document.querySelector(".editor-textarea").value;
    if (!content) return alert("Sheet cannot be empty!");
    try {
        const response = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content })
        });
        if (response.ok) window.location.href = "feed.html";
    } catch (error) {
        alert("Post failed.");
    }
}

async function performGlobalSearch(query) {
    try {
        const response = await fetch(`${API_BASE}/search?q=${query}`);
        const posts = await response.json();
        renderFeed(posts, true, "main-feed");
    } catch (error) {
        console.error(error);
    }
}

function handleReport(postId) {
    const reason = prompt("Why are you reporting this post?");
    if (reason) alert("Reported successfully.");
}

function formatDate(date) {
    const d = Math.floor((new Date() - new Date(date)) / 1000);
    if (d < 60) return 'now';
    if (d < 3600) return Math.floor(d/60) + 'm';
    if (d < 86400) return Math.floor(d/3600) + 'h';
    return Math.floor(d/86400) + 'd';
}

function setupGlobalInteractions() {
    const btn = document.getElementById("logout-btn");
    if (btn) {
        btn.onclick = async (e) => {
            e.preventDefault();
            await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
            window.location.href = "index.html";
        };
    }
}

async function openPostModal(postId) {
    const modal = document.getElementById("post-modal");
    const contentDiv = document.getElementById("modal-post-content");
    const commentsList = document.getElementById("modal-comments-list");
    modal.style.display = "flex";
    contentDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin" style="color: #3EFF8B; font-size: 2rem;"></i></div>`;
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}`, { credentials: 'include' });
        const { post, comments, currentUser } = await response.json();
        const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
        contentDiv.innerHTML = `
            <div class="sheet-header" style="background: white; color: black; margin: -20px -20px 20px -20px; padding: 15px; border-bottom: 2px solid black;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${post.author?.avatar_url || 'img/dp.jpg'}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid black;">
                    <div><div style="font-weight: 900; text-transform: uppercase; line-height: 1;">${post.author?.display_name}</div><div style="font-size: 0.8rem; opacity: 0.7;">@${post.author?.username}</div></div>
                </div>
            </div>
            <div style="padding: 30px 0;"><p style="font-size: 1.6rem; color: white; line-height: 1.4; font-weight: 500;">${post.content}</p></div>
            <div class="sheet-footer" style="border-top: 1px solid #333; padding-top: 15px; display: flex; gap: 20px;">
                <div class="footer-stat" onclick="handleLike('${post._id}', this)"><i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color: #FF3E3E' : ''}"></i> <span class="like-count">${post.likes?.length || 0}</span></div>
                <div class="footer-stat" onclick="handleShare('${post._id}')"><i class="fa-solid fa-share-nodes"></i> <span>Share</span></div>
            </div>`;
        commentsList.innerHTML = "";
        if (comments.length > 0) {
            comments.forEach(comment => {
                const isMyComment = currentUser && currentUser.id === comment.author?._id;
                const cDiv = document.createElement("div");
                cDiv.className = "comment-item";
                cDiv.innerHTML = `<div style="display: flex; gap: 10px;"><img src="${comment.author?.avatar_url || 'img/dp.jpg'}" style="width: 25px; height: 25px; border-radius: 50%;"><div><strong style="color: #3EFF8B; font-size: 0.9rem;">@${comment.author?.username}</strong><p style="color: white; margin-top: 4px;">${comment.content}</p></div></div>${isMyComment ? `<button onclick="deleteComment('${comment._id}', '${postId}')" class="delete-comment-btn"><i class="fa-regular fa-trash-can"></i></button>` : ''}`;
                commentsList.appendChild(cDiv);
            });
        } else {
            commentsList.innerHTML = "<p style='color: #555; padding: 20px 0;'>No comments yet.</p>";
        }
        document.getElementById("submit-modal-comment").onclick = () => submitModalComment(postId);
    } catch (error) {
        contentDiv.innerHTML = "<p style='color:red;'>Error loading.</p>";
    }
}

async function submitModalComment(postId) {
    const text = document.getElementById("modal-comment-text").value;
    if (!text) return;
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content: text })
        });
        if (response.ok) {
            document.getElementById("modal-comment-text").value = "";
            openPostModal(postId);
        }
    } catch (error) {
        console.error(error);
    }
}

function closePostModal() { document.getElementById("post-modal").style.display = "none"; }

async function deleteComment(commentId, postId) {
    if (!confirm("Delete?")) return;
    try {
        const response = await fetch(`${API_BASE}/comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
        if (response.ok) openPostModal(postId);
    } catch (error) {
        alert("Failed.");
    }
}

window.toggleOptions = toggleOptions;
window.handleLike = handleLike;
window.handleRepost = handleRepost;
window.handleShare = handleShare;
window.handleComment = handleComment;
window.handleReport = handleReport;
window.openPostModal = openPostModal;
window.submitModalComment = submitModalComment;
window.closePostModal = closePostModal;
window.deleteComment = deleteComment;
window.toggleFollow = toggleFollow;