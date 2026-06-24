// Content for the static info pages. Driving them from data means one
// <StaticPage> component renders all four — instead of four near-identical
// HTML files like the original project had.

export const STATIC_PAGES = {
  about: {
    title: "What is Oh Sheet!?",
    blocks: [
      {
        type: "p",
        text: 'Oh Sheet! is a compact micro-blog. Post a "sheet" — a short, high-value note, thought, or lesson — like the good ones, tag them, and follow the people whose feed you actually want to read.',
      },
      {
        type: "callout",
        icon: "GitBranch",
        title: "Built by the community",
        text: "Every sheet is someone documenting what they learned so the next person finds it faster.",
      },
      { type: "h2", text: "The idea" },
      {
        type: "p",
        text: "A high-contrast, distraction-free place to share what you figured out today. No fluff, no infinite thread — just the note and the people who care about it.",
      },
      { type: "h2", text: "What you can do" },
      {
        type: "ul",
        items: [
          "Post sheets with plain text, tags, and images.",
          "Like a sheet when it helps you.",
          "Comment to ask, correct, or extend.",
          "Follow people and get a feed that is only them.",
          "Browse by tag to find sheets on a topic.",
          "Pick a custom avatar and personalize your profile.",
        ],
      },
      { type: "h2", text: "Earn points & climb the leaderboard" },
      {
        type: "p",
        text: "Stay active and you rack up points — for posting, commenting, getting likes, and logging in daily. The most active members rise to the top of the leaderboard.",
      },
      { type: "h2", text: "Be good to each other" },
      {
        type: "p",
        text: "Keep it friendly and respectful. No hate, harassment, or bad language. Treat people the way you would want to be treated.",
      },
      {
        type: "callout",
        icon: "Info",
        title: "Created by Sourabh Mahiya",
        text: "A full-stack project built end to end. Reach out: ssmahiya7@gmail.com · linkedin.com/in/sourabh-mahiya-sm0047 · github.com/mahiya47",
      },
    ],
  },
  rules: {
    title: "Community Rules",
    blocks: [
      {
        type: "p",
        text: "A few ground rules keep Oh Sheet! useful for everyone.",
      },
      { type: "h2", text: "1. No spam" },
      {
        type: "p",
        text: "Skip the repetitive posts and low-effort promo links.",
      },
      { type: "h2", text: "2. Respect people" },
      {
        type: "p",
        text: "Harassment, hate speech, and general toxicity get you removed.",
      },
      { type: "h2", text: "3. Credit your sources" },
      {
        type: "p",
        text: "Sharing something you found? Link the original author.",
      },
      { type: "h2", text: "4. Keep it clean" },
      {
        type: "p",
        text: "No bad language or offensive content — this is a friendly space.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    blocks: [
      { type: "p", text: "Last updated: March 2026" },
      { type: "h2", text: "What we collect" },
      {
        type: "p",
        text: "Your username, email address, and the sheets and comments you post. Optionally, profile details you choose to add such as a bio, avatar, gender, or orientation.",
      },
      { type: "h2", text: "How we use it" },
      {
        type: "p",
        text: 'To build your feed and let you interact with other people. Profile details like gender and orientation are only shown publicly if you turn on the "show on profile" option. We do not sell your personal data.',
      },
      { type: "h2", text: "Cookies" },
      {
        type: "p",
        text: "Essential cookies keep you signed in and remember your theme preference.",
      },
    ],
  },
  agreement: {
    title: "User Agreement",
    blocks: [
      { type: "h2", text: "Accepting these terms" },
      {
        type: "p",
        text: "Creating an account means you agree to the community rules and privacy policy.",
      },
      { type: "h2", text: "Who owns your content" },
      {
        type: "p",
        text: "You keep ownership of what you post. You grant Oh Sheet! a license to display and distribute it on the platform.",
      },
      { type: "h2", text: "Ending an account" },
      {
        type: "p",
        text: "We can suspend or remove accounts that repeatedly break the rules or do something illegal.",
      },
    ],
  },
};
