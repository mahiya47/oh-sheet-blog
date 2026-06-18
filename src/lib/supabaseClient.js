/* ===========================================================================
   REAL BACKEND (optional) — reference only.

   The app ships running on the in-memory mock store (src/lib/store.jsx), so
   nothing imports this file yet. When you're ready to connect the real
   Supabase backend the original project used, here's the path:

   1. Install the client:
        npm install @supabase/supabase-js

   2. Put your credentials in a .env file (copy .env.example). The anon key is
      safe to expose to the browser, but it belongs in env, not in source:
        VITE_SUPABASE_URL=...
        VITE_SUPABASE_ANON_KEY=...

   3. Uncomment the code below.

   4. In src/lib/store.jsx, replace the bodies of the selectors/actions with
      Supabase queries. The shapes are intentionally close to the original
      script.js, e.g.:

        // getFeed
        const { data } = await supabase
          .from('posts')
          .select('*, profiles(username, display_name, avatar_url), likes(user_id), comments(id)')
          .order('created_at', { ascending: false });

      Because store.jsx is the only place data is fetched, this is the single
      file you change — every component keeps working untouched. (Note: real
      queries are async, so the selectors would return promises and components
      would load data in an effect instead of reading it synchronously.)

   Tables used by the original app: profiles, posts, likes, comments, follows.
   =========================================================================== */

// import { createClient } from '@supabase/supabase-js';
//
// const url = import.meta.env.VITE_SUPABASE_URL;
// const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
//
// if (!url || !anonKey) {
//   console.warn('Supabase env vars missing — set them in .env (see .env.example).');
// }
//
// export const supabase = createClient(url, anonKey);

export {};
