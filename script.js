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
    if (!session) return;

    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: true };

    try {
        const compressedFile = await imageCompression(file, options);
        
        if (compressedFile.size > 2 * 1024 * 1024) {
            alert("Image is still too large after compression. Please use a smaller file.");
            return;
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(filePath, compressedFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
        const preview = document.getElementById("settings-pfp-preview");
        if (preview) preview.src = publicUrl;
        
        await supabaseClient.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
        alert("Profile picture updated!");
    } catch (error) {
        alert("Error processing image: " + error.message);
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

async function performGlobalSearch(query) {
    const { data: posts } = await supabaseClient
        .from('posts')
        .select('*, profiles!inner(username, display_name, avatar_url), likes(user_id), comments(id)')
        .or(`content.ilike.%${query}%, profiles.username.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    renderFeed(posts, true, "main-feed");
}

function renderFeed(posts, isSearch = false, containerId = "main-feed") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loader = document.getElementById("feed-loader");
    if (loader) loader.remove();

    container.innerHTML = isSearch ? `<div style="color: #3EFF8B; padding: 10px;">Results: ${posts.length} found</div>` : '';

    posts.forEach(post => {
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
                <div class="more-options" onclick="toggleOptions(${post.id})"><i class="fa-solid fa-ellipsis"></i></div>
            </div>
            <div class="sheet-content"><p>${post.content}</p></div>
            <div class="sheet-footer">
                <div class="footer-stat" onclick="handleComment(${post.id})"><i class="fa-regular fa-comment"></i> <span>${post.comments?.length || 0}</span></div>
                <div class="footer-stat"><i class="fa-regular fa-heart"></i> <span>${post.likes?.length || 0}</span></div>
            </div>`;
        container.appendChild(article);
    });
}

async function toggleOptions(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    
    const { data: post } = await supabaseClient.from('posts').select('user_id').eq('id', postId).single();
    
    if (post && post.user_id === session.user.id) {
        if (confirm("Are you sure you want to delete this Sheet?")) {
            const { error } = await supabaseClient.from('posts').delete().eq('id', postId);
            if (!error) {
                window.location.reload();
            } else {
                alert("Error deleting post: " + error.message);
            }
        }
    } else {
        alert("You can only delete your own posts!");
    }
}

async function handleComment(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in to comment!");

    const commentBody = prompt("Enter your comment:");
    if (!commentBody || commentBody.trim() === "") return;

    await supabaseClient.from('comments').insert([{ content: commentBody, post_id: postId, user_id: session.user.id }]);
    alert("Comment added!");
    window.location.reload(); 
}

async function createNewPost(e) {
    e.preventDefault();
    const content = document.querySelector(".editor-textarea").value;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("Sign in to post!");
    await supabaseClient.from('posts').insert([{ content, user_id: user.id }]);
    window.location.href = "feed.html";
}

function formatDate(dateString) {
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return Math.floor(diff/60) + 'm';
    if (diff < 86400) return Math.floor(diff/3600) + 'h';
    return Math.floor(diff/86400) + 'd';
}

function setupGlobalInteractions() {
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.onclick = async (e) => { 
            e.preventDefault();
            await supabaseClient.auth.signOut(); 
            window.location.href = "index.html"; 
        };
    }
}