const supabaseUrl = 'https://atrtpagxccesjuijeoqz.supabase.co'
const supabaseKey = 'sb_publishable_kXsdRS77Aj1bAAx_EkgKsw_B0uZu30n'
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey)

const neobrutalistColors = ["#FF3E3E", "#3E54FF", "#3EFF8B", "#FFF03E", "#FF3EEF", "#3EFAFF", "#FFA53E", "#9D3EFF", "#FF3E96", "#C4FF3E"];

async function checkUserAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const path = window.location.pathname;
    const currentPage = path.split("/").pop();
    const publicPages = ["index.html", "create-account.html"];

    if (!session && !publicPages.includes(currentPage) && currentPage !== "") {
        window.location.href = "index.html";
    } 
    else if (session && (currentPage === "index.html" || currentPage === "create-account.html" || currentPage === "")) {
        window.location.href = "feed.html";
    } else {
        const overlay = document.getElementById("loading-overlay");
        if (overlay) {
            overlay.style.opacity = "0";
            setTimeout(() => overlay.remove(), 300);
        }
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
            if (e.target === postModal) {
                closePostModal();
            }
        });
    }

    setupGlobalInteractions();
});

async function updateUserSettings() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const displayName = document.getElementById("settings-display-name").value;
    const bio = document.getElementById("settings-bio").value;

    const { error } = await supabaseClient
        .from('profiles')
        .update({
            display_name: displayName,
            bio: bio
        })
        .eq('id', session.user.id);

    if (error) {
        alert("Error updating profile: " + error.message);
    } else {
        alert("Settings saved successfully!");
        window.location.href = "profile.html";
    }
}

async function loadSettingsData() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        const displayNameInput = document.getElementById("settings-display-name");
        const bioInput = document.getElementById("settings-bio");
        const emailInput = document.getElementById("settings-email");
        const pfpPreview = document.getElementById("settings-pfp-preview");

        if (displayNameInput) displayNameInput.value = profile.display_name || "";
        if (bioInput) bioInput.value = profile.bio || "";
        if (emailInput) emailInput.value = session.user.email;
        if (pfpPreview && profile.avatar_url) pfpPreview.src = profile.avatar_url;
    }
}

async function handleSignIn(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert(error.message);
    } else {
        window.location.href = "feed.html";
    }
}

async function initUserNav() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

    if (profile) {
        const navUser = document.getElementById("nav-username");
        const navPfp = document.getElementById("nav-user-pfp");
        if (navUser) navUser.innerText = profile.username;
        if (navPfp && profile.avatar_url) navPfp.src = profile.avatar_url;
    }
}

async function uploadProfilePicture(e) {
    const file = e.target.files[0];
    if (!file) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: true };

    try {
        const compressedFile = await imageCompression(file, options);
        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, compressedFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
        
        await supabaseClient.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
        
        const settingsPreview = document.getElementById("settings-pfp-preview");
        if (settingsPreview) settingsPreview.src = publicUrl;

        alert("Profile picture updated!");
    } catch (error) {
        alert("Error: " + error.message);
    }
}

async function fetchUserProfile() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('id') || session?.user.id;

    if (!targetUserId) return;

    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

    if (profile) {
        document.getElementById("profile-display-name").innerText = profile.display_name || profile.username;
        document.getElementById("profile-handle").innerText = "@" + profile.username;
    
        const bioText = (profile.bio && profile.bio.trim().length > 0) ? profile.bio : "No bio yet.";
        document.getElementById("profile-bio-text").innerText = bioText;
    
        if (profile.avatar_url) {
            document.getElementById("profile-main-pfp").src = profile.avatar_url;
        }

        fetchFollowCounts(targetUserId);

        const actionArea = document.getElementById("profile-actions-area");
        if (!actionArea) return;
    
        if (session && session.user.id === targetUserId) {
            actionArea.innerHTML = `<button class="profile-edit-btn" onclick="window.location.href='setting.html'">Edit Profile</button>`;
        } else if (session) {
            const { data: isFollowing } = await supabaseClient
                .from('follows')
                .select('*')
                .match({ follower_id: session.user.id, following_id: targetUserId })
                .maybeSingle();

            const followBtnStyles = isFollowing 
                ? 'background: #FF3E3E; color: black; border: 2px solid black;' 
                : 'background: white; color: black; border: 2px solid black;';

            actionArea.innerHTML = `
                <button class="profile-edit-btn" 
                        style="${followBtnStyles}" 
                        onclick="toggleFollow('${targetUserId}', this)">
                    ${isFollowing ? 'Unfollow' : 'Follow'}
                </button>`;
        } else {
            actionArea.innerHTML = `<button class="profile-edit-btn" onclick="alert('Please login to follow users!')">Follow</button>`;
        }
    
        fetchUserPosts(targetUserId);
    }
}

