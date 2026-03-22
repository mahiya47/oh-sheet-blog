const supabaseUrl = 'https://atrtpagxccesjuijeoqz.supabase.co'
const supabaseKey = 'sb_publishable_kXsdRS77Aj1bAAx_EkgKsw_B0uZu30n'
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey)

const neobrutalistColors = ["#FF3E3E", "#3E54FF", "#3EFF8B", "#FFF03E", "#FF3EEF", "#3EFAFF", "#FFA53E", "#9D3EFF", "#FF3E96", "#C4FF3E"];

// --- UPDATED AUTH PROTECTION FOR NEW FILE STRUCTURE ---
async function checkUserAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const path = window.location.pathname;
    const currentPage = path.split("/").pop();
    
    // index.html is now your LOGIN page. feed.html is now your main FEED page.
    const publicPages = ["index.html", "create-account.html"];

    // 1. Redirect to Login if not signed in (and not already on a public page)
    if (!session && !publicPages.includes(currentPage) && currentPage !== "") {
        window.location.href = "index.html";
    } 
    // 2. Redirect to Feed if already signed in and trying to access Login/Signup
    else if (session && (currentPage === "index.html" || currentPage === "create-account.html" || currentPage === "")) {
        window.location.href = "feed.html";
    } else {
        // Handle loading overlay removal
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
    const settingsTabs = document.querySelectorAll(".nav-tab");
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

    if (settingsTabs.length > 0) {
        setupSettingsTabs(settingsTabs);
        loadCurrentSettings();
        const saveBtn = document.getElementById("save-settings-btn");
        if (saveBtn) saveBtn.addEventListener("click", saveProfileSettings);
    }

    setupGlobalInteractions();
});

// --- AUTHENTICATION HANDLERS ---

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

