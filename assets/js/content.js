// Renders projects, posts and demos from the JSON indexes in /data and /demos,
// and long-form Markdown pages from /content.
(function () {
  const PROJECTS_URL = "/data/projects.json";
  const POSTS_URL = "/data/posts.json";
  const DEMOS_URL = "/demos/demos.json";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "");

  async function loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    return res.json();
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function tagList(tags, linkTo) {
    if (!tags || !tags.length) return "";
    const items = tags.map((t) =>
      linkTo
        ? `<li><a class="tag" href="${linkTo}?tag=${encodeURIComponent(t)}">${esc(t)}</a></li>`
        : `<li><span class="tag">${esc(t)}</span></li>`
    );
    return `<ul class="tags">${items.join("")}</ul>`;
  }

  function showError(el, err) {
    console.error(err);
    el.innerHTML = `<div class="error">Couldn't load content. If you opened this file directly, serve the site over HTTP (see README).</div>`;
  }

  // ---------- Projects ----------
  function projectLinks(p, { includeWriteup = true } = {}) {
    const links = [];
    if (includeWriteup) links.push(`<a href="/project.html?id=${encodeURIComponent(p.id)}">Write-up</a>`);
    if (p.repo) links.push(`<a href="${esc(p.repo)}" rel="noopener">Code</a>`);
    if (p.demo) links.push(`<a href="${esc(p.demo)}">Live demo</a>`);
    if (p.store) links.push(`<a href="${esc(p.store)}" rel="noopener">Steam</a>`);
    if (p.video_url) links.push(`<a href="${esc(p.video_url)}" rel="noopener">Video</a>`);
    return `<div class="card-links">${links.join("")}</div>`;
  }

  function projectCard(p) {
    const href = `/project.html?id=${encodeURIComponent(p.id)}`;
    const video = p.video ? `<video muted loop playsinline preload="none" src="${esc(p.video)}"></video>` : "";
    const badge = p.demo ? `<span class="card-badge">LIVE DEMO</span>` : "";
    return `
      <article class="card">
        <a class="card-media" href="${href}" tabindex="-1" aria-hidden="true">
          <img src="${esc(p.thumb)}" alt="" loading="lazy">${video}${badge}
        </a>
        <div class="card-body">
          <h3><a href="${href}">${esc(p.title)}</a></h3>
          <p>${esc(p.summary)}</p>
          ${tagList(p.tags, "/projects.html")}
          ${projectLinks(p)}
        </div>
      </article>`;
  }

  // Play the optional preview video on hover/focus.
  function wireCardVideos(root) {
    root.querySelectorAll(".card").forEach((card) => {
      const media = card.querySelector(".card-media");
      const video = media && media.querySelector("video");
      if (!video) return;
      const play = () => { media.classList.add("playing"); video.play().catch(() => {}); };
      const stop = () => { media.classList.remove("playing"); video.pause(); };
      card.addEventListener("mouseenter", play);
      card.addEventListener("mouseleave", stop);
      card.addEventListener("focusin", play);
      card.addEventListener("focusout", stop);
    });
  }

  function renderCards(el, projects) {
    el.innerHTML = projects.length
      ? projects.map(projectCard).join("")
      : `<div class="empty">No projects match this filter.</div>`;
    wireCardVideos(el);
  }

  async function home() {
    const projEl = document.getElementById("featured-projects");
    const postEl = document.getElementById("latest-posts");
    try {
      const projects = (await loadJSON(PROJECTS_URL)).sort(byDateDesc);
      const featured = projects.filter((p) => p.featured);
      renderCards(projEl, (featured.length ? featured : projects).slice(0, 3));
    } catch (err) { showError(projEl, err); }
    try {
      const posts = (await loadJSON(POSTS_URL)).sort(byDateDesc);
      renderPostList(postEl, posts.slice(0, 3));
    } catch (err) { showError(postEl, err); }
  }

  async function projects() {
    const el = document.getElementById("project-grid");
    const chips = document.getElementById("project-filters");
    let all;
    try { all = (await loadJSON(PROJECTS_URL)).sort(byDateDesc); }
    catch (err) { return showError(el, err); }

    const tags = [...new Set(all.flatMap((p) => p.tags || []))].sort((a, b) => a.localeCompare(b));
    const params = new URLSearchParams(location.search);
    let active = tags.includes(params.get("tag")) ? params.get("tag") : null;

    function draw() {
      chips.innerHTML = [null, ...tags]
        .map((t) => `<button class="chip" type="button" data-tag="${esc(t ?? "")}" aria-pressed="${t === active}">${esc(t ?? "All")}</button>`)
        .join("");
      renderCards(el, active ? all.filter((p) => (p.tags || []).includes(active)) : all);
    }

    chips.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      active = btn.dataset.tag || null;
      const url = new URL(location.href);
      if (active) url.searchParams.set("tag", active); else url.searchParams.delete("tag");
      history.replaceState(null, "", url);
      draw();
    });

    draw();
  }

  // ---------- Posts ----------
  function renderPostList(el, posts) {
    if (!posts.length) { el.innerHTML = `<div class="empty">No posts yet.</div>`; return; }
    el.innerHTML = posts.map((p) => `
      <article class="post-item">
        <div class="post-meta"><time datetime="${esc(p.date)}">${formatDate(p.date)}</time>${tagList(p.tags)}</div>
        <h3><a href="/post.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h3>
        <p>${esc(p.summary)}</p>
      </article>`).join("");
  }

  async function blog() {
    const el = document.getElementById("post-list");
    try { renderPostList(el, (await loadJSON(POSTS_URL)).sort(byDateDesc)); }
    catch (err) { showError(el, err); }
  }

  // ---------- Markdown ----------
  // Pull math out before Markdown parsing so marked doesn't mangle `_` and `*`,
  // skipping fenced and inline code.
  function renderMarkdown(md) {
    const math = [];
    const parts = md.split(/(```[\s\S]*?```|`[^`\n]*`)/);
    for (let i = 0; i < parts.length; i += 2) {
      parts[i] = parts[i]
        .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => `@@MATH${math.push({ tex, display: true }) - 1}@@`)
        .replace(/(^|[^\\$])\$([^$\n]+?)\$/g, (_, pre, tex) => `${pre}@@MATH${math.push({ tex, display: false }) - 1}@@`);
    }
    let html = marked.parse(parts.join(""));
    html = html.replace(/@@MATH(\d+)@@/g, (_, i) => {
      const m = math[+i];
      try { return katex.renderToString(m.tex, { displayMode: m.display, throwOnError: false }); }
      catch (_) { return esc(m.tex); }
    });
    return html;
  }

  function enhanceProse(el) {
    if (window.hljs) el.querySelectorAll("pre code").forEach((c) => hljs.highlightElement(c));
    el.querySelectorAll("a[href^='http']").forEach((a) => a.setAttribute("rel", "noopener"));
  }

  async function markdownPage({ indexUrl, key, param, dir, head }) {
    const root = document.getElementById("article");
    const id = new URLSearchParams(location.search).get(param);
    try {
      const entry = (await loadJSON(indexUrl)).find((x) => x[key] === id);
      if (!entry) {
        root.innerHTML = `<div class="notfound"><div class="code">404</div><p>Nothing here. <a href="/">Go home</a></p></div>`;
        return;
      }
      const res = await fetch(`${dir}/${encodeURIComponent(id)}.md`);
      const md = res.ok ? await res.text() : "_Write-up coming soon._";
      document.title = `${entry.title} — depthBuffer`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && entry.summary) meta.setAttribute("content", entry.summary);
      root.innerHTML = `${head(entry, md)}<div class="prose" id="prose">${renderMarkdown(md)}</div>`;
      enhanceProse(document.getElementById("prose"));
    } catch (err) { showError(root, err); }
  }

  function project() {
    return markdownPage({
      indexUrl: PROJECTS_URL, key: "id", param: "id", dir: "/content/projects",
      head: (p) => `
        <header class="article-head">
          <p class="eyebrow"><a href="/projects.html">&larr; Projects</a></p>
          <h1>${esc(p.title)}</h1>
          <p class="summary">${esc(p.summary)}</p>
          ${tagList(p.tags, "/projects.html")}
          ${projectLinks(p, { includeWriteup: false })}
        </header>`,
    });
  }

  function post() {
    return markdownPage({
      indexUrl: POSTS_URL, key: "slug", param: "slug", dir: "/content/posts",
      head: (p, md) => {
        const minutes = Math.max(1, Math.round(md.split(/\s+/).length / 220));
        return `
        <header class="article-head">
          <p class="eyebrow"><a href="/blog.html">&larr; Blog</a></p>
          <h1>${esc(p.title)}</h1>
          <div class="post-meta"><time datetime="${esc(p.date)}">${formatDate(p.date)}</time><span>${minutes} min read</span>${tagList(p.tags)}</div>
        </header>`;
      },
    });
  }

  // ---------- Demos ----------
  async function demos() {
    const el = document.getElementById("demo-grid");
    try {
      const list = await loadJSON(DEMOS_URL);
      el.innerHTML = list.map((d) => `
        <article class="card">
          <a class="card-media" href="${esc(d.path)}" tabindex="-1" aria-hidden="true">
            <img src="${esc(d.thumb)}" alt="" loading="lazy"><span class="card-badge">${esc(d.api)}</span>
          </a>
          <div class="card-body">
            <h3><a href="${esc(d.path)}">${esc(d.title)}</a></h3>
            <p>${esc(d.summary)}</p>
            ${tagList(d.tags)}
            <div class="card-links"><a href="${esc(d.path)}">Launch &rarr;</a>${d.source ? `<a href="${esc(d.source)}" rel="noopener">Source</a>` : ""}</div>
          </div>
        </article>`).join("");
    } catch (err) { showError(el, err); }
  }

  const pages = { home, projects, project, blog, post, demos };
  const run = pages[document.body.dataset.page];
  if (run) run();
})();