async function fetchUserPosts(userId) {
    const { data: posts, error } = await supabaseClient
        .from('posts')
        .select('*, profiles(username, display_name, avatar_url), likes(user_id), comments(id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching user posts:", error);
        return;
    }

    renderFeed(posts, false, "user-posts-feed");
}

async function fetchMainFeed() {
    const { data: posts } = await supabaseClient
        .from('posts')
        .select('*, profiles(username, display_name, avatar_url), likes(user_id), comments(id)')
        .order('created_at', { ascending: false });

    renderFeed(posts, false, "main-feed");
}

async function fetchTrendingSidebar() {
    const container = document.getElementById("trending-container");
    if (!container) return;

    const { data: trends, error } = await supabaseClient
        .from('posts')
        .select('content, profiles(username)')
        .limit(3)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Trending Error:", error);
        return;
    }

    container.innerHTML = "";
    trends.forEach(item => {
        const div = document.createElement("article");
        div.className = "trending-row";
        div.innerHTML = `
            <div class="trending-content">
                <span class="trending-meta">u/${item.profiles?.username || 'anon'}</span>
                <p class="trending-tag">${item.content.substring(0, 30)}...</p>
            </div>`;
        container.appendChild(div);
    });
}

async function renderFeed(posts, isSearch = false, containerId = "main-feed") {
    let container = document.getElementById(containerId);
    
    if (!container) {
        return;
    }

    const loader = container.querySelector("#feed-loader");
    if (loader) {
        loader.remove();
    }
    
    container.innerHTML = isSearch ? `<div style="color: #3EFF8B; padding: 10px; font-weight: bold;">Results: ${posts.length} found</div>` : '';

    if (!posts || posts.length === 0) {
        container.innerHTML += `
            <div style="color: white; text-align: center; padding: 40px; border: 2px dashed #444; border-radius: 12px; margin-top: 20px;">
                <i class="fa-solid fa-sheet-plastic" style="font-size: 2rem; color: #444; margin-bottom: 10px;"></i>
                <p>No sheets found here yet.</p>
            </div>`;
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();

    posts.forEach((post) => {
        const isLiked = session ? post.likes.some(l => l.user_id === session.user.id) : false;
        const color = neobrutalistColors[Math.floor(Math.random() * neobrutalistColors.length)];
        
        const article = document.createElement("article");
        article.className = "sheet-card";
        
        article.onclick = (e) => {
            if (!e.target.closest('.footer-stat') && !e.target.closest('.more-options') && !e.target.closest('a')) {
                openPostModal(post.id);
            }
        };

        article.innerHTML = `
            <div class="sheet-header" style="background-color: ${color}">
                <a href="profile.html?id=${post.user_id}" class="user-meta">
                    <img src="${post.profiles?.avatar_url || 'img/dp.jpg'}" class="sheet-pfp">
                    <div class="user-names">
                        <span class="display-name" style="color:black">${post.profiles?.display_name || 'User'}</span>
                        <span class="username" style="color:rgba(0,0,0,0.6)">@${post.profiles?.username} • ${formatDate(post.created_at)}</span>
                    </div>
                </a>
                <div class="more-options">
                    <i class="fa-solid fa-ellipsis"></i>
                    <div class="dropdown-content">
                        <a href="profile.html?id=${post.user_id}"><i class="fa-regular fa-user"></i> Visit Profile</a>
                        <a href="javascript:void(0)" onclick="handleReport(${post.id})"><i class="fa-regular fa-flag"></i> Report</a>
                        ${session && session.user.id === post.user_id ? 
                            `<a href="javascript:void(0)" onclick="toggleOptions(${post.id}, '${post.user_id}', event)" style="color: #FF3E3E;">
                                <i class="fa-regular fa-trash-can"></i> Delete
                            </a>` 
                            : ''}
                    </div>
                </div>
            </div>
            <div class="sheet-content">
                <p>${post.content}</p>
            </div>
            <div class="sheet-footer">
                <div class="footer-stat" onclick="openPostModal(${post.id})">
                    <i class="fa-regular fa-comment"></i> 
                    <span>${post.comments?.length || 0}</span>
                </div>
                <div class="footer-stat" onclick="handleRepost(${post.id})">
                    <i class="fa-solid fa-arrows-rotate"></i> 
                    <span>Repost</span>
                </div>
                <div class="footer-stat" onclick="handleLike(${post.id}, this)">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color: #FF3E3E' : ''}"></i> 
                    <span class="like-count">${post.likes?.length || 0}</span>
                </div>
                <div class="footer-stat" onclick="handleShare(${post.id})">
                    <i class="fa-solid fa-share-nodes"></i> 
                    <span>Share</span>
                </div>
            </div>`;
        
        container.appendChild(article);
    });
}

async function fetchFollowingFeed() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const { data: followingData } = await supabaseClient
        .from('follows')
        .select('following_id')
        .eq('follower_id', session.user.id);

    const followingIds = followingData.map(f => f.following_id);

    if (followingIds.length === 0) {
        document.getElementById("following-feed").innerHTML = `
            <div style="color: white; text-align: center; padding: 40px; border: 2px dashed #444;">
                <p>You aren't following anyone yet!</p>
                <a href="feed.html" style="color: #3EFF8B;">Go explore posts</a>
            </div>`;
        return;
    }

    const { data: posts, error } = await supabaseClient
        .from('posts')
        .select('*, profiles(username, display_name, avatar_url), likes(user_id), comments(id)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false });

    if (!error) {
        renderFeed(posts, false, "following-feed");
    }
}

async function toggleFollow(targetUserId, btnElement) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in to follow users!");
    if (session.user.id === targetUserId) return alert("You can't follow yourself!");

    const { data: existing } = await supabaseClient
        .from('follows')
        .select('*')
        .match({ follower_id: session.user.id, following_id: targetUserId })
        .maybeSingle();

    if (existing) {
        await supabaseClient
            .from('follows')
            .delete()
            .match({ follower_id: session.user.id, following_id: targetUserId });
        
        btnElement.innerText = "Follow";
        btnElement.style.background = "white";
        btnElement.style.color = "black";
    } else {
        await supabaseClient
            .from('follows')
            .insert([{ follower_id: session.user.id, following_id: targetUserId }]);
        
        btnElement.innerText = "Unfollow";
        btnElement.style.background = "#FF3E3E";
        btnElement.style.color = "black";
    }
    fetchFollowCounts(targetUserId);
}

