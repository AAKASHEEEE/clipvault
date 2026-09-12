/* ClipVault: framework-free rendering, accessible native dialogs, explicit saves. */
(() => {
  "use strict";
  const C = ClipVaultCore,
    { LocalStore, CloudStore, key } = ClipVaultStorage,
    E = C.esc,
    $ = (s) => document.querySelector(s),
    root = $("#root"),
    dialog = $("#editor");
  const empty = () => ({ version: 1, accounts: [], clips: [] });
  const S = {
    view: "home",
    authMode: "signin",
    authMessage: "",
    authMessageType: "error",
    page: "overview",
    data: empty(),
    mode: "local",
    sample: false,
    loaded: false,
    store: new LocalStore(),
    query: "",
    platform: "all",
    niche: "all",
    sort: "newest",
    busy: false,
    epoch: 0,
    client: null,
    user: null,
  };
  function getRedirectUrl(hash = "") {
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      return window.location.origin + window.location.pathname + hash;
    }
    return "https://clipvaultt.netlify.app/" + hash;
  }
  function setAuthMode(mode = "signin", message = "", type = "error", updateHash = true) {
    S.view = "auth";
    S.authMode = mode;
    S.authMessage = message;
    S.authMessageType = type;
    if (updateHash) {
      const hash = mode === "signin" ? "#login" : "#" + mode;
      if (window.location.hash !== hash) {
        history.replaceState(null, "", hash);
      }
    }
    render();
  }
  function handleRoute() {
    const hash = window.location.hash || "";
    const params = new URLSearchParams(window.location.search);
    const authParam = params.get("auth") || params.get("mode");

    if (hash.includes("type=recovery") || authParam === "reset" || hash === "#reset" || hash.startsWith("#reset")) {
      setAuthMode("reset", "Enter your new password below (at least 12 characters).", "info", false);
      return;
    }

    const route = authParam || (hash.startsWith("#") ? hash.slice(1).split("?")[0] : "");
    if (["login", "signin"].includes(route)) {
      setAuthMode("signin", "", "error", false);
    } else if (["signup", "register"].includes(route)) {
      setAuthMode("signup", "", "error", false);
    } else if (["magiclink", "magic-link", "magic"].includes(route)) {
      setAuthMode("magiclink", "", "error", false);
    } else if (["forgot", "forgot-password", "reset-password"].includes(route)) {
      setAuthMode("forgot", "", "error", false);
    } else if (["reset", "update-password"].includes(route)) {
      setAuthMode("reset", "", "error", false);
    } else if (hash === "" || hash === "#" || hash === "#home" || hash.startsWith("#workflow") || hash.startsWith("#faq")) {
      if (!S.user && S.view === "auth") {
        S.view = "home";
        render();
      }
    }
  }
  let returnFocus = null,
    ytKey = "";
  const names = {
    overview: "Overview",
    accounts: "Accounts",
    board: "Clip board",
    analytics: "Analytics",
    settings: "Settings",
  };
  const icons = {
    play: "M8 5v14l11-7z",
    overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    accounts:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M18 8h4 M20 6v4",
    board: "M3 4h5v16H3z M10 4h5v10h-5z M17 4h4v13h-4z",
    analytics: "M4 19h16 M7 15v-4 M12 15V5 M17 15V8",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
    arrow: "M5 12h14 M13 6l6 6-6 6",
    plus: "M12 5v14 M5 12h14",
    check: "M5 12l4 4L19 6",
    close: "M6 6l12 12 M6 18 18 6",
    menu: "M4 6h16 M4 12h16 M4 18h16",
    search: "M21 21l-5-5 M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16",
    external:
      "M14 3h7v7 M10 14 21 3 M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5",
  };
  const icon = (n) =>
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[n] || icons.play}"/></svg>`;
  const platformMark = (platform) => {
    const marks = {
      youtube: '<rect x="3" y="6" width="18" height="12" rx="3" fill="currentColor"/><path d="m10 9 5 3-5 3V9Z" fill="var(--surface)" stroke="none"/>',
      instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>',
      tiktok: '<path d="M14 4v10.2a3.8 3.8 0 1 1-3-3.7"/><path d="M14 4c.7 2.2 2 3.5 4.5 4"/>',
      facebook: '<path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V4a22 22 0 0 0-2.5-.2c-2.5 0-4.2 1.5-4.2 4.3V10H7.5v3h2.6v8"/>',
      podcast: '<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M8.2 16a5.5 5.5 0 0 1 0-8M15.8 8a5.5 5.5 0 0 1 0 8M5.7 18.8a9.2 9.2 0 0 1 0-13.6M18.3 5.2a9.2 9.2 0 0 1 0 13.6"/>',
    };
    return `<svg class="platform-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${marks[platform] || marks.podcast}</svg>`;
  };
  const brand = () =>
    `<button class="brand" data-action="home" aria-label="ClipVault home"><span>${icon("play")}</span>ClipVault<span class="brand-dot">.</span></button>`;
  const btn = (label, action, primary = false) =>
    `<button class="button ${primary ? "primary" : ""}" data-action="${action}">${label}</button>`;
  const badge = (label, kind = "") =>
    `<span class="badge ${kind}">${E(label)}</span>`;
  const compact = (n) =>
    new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n || 0);
  const exact = (n) => new Intl.NumberFormat("en").format(n || 0);
  const date = (d) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  const link = (url, label) =>
    url
      ? `<a href="${E(C.url(url))}" target="_blank" rel="noopener noreferrer">${E(label)} ${icon("external")}</a>`
      : "";
  const field = (name, label, value = "", type = "text", attrs = "") =>
    `<label class="field">${label}<input name="${name}" type="${type}" value="${E(value ?? "")}" ${attrs}></label>`;
  const select = (name, label, options, value) =>
    `<label class="field">${label}<select name="${name}">${Object.entries(
      options,
    )
      .map(
        ([k, v]) =>
          `<option value="${E(k)}" ${k === value ? "selected" : ""}>${E(v)}</option>`,
      )
      .join("")}</select></label>`;
  const none = (title, description, action, label) =>
    `<div class="empty"><span>${icon("board")}</span><h2>${E(title)}</h2><p>${E(description)}</p>${action ? btn(label, action, true) : ""}</div>`;
  function notify(message, error = false) {
    const el = $("#toast");
    el.textContent = message;
    el.className = error ? "error" : "show";
    clearTimeout(el.timer);
    el.timer = setTimeout(() => {
      el.textContent = "";
      el.className = "";
    }, 6500);
  }
  function render() {
    document.body.classList.remove("nav-open");
    root.innerHTML =
      S.view === "home" ? home() : S.view === "auth" ? auth() : shell();
    if (S.view === "app" && S.page === "settings") {
      const cloudHeading = [...root.querySelectorAll("#page-content h2")].find((h) => h.textContent.includes("Optional cloud"));
      if (cloudHeading) {
        cloudHeading.textContent = "Cloud workspace";
        const cloudCopy = cloudHeading.nextElementSibling;
        if (cloudCopy?.tagName === "P") cloudCopy.textContent = S.mode === "cloud" ? `Signed in as ${S.user?.email || "your account"}.` : "Supabase cloud is ready. Sign in to access private synced records.";
      }
    }
    document.title =
      S.view === "app"
        ? names[S.page] + " · ClipVault"
        : S.view === "auth"
          ? (S.authMode === "signup" ? "Sign Up" : S.authMode === "forgot" ? "Reset Password" : S.authMode === "reset" ? "New Password" : S.authMode === "magiclink" ? "Magic Link" : "Log In") + " · ClipVault"
          : "ClipVault — Make room for better content";
  }
  function home() {
    return `<div class="landing"><nav class="landnav" aria-label="Main">${brand()}<div><a href="#workflow">How it works</a><a href="#faq">FAQs</a>${btn("Local workspace", "local")}${btn("Cloud sign in", "login", true)}</div></nav><main id="content"><section class="hero"><div><span class="eyebrow">● YOUR CONTENT, WITH A PLAN</span><h1>Less admin.<br>More <em>great clips.</em></h1><p>Your channels, your production queue, your next big idea. A calmer workspace for everything around the edit.</p><div class="actions">${btn("Try the demo " + icon("arrow"), "demo", true)}${btn("Start a blank workspace", "local")}</div><small>No sign-up for local mode. No automatic publishing.</small></div><div class="product-preview"><div class="preview-top"><b>${icon("play")} Studio workspace</b>${badge("SAMPLE DATA", "blue")}</div><div class="preview-body"><span class="eyebrow">MAKE SOMETHING GOOD</span><h2>Your next batch, sorted.</h2><div class="preview-stats"><div><b>8</b><small>Ideas in motion</small></div><div><b>3</b><small>Ready to share</small></div><div><b>1</b><small>Clear workflow</small></div></div><div class="preview-board"><section><h3><i class="dot cutting"></i> Cutting</h3><article><span class="platform-text instagram">INSTAGRAM</span><h4>The conversation worth clipping.</h4><div class="wave" aria-hidden="true">${Array.from({ length: 16 }, () => "<i></i>").join("")}</div><small>Off Script · Editing</small></article><article><span class="platform-text youtube">YOUTUBE</span><h4>A better morning routine</h4></article></section><section><h3><i class="dot ready"></i> Ready</h3><article><span class="ready-check">${icon("check")}</span><h4>The final-round comeback.</h4><p>One last look. Then it’s out in the world.</p><small>Pixel Playground</small></article><div class="preview-empty">Room for your next idea</div></section></div></div><div class="preview-foot">${icon("check")} From first idea to final post.</div></div></section><section class="platform-strip"><span>ONE HOME FOR YOUR CHANNELS</span><b>YouTube</b><b>Instagram</b><b>TikTok</b><b>Facebook</b></section><section class="home-section" id="workflow"><span class="eyebrow">A LITTLE STRUCTURE. A LOT MORE FOCUS.</span><h2>Stay in the creative flow.</h2><p>Not another video editor. The workspace that keeps your workflow moving.</p><div class="features">${[
      [
        "01 / ORGANIZE",
        "accounts",
        "Every channel. One place.",
        "Keep channel links, contacts, priorities, and content notes together—without storing passwords.",
      ],
      [
        "02 / PRODUCE",
        "board",
        "Give every clip a next step.",
        "Move from queued to cutting, ready, and posted. Drag cards or use keyboard-friendly status menus.",
      ],
      [
        "03 / LEARN",
        "analytics",
        "Know what you’ve recorded.",
        "Log results after publishing. Keep posted-clip performance separate from channel lifetime views.",
      ],
    ]
      .map(
        ([n, i, t, p]) =>
          `<article><small>${n}</small>${icon(i)}<h3>${t}</h3><p>${p}</p></article>`,
      )
      .join(
        "",
      )}</div></section><section class="faq home-section" id="faq"><div><span class="eyebrow">GOOD TO KNOW</span><h2>Simple by design.<br>Clear about the details.</h2></div><div><details><summary>Do I need an account?</summary><p>No. Local mode stores your data in this browser. Export regular backups; clearing site data removes local records. Supabase cloud sign-in is optional.</p></details><details><summary>Does this edit or publish videos?</summary><p>No. ClipVault organizes the work around the edit. Publish through your existing tools, then update the status here.</p></details><details><summary>Are analytics automatic?</summary><p>Clip analytics are manual records. Optional YouTube channel-view sync needs your own restricted API key. Other platforms remain manual.</p></details><details><summary>Can I store passwords?</summary><p>No. Use a dedicated password manager and your platform’s editor roles. Never put passwords or recovery codes in notes.</p></details></div></section><section class="home-cta"><div><span class="eyebrow">LESS SCATTERED. MORE SHIPPED.</span><h2>Make space for the next great clip.</h2></div>${btn("Open the demo " + icon("arrow"), "demo", true)}</section></main><footer>ClipVault · A workspace for the work around the edit.</footer></div>`;
  }
  function nav(p) {
    return `<button class="nav-item ${S.page === p ? "active" : ""}" data-page="${p}" ${S.page === p ? 'aria-current="page"' : ""}>${icon(p)}${names[p]}${p === "board" ? `<span class="nav-count">${C.metrics(S.data).progress}</span>` : ""}</button>`;
  }
  function shell() {
    return `<div class="app"><button class="scrim" data-action="close-nav" aria-label="Close navigation"></button><aside class="sidebar">${brand()}<div class="workspace"><b>${S.sample ? "Demo workspace" : S.mode === "cloud" ? "Cloud workspace" : "Local workspace"}</b><small>${S.sample ? "In memory only" : S.mode === "cloud" ? "Signed in" : "Saved in this browser"}</small></div><span class="nav-label">WORKSPACE</span><nav aria-label="Workspace">${["overview", "accounts", "board", "analytics"].map(nav).join("")}</nav><div class="sidebar-bottom">${nav("settings")}<p>No passwords here.<br>Just your creative workflow.</p><button class="nav-item" data-action="exit">${icon("arrow")}${S.mode === "cloud" ? "Sign out" : "Back to home"}</button></div></aside><div class="app-body"><header class="app-top"><div>${btn(icon("menu"), "toggle-nav")}<span>Workspace <span>/</span> <b>${names[S.page]}</b></span></div>${badge(S.sample ? "Demo · in memory" : S.mode === "cloud" ? "Cloud · signed in" : "Local · this browser")}</header><main id="content" tabindex="-1"><div class="page-heading"><div><span class="eyebrow">YOUR CREATIVE WORKSPACE</span><h1>${names[S.page]}</h1><p>${{ overview: "A clear view of what’s moving. And what comes next.", accounts: "Your channels, organized. No passwords required.", board: "Less chasing updates. More moving things forward.", analytics: "Recorded performance, with the right context.", settings: "Your workspace. Your data. Your preferences." }[S.page]}</p></div>${["overview", "board", "accounts"].includes(S.page) ? btn(icon("plus") + (S.page === "accounts" ? " Add account" : " New clip"), S.page === "accounts" ? "account" : "clip", true) : ""}</div>${S.sample ? `<div class="notice blue"><span><b>Demo workspace.</b> Fictional accounts and clips, stored in memory only.</span>${btn("Start my workspace", "local")}</div>` : ""}<div id="page-content">${pageContent()}</div></main><footer>${S.sample ? "Demo changes disappear when you leave." : S.mode === "cloud" ? "Cloud access is governed by your Supabase policies." : "Local data stays in this browser. Keep a backup."}</footer></div></div>`;
  }
  function pageContent() {
    return { overview, accounts, board, analytics, settings }[S.page]();
  }
  function refresh() {
    if ($("#page-content")) $("#page-content").innerHTML = pageContent();
    if ($(".nav-count"))
      $(".nav-count").textContent = C.metrics(S.data).progress;
  }
  function setPage(p) {
    if (!names[p]) return;
    S.page = p;
    S.query = "";
    S.platform = "all";
    S.niche = "all";
    render();
    $("#content").focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  function stat(label, value, note, accent = false) {
    return `<article class="stat ${accent ? "accent" : ""}"><span>${label}</span><strong title="${exact(value)}">${compact(value)}</strong><small>${note}</small></article>`;
  }
  function overview() {
    const m = C.metrics(S.data),
      next = S.data.clips
        .filter((c) => c.status !== "posted")
        .sort(
          (a, b) =>
            C.priorities.indexOf(a.priority) - C.priorities.indexOf(b.priority),
        )
        .slice(0, 4);
    return `<section class="stats">${stat("Active channels", m.active, S.data.accounts.length + " accounts in your workspace")}${stat("In production", m.progress, "Queued, cutting, or ready")}${stat("Posted clips", m.posted, "Marked as published")}${stat("Posted-clip views", m.clipViews, "Manually recorded · all time", true)}</section><div class="dashboard-grid"><section class="panel"><div class="panel-title"><div><h2>Your next moves</h2><p>High-priority work comes first.</p></div><button class="text-button" data-page="board">Open board ${icon("arrow")}</button></div>${next.length ? `<div class="next-list">${next.map((c) => `<button class="next-item" data-edit-clip="${c.id}"><span class="item-icon ${c.status}">${icon(c.status === "ready" ? "check" : "play")}</span><span><b>${E(c.title)}</b><small>${E(S.data.accounts.find((a) => a.id === c.account_id)?.name || "Unlinked")} · ${C.stages[c.status]}</small></span>${badge(c.priority, c.priority === "high" ? "orange" : "")}</button>`).join("")}</div>` : none("A little room to create", "Add a source video and give your next clip a home.", "clip", "Create your first clip")}</section><section class="panel"><div class="panel-title"><div><h2>Pipeline snapshot</h2><p>Every stage, at a glance.</p></div></div><div class="stage-list">${Object.entries(
      C.stages,
    )
      .map(
        ([k, v]) =>
          `<button data-page="board"><span><i class="dot ${k}"></i>${v}</span><b>${S.data.clips.filter((c) => c.status === k).length}</b></button>`,
      )
      .join(
        "",
      )}</div><p class="panel-tip">Publish in your platform, then mark the clip as posted here.</p></section></div><section class="channel-section"><div class="panel-title"><div><h2>Your channels</h2><p>The accounts behind your clips.</p></div><button class="text-button" data-page="accounts">View accounts ${icon("arrow")}</button></div>${
      S.data.accounts.length
        ? `<div class="mini-accounts">${S.data.accounts
            .slice(0, 4)
            .map(
              (a) =>
                `<button data-edit-account="${a.id}"><span class="avatar ${a.platform}">${platformMark(a.platform)}</span><span><b>${E(a.name)}</b><small>${C.platforms[a.platform]} · ${a.niche}</small></span></button>`,
            )
            .join("")}</div>`
        : none(
            "Start with a channel",
            "Keep your source videos and clips connected.",
            "account",
            "Add account",
          )
    }</section>`;
  }
  function filters() {
    return `<div class="filters"><label class="search">${icon("search")}<input type="search" id="search" aria-label="Search workspace records" placeholder="Search ${S.page === "accounts" ? "accounts" : "clips"}…" value="${E(S.query)}"></label><div><select id="filter-platform" aria-label="Platform filter"><option value="all">All platforms</option>${Object.entries(
      C.platforms,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}" ${S.platform === k ? "selected" : ""}>${v}</option>`,
      )
      .join(
        "",
      )}</select><select id="filter-niche" aria-label="Niche filter"><option value="all">All niches</option>${C.niches.map((k) => `<option ${S.niche === k ? "selected" : ""}>${k}</option>`).join("")}</select><select id="filter-sort" aria-label="Sort order">${[
      ["newest", "Newest first"],
      ["priority", "Priority first"],
      ["name", "Name A–Z"],
    ]
      .map(
        ([k, v]) =>
          `<option value="${k}" ${S.sort === k ? "selected" : ""}>${v}</option>`,
      )
      .join("")}</select>${btn("Reset", "reset-filters")}</div></div>`;
  }
  function filtered(type) {
    return S.data[type]
      .filter((r) => {
        const a =
          type === "accounts"
            ? r
            : S.data.accounts.find((a) => a.id === r.account_id);
        return (
          (S.platform === "all" || a?.platform === S.platform) &&
          (S.niche === "all" || a?.niche === S.niche) &&
          [r.name, r.title, r.handle, r.notes, a?.name].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(S.query.toLowerCase()),
          )
        );
      })
      .sort((a, b) =>
        S.sort === "name"
          ? (a.name || a.title).localeCompare(b.name || b.title)
          : S.sort === "priority"
            ? C.priorities.indexOf(a.priority) -
              C.priorities.indexOf(b.priority)
            : new Date(b.created_at) - new Date(a.created_at),
      );
  }
  function accounts() {
    return filters() + '<div id="results">' + accountResults() + "</div>";
  }
  function accountResults() {
    const list = filtered("accounts");
    return `<p class="result-count">${list.length} of ${S.data.accounts.length} accounts</p>${list.length ? `<div class="account-grid">${list.map((a) => `<article class="account-card"><div class="account-top"><span class="avatar ${a.platform}">${platformMark(a.platform)}</span>${badge(a.status, a.status === "active" ? "green" : "")}</div><h2>${E(a.name)}</h2><p>${E(a.handle || C.platforms[a.platform])}</p><div class="tags">${badge(a.niche)}${badge(a.priority + " priority", a.priority === "high" ? "orange" : "")}</div><div class="account-views"><span>Channel views</span><b>${compact(a.views)}</b></div>${a.platform === "youtube" && (a.subscribers || a.videos) ? `<div class="account-youtube"><span><b>${compact(a.subscribers)}</b> subscribers</span><span><b>${compact(a.videos)}</b> videos</span></div>` : ""}<div class="account-link">${link(a.url, "Open channel")}</div><details><summary>Contact & notes</summary><p>${E([a.email, a.phone, a.notes || "No notes added."].filter(Boolean).join("\n"))}</p></details><div class="card-foot"><small>Added ${date(a.created_at)}</small><button class="text-button" data-edit-account="${a.id}">Edit account</button></div></article>`).join("")}</div>` : none("No matching accounts", "Try a different search or add a new channel.", "account", "Add account")}`;
  }
  function board() {
    return filters() + '<div id="results">' + boardResults() + "</div>";
  }
  function clipCard(c) {
    const a = S.data.accounts.find((a) => a.id === c.account_id);
    return `<article class="clip-card" draggable="true" data-clip-id="${c.id}"><div class="clip-top"><span class="platform-text ${a?.platform || ""}">${a ? platformMark(a.platform) : ""}${E(a ? C.platforms[a.platform] : "Unlinked")}</span>${badge(c.priority, c.priority === "high" ? "orange" : "")}</div><button class="clip-title" data-edit-clip="${c.id}">${E(c.title)}</button><p>${E(a?.name || "No account linked")}</p>${c.status === "posted" ? `<p class="clip-views"><b>${compact(c.views)}</b> recorded views</p>` : ""}<div class="source-link">${link(c.source_url, "Source video")}</div><div class="clip-foot"><select data-move="${c.id}" aria-label="Status for ${E(c.title)}">${Object.entries(
      C.stages,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}" ${k === c.status ? "selected" : ""}>${v}</option>`,
      )
      .join(
        "",
      )}</select><button class="text-button" data-edit-clip="${c.id}" aria-label="Edit ${E(c.title)}">Edit ${icon("arrow")}</button></div></article>`;
  }
  function boardResults() {
    const list = filtered("clips");
    return `<p class="result-count">${list.length} of ${S.data.clips.length} clips · Drag cards or use their status menus</p><div class="board">${Object.entries(
      C.stages,
    )
      .map(
        ([k, v]) =>
          `<section class="column" data-drop="${k}" aria-label="${v} clips"><h2><span><i class="dot ${k}"></i>${v}</span><b>${list.filter((c) => c.status === k).length}</b></h2><div class="column-cards">${
            list
              .filter((c) => c.status === k)
              .map(clipCard)
              .join("") ||
            `<div class="column-empty">${icon(k === "posted" ? "check" : "plus")}<span>${k === "posted" ? "Your published work goes here." : "Room for your next clip."}</span></div>`
          }</div><button class="add-stage" data-stage="${k}">${icon("plus")} Add clip</button></section>`,
      )
      .join("")}</div>`;
  }
  function analytics() {
    const m = C.metrics(S.data),
      posted = S.data.clips
        .filter((c) => c.status === "posted")
        .sort((a, b) => b.views - a.views);
    const geo = {},
      age = {};
    posted.forEach((c) => {
      if (c.geo) geo[c.geo] = (geo[c.geo] || 0) + c.views;
      if (c.age_group) age[c.age_group] = (age[c.age_group] || 0) + c.views;
    });
    const top = (o) =>
      Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0] || "Not recorded";
    return `<div class="notice"><p><b>Manual records, not live analytics.</b> Channel totals and posted-clip views stay separate because they may overlap.</p></div><section class="stats">${stat("Posted-clip views", m.clipViews, m.posted + " published clips", true)}${stat("Recorded 24h views", m.recorded24h, "Entered snapshots; reporting dates may differ")}${stat("Channel views", m.channelViews, "Separate lifetime totals")}${stat("In production", m.progress, "Excluded from performance totals")}</section><div class="analytics-grid"><section class="panel"><div class="panel-title"><div><h2>Posted-clip performance</h2><p>Ranked by recorded views.</p></div></div>${posted.length ? `<div class="table-scroll"><table><thead><tr><th>Clip / channel</th><th>Total views</th><th>Recorded 24h</th></tr></thead><tbody>${posted.map((c) => `<tr><td><button class="text-button" data-edit-clip="${c.id}">${E(c.title)}</button><small>${E(S.data.accounts.find((a) => a.id === c.account_id)?.name || "Unlinked")}</small></td><td>${exact(c.views)}</td><td>${exact(c.views_24h)}</td></tr>`).join("")}</tbody></table></div>` : none("Your results start here", "Mark a clip as posted and enter its performance.", "clip", "Add a posted clip")}</section><section class="panel"><div class="panel-title"><div><h2>By platform</h2><p>Posted-clip views only.</p></div></div><div class="breakdown">${[...Object.entries(C.platforms), ["unlinked", "Unlinked"]].map(([k, v]) => `<div><span>${v}</span><b>${compact(posted.filter((c) => (S.data.accounts.find((a) => a.id === c.account_id)?.platform || "unlinked") === k).reduce((s, c) => s + c.views, 0))}</b></div>`).join("")}</div><div class="audience"><h3>Recorded audience labels</h3><p>Top location <b>${E(top(geo))}</b></p><p>Top age group <b>${E(top(age))}</b></p><small>Weighted by each clip’s total views. Not a demographic distribution.</small></div></section></div>`;
  }
  function settings() {
    return `<div class="settings-grid"><section class="panel settings-panel"><h2>Data & backups</h2><p>${S.sample ? "Demo data is in memory only." : S.mode === "cloud" ? "Cloud data belongs to your authenticated user." : "Local data is stored in this browser and is not encrypted. Clearing site data deletes it."}</p><div class="actions">${btn("Export JSON backup", "export")}${!S.sample && S.mode === "local" ? btn("Import JSON backup", "import") : ""}</div><input type="file" id="backup-file" accept=".json,application/json" hidden><small>Backups include contacts and notes. Store them privately. Import replaces local data only after validation and confirmation.</small>${!S.sample && S.mode === "local" ? `<hr><h3>Reset local workspace</h3><p>Export a backup first. Cloud records and the old version’s storage are not affected.</p><div class="actions">${btn("Reset local data", "reset-local")}${btn("Export raw local data", "raw")}</div>` : ""}</section><section class="panel settings-panel"><h2>Appearance</h2><label class="field">Color theme<select id="theme">${["system", "light", "dark"].map((t) => `<option value="${t}" ${document.documentElement.dataset.theme === t ? "selected" : ""}>${t[0].toUpperCase() + t.slice(1)}</option>`).join("")}</select></label><hr><h2>Optional cloud workspace</h2><p>${S.mode === "cloud" ? "Signed in as " + E(S.user?.email) : "Configure your own Supabase project in config.js. Local and cloud workspaces are never automatically merged."}</p>${btn(S.mode === "cloud" ? "Sign out" : "Cloud sign-in", S.mode === "cloud" ? "exit" : "login")}</section><section class="panel settings-panel"><h2>YouTube channel stats</h2><p>Use an API key restricted to your HTTP referrers and YouTube Data API v3. The key stays in memory only.</p><form id="youtube-form">${field("key", "Restricted YouTube API key", ytKey, "password", 'autocomplete="off"')}<button class="button" type="submit">Sync YouTube channels</button><p class="form-error" role="alert"></p></form><small>Updates channel view totals, not clip analytics. Use an @handle or /channel/ URL. No subscriber/video-count display in this edition.</small></section><section class="panel settings-panel"><h2>Safer by design</h2><ul><li>No social-account passwords or recovery codes.</li><li>Only validated http(s) links.</li><li>Save failures keep your form open.</li><li>Cloud record ownership enforced by database policies.</li></ul><p>This is not a password vault. Old credentials in your original database are not deleted by this edition.</p></section></div>`;
  }
  function auth() {
    const mode = S.authMode || "signin";
    const titles = {
      signin: "Welcome back.",
      signup: "Make it your workspace.",
      magiclink: "Sign in with Magic Link",
      forgot: "Reset your password",
      reset: "Choose a new password",
    };
    const subtitles = {
      signin: "Your private ClipVault cloud workspace is ready. Sign in to continue.",
      signup: "Sign up to securely sync and access your creator workspace anywhere.",
      magiclink: "Enter your email address and we'll send a passwordless sign-in link.",
      forgot: "Enter your account email. We'll send you a secure link to choose a new password.",
      reset: "Enter your new password below (at least 12 characters).",
    };

    const isMainTab = ["signin", "magiclink", "signup"].includes(mode);
    const tabsHtml = isMainTab
      ? `<div class="auth-tabs" role="tablist">
          <button type="button" class="auth-tab ${mode === "signin" ? "active" : ""}" data-auth-mode="signin">Password</button>
          <button type="button" class="auth-tab ${mode === "magiclink" ? "active" : ""}" data-auth-mode="magiclink">Magic Link</button>
          <button type="button" class="auth-tab ${mode === "signup" ? "active" : ""}" data-auth-mode="signup">Sign Up</button>
        </div>`
      : "";

    let formFields = "";
    let submitLabel = "Sign in";

    if (mode === "signin") {
      formFields = `${field("email", "Email address", "", "email", 'required autocomplete="email" autofocus')}${field("password", "Password", "", "password", 'required autocomplete="current-password"')}`;
      submitLabel = "Sign in";
    } else if (mode === "signup") {
      formFields = `${field("name", "Your name", "", "text", 'required autocomplete="name" autofocus')}${field("email", "Email address", "", "email", 'required autocomplete="email"')}${field("password", "Password", "", "password", 'required autocomplete="new-password" minlength="12"')}${field("confirm", "Confirm password", "", "password", 'required autocomplete="new-password"')}`;
      submitLabel = "Create account";
    } else if (mode === "magiclink") {
      formFields = `${field("email", "Email address", "", "email", 'required autocomplete="email" autofocus')}`;
      submitLabel = "Send Magic Link";
    } else if (mode === "forgot") {
      formFields = `${field("email", "Account email address", "", "email", 'required autocomplete="email" autofocus')}`;
      submitLabel = "Send reset link";
    } else if (mode === "reset") {
      formFields = `${field("password", "New password", "", "password", 'required autocomplete="new-password" minlength="12" autofocus')}${field("confirm", "Confirm new password", "", "password", 'required autocomplete="new-password"')}`;
      submitLabel = "Update password & sign in";
    }

    let linksHtml = "";
    if (mode === "signin") {
      linksHtml = `<button type="button" class="text-button" data-auth-mode="forgot">Forgot password?</button><button type="button" class="text-button" data-action="home">← Back to home</button>`;
    } else if (mode === "magiclink") {
      linksHtml = `<button type="button" class="text-button" data-auth-mode="signin">Use password instead</button><button type="button" class="text-button" data-action="home">← Back to home</button>`;
    } else if (mode === "signup") {
      linksHtml = `<button type="button" class="text-button" data-auth-mode="signin">Already have an account? Sign in</button><button type="button" class="text-button" data-action="home">← Back to home</button>`;
    } else if (mode === "forgot") {
      linksHtml = `<button type="button" class="text-button" data-auth-mode="signin">← Back to sign in</button><button type="button" class="text-button" data-action="home">Back to home</button>`;
    } else if (mode === "reset") {
      linksHtml = `<button type="button" class="text-button" data-auth-mode="signin">← Back to sign in</button><button type="button" class="text-button" data-action="home">Back to home</button>`;
    }

    const messageHtml = S.authMessage
      ? `<div class="auth-notice ${S.authMessageType || "info"}" role="alert">${E(S.authMessage)}</div>`
      : "";

    return `<div class="auth-page">
      ${brand()}
      <main class="auth-card" id="content">
        ${badge(mode === "reset" || mode === "forgot" ? "PASSWORD RECOVERY" : "SUPABASE CLOUD WORKSPACE", "blue")}
        <h1>${E(titles[mode] || "Cloud Workspace")}</h1>
        <p>${E(subtitles[mode] || "")}</p>
        ${tabsHtml}
        ${messageHtml}
        <form id="auth-form" data-mode="${mode}">
          ${formFields}
          <button class="button primary" type="submit">${submitLabel} ${icon("arrow")}</button>
          <p class="form-error" role="alert"></p>
        </form>
        <div class="auth-links">
          ${linksHtml}
        </div>
        <small>Protected by Supabase Auth with Row Level Security. Passwords must be at least 12 characters.</small>
      </main>
    </div>`;
  }
  async function local(demo = false) {
    if (S.busy) return;
    if (S.mode === "cloud" && S.user) {
      notify("Sign out of cloud before switching workspaces.", true);
      return;
    }
    S.busy = true;
    const token = ++S.epoch;
    try {
      const data = demo ? C.demo() : await new LocalStore().load();
      if (token !== S.epoch) return;
      Object.assign(S, {
        data,
        mode: "local",
        view: "app",
        page: "overview",
        sample: demo,
        loaded: true,
        store: new LocalStore(),
      });
      render();
    } catch (e) {
      S.view = "app";
      S.page = "settings";
      S.loaded = false;
      render();
      notify(e.message, true);
    } finally {
      S.busy = false;
    }
  }
  function openDialog(html) {
    returnFocus = document.activeElement;
    dialog.innerHTML = html;
    dialog.showModal();
    document.body.classList.add("dialog-open");
    setTimeout(
      () => dialog.querySelector("[autofocus],input,button")?.focus(),
      0,
    );
  }
  function closeDialog() {
    dialog.close();
  }
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    dialog.innerHTML = "";
    if (returnFocus?.isConnected) returnFocus.focus();
  });
  dialog.addEventListener("cancel", (e) => {
    if (S.busy) e.preventDefault();
  });
  function dialogHead(title, description) {
    return `<header class="dialog-head"><div><span class="eyebrow">CLIPVAULT WORKSPACE</span><h2 id="dialog-title">${E(title)}</h2></div><button class="icon-button" type="button" data-action="close-dialog" aria-label="Close dialog">${icon("close")}</button></header><p class="dialog-description">${E(description)}</p>`;
  }
  function edit(kind, id, stage) {
    if (!S.loaded) {
      notify("Load a workspace before adding records.", true);
      return;
    }
    const r =
      S.data[kind === "account" ? "accounts" : "clips"].find(
        (r) => r.id === id,
      ) || {};
    let fields;
    if (kind === "account")
      fields = `<div class="form-grid">${field("name", "Account name *", r.name, "text", 'required maxlength="100" autofocus')}${select("platform", "Platform", C.platforms, r.platform || "youtube")}<div class="full">${field("url", "Channel URL *", r.url, "text", 'required inputmode="url" placeholder="https://youtube.com/@channel"')}</div>${field("handle", "Handle / username", r.handle, "text", 'maxlength="100"')}${select("niche", "Content niche", Object.fromEntries(C.niches.map((k) => [k, k])), r.niche || "other")}${select("priority", "Priority", { high: "High", medium: "Medium", low: "Low" }, r.priority || "medium")}${select("status", "Account status", { active: "Active", paused: "Paused", review: "Review" }, r.status || "active")}${field("views", "Recorded channel views", r.views || 0, "number", 'min="0" step="1"')}${field("subscribers", "YouTube subscribers", r.subscribers || 0, "number", 'min="0" step="1"')}${field("videos", "Published videos", r.videos || 0, "number", 'min="0" step="1"')}${field("email", "Contact email", r.email, "email")}${field("phone", "Contact phone", r.phone, "tel")}<label class="field full">Content notes<textarea name="notes" rows="3" maxlength="2000">${E(r.notes || "")}</textarea></label></div>`;
    else
      fields = `<div class="form-grid"><div class="full">${field("title", "Clip title *", r.title, "text", 'required maxlength="180" autofocus')}</div>${select("account_id", "From account", { "": "Unlinked", ...Object.fromEntries(S.data.accounts.map((a) => [a.id, a.name])) }, r.account_id || "")}${select("priority", "Priority", { high: "High", medium: "Medium", low: "Low" }, r.priority || "medium")}<div class="full">${field("source_url", "Source video URL", r.source_url, "text", 'inputmode="url"')}</div><div class="full">${select("status", "Workflow status", C.stages, r.status || stage || "queued")}</div></div><fieldset id="performance-fields" ${(r.status || stage) !== "posted" ? "hidden" : ""}><legend>Recorded performance</legend><p>Manual snapshots, not live data. 24h views cannot exceed total views.</p><div class="form-grid">${field("views", "Total clip views", r.views || 0, "number", 'min="0" step="1"')}${field("views_24h", "Recorded 24h views", r.views_24h || 0, "number", 'min="0" step="1"')}${field("geo", "Top audience location", r.geo)}${select("age_group", "Top age group", { "": "Not recorded", "13–17": "13–17", "18–24": "18–24", "25–34": "25–34", "35–44": "35–44", "45+": "45+" }, r.age_group || "")}</div></fieldset>`;
    openDialog(
      `${dialogHead((id ? "Edit " : "Add ") + kind, kind === "account" ? "Channel contacts and notes. Never paste passwords or recovery codes." : "Give your next idea a home. Add performance after publishing.")}<form id="record-form" data-kind="${kind}" data-id="${id || ""}">${fields}<p class="form-error" role="alert"></p><footer class="dialog-foot">${id ? `<button class="button danger-text" type="button" data-delete="${kind}" data-id="${id}">Delete ${kind}</button>` : "<span></span>"}<div><button class="button" type="button" data-action="close-dialog">Cancel</button><button class="button primary" type="submit">Save ${kind}</button></div></footer></form>`,
    );
  }
  function confirm(title, message, label, fn) {
    openDialog(
      `${dialogHead(title, message)}<p class="form-error" role="alert"></p><footer class="dialog-foot"><span></span><div>${btn("Cancel", "close-dialog")}<button class="button danger" id="confirm">${label}</button></div></footer>`,
    );
    $("#confirm").onclick = () => busy(dialog, fn);
  }
  async function busy(container, fn) {
    if (S.busy) return;
    S.busy = true;
    const elements = [
      ...container.querySelectorAll("button,input,select,textarea"),
    ];
    elements.forEach((e) => (e.disabled = true));
    container.setAttribute("aria-busy", "true");
    const message = container.querySelector(".form-error");
    if (message) message.textContent = "";
    try {
      await fn();
    } catch (e) {
      if (message && message.isConnected) message.textContent = e.message;
      else notify(e.message, true);
    } finally {
      S.busy = false;
      elements.forEach((e) => (e.disabled = false));
      container.removeAttribute("aria-busy");
    }
  }
  async function save(kind, values, id) {
    if (!S.loaded) throw Error("Workspace is not loaded.");
    const token = S.epoch,
      table = kind === "account" ? "accounts" : "clips",
      d = structuredClone(S.data),
      row = kind === "account" ? C.account(values) : C.clip(values, d.accounts);
    let record;
    if (S.mode === "cloud") record = await S.store.save(table, row, id);
    else
      record = {
        ...row,
        id: id || C.uuid(),
        created_at: id
          ? d[table].find((r) => r.id === id)?.created_at
          : new Date().toISOString(),
      };
    if (id) {
      const index = d[table].findIndex((r) => r.id === id);
      if (index < 0) throw Error("Record no longer exists.");
      d[table][index] = record;
    } else d[table].unshift(record);
    const clean = C.backup(d);
    if (S.mode === "local" && !S.sample) await S.store.commit(clean);
    if (token !== S.epoch)
      throw Error("Session changed; reload the workspace.");
    S.data = clean;
  }
  async function remove(kind, id) {
    const token = S.epoch,
      d = structuredClone(S.data),
      table = kind === "account" ? "accounts" : "clips";
    if (S.mode === "cloud") await S.store.remove(table, id);
    d[table] = d[table].filter((r) => r.id !== id);
    if (kind === "account")
      d.clips.forEach((c) => {
        if (c.account_id === id) c.account_id = null;
      });
    if (S.mode === "local" && !S.sample) await S.store.commit(d);
    if (token !== S.epoch) return;
    S.data = d;
    closeDialog();
    render();
    notify("Deleted successfully.");
  }
  async function move(id, status) {
    if (S.busy) return;
    const c = S.data.clips.find((c) => c.id === id);
    if (!c || c.status === status) return;
    S.busy = true;
    try {
      await save("clip", { ...c, status }, id);
      refresh();
      notify("Moved to " + C.stages[status] + ".");
    } catch (e) {
      refresh();
      notify(e.message, true);
    } finally {
      S.busy = false;
    }
  }
  function download(raw = false) {
    if (!raw && !S.loaded)
      throw Error("No readable workspace. Use raw export instead.");
    const content = raw
        ? localStorage.getItem(key) || "{}"
        : JSON.stringify(
            { ...C.backup(S.data), exported_at: new Date().toISOString() },
            null,
            2,
          ),
      uri = URL.createObjectURL(
        new Blob([content], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = uri;
    a.download = "clipvault-" + (raw ? "raw-" : "") + "backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(uri), 1000);
  }
  async function client() {
    if (S.client) return S.client;
    const cfg = window.CLIPVAULT_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey)
      throw Error(
        "Cloud is not configured. Add your project URL and publishable key in config.js, or use local mode.",
      );
    const u = new URL(cfg.supabaseUrl);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".supabase.co"))
      throw Error("Use an https Supabase project URL.");
    const k = cfg.supabasePublishableKey;
    if (!k.startsWith("sb_publishable_")) {
      try {
        const payload = JSON.parse(
          atob(k.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        if (payload.role !== "anon") throw Error();
      } catch {
        throw Error(
          "Use a publishable or legacy anon key. Never expose service-role keys.",
        );
      }
    }
    if (!window.supabase)
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/dist/umd/supabase.js";
        const timer = setTimeout(() => {
          script.remove();
          reject(Error("Cloud SDK timed out. Check your connection."));
        }, 12000);
        script.onload = () => {
          clearTimeout(timer);
          resolve();
        };
        script.onerror = () => {
          clearTimeout(timer);
          script.remove();
          reject(Error("Cloud SDK failed to load. Local mode still works."));
        };
        document.head.append(script);
      });
    S.client = window.supabase.createClient(cfg.supabaseUrl, k);
    S.client.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        if (event === "SIGNED_OUT" && S.mode === "cloud") clearSession();
        if (event === "PASSWORD_RECOVERY") {
          setAuthMode("reset", "Recovery link verified. Please choose your new password.", "info", true);
        } else if (event === "SIGNED_IN") {
          if (S.authMode === "reset") return;
          if (session?.user && (!S.user || session.user.id !== S.user.id)) {
            enterCloud(session).catch((e) => notify(e.message, true));
          }
        }
      }, 0);
    });
    return S.client;
  }
  async function enterCloud(session) {
    if (!session?.user)
      throw Error("No session. Confirm your email and sign in.");
    const token = ++S.epoch,
      store = new CloudStore(S.client, session.user);
    S.data = empty();
    S.loaded = false;
    S.user = session.user;
    S.mode = "cloud";
    S.sample = false;
    try {
      const [d, profile] = await Promise.all([
        store.load(),
        store.getProfile().catch(() => null),
      ]);
      if (token !== S.epoch) return;
      // Apply user preferences to the app
      if (profile) {
        applyUserPreferences(profile);
      }
      Object.assign(S, {
        data: d,
        store,
        profile: profile || {},
        view: "app",
        page: "overview",
        loaded: true,
      });
      if (window.location.hash.startsWith("#login") || window.location.hash.startsWith("#signup") || window.location.hash.startsWith("#magic") || window.location.hash.startsWith("#reset") || window.location.hash.startsWith("#forgot")) {
        history.replaceState(null, "", window.location.pathname);
      }
      render();
    } catch (e) {
      setAuthMode("signin", "Signed in, but data could not load: " + e.message, "error", false);
      throw e;
    }
  }
  function applyUserPreferences(profile) {
    if (!profile) return;
    // Apply theme preference
    if (profile.theme === "dark") {
      document.documentElement.style.colorScheme = "dark";
    } else if (profile.theme === "light") {
      document.documentElement.style.colorScheme = "light";
    }
    // Store preferences in app state for UI customization
    if (profile.sort_preference) S.sort = profile.sort_preference;
    if (profile.default_platform) S.platform = profile.default_platform;
  }
  function clearSession() {
    ++S.epoch;
    ytKey = "";
    Object.assign(S, {
      view: "home",
      user: null,
      mode: "local",
      sample: false,
      loaded: false,
      data: empty(),
      store: new LocalStore(),
    });
    if (dialog.open) closeDialog();
    if (window.location.hash.startsWith("#login") || window.location.hash.startsWith("#signup") || window.location.hash.startsWith("#magic") || window.location.hash.startsWith("#reset") || window.location.hash.startsWith("#forgot")) {
      history.replaceState(null, "", window.location.pathname);
    }
    render();
  }
  async function exit() {
    if (S.busy) return;
    S.busy = true;
    try {
      if (S.mode === "cloud") {
        const { error } = await S.client.auth.signOut();
        if (error) throw error;
      }
      clearSession();
    } catch (e) {
      notify("Could not sign out: " + e.message, true);
    } finally {
      S.busy = false;
    }
  }
  async function youtube(apiKey) {
    ytKey = apiKey.trim();
    if (!ytKey) throw Error("Paste a restricted YouTube API key.");
    const list = S.data.accounts.filter((a) => a.platform === "youtube");
    if (!list.length) throw Error("Add a YouTube account first.");
    let count = 0,
      failures = [];
    for (const a of list) {
      try {
        const u = new URL(a.url);
        if (
          !["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
            u.hostname,
          )
        )
          throw Error("Use a youtube.com URL.");
        const m = u.pathname.match(/^\/(?:channel\/(UC[\w-]+)|(@[^/]+))\/?$/);
        if (!m)
          throw Error("Use an @handle or /channel/ ID, not /c/ or /user/.");
        const params = new URLSearchParams({
          part: "statistics",
          key: ytKey,
          ...(m[1] ? { id: m[1] } : { forHandle: m[2] }),
        });
        const response = await fetch(
          "https:" + "//www.googleapis.com/youtube/v3/channels?" + params,
          { signal: AbortSignal.timeout(12000) },
        );
        const data = await response.json();
        if (!response.ok || data.error)
          throw Error(data.error?.message || "Request failed");
        if (!data.items?.length) throw Error("Channel not found");
        await save(
          "account",
          { ...a, views: Number(data.items[0].statistics.viewCount), subscribers: Number(data.items[0].statistics.subscriberCount), videos: Number(data.items[0].statistics.videoCount) },
          a.id,
        );
        count++;
      } catch (e) {
        failures.push(a.name + ": " + e.message);
      }
    }
    if (failures.length)
      throw Error(
        count + "/" + list.length + " channels updated. " + failures.join(" "),
      );
    notify(count + " YouTube channel(s) updated.");
  }
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!["record-form", "auth-form", "youtube-form"].includes(form.id)) return;
    e.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    await busy(form, async () => {
      if (form.id === "record-form") {
        await save(form.dataset.kind, values, form.dataset.id || null);
        closeDialog();
        render();
        notify("Saved successfully.");
      }
      if (form.id === "youtube-form") await youtube(values.key);
      if (form.id === "auth-form") {
        const mode = form.dataset.mode || "signin";
        const sb = await client();

        if (mode === "signin") {
          const response = await sb.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          });
          if (response.error) throw response.error;
          if (!response.data.session) {
            setAuthMode("signin", "Check your email to confirm your account, then sign in.", "info", true);
            return;
          }
          await enterCloud(response.data.session);
        } else if (mode === "signup") {
          if (values.password !== values.confirm)
            throw Error("Passwords do not match.");
          if (values.password.length < 12)
            throw Error("Password must be at least 12 characters.");

          const response = await sb.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: { full_name: values.name },
              emailRedirectTo: getRedirectUrl("#login"),
            },
          });
          if (response.error) throw response.error;
          if (!response.data.session) {
            setAuthMode(
              "signin",
              "Account created! Check your email to confirm your account, then sign in.",
              "success",
              true
            );
            return;
          }
          if (response.data.session?.user) {
            try {
              const store = new CloudStore(S.client, response.data.session.user);
              await store.saveProfile({
                display_name: values.name || "",
                theme: "auto",
                notifications_enabled: true,
                default_platform: "youtube",
                sort_preference: "newest",
                bio: "",
              });
            } catch (e) {
              console.warn("Could not create user profile:", e);
            }
          }
          await enterCloud(response.data.session);
        } else if (mode === "magiclink") {
          const email = (values.email || "").trim();
          if (!email) throw Error("Please enter your email address.");
          const { error } = await sb.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: getRedirectUrl("#login"),
            },
          });
          if (error) throw error;
          setAuthMode(
            "magiclink",
            "Magic link sent! Check your inbox and click the link to sign in instantly.",
            "success",
            true
          );
        } else if (mode === "forgot") {
          const email = (values.email || "").trim();
          if (!email) throw Error("Please enter your account email address.");
          const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: getRedirectUrl("#reset"),
          });
          if (error) throw error;
          setAuthMode(
            "forgot",
            "Password reset link sent! Check your inbox and follow the link to choose a new password.",
            "success",
            true
          );
        } else if (mode === "reset") {
          if (values.password !== values.confirm)
            throw Error("Passwords do not match.");
          if (values.password.length < 12)
            throw Error("Password must be at least 12 characters.");

          const { data, error } = await sb.auth.updateUser({
            password: values.password,
          });
          if (error) throw error;
          notify("Password updated successfully!");
          const { data: sessionData } = await sb.auth.getSession();
          if (sessionData?.session) {
            await enterCloud(sessionData.session);
          } else {
            setAuthMode(
              "signin",
              "Password updated successfully! You can now sign in with your new password.",
              "success",
              true
            );
          }
        }
      }
    });
  });
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.dataset.page) {
      setPage(b.dataset.page);
      return;
    }
    if (b.dataset.editAccount) {
      edit("account", b.dataset.editAccount);
      return;
    }
    if (b.dataset.editClip) {
      edit("clip", b.dataset.editClip);
      return;
    }
    if (b.dataset.stage) {
      edit("clip", null, b.dataset.stage);
      return;
    }
    if (b.dataset.authMode) {
      setAuthMode(b.dataset.authMode, "", "error", true);
      return;
    }
    if (b.dataset.delete) {
      const kind = b.dataset.delete,
        id = b.dataset.id;
      confirm(
        "Delete " + kind + "?",
        "This cannot be undone. " +
          (kind === "account" ? "Linked clips will be kept and unlinked." : ""),
        "Delete " + kind,
        () => remove(kind, id),
      );
      return;
    }
    const action = b.dataset.action;
    try {
      if (action === "demo") await local(true);
      if (action === "local") await local();
      if (action === "home") {
        if (S.user) {
          S.view = "app";
          setPage("overview");
        } else {
          S.view = "home";
          if (window.location.hash.startsWith("#login") || window.location.hash.startsWith("#signup") || window.location.hash.startsWith("#magic") || window.location.hash.startsWith("#forgot") || window.location.hash.startsWith("#reset")) {
            history.replaceState(null, "", window.location.pathname);
          }
          render();
        }
      }
      if (action === "login") {
        if (S.user) await enterCloud({ user: S.user });
        else {
          setAuthMode("signin", "", "error", true);
        }
      }
      if (action === "exit") await exit();
      if (action === "account") edit("account");
      if (action === "clip")
        edit("clip", null, S.page === "analytics" ? "posted" : "queued");
      if (action === "close-dialog" && !S.busy) closeDialog();
      if (action === "toggle-nav") {
        const open = document.body.classList.toggle("nav-open");
        b.setAttribute("aria-expanded", String(open));
        if (open) $(".sidebar .nav-item").focus();
      }
      if (action === "close-nav") {
        document.body.classList.remove("nav-open");
        $('[data-action="toggle-nav"]').focus();
      }
      if (action === "reset-filters") {
        S.query = "";
        S.platform = "all";
        S.niche = "all";
        S.sort = "newest";
        refresh();
      }
      if (action === "export") download();
      if (action === "raw") download(true);
      if (action === "import") $("#backup-file").click();
      if (action === "reset-local")
        confirm(
          "Reset local workspace?",
          "Export a backup first. This does not change cloud data or your original version’s storage.",
          "Reset local data",
          async () => {
            const d = empty();
            await S.store.commit(d);
            S.data = d;
            S.loaded = true;
            closeDialog();
            render();
            notify("Local workspace reset.");
          },
        );
      if (b.id === "save-profile-btn" && S.mode === "cloud" && S.store) {
        const form = b.closest("section");
        if (!form) return;
        const profile = {
          display_name: form.querySelector('input[id="display_name"]')?.value || "",
          bio: form.querySelector('input[id="bio"]')?.value || "",
          avatar_url: form.querySelector('input[id="avatar_url"]')?.value || "",
          theme: form.querySelector("select#profile-theme")?.value || "auto",
          notifications_enabled: form.querySelector("#notifications")?.checked || true,
        };
        await busy(b, async () => {
          const updated = await S.store.saveProfile(profile);
          Object.assign(S, { profile: updated });
          applyUserPreferences(updated);
          notify("Profile saved successfully.");
        });
      }
    } catch (err) {
      notify(err.message, true);
    }
  });
  root.addEventListener("input", (e) => {
    if (e.target.id === "search") {
      S.query = e.target.value;
      $("#results").innerHTML =
        S.page === "accounts" ? accountResults() : boardResults();
    }
  });
  document.addEventListener("change", async (e) => {
    const t = e.target;
    if (t.name === "status" && $("#performance-fields"))
      $("#performance-fields").hidden = t.value !== "posted";
    if (t.id.startsWith("filter-")) {
      S[t.id.slice(7)] = t.value;
      $("#results").innerHTML =
        S.page === "accounts" ? accountResults() : boardResults();
    }
    if (t.dataset.move) await move(t.dataset.move, t.value);
    if (t.id === "theme") {
      document.documentElement.dataset.theme = t.value;
      try {
        localStorage.setItem("clipvault.theme", t.value);
      } catch {
        notify("Theme applies to this session only.");
      }
    }
    if (t.id === "backup-file" && t.files[0]) {
      try {
        if (t.files[0].size > 5 * 1024 * 1024)
          throw Error("Backup must be smaller than 5 MB.");
        const d = C.backup(JSON.parse(await t.files[0].text()));
        confirm(
          "Replace local data?",
          `Import ${d.accounts.length} accounts and ${d.clips.length} clips? This replaces the current local workspace. Export a backup first.`,
          "Replace local data",
          async () => {
            await S.store.commit(d);
            S.data = d;
            S.loaded = true;
            closeDialog();
            render();
            notify("Backup imported.");
          },
        );
      } catch (err) {
        notify(err.message, true);
      }
      t.value = "";
    }
  });
  root.addEventListener("dragstart", (e) => {
    const c = e.target.closest("[data-clip-id]");
    if (!c || S.busy) return;
    e.dataTransfer.setData("text/plain", c.dataset.clipId);
    e.dataTransfer.effectAllowed = "move";
    c.classList.add("dragging");
  });
  root.addEventListener("dragover", (e) => {
    const col = e.target.closest("[data-drop]");
    if (col) {
      e.preventDefault();
      col.classList.add("drag-over");
    }
  });
  root.addEventListener("dragleave", (e) => {
    const col = e.target.closest("[data-drop]");
    if (col && !col.contains(e.relatedTarget))
      col.classList.remove("drag-over");
  });
  root.addEventListener("drop", (e) => {
    const col = e.target.closest("[data-drop]");
    if (col) {
      e.preventDefault();
      col.classList.remove("drag-over");
      move(e.dataTransfer.getData("text/plain"), col.dataset.drop);
    }
  });
  root.addEventListener("dragend", () =>
    document
      .querySelectorAll(".dragging,.drag-over")
      .forEach((el) => el.classList.remove("dragging", "drag-over")),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.body.classList.remove("nav-open");
    if (
      e.key === "/" &&
      !dialog.open &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement.tagName,
      ) &&
      $("#search")
    ) {
      e.preventDefault();
      $("#search").focus();
    }
  });
  async function init() {
    try {
      const theme = localStorage.getItem("clipvault.theme") || "system";
      document.documentElement.dataset.theme = [
        "system",
        "light",
        "dark",
      ].includes(theme)
        ? theme
        : "system";
    } catch {
      document.documentElement.dataset.theme = "system";
    }

    window.addEventListener("hashchange", () => {
      handleRoute();
    });

    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const isAuthRedirect =
      hash.includes("access_token=") ||
      hash.includes("type=recovery") ||
      hash.includes("error=") ||
      search.includes("code=") ||
      search.includes("error=");
    const isAuthRoute =
      hash.startsWith("#login") ||
      hash.startsWith("#signin") ||
      hash.startsWith("#signup") ||
      hash.startsWith("#magic") ||
      hash.startsWith("#forgot") ||
      hash.startsWith("#reset") ||
      search.includes("auth=");

    if (window.CLIPVAULT_CONFIG?.supabaseUrl && (isAuthRedirect || isAuthRoute)) {
      try {
        const sb = await client();
        if (isAuthRedirect) {
          const { data, error } = await sb.auth.getSession();
          if (error) {
            setAuthMode("signin", error.message, "error", false);
            return;
          }
          if (hash.includes("type=recovery") || search.includes("type=recovery")) {
            setAuthMode("reset", "Recovery link verified. Please enter your new password below.", "info", false);
            return;
          }
          if (data?.session && S.authMode !== "reset") {
            await enterCloud(data.session);
            return;
          }
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
      }
    }

    handleRoute();
    if (S.view !== "auth" && S.view !== "app") {
      render();
    }
  }
  init();
})();
