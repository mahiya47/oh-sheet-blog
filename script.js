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

    if (mainFeed) fetchMainFeed();
    if (trendingContainer) fetchTrendingSidebar();
    if (profilePage) fetchUserProfile();
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

    setupGlobalInteractions();
});

async function handleSignUp(e) {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const username = document.getElementById("signup-username").value;

    const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { username: username, display_name: username } }
    });

    if (error) {
        alert(error.message);
    } else {
        alert("Account created! Redirecting to Sign In...");
        window.location.href = "index.html"; 
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
        alert("Profile picture updated!");
        window.location.reload();
    } catch (error) {
        alert("Error: " + error.message);
    }
}

async function fetchUserProfile() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const urlParams = new URLSearchParams(window.location.search);
    const targetUserId = urlParams.get('id') || session?.user.id;

    if (!targetUserId) return;

    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', targetUserId).single();

    if (profile) {
        document.getElementById("profile-display-name").innerText = profile.display_name || profile.username;
        document.getElementById("profile-handle").innerText = "@" + profile.username;
        document.getElementById("profile-bio-text").innerText = profile.bio || "No bio yet.";
        if (profile.avatar_url) document.getElementById("profile-main-pfp").src = profile.avatar_url;

        const actionArea = document.getElementById("profile-actions-area");
        if (session && session.user.id === targetUserId) {
            actionArea.innerHTML = `<button class="profile-edit-btn" onclick="window.location.href='setting.html'">Edit Profile</button>`;
        }
        fetchUserPosts(targetUserId);
    }
}

async function fetchUserPosts(userId) {
    const { data: posts } = await supabaseClient
        .from('posts')
        .select('*, profiles(username, display_name, avatar_url), likes(user_id), comments(id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
    const container = document.getElementById(containerId);
    if (!container) return;

    const loader = document.getElementById("feed-loader");
    if (loader) loader.remove();

    // Fetch session once at the start for better performance
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    container.innerHTML = isSearch ? `<div style="color: #3EFF8B; padding: 10px;">Results: ${posts.length} found</div>` : '';

    if (!posts || posts.length === 0) {
        container.innerHTML += `<div style="color: white; text-align: center; padding: 20px;">No sheets found here.</div>`;
        return;
    }

    posts.forEach((post) => {
        const isLiked = session ? post.likes.some(l => l.user_id === session.user.id) : false;
        const color = neobrutalistColors[Math.floor(Math.random() * neobrutalistColors.length)];
        
        const article = document.createElement("article");
        article.className = "sheet-card";
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
                        <a href="#" onclick="handleReport(${post.id})"><i class="fa-regular fa-flag"></i> Report</a>
                        ${session && session.user.id === post.user_id ? 
                            `<a href="javascript:void(0)" onclick="toggleOptions(${post.id}, '${post.user_id}', event)" style="color: #FF3E3E;">
                                <i class="fa-regular fa-trash-can"></i> Delete
                            </a>` 
                            : ''}
                    </div>
                </div>
            </div>
            <div class="sheet-content"><p>${post.content}</p></div>
            <div class="sheet-footer">
                <div class="footer-stat" onclick="handleComment(${post.id})"><i class="fa-regular fa-comment"></i> <span>${post.comments?.length || 0}</span></div>
                <div class="footer-stat" onclick="handleRepost(${post.id})"><i class="fa-solid fa-arrows-rotate"></i> <span>Repost</span></div>
                <div class="footer-stat" onclick="handleLike(${post.id}, this)">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color: #FF3E3E' : ''}"></i> 
                    <span class="like-count">${post.likes?.length || 0}</span>
                </div>
                <div class="footer-stat" onclick="handleShare(${post.id})"><i class="fa-solid fa-share-nodes"></i> <span>Share</span></div>
            </div>`;
        
        container.appendChild(article);
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

window.toggleOptions = toggleOptions;

async function handleLike(postId, element) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in first!");
    const heartIcon = element.querySelector('i');
    const likeCountSpan = element.querySelector('.like-count');
    let count = parseInt(likeCountSpan.innerText);

    const { data: existing } = await supabaseClient.from('likes').select('*').match({ post_id: postId, user_id: session.user.id }).single();

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
        // USE BACKTICKS HERE ` `
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
    const content = document.querySelector(".editor-textarea").value;
    const { data: { user } } = await supabaseClient.auth.getUser();
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

window.toggleOptions = toggleOptions;
window.handleLike = handleLike;
window.handleRepost = handleRepost;
window.handleShare = handleShare;
window.handleComment = handleComment;
window.handleReport = handleReport;