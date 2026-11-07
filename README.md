# depthbuffer.github.io

Static portfolio site. GitHub Pages serves `main` as-is (no build step).

## Run locally

```sh
python -m http.server 8123
```

Open http://localhost:8123. Opening the HTML files directly does not work, because pages load JSON and Markdown with `fetch()`.

## Layout

```
index.html              Home
404.html                Not-found page
about/                  About page and cv.pdf
projects/
  index.html            Project grid (filter: ?tag=)
  view.html             One project (?id=<id>)
  projects.json         Project list
  content/<id>.md       Project write-ups
  img/                  Thumbnails
blog/
  index.html, post.html Post list, one post (?slug=<slug>)
  posts.json            Post list
  content/<slug>.md     Posts
demos/
  index.html            Demo list
  demos.json            Demo list
assets/css, assets/js   Shared styles and scripts
```

## Add a project

1. Add an entry to `projects/projects.json`:

   | Field      | Required | Notes                                      |
   |------------|----------|--------------------------------------------|
   | `id`       | yes      | Must match `projects/content/<id>.md`      |
   | `title`    | yes      |                                            |
   | `summary`  | yes      | One or two sentences                       |
   | `tags`     | yes      | Used by the filter                         |
   | `thumb`    | yes      | 16:9 image, e.g. `/projects/img/<id>.jpg`  |
   | `date`     | yes      | `YYYY-MM-DD`, newest first                 |
   | `featured` | no       | `true` shows it on the home page (max 3)   |
   | `video`    | no       | Muted `.mp4` loop, plays on card hover     |
   | `repo`     | no       | Source link                                |
   | `demo`     | no       | Live demo link                             |
   | `store`    | no       | Steam page link                            |
   | `video_url`| no       | External video, e.g. YouTube               |

2. Write `projects/content/<id>.md`.

## Add a blog post

1. Add `{ "slug", "title", "date", "summary", "tags" }` to `blog/posts.json`.
2. Write `blog/content/<slug>.md`.
3. For the first post, set `show: true` for Blog in `NAV` in `assets/js/site.js`.

## Add a demo

1. Create `demos/<name>/index.html` (self-contained page).
2. Add `{ "title", "summary", "api", "tags", "path", "thumb", "source" }` to `demos/demos.json`.
   `path` is `/demos/<name>/`. `source` is optional.
3. For the first demo, set `show: true` for Demos in `NAV` in `assets/js/site.js`.

## Markdown

- Code blocks: fenced, with a language (`glsl`, `cpp`).
- Math: `$inline$` and `$$block$$` (KaTeX). Write a literal dollar sign as `\$`.
- Images and video: use absolute paths, e.g. `/projects/img/shot.jpg`.
- `<!-- comments -->` are not shown on the page.

## Paths

All links use absolute paths (`/projects/…`). Do not use relative paths: `404.html` is served at any URL depth.
