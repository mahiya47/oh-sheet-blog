# Oh Sheet! — React rebuild

A neobrutalist micro-blog for developers. This is the React version of the original
vanilla HTML/CSS/JS project: same identity (black canvas, white strokes, acid-green
accent, Ubuntu Mono), rebuilt as a proper component-based single-page app.

It runs entirely on a built-in **mock store**, so you can clone, install, and use the
whole thing — posting, liking, commenting, following, profiles, search, themes — with
**zero backend setup**. Swapping in the real Supabase backend later is a one-file change
(see “Connecting a real backend” below).

## Stack

- **React 18** + **Vite** (fast dev server, optimized build)
- **React Router** for navigation
- **lucide-react** for icons (tree-shakeable; replaces the Font Awesome CDN)
- Plain CSS with **design tokens** (CSS custom properties) — no framework, themeable

## Run it

```bash
npm install
npm run dev      # start the dev server (Vite prints a localhost URL)
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

On first load you'll land on the sign-in screen. Click **“Sign in as demo”** (or sign
in with any seeded email such as `debbie@ohsheet.dev` — passwords aren't checked in the
demo) and explore. You can also create a new account; it's stored in your browser.

## Project structure

```
src/
  main.jsx              App entry — mounts providers (Theme, Toast, Store, Router)
  App.jsx               Route table
  index.css             Design tokens + all component styles (dark + light themes)

  data/
    mockData.js         Seed users, posts, comments, likes, follows
    staticContent.js    Copy for About / Rules / Privacy / Agreement

  lib/
    store.jsx           Single source of truth: auth + all data, persisted to
                        localStorage, exposed via useStore() selectors & actions
    time.js             timeAgo(), deterministic card colors, avatar initials
    useClickAway.js     Hook to close dropdowns on outside click
    supabaseClient.js   Reference template for wiring a real backend (unused)

  context/
    ThemeContext.jsx    Dark/light theme (the toggle the original never wired up)
    ToastContext.jsx    Toast notifications (replace the old alert() calls)
    ModalContext.jsx    Lets any card open the shared post modal

  components/
    Layout.jsx          The 3-column shell, defined ONCE (nav + rails + outlet)
    Navbar.jsx  LeftSidebar.jsx  RightSidebar.jsx  BottomNav.jsx
    SheetCard.jsx       A single post + its actions
    Feed.jsx            A list of sheets with an empty state
    PostModal.jsx       Post detail + comments
    Avatar.jsx  BackToTop.jsx  ProtectedRoute.jsx

  pages/
    Login.jsx  Signup.jsx
    FeedPage.jsx  FollowingPage.jsx  TrendingPage.jsx
    ProfilePage.jsx  CreatePostPage.jsx  SettingsPage.jsx
    SearchPage.jsx  SupportPage.jsx  StaticPage.jsx  NotFound.jsx
```

## How the data layer works

`src/lib/store.jsx` holds the entire app state (the signed-in user plus every post,
like, comment and follow) in React state, persisted to `localStorage`. Components read
data through **selectors** (`getFeed`, `getProfile`, `getComments`, …) and change it
through **actions** (`createPost`, `toggleLike`, `toggleFollow`, …). Because all data
lives in one place, every action just updates state and the UI re-renders — no manual
DOM updates and no full page reloads.

## Connecting a real backend (optional)

The original used Supabase with tables `profiles`, `posts`, `likes`, `comments`,
`follows`. To use it here:

1. `npm install @supabase/supabase-js`
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
3. Uncomment the client in `src/lib/supabaseClient.js`.
4. Replace the selector/action bodies in `src/lib/store.jsx` with Supabase queries.
   That's the **only** file you touch — every component keeps working. (Real queries
   are async, so selectors would return promises and components would load data in an
   effect rather than reading it synchronously.)

## Deploying to GitHub Pages

If you deploy under a repo subpath (e.g. `username.github.io/oh-sheet-react/`), set
`base: '/oh-sheet-react/'` in `vite.config.js`. The router already reads this value, so
links stay correct. For a custom domain or root deploy, leave `base` as `'/'`.

## Notes

- This is a front-end demo: there's no real server, auth, or password checking. Data
  lives in your browser only. Reset it anytime under **Settings → Account → Reset demo
  data**.