// --- PROFILE & DP UPLOAD ---

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

    if (file.size > 5 * 1024 * 1024) {
        alert("File too large! Please select an image under 5MB.");
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    const options = { maxSizeMB: 0.05, maxWidthOrHeight: 500, useWebWorker: true };

    try {
        const compressedFile = await imageCompression(file, options);
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

// --- FEED, SEARCH & INTERACTION ---

async function fetchMainFeed() {
    const { data: posts, error } = await supabaseClient
        .from('posts')
        .select('*, profiles(username, display_name, avatar_url), likes(user_id), comments(id)')
        .order('created_at', { ascending: false });

    if (!error) renderFeed(posts);
}

async function performGlobalSearch(query) {
    const { data: posts, error } = await supabaseClient
        .from('posts')
        .select('*, profiles!inner(username, display_name, avatar_url), likes(user_id), comments(id)')
        .or(`content.ilike.%${query}%, profiles.username.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    if (!error) renderFeed(posts, true);
}

async function renderFeed(posts, isSearch = false) {
    const feedContainer = document.getElementById("main-feed");
    const { data: { session } } = await supabaseClient.auth.getSession();
    const loader = document.getElementById("feed-loader");
    if (loader) loader.remove();
    
    feedContainer.innerHTML = isSearch ? `<div style="color: #3EFF8B; padding: 10px; font-family: 'Ubuntu Mono';">Results: ${posts.length} found</div>` : '';

    posts.forEach(post => {
        const color = neobrutalistColors[Math.floor(Math.random() * neobrutalistColors.length)];
        const isLiked = session ? post.likes.some(l => l.user_id === session.user.id) : false;
        
        const article = document.createElement("article");
        article.className = "sheet-card";
        article.innerHTML = `
            <div class="sheet-header" style="background-color: ${color}">
                <div class="header-left">
                    <a href="profile.html" class="user-meta">
                        <img src="${post.profiles?.avatar_url || 'img/dp.jpg'}" class="sheet-pfp">
                        <div class="user-names">
                            <span class="display-name" style="color:black">${post.profiles?.display_name || 'User'}</span>
                            <span class="username" style="color:rgba(0,0,0,0.6)">@${post.profiles?.username || 'anon'} • ${formatDate(post.created_at)}</span>
                        </div>
                    </a>
                </div>
                <div class="more-options" onclick="toggleOptions(${post.id})"><i class="fa-solid fa-ellipsis"></i></div>
            </div>
            <div class="sheet-content"><p>${post.content}</p></div>
            <div class="sheet-footer">
                <div class="footer-stat" onclick="handleComment(${post.id})"><i class="fa-regular fa-comment"></i> <span>${post.comments?.length || 0}</span></div>
                <div class="footer-stat" onclick="handleRepost(${post.id})"><i class="fa-solid fa-arrows-rotate"></i> <span>0</span></div>
                <div class="footer-stat" onclick="handleLike(${post.id}, this)">
                    <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart" style="${isLiked ? 'color: #FF3E3E' : ''}"></i> 
                    <span class="like-count">${post.likes?.length || 0}</span>
                </div>
                <div class="footer-stat" onclick="handleShare(${post.id})"><i class="fa-solid fa-share-nodes"></i></div>
            </div>`;
        feedContainer.appendChild(article);
    });
}

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

async function handleComment(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in to comment!");

    const commentBody = prompt("Enter your comment:");
    if (!commentBody || commentBody.trim() === "") return;

    await supabaseClient.from('comments').insert([{ content: commentBody, post_id: postId, user_id: session.user.id }]);
    alert("Comment added!");
    window.location.reload(); 
}

async function toggleOptions(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data: post } = await supabaseClient.from('posts').select('user_id').eq('id', postId).single();
    if (post && post.user_id === session.user.id) {
        if (confirm("Delete this Sheet?")) {
            await supabaseClient.from('posts').delete().eq('id', postId);
            window.location.reload();
        }
    } else {
        alert("Only the owner can delete this post.");
    }
}

// --- CORE UTILITIES ---

async function createNewPost(e) {
    e.preventDefault();
    const content = document.querySelector(".editor-textarea").value;
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("Sign in to post!");
    await supabaseClient.from('posts').insert([{ content, user_id: user.id }]);
    window.location.href = "feed.html";
}

function handleShare(postId) {
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?id=${postId}`);
    alert("Link copied!");
}

async function handleRepost(postId) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return alert("Sign in to repost!");
    const { data: original } = await supabaseClient.from('posts').select('*').eq('id', postId).single();
    await supabaseClient.from('posts').insert([{ content: `Repost: ${original.content}`, user_id: session.user.id }]);
    window.location.reload();
}

// --- SETTINGS ---

function setupSettingsTabs(tabs) {
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            e.preventDefault();
            const sectionId = tab.getAttribute("data-section");
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            document.querySelectorAll(".settings-section").forEach(sec => sec.classList.remove("active"));
            const target = document.getElementById(`${sectionId}-section`);
            if (target) target.classList.add("active");
        });
    });
}

async function loadCurrentSettings() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) {
        const dName = document.getElementById("settings-display-name");
        const bio = document.getElementById("settings-bio");
        const email = document.getElementById("settings-email");
        const pfp = document.getElementById("settings-pfp-preview");
        if (dName) dName.value = profile.display_name || "";
        if (bio) bio.value = profile.bio || "";
        if (email) email.value = session.user.email;
        if (pfp && profile.avatar_url) pfp.src = profile.avatar_url;
    }
}

async function saveProfileSettings() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const dName = document.getElementById("settings-display-name").value;
    const bio = document.getElementById("settings-bio").value;
    await supabaseClient.from('profiles').update({ display_name: dName, bio: bio }).eq('id', session.user.id);
    alert("Settings saved!");
}

async function fetchTrendingSidebar() {
    const container = document.getElementById("trending-container");
    if (!container) return;
    const { data: trends } = await supabaseClient.from('posts').select('content, profiles(username)').limit(3).order('created_at', { ascending: false });
    if (!trends) return;
    container.innerHTML = "";
    trends.forEach(item => {
        const div = document.createElement("article");
        div.className = "trending-row";
        div.innerHTML = `<a href="#" class="trending-content"><span class="trending-meta">u/${item.profiles?.username}</span><p class="trending-tag">${item.content.substring(0, 30)}...</p></a>`;
        container.appendChild(div);
    });
}

function formatDate(dateString) {
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return Math.floor(diff/60) + 'm';
    return Math.floor(diff/3600) + 'h';
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