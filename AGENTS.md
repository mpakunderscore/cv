# AGENTS

This project is served via GitHub Pages.

Because of that:

- The root `index.html` must remain in place and be served as-is.
- The build produces a single `dist/index.js` bundle (including CSS).
- Build updates only the `?v=...` timestamp on the script tag in `index.html` for cache busting.
- Static assets (images, `cv.pdf`, `CNAME`) stay in the repository root and are not copied by the build.
