# Oh Sheet! — Frontend

A Twitter/Reddit-style social blogging app where people post short "sheets," follow each other, like, comment, tag people, DM (including two bot characters), and play a full built-in arcade — including real-time multiplayer games against friends.

**Live:** [ohsheet.blog](https://ohsheet.blog)

This is the frontend (React + Vite). The backend lives in a separate repo: [oh-sheet-blog-backend](https://github.com/mahiya47/oh-sheet-blog-backend).

## What it does

**Core social features**
- **Auth** — sign up, log in, log out (JWT-based), email verification, Google/GitHub OAuth
- **Posts ("sheets")** — create, view, edit, delete, with optional image (in-browser cropping) or video
- **Tag people** — search and tag other users in a post; tagged people are notified, shown inline on the post, and can remove their own tag; tagged posts also appear on the tagged person's profile
- **Reposts** — repost with an optional comment, original post shown inline
- **Comments** — threaded (one level of replies), with live reload
- **Likes/Reactions** — typed reactions, instant sync across feed/modal/profile
- **Bookmarks** — save posts to a dedicated "Saved" tab
- **Follows** — follow/unfollow, with a dedicated "Following" feed and mutual-connection-aware suggestions
- **Tags (hashtags)** — up to 5 per post; click any tag to browse everything using it
- **Trending** — posts ranked by engagement, plus a trending-tags panel
- **Search** — unified search across posts, people, and tags
- **Profiles** — bio, avatar/cover photo, social links, streaks, verified badge, achievement badges
- **Notifications** — likes, comments, follows, replies, tags, DMs
- **Leaderboard** — top users by score
- **Blocking & Reporting** — user-to-user blocking, a reporting system, and a support-ticket contact form
- **Sort** — Hot / New / Top on any feed
- **Responsive** — mobile bottom nav, fully adapted layouts
- **Dark/light theme** — toggle, remembered per device

**Chat**
- 1:1 direct messages
- **Tonald Drump** — an AI-powered parody-billionaire chatbot character (LLM via Groq) that DMs every new signup and auto-replies to messages
- **Pikku the Cat** — a non-AI bot that sends a welcome DM to new users and drops an automatic comment on new posts

**Arcade**
- 6 single-player games: Snake, Tetris, Minesweeper, Reaction Timer, Flappy Bird, Endless Runner
- 2 daily puzzle games with streak tracking: Sudoku and Crossword (500+ word bank, same puzzle for everyone each day)
- 4 real-time multiplayer games (via Socket.io, room-code based): Rock Paper Scissors, Tic-Tac-Toe, Snake & Ladder (2-4 players), and a full-rules Ludo (2-4 players, 4 tokens each)
- Per-game and global arcade leaderboards

## Tech stack

- **React** with **Vite**
- **React Router** for routing
- **Axios** for API calls
- **Socket.io-client** for real-time multiplayer games
- **react-easy-crop** for in-browser image cropping
- **react-markdown** + **remark-gfm** for rendering post content
- **lucide-react** for icons
- Plain CSS with a custom neobrutalist design system (CSS variables, hard shadows)
- Deployed on **Vercel**

## Running locally

You'll need the backend running first.

```bash
# clone and install
git clone https://github.com/mahiya47/oh-sheet-blog.git
cd oh-sheet-blog
npm install

# set the API URL (create a .env file)
echo "VITE_API_URL=http://localhost:5000/api" > .env

# start the dev server
npm run dev
```

Open http://localhost:5173.

## Environment variables

| Variable | What it's for | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API (must end in `/api`) | `https://api.ohsheet.blog/api` |

## How it's deployed

The frontend is on **Vercel**, auto-deploying on every push to `main`.

The backend runs on an **Oracle Cloud** VM (Ubuntu), managed by **PM2**, sitting behind **nginx** as a reverse proxy at `api.ohsheet.blog` with SSL via **Let's Encrypt/Certbot**. The database is **PostgreSQL** (via **Prisma ORM**), also running on the same VM. User-uploaded images/videos are saved directly to the server's local disk (not a third-party CDN) and served through the same nginx/Express setup.

## Project structure

```
src/
  components/   reusable UI (SheetCard, Avatar, Navbar, SortBar, modals, arcade widgets, ...)
  pages/        route-level pages (Feed, Profile, Settings, Tag, Chat, Arcade games, ...)
  context/      React context providers (toast, theme, modal)
  lib/          the data store (API calls + state) and helpers
  api.js        axios instance
```

## About

Built by Sourabh Mahiya as a full-stack portfolio project.

Email: ssmahiya7@gmail.com
LinkedIn: sourabh-mahiya-sm0047
GitHub: mahiya47
