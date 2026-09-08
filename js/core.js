/* Pure domain logic: shared by browser and Node tests. */
(function (root) {
  "use strict";
  const platforms = {
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    podcast: "Podcast",
  };
  const stages = {
    queued: "Queued",
    cutting: "Cutting",
    ready: "Ready",
    posted: "Posted",
  };
  const niches = [
    "music",
    "streaming",
    "gaming",
    "lifestyle",
    "sports",
    "comedy",
    "education",
    "podcast",
    "other",
  ];
  const priorities = ["high", "medium", "low"];
  const uuid = () => crypto.randomUUID();
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function text(v, name, max = 200, required = false) {
    const t = String(v ?? "").trim();
    if (required && !t) throw Error(name + " is required.");
    if (t.length > max)
      throw Error(name + " is too long (maximum " + max + ").");
    return t;
  }
  function number(v) {
    const n = Number(v == null || v === "" ? 0 : v);
    if (!Number.isSafeInteger(n) || n < 0)
      throw Error("Views must be non-negative whole numbers.");
    return n;
  }
  function option(v, options, defaultValue) {
    const r = v || defaultValue;
    if (!options.includes(r)) throw Error("Invalid option: " + r);
    return r;
  }
  function url(v, required = false) {
    let s = text(v, "URL", 2048, required);
    if (!s) return "";
    if (!/^[a-z][a-z\d+.-]*:/i.test(s)) s = "https:" + "//" + s;
    let u;
    try {
      u = new URL(s);
    } catch {
      throw Error("Enter a valid website URL.");
    }
    if (
      !["http:", "https:"].includes(u.protocol) ||
      u.username ||
      u.password ||
      !u.hostname.includes(".")
    )
      throw Error("Use an http(s) URL without embedded credentials.");
    return u.href;
  }
  function account(v) {
    return {
      name: text(v.name, "Account name", 100, true),
      url: url(v.url, true),
      platform: option(v.platform, Object.keys(platforms), "youtube"),
      niche: option(v.niche, niches, "other"),
      status: option(v.status, ["active", "paused", "review"], "active"),
      priority: option(v.priority, priorities, "medium"),
      handle: text(v.handle, "Handle", 100),
      email: text(v.email, "Contact email", 254),
      phone: text(v.phone, "Phone", 50),
      notes: text(v.notes, "Notes", 2000),
      views: number(v.views),
      subscribers: number(v.subscribers),
      videos: number(v.videos),
    };
  }
  function clip(v, accounts) {
    const account_id = v.account_id || null;
    if (account_id && !accounts.some((a) => a.id === account_id))
      throw Error("Select an account in this workspace.");
    const r = {
      title: text(v.title, "Clip title", 180, true),
      account_id,
      source_url: url(v.source_url),
      status: option(v.status, Object.keys(stages), "queued"),
      priority: option(v.priority, priorities, "medium"),
      views: number(v.views),
      views_24h: number(v.views_24h),
      geo: text(v.geo, "Location", 100),
      age_group: option(
        v.age_group,
        ["", "13–17", "18–24", "25–34", "35–44", "45+"],
        "",
      ),
    };
    if (r.views_24h > r.views)
      throw Error("24-hour views cannot exceed total clip views.");
    return r;
  }
  function backup(v) {
    if (
      !v ||
      v.version !== 1 ||
      !Array.isArray(v.accounts) ||
      !Array.isArray(v.clips)
    )
      throw Error("Choose a ClipVault v1 JSON backup.");
    if (v.accounts.length > 2000 || v.clips.length > 10000)
      throw Error("Workspace exceeds the supported record limit.");
    const ids = new Set();
    const identity = (r) => {
      if (
        !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
          r.id,
        ) ||
        ids.has(r.id)
      )
        throw Error("Invalid or duplicate record IDs.");
      ids.add(r.id);
      if (!r.created_at || !Number.isFinite(Date.parse(r.created_at)))
        throw Error("Invalid record date.");
      return { id: r.id, created_at: new Date(r.created_at).toISOString() };
    };
    const accounts = v.accounts.map((a) => ({ ...identity(a), ...account(a) }));
    return {
      version: 1,
      accounts,
      clips: v.clips.map((c) => ({ ...identity(c), ...clip(c, accounts) })),
    };
  }
  function metrics(d) {
    const posted = d.clips.filter((c) => c.status === "posted");
    return {
      active: d.accounts.filter((a) => a.status === "active").length,
      progress: d.clips.length - posted.length,
      posted: posted.length,
      channelViews: d.accounts.reduce((s, a) => s + a.views, 0),
      clipViews: posted.reduce((s, c) => s + c.views, 0),
      recorded24h: posted.reduce((s, c) => s + c.views_24h, 0),
    };
  }
  function demo() {
    const ago = (n) => new Date(Date.now() - n * 86400000).toISOString();
    const rows = [
      ["The Daily Frame", "youtube", "education", 284000],
      ["Off Script", "instagram", "podcast", 196000],
      ["Pixel Playground", "tiktok", "gaming", 87000],
      ["Slow Sunday", "facebook", "lifestyle", 42000],
    ];
    const accounts = rows.map(([name, platform, niche, views], i) => ({
      ...account({
        name,
        platform,
        niche,
        views,
        status: i === 3 ? "paused" : "active",
        url: "https:" + "//" + platform + ".com/@sample",
        notes: "Fictional sample account. Replace with your own channel.",
      }),
      id: uuid(),
      created_at: ago(14 - i),
    }));
    const titles = [
      "The one habit that changed my mornings",
      "An honest conversation about starting over",
      "This final round was unreal",
      "A quieter kind of weekend",
      "Three editing tricks worth stealing",
      "The question nobody asks",
      "A 30-second desk reset",
      "The comeback nobody saw coming",
    ];
    const statuses = [
      "queued",
      "cutting",
      "ready",
      "queued",
      "posted",
      "posted",
      "cutting",
      "posted",
    ];
    const clips = titles.map((title, i) => ({
      ...clip(
        {
          title,
          account_id: accounts[i % 4].id,
          status: statuses[i],
          priority: i % 3 === 0 ? "high" : "medium",
          views:
            statuses[i] === "posted"
              ? [12400, 8600, 4500][i === 4 ? 0 : i === 5 ? 1 : 2]
              : 0,
          views_24h: statuses[i] === "posted" ? 840 : 0,
          geo: statuses[i] === "posted" ? "India" : "",
          age_group: statuses[i] === "posted" ? "18–24" : "",
        },
        accounts,
      ),
      id: uuid(),
      created_at: ago(7 - i),
    }));
    return { version: 1, accounts, clips };
  }
  const api = {
    platforms,
    stages,
    niches,
    priorities,
    uuid,
    esc,
    url,
    account,
    clip,
    backup,
    metrics,
    demo,
  };
  root.ClipVaultCore = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
