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

// --- AUTH HANDLERS ---
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

// --- PROFILE LOGIC ---
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

// --- FEED & TRENDING ---
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

    const { data: trends } = await supabaseClient
        .from('posts')
        .select('content, profiles(username)')
        .limit(3)
        .order('created_at', { ascending: false });

    if (!trends) return;
    container.innerHTML = "";
    trends.forEach(item => {
        const div = document.createElement("article");
        div.className = "trending-row";
        div.innerHTML = `<div class="trending-content"><span class="trending-meta">u/${item.profiles?.username}</span><p class="trending-tag">${item.content.substring(0, 30)}...</p></div>`;
        container.appendChild(div);
    });
}

function renderFeed(posts, isSearch = false, containerId = "main-feed") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loader = document.getElementById("feed-loader");
    if (loader) loader.remove();

    const currentUserId = supabaseClient.auth.getSession().then(({data}) => data.session?.user.id);

    container.innerHTML = isSearch ? `<div style="color: #3EFF8B; padding: 10px;">Results: ${posts.length} found</div>` : '';

    posts.forEach(async (post) => {
        const { data: { session } } = await supabaseClient.auth.getSession();
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
                <div class="more-options" onclick="toggleOptions(${post.id})"><i class="fa-solid fa-ellipsis"></i></div>
            </div>
            <div class="sheet-content"><p>${post.content}</p></div>
            <div class="sheet-footer">
                <div class="footer-stat" onclick="handleComment(${post.id})"><i class="fa-regular fa-comment"></i> <span>${post.comments?.length || 0}</span></div>
                <div class="footer-stat" onclick="handleRepost(${post.id})"><i class="fa-solid fa-arrows-rotate"></i> <span>Repost</span></div>
                <div class="footer-stat" onclick="handleLike(${post.id}, this)">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color: #FF3E3E' : ''}"></i> 
                    <span class="like-count">${post.likes?.length || 0}</span>
                </div>
            </div>`;
        container.appendChild(article);
    });
}

// --- INTERACTIONS ---
async function handleLike(postId, element) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in to like!");

    const heartIcon = element.querySelector('i');
    const likeCountSpan = element.querySelector('.like-count');
    let currentCount = parseInt(likeCountSpan.innerText);

    const { data: existingLike } = await supabaseClient.from('likes').select('*').match({ post_id: postId, user_id: session.user.id }).single();

    if (existingLike) {
        await supabaseClient.from('likes').delete().match({ post_id: postId, user_id: session.user.id });
        heartIcon.classList.replace('fa-solid', 'fa-regular');
        heartIcon.style.color = "";
        likeCountSpan.innerText = currentCount - 1;
    } else {
        await supabaseClient.from('likes').insert([{ post_id: postId, user_id: session.user.id }]);
        heartIcon.classList.replace('fa-regular', 'fa-solid');
        heartIcon.style.color = "#FF3E3E";
        likeCountSpan.innerText = currentCount + 1;
    }
}

async function handleRepost(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in to repost!");
    
    const { data: original } = await supabaseClient.from('posts').select('*').eq('id', postId).single();
    if (original) {
        await supabaseClient.from('posts').insert([{ 
            content: `Repost from @${session.user.user_metadata.username}: ${original.content}`, 
            user_id: session.user.id 
        }]);
        alert("Sheet Reposted!");
        window.location.reload();
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