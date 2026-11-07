// Shared site chrome: header, footer, nav highlight, theme toggle.
(function () {
  const SITE = {
    name: "depthBuffer",
    author: "Antony Peter T",
    github: "https://github.com/depthBuffer",
    linkedin: "https://www.linkedin.com/in/antony-t-5188a3135/",
  };

  // Set show: true once a section has content.
  const NAV = [
    { href: "/projects/", label: "Projects", show: true },
    { href: "/demos/", label: "Demos", show: false },
    { href: "/blog/", label: "Blog", show: false },
    { href: "/about/", label: "About", show: true },
  ];

  const path = location.pathname;

  function themeIcon(theme) {
    return theme === "light"
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  }

  function currentTheme() {
    const set = document.documentElement.dataset.theme;
    if (set) return set;
    return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function renderHeader() {
    const header = document.getElementById("site-header");
    if (!header) return;
    header.className = "site-header";
    const links = NAV.filter((item) => item.show).map((item) => {
      const active = path.startsWith(item.href) ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${active}>${item.label}</a>`;
    }).join("");
    header.innerHTML = `
      <div class="container">
        <a class="brand" href="/">${SITE.name}<span>_</span></a>
        <div style="display:flex;align-items:center;gap:8px">
          <nav class="nav" id="site-nav" aria-label="Main">${links}</nav>
          <button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle colour theme">${themeIcon(currentTheme())}</button>
          <button class="icon-btn menu-btn" id="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>`;

    document.getElementById("theme-toggle").addEventListener("click", (e) => {
      const next = currentTheme() === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (_) { /* storage unavailable */ }
      e.currentTarget.innerHTML = themeIcon(next);
    });

    const nav = document.getElementById("site-nav");
    const menuBtn = document.getElementById("menu-toggle");
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  function renderFooter() {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container">
        <span>&copy; ${new Date().getFullYear()} ${SITE.author}</span>
        <span><a href="${SITE.github}">GitHub</a> &middot; <a href="${SITE.linkedin}">LinkedIn</a> &middot; <a href="/about/">Contact</a></span>
      </div>`;
  }

  renderHeader();
  renderFooter();
})();