async function fetchFollowCounts(userId) {
    const { count: followingCount, error: err1 } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    const { count: followersCount, error: err2 } = await supabaseClient
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    if (!err1 && followingCount !== null) {
        document.getElementById("following-count").innerText = followingCount;
    }
    if (!err2 && followersCount !== null) {
        document.getElementById("followers-count").innerText = followersCount;
    }
}

async function fetchFollowingSidebar() {
    const container = document.getElementById("following-sidebar-container");
    if (!container) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        container.innerHTML = "<p style='padding:15px; color:#888;'>Sign in to see who you follow.</p>";
        return;
    }

    const { data: following, error } = await supabaseClient
        .from('follows')
        .select('following_id, profiles:following_id(username, display_name, avatar_url)')
        .eq('follower_id', session.user.id);

    if (error) {
        console.error("Sidebar Error:", error);
        return;
    }

    if (!following || following.length === 0) {
        container.innerHTML = "<p style='padding:15px; color:#888;'>Not following anyone yet.</p>";
        return;
    }

    container.innerHTML = "";
    following.forEach(item => {
        const p = item.profiles;
        if (!p) return;
        
        const div = document.createElement("div");
        div.className = "trending-row";
        div.innerHTML = `
            <a href="profile.html?id=${item.following_id}" style="display:flex; align-items:center; gap:10px; width:100%;">
                <img src="${p.avatar_url || 'img/dp.jpg'}" style="width:30px; height:30px; border-radius:50%; border:1px solid white; object-fit: cover;">
                <div class="trending-content">
                    <span class="trending-tag" style="color: white; font-weight: bold;">${p.display_name || p.username}</span>
                    <span class="trending-meta">@${p.username}</span>
                </div>
            </a>`;
        container.appendChild(div);
    });
}   

