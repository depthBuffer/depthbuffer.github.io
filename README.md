# depthbuffer.github.io

My graphics programming portfolio: projects, live WebGL2/WebGPU demos and technical write-ups.
It's plain HTML/CSS/JS with no build step. GitHub Pages serves the repo as-is at https://depthbuffer.github.io.

## Preview locally

The pages load JSON and Markdown with `fetch()`, which doesn't work over `file://`. Serve the folder instead:

```sh
python -m http.server 8000
# open http://localhost:8000
```

## Adding content

### A project
1. Add an entry to `data/projects.json`:
   ```json
   {
     "id": "my-project",
     "title": "My Project",
     "summary": "One or two sentences.",
     "tags": ["Vulkan", "C++"],
     "thumb": "/assets/img/projects/my-project.jpg",
     "video": "/assets/img/projects/my-project.mp4",
     "repo": "https://github.com/...",
     "demo": "/demos/my-demo/",
     "featured": true,
     "date": "2026-11-01"
   }
   ```
   `video` (a short muted loop that plays on hover), `repo`, `demo`, `store` (a Steam page) and `video_url` (e.g. YouTube) are optional.
   `featured: true` puts it on the home page (up to 3, newest first).
2. Write the long-form page in `content/projects/my-project.md`. The file name must match `id`.

### A blog post
1. Add `{ "slug", "title", "date", "summary", "tags" }` to `data/posts.json`.
2. Write `content/posts/<slug>.md`.

Markdown supports:
- **Code highlighting** for fenced blocks: `glsl`, `cpp`, `hlsl` (use `cpp`), `wgsl` (use `rust`) and so on.
- **Math** with KaTeX: `$inline$` and `$$display$$`. Escape a literal dollar sign as `\$`.
- **Images and video**: use root-absolute paths (`/assets/img/...`), not relative ones.

### A live demo
1. Create `demos/<name>/index.html`. Copy an existing demo as a starting point. They share `/assets/css/demo.css` and `/assets/js/demo-kit.js` (FPS counter, canvas resize, slider binding, error screen).
2. Add it to `demos/demos.json`.

## Personalise
- **Bio, experience, skills, contact:** `about.html`. The hero text is in `index.html`.
- **CV:** replace `assets/cv.pdf`.
- **Brand name, author and footer links:** the `SITE` constant at the top of `assets/js/site.js`.
- **Colours:** the tokens at the top of `assets/css/style.css`.
- **Project write-ups:** `content/projects/*.md` contain `<!-- TODO -->` comments (invisible on the page) marking where screenshots and detail go. Replace the generated SVG thumbnails in `assets/img/projects/` with real screenshots.

## Layout
```
index.html, projects.html, project.html, blog.html, post.html, demos.html, about.html, 404.html
assets/css/style.css   site styles (dark default + light theme)
assets/css/demo.css    full-screen demo styles
assets/js/site.js      header/footer, nav, theme toggle
assets/js/content.js   renders cards and lists from JSON, and Markdown pages
assets/js/hero.js      WebGL2 hero background
data/*.json            project and post indexes
content/**.md          project write-ups and blog posts
demos/                 self-contained live demos + demos.json
```

## Deploying
Push to `main`. In the repo's **Settings → Pages**, the source should be **Deploy from a branch → `main` / `(root)`**.
The `.nojekyll` file tells Pages to serve files as-is without running Jekyll.
