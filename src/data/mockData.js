// Seed data for the built-in mock backend.
// This lets the whole app run with zero setup. See src/lib/store.js for how
// it's loaded, and the README for swapping in a real Supabase backend.

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString();

export const SEED_USERS = [
  {
    id: 'u_sourabh',
    username: 'sourabh',
    displayName: 'Sourabh Mahiya',
    bio: 'Full-stack in progress. JS → React → the job. Sheets about what I break and fix.',
    avatarUrl: null,
    email: 'sourabh@ohsheet.dev',
  },
  {
    id: 'u_dev',
    username: 'devdebbie',
    displayName: 'Debbie Okafor',
    bio: 'Frontend engineer. CSS is a programming language and I will die on this hill.',
    avatarUrl: null,
    email: 'debbie@ohsheet.dev',
  },
  {
    id: 'u_rin',
    username: 'rin_codes',
    displayName: 'Rin Tanaka',
    bio: 'Backend / Postgres / coffee. Indexing your slow queries since 2019.',
    avatarUrl: null,
    email: 'rin@ohsheet.dev',
  },
  {
    id: 'u_max',
    username: 'maxbuilds',
    displayName: 'Max Romero',
    bio: 'Shipping side projects nobody asked for. Vite enjoyer.',
    avatarUrl: null,
    email: 'max@ohsheet.dev',
  },
  {
    id: 'u_ann',
    username: 'annscript',
    displayName: 'Ana Costa',
    bio: 'DX, docs, and developer tooling. Good error messages are a love language.',
    avatarUrl: null,
    email: 'ana@ohsheet.dev',
  },
];

export const SEED_POSTS = [
  {
    id: 'p1',
    authorId: 'u_rin',
    createdAt: minutesAgo(14),
    content:
      "Reminder: an index on a column you never filter or sort by is just a slower write and a bigger table. Measure before you add them.",
  },
  {
    id: 'p2',
    authorId: 'u_dev',
    createdAt: minutesAgo(47),
    content:
      "`gap` on flex/grid removed about 200 lines of margin hacks from our codebase this week. If you're still doing `:not(:last-child) { margin-right }`, it's time.",
  },
  {
    id: 'p3',
    authorId: 'u_sourabh',
    createdAt: minutesAgo(95),
    content:
      "Finally understood immutable state updates: you don't mutate the array, you map over it and return a NEW one with the changed item swapped in. The spread operator does the copying. Click.",
  },
  {
    id: 'p4',
    authorId: 'u_max',
    createdAt: minutesAgo(180),
    content:
      "Spent 2 hours on a bug. It was a trailing slash in a route. As always.",
  },
  {
    id: 'p5',
    authorId: 'u_ann',
    createdAt: minutesAgo(320),
    content:
      "Error messages should answer three questions: what happened, why, and what I do next. 'Something went wrong' answers zero of them.",
  },
  {
    id: 'p6',
    authorId: 'u_sourabh',
    createdAt: minutesAgo(610),
    content:
      "Day 1 of rebuilding my blog in React instead of vanilla JS. The amount of HTML I was copy-pasting between pages is genuinely embarrassing in hindsight.",
  },
  {
    id: 'p7',
    authorId: 'u_dev',
    createdAt: minutesAgo(900),
    content:
      "Hot take: most 'we need a state management library' moments are actually 'we need to lift this one piece of state up one level' moments.",
  },
  {
    id: 'p8',
    authorId: 'u_rin',
    createdAt: minutesAgo(1500),
    content:
      "`SELECT *` in production code is a future migration breaking silently. Name your columns.",
  },
];

export const SEED_COMMENTS = [
  { id: 'c1', postId: 'p3', authorId: 'u_dev', createdAt: minutesAgo(80), content: 'This is THE React lightbulb moment. Welcome to the club.' },
  { id: 'c2', postId: 'p3', authorId: 'u_max', createdAt: minutesAgo(70), content: 'Wait until you meet useReducer for the gnarly ones.' },
  { id: 'c3', postId: 'p1', authorId: 'u_ann', createdAt: minutesAgo(10), content: 'Saving this to send to my whole team.' },
  { id: 'c4', postId: 'p6', authorId: 'u_rin', createdAt: minutesAgo(600), content: 'Components are just the DRY principle wearing a hat.' },
  { id: 'c5', postId: 'p2', authorId: 'u_sourabh', createdAt: minutesAgo(40), content: 'I literally did the margin hack thing last week. Refactoring now.' },
];

// likes: which user liked which post
export const SEED_LIKES = [
  { postId: 'p1', userId: 'u_sourabh' },
  { postId: 'p1', userId: 'u_dev' },
  { postId: 'p1', userId: 'u_ann' },
  { postId: 'p2', userId: 'u_sourabh' },
  { postId: 'p2', userId: 'u_rin' },
  { postId: 'p2', userId: 'u_max' },
  { postId: 'p2', userId: 'u_ann' },
  { postId: 'p3', userId: 'u_dev' },
  { postId: 'p3', userId: 'u_max' },
  { postId: 'p5', userId: 'u_sourabh' },
  { postId: 'p5', userId: 'u_dev' },
  { postId: 'p7', userId: 'u_max' },
  { postId: 'p8', userId: 'u_dev' },
  { postId: 'p8', userId: 'u_ann' },
];

// follows: followerId follows followingId
export const SEED_FOLLOWS = [
  { followerId: 'u_sourabh', followingId: 'u_dev' },
  { followerId: 'u_sourabh', followingId: 'u_rin' },
  { followerId: 'u_dev', followingId: 'u_sourabh' },
  { followerId: 'u_max', followingId: 'u_sourabh' },
  { followerId: 'u_ann', followingId: 'u_dev' },
  { followerId: 'u_rin', followingId: 'u_ann' },
];

// The user you're signed in as when you click "Sign in as demo".
export const DEMO_USER_ID = 'u_sourabh';