async function toggleOptions(postId, postUserId, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
        alert("Please sign in to perform this action.");
        return;
    }

    if (postUserId !== user.id) {
        alert("You can only delete your own posts!");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this Sheet?");
    if (confirmDelete) {
        const { error } = await supabaseClient
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', user.id);

        if (error) {
            console.error("Delete Error:", error);
            alert("Delete failed: " + error.message);
        } else {
            alert("Sheet deleted successfully!");
            window.location.reload();
        }
    }
}

async function handleLike(postId, element) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in first!");
    const heartIcon = element.querySelector('i');
    const likeCountSpan = element.querySelector('.like-count');
    let count = parseInt(likeCountSpan.innerText);

    const { data: existing } = await supabaseClient.from('likes').select('*').match({ post_id: postId, user_id: session.user.id }).maybeSingle();

    if (existing) {
        await supabaseClient.from('likes').delete().match({ post_id: postId, user_id: session.user.id });
        heartIcon.classList.replace('fa-solid', 'fa-regular');
        heartIcon.style.color = "";
        likeCountSpan.innerText = count - 1;
    } else {
        await supabaseClient.from('likes').insert([{ post_id: postId, user_id: session.user.id }]);
        heartIcon.classList.replace('fa-regular', 'fa-solid');
        heartIcon.style.color = "#FF3E3E";
        likeCountSpan.innerText = count + 1;
    }
}

async function handleRepost(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in first!");
    
    const { data: original } = await supabaseClient.from('posts').select('*').eq('id', postId).single();
    
    if (original) {
        await supabaseClient.from('posts').insert([{ 
            content: `Repost: ${original.content}`,
            user_id: session.user.id 
        }]);
        alert("Reposted!");
        window.location.reload();
    }
}

function handleShare(postId) {
    const url = `${window.location.origin}${window.location.pathname}?id=${postId}`;
    navigator.clipboard.writeText(url).then(() => alert("Link copied!"));
}

async function handleComment(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in first!");
    const body = prompt("Enter comment:");
    if (body) {
        await supabaseClient.from('comments').insert([{ content: body, post_id: postId, user_id: session.user.id }]);
        window.location.reload();
    }
}

async function createNewPost(e) {
    e.preventDefault();
    const textarea = document.querySelector(".editor-textarea");
    if (!textarea) return;
    
    const content = textarea.value;
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!content) return alert("Sheet cannot be empty!");

    await supabaseClient.from('posts').insert([{ content, user_id: user.id }]);
    window.location.href = "feed.html";
}


function handleReport(postId) {
    const reason = prompt("Why are you reporting this post? (Spam, Harassment, Inappropriate)");
    if (reason) {
        alert("Thank you. Post #" + postId + " has been reported for: " + reason);
        console.log(`Post ${postId} reported for: ${reason}`);
    }
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
    if (btn) btn.onclick = async () => { await supabaseClient.auth.signOut(); window.location.href = "index.html"; };
}
;

