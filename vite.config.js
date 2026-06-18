import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // If you deploy to GitHub Pages under a repo subpath (e.g. user.github.io/oh-sheet-react),
  // set `base` to '/oh-sheet-react/'. For a custom domain or root deploy, leave it as '/'.
  base: '/',
})
