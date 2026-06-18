// Content for the static info pages. Driving them from data means one
// <StaticPage> component renders all four — instead of four near-identical
// HTML files like the original project had.

export const STATIC_PAGES = {
  about: {
    title: 'What is Oh Sheet!?',
    blocks: [
      { type: 'p', text: 'Oh Sheet! is a compact micro-blog for developers. Post a "sheet" — a short, high-value note, snippet, or lesson — drop fire on the good ones, and follow the people whose feed you actually want to read.' },
      {
        type: 'callout',
        icon: 'GitBranch',
        title: 'Built by the community',
        text: 'Every sheet is someone documenting what they learned so the next person finds it faster.',
      },
      { type: 'h2', text: 'The idea' },
      { type: 'p', text: 'A high-contrast, distraction-free place to share what you figured out today. No fluff, no infinite thread — just the note and the people who care about it.' },
      { type: 'h2', text: 'What you can do' },
      {
        type: 'ul',
        items: [
          'Post sheets with plain text or pasted code.',
          'Give a sheet fire when it helps you.',
          'Comment to ask, correct, or extend.',
          'Follow people and get a feed that is only them.',
        ],
      },
    ],
  },
  rules: {
    title: 'Community Rules',
    blocks: [
      { type: 'p', text: 'A few ground rules keep Oh Sheet! useful for everyone.' },
      { type: 'h2', text: '1. No spam' },
      { type: 'p', text: 'Skip the repetitive posts and low-effort promo links.' },
      { type: 'h2', text: '2. Respect people' },
      { type: 'p', text: 'Harassment, hate speech, and general toxicity get you removed.' },
      { type: 'h2', text: '3. Credit your sources' },
      { type: 'p', text: 'Sharing a snippet you found? Link the original author.' },
      { type: 'h2', text: '4. Format your code' },
      { type: 'p', text: 'Wrap code so the next person can actually read it.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    blocks: [
      { type: 'p', text: 'Last updated: March 2026' },
      { type: 'h2', text: 'What we collect' },
      { type: 'p', text: 'Your username, email address, and the sheets and comments you post.' },
      { type: 'h2', text: 'How we use it' },
      { type: 'p', text: 'To build your feed and let you interact with other people. We do not sell your personal data.' },
      { type: 'h2', text: 'Cookies' },
      { type: 'p', text: 'Essential cookies keep you signed in and remember your theme preference.' },
    ],
  },
  agreement: {
    title: 'User Agreement',
    blocks: [
      { type: 'h2', text: 'Accepting these terms' },
      { type: 'p', text: 'Creating an account means you agree to the community rules and privacy policy.' },
      { type: 'h2', text: 'Who owns your content' },
      { type: 'p', text: 'You keep ownership of what you post. You grant Oh Sheet! a license to display and distribute it on the platform.' },
      { type: 'h2', text: 'Ending an account' },
      { type: 'p', text: 'We can suspend or remove accounts that repeatedly break the rules or do something illegal.' },
    ],
  },
};