async function openPostModal(postId) {
    const modal = document.getElementById("post-modal");
    const contentDiv = document.getElementById("modal-post-content");
    const commentsList = document.getElementById("modal-comments-list");
    
    modal.style.display = "flex";
    contentDiv.innerHTML = `<div style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin" style="color: #3EFF8B; font-size: 2rem;"></i></div>`;
    commentsList.innerHTML = "";

    const { data: { session } } = await supabaseClient.auth.getSession();

    const { data: post, error } = await supabaseClient
        .from('posts')
        .select('*, profiles(username, display_name, avatar_url), likes(user_id)')
        .eq('id', postId)
        .single();

    if (error) {
        contentDiv.innerHTML = "<p style='color:red;'>Error loading post.</p>";
        return;
    }

    const isLiked = session ? post.likes.some(l => l.user_id === session.user.id) : false;

    contentDiv.innerHTML = `
        <div class="sheet-header" style="background: white; color: black; margin: -20px -20px 20px -20px; padding: 15px; border-bottom: 2px solid black;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${post.profiles.avatar_url || 'img/dp.jpg'}" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid black;">
                <div>
                    <div style="font-weight: 900; text-transform: uppercase; line-height: 1;">${post.profiles.display_name}</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">@${post.profiles.username}</div>
                </div>
            </div>
        </div>
        <div style="padding: 30px 0;">
            <p style="font-size: 1.6rem; color: white; line-height: 1.4; font-weight: 500;">${post.content}</p>
        </div>
        <div class="sheet-footer" style="border-top: 1px solid #333; padding-top: 15px; display: flex; gap: 20px;">
            <div class="footer-stat" onclick="handleLike(${post.id}, this)">
                <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color: #FF3E3E' : ''}"></i> 
                <span class="like-count">${post.likes?.length || 0}</span>
            </div>
            <div class="footer-stat" onclick="handleShare(${post.id})">
                <i class="fa-solid fa-share-nodes"></i> 
                <span>Share</span>
            </div>
        </div>
    `;

    const { data: comments } = await supabaseClient
        .from('comments')
        .select('id, content, user_id, profiles(username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (comments && comments.length > 0) {
        comments.forEach(comment => {
            const isMyComment = session && session.user.id === comment.user_id;
            const cDiv = document.createElement("div");
            cDiv.style.padding = "12px 0";
            cDiv.style.borderBottom = "1px solid #222";
            cDiv.style.display = "flex";
            cDiv.style.justifyContent = "space-between";
            cDiv.style.alignItems = "flex-start";

            cDiv.innerHTML = `
                <div style="display: flex; gap: 10px;">
                    <img src="${comment.profiles.avatar_url || 'img/dp.jpg'}" style="width: 25px; height: 25px; border-radius: 50%;">
                    <div>
                        <strong style="color: #3EFF8B; font-size: 0.9rem;">@${comment.profiles.username}</strong>
                        <p style="color: white; margin-top: 4px;">${comment.content}</p>
                    </div>
                </div>
                ${isMyComment ? `
                    <button onclick="deleteComment(${comment.id}, ${postId})" style="background:transparent; border:none; color:#FF3E3E; cursor:pointer; font-size:0.8rem;">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                ` : ''}
            `;
            commentsList.appendChild(cDiv);
        });
    } else {
        commentsList.innerHTML = "<p style='color: #555; padding: 20px 0;'>No comments yet.</p>";
    }

    document.getElementById("submit-modal-comment").onclick = () => submitModalComment(postId);
}

async function submitModalComment(postId) {
    const text = document.getElementById("modal-comment-text").value
    if (!text) return

    const { data: { session } } = await supabaseClient.auth.getSession()
    if (!session) return alert("Sign in to comment")

    await supabaseClient.from('comments').insert([{ 
        content: text, 
        post_id: postId, 
        user_id: session.user.id 
    }])

    document.getElementById("modal-comment-text").value = ""
    openPostModal(postId)
}

function closePostModal() {
    document.getElementById("post-modal").style.display = "none"
}

async function deleteComment(commentId, postId) {
    if (!confirm("Delete this comment?")) return;

    const { error } = await supabaseClient
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (error) {
        alert("Error: " + error.message);
    } else {
        openPostModal(postId);
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
window.closePostModal = closePostModal
window.deleteComment = deleteComment;
window.toggleFollow = toggleFollow;