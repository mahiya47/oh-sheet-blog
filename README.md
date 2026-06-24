# Oh Sheet! — Frontend

A Twitter/Reddit-style social blogging app where people post short "sheets," follow each other, like, comment, and browse by tags.

**Live:** [ohsheet.blog](https://ohsheet.blog)

This is the frontend (React + Vite). The backend lives in a separate repo: [oh-sheet-blog-backend](https://github.com/mahiya47/oh-sheet-blog-backend).

---

## What it does

- **Auth** — sign up, log in, log out (JWT-based)
- **Posts** — create, view, delete "sheets," each with an auto-generated color
- **Comments** — add and delete comments in a post modal, with live reload
- **Likes** — instant like/unlike, synced across the feed, modal, and trending views
- **Follows** — follow/unfollow people, with a dedicated "Following" feed
- **Tags** — add up to 5 tags per post; click any tag to see every post using it
- **Trending** — posts ranked by engagement, plus a trending-tags panel
- **Search** — search posts and people
- **Profiles** — view anyone's profile, edit your own name, username, bio, and avatar
- **Sort** — sort any feed by Hot, New, or Top
- **Responsive** — works on mobile with a bottom nav bar and adapted layout
- **Dark / light theme** — toggle, remembered per device

## Tech stack

- **React** with **Vite**
- **React Router** for routing
- **Axios** for API calls
- **lucide-react** for icons
- Plain CSS with a custom neobrutalist design system (CSS variables, hard shadows)
- Deployed on **Vercel**

## Running locally

You'll need the [backend](https://github.com/mahiya47/oh-sheet-blog-backend) running first.

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

Open `http://localhost:5173`.

### Environment variables

| Variable       | What it's for                                  | Example                        |
| -------------- | ---------------------------------------------- | ------------------------------ |
| `VITE_API_URL` | Base URL of the backend API (must end in /api) | `https://api.ohsheet.blog/api` |

## How it's deployed

The frontend is on Vercel. The backend runs on a home Ubuntu server and is exposed to the internet through a permanent Cloudflare tunnel at `api.ohsheet.blog`. The whole chain — domain, tunnel, and process management — is set up to survive reboots automatically, so the live link stays up on its own.

## Project structure

```
src/
  components/   reusable UI (SheetCard, Avatar, Navbar, SortBar, modal, ...)
  pages/        route-level pages (Feed, Profile, Settings, Tag, ...)
  context/      React context providers (toast, theme, modal)
  lib/          the data store (API calls + state) and helpers
  api.js        axios instance
```

## About

Built by **Sourabh Mahiya** as a full-stack portfolio project.

- Email: ssmahiya7@gmail.com
- LinkedIn: [sourabh-mahiya-sm0047](https://www.linkedin.com/in/sourabh-mahiya-sm0047/)
- GitHub: [mahiya47](https://github.com/mahiya47)
