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
        text: "A few ground rules keep Oh Sheet! useful, safe, and welcoming for everyone. Breaking these can lead to a warning, a temporary restriction, or account removal depending on severity.",
      },

      { type: "h2", text: "1. No spam" },
      {
        type: "p",
        text: "Don't post repetitive content, mass-tag unrelated topics, or drop low-effort promotional links. Sharing your own work occasionally is fine — flooding the feed with it isn't.",
      },

      { type: "h2", text: "2. Respect people" },
      {
        type: "p",
        text: "Harassment, hate speech, threats, doxxing, or targeted attacks on any user will get your content removed and your account restricted or banned. This applies in posts, comments, chat, and direct messages.",
      },
      {
        type: "ul",
        items: [
          "No discrimination based on race, gender, orientation, religion, disability, or nationality.",
          "No bullying, pile-ons, or coordinated harassment of another user.",
          "No sharing someone else's private information without consent.",
        ],
      },

      { type: "h2", text: "3. Credit your sources" },
      {
        type: "p",
        text: "If you're sharing something you found — a tip, a snippet, an idea — credit the original author when you know who they are. Passing off someone else's work as your own isn't allowed.",
      },

      { type: "h2", text: "4. Keep it clean" },
      {
        type: "p",
        text: "No explicit sexual content, gore, or offensive imagery. Profanity in casual conversation is fine in moderation; slurs and abusive language are not.",
      },

      { type: "h2", text: "5. No illegal activity" },
      {
        type: "p",
        text: "Don't use Oh Sheet! to promote, coordinate, or facilitate anything illegal — this includes scams, fraud, and the sale of prohibited goods or services.",
      },

      { type: "h2", text: "6. Impersonation" },
      {
        type: "p",
        text: "Don't pretend to be someone else, or create an account designed to mislead people about who you are. Parody accounts are fine if it's obviously a parody.",
      },

      { type: "h2", text: "7. Reporting" },
      {
        type: "p",
        text: "See something that breaks these rules? Use the Report option on the post, comment, or profile. We review reports and take action based on severity and repeat behavior.",
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    blocks: [
      { type: "p", text: "Last updated: July 2026" },

      { type: "h2", text: "What we collect" },
      {
        type: "p",
        text: "To create an account, we collect your username, email address, and password. As you use the app, we store the sheets, comments, likes, follows, and direct messages you create.",
      },
      {
        type: "p",
        text: "You can optionally add profile details: a display name, bio, avatar or cover photo, birthday, pronouns, gender, sexual orientation, current city, workplace, education, and links to your social media profiles.",
      },

      { type: "h2", text: "How we use it" },
      {
        type: "p",
        text: "Your data builds your feed, powers notifications, and lets you interact with other people on the platform. We do not sell your personal data to advertisers or third parties.",
      },
      {
        type: "p",
        text: 'Sensitive profile fields — gender and sexual orientation — are private by default. They are only shown on your public profile if you explicitly enable the "Show on my profile" toggle in Settings. You can turn this off at any time.',
      },

      { type: "h2", text: "Password & data security" },
      {
        type: "p",
        text: "Your password is never stored in plain text. We use bcrypt, an industry-standard one-way hashing algorithm, so even we cannot see or recover your actual password — only a verification check is possible.",
      },
      {
        type: "callout",
        icon: "Info",
        title: "Message encryption is on our roadmap",
        text: "Direct messages and global chat are currently stored securely in our database but are not yet end-to-end encrypted. We plan to add encryption for messages in a future update. Please avoid sharing sensitive personal information (passwords, financial details, ID numbers) over chat or DMs in the meantime.",
      },

      { type: "h2", text: "Images you upload" },
      {
        type: "p",
        text: "Photos and avatars you upload are stored with Cloudinary, a third-party media hosting provider, and served over secure HTTPS connections.",
      },

      { type: "h2", text: "Cookies & local storage" },
      {
        type: "p",
        text: "We use essential cookies and browser local storage to keep you signed in, remember your theme preference (dark/light mode), and track which chat messages you've already seen. We do not use third-party advertising or tracking cookies.",
      },

      { type: "h2", text: "Data retention" },
      {
        type: "p",
        text: "Global chat messages automatically expire after 24 hours. Direct messages are removed 24 hours after being read by both people, or automatically if left unread past a certain period. Notifications you've seen are removed after 24 hours, or immediately if you dismiss them manually.",
      },
      {
        type: "p",
        text: "If you delete your account, it enters a 7-day recovery window during which you can reactivate simply by logging back in. After 7 days, your account and associated data are permanently deleted and cannot be recovered.",
      },

      { type: "h2", text: "Your choices" },
      {
        type: "ul",
        items: [
          "Edit or remove any profile field at any time from Settings.",
          "Toggle visibility of gender and orientation independently.",
          "Delete individual posts, comments, or messages you've sent.",
          "Delete your account entirely (see the Account Agreement for details).",
        ],
      },

      { type: "h2", text: "Contact" },
      {
        type: "p",
        text: "Questions about this policy or your data? Reach out at ssmahiya7@gmail.com.",
      },
    ],
  },

  agreement: {
    title: "User Agreement",
    blocks: [
      { type: "h2", text: "Accepting these terms" },
      {
        type: "p",
        text: "By creating an account on Oh Sheet!, you agree to this User Agreement, the Community Rules, and the Privacy Policy. If you don't agree with any part of these, please don't use the platform.",
      },

      { type: "h2", text: "Eligibility" },
      {
        type: "p",
        text: "You must provide accurate information when creating an account. One person, one account — creating multiple accounts to evade a restriction or manipulate the leaderboard is not allowed.",
      },

      { type: "h2", text: "Who owns your content" },
      {
        type: "p",
        text: "You retain full ownership of everything you post — your sheets, comments, images, and messages. By posting, you grant Oh Sheet! a limited, non-exclusive license to store, display, and distribute that content within the platform so other users can see it.",
      },

      { type: "h2", text: "Account verification" },
      {
        type: "p",
        text: "Verifying your email unlocks a blue verification tick on your profile. This confirms your email is real — it does not imply endorsement or special status beyond that.",
      },

      { type: "h2", text: "Suspending or removing accounts" },
      {
        type: "p",
        text: "We can suspend, restrict, or permanently remove any account that repeatedly breaks the Community Rules, engages in illegal activity, or poses a risk to other users. Where possible, we'll warn you before taking permanent action.",
      },

      { type: "h2", text: "Deleting your own account" },
      {
        type: "p",
        text: "You can delete your account at any time from Settings. Once you do:",
      },
      {
        type: "ul",
        items: [
          "Your account is deactivated immediately and hidden from other users.",
          "For 7 days, your data is kept in a recovery state. Logging back in during this window automatically reactivates your account, and you'll get a notification confirming the reactivation.",
          "After 7 days with no login, your account and all associated data (posts, comments, messages, profile info) are permanently and irreversibly deleted.",
        ],
      },

      { type: "h2", text: "Blocking other users" },
      {
        type: "p",
        text: "You can block another user from Settings or their profile. Once blocked, that person can no longer see your posts, follow you, message you, or find your profile in search. You can unblock them at any time from your Blocked Users list.",
      },

      { type: "h2", text: "Changes to this agreement" },
      {
        type: "p",
        text: "We may update this agreement as the platform evolves. Continuing to use Oh Sheet! after changes take effect means you accept the updated terms.",
      },

      { type: "h2", text: "Contact" },
      {
        type: "p",
        text: "Questions about this agreement? Reach out at ssmahiya7@gmail.com.",
      },
    ],
  },
};
