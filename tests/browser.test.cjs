const { chromium } = require("playwright"),
  { pathToFileURL } = require("node:url"),
  path = require("node:path"),
  fs = require("node:fs/promises"),
  assert = require("node:assert/strict");
(async () => {
  const out = path.resolve(process.env.QA_DIR || "test-results");
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || undefined,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(5000);
  const errors = [],
    checks = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const ok = (n) => {
    checks.push(n);
    console.log("PASS " + n);
  };
  const click = async (s) => page.locator(s).first().click();
  const shot = async (n) =>
    page.screenshot({ path: path.join(out, n + ".png"), fullPage: true });
  const nav = async (n) => {
    if (await page.locator('[data-action="toggle-nav"]').isVisible())
      await click('[data-action="toggle-nav"]');
    await click('.sidebar [data-page="' + n + '"]');
  };
  try {
    await page.goto(
      pathToFileURL(path.resolve(__dirname, "../index.html")).href,
    );
    await shot("home");
    ok("offline homepage");
    await click('[data-action="demo"]');
    assert.equal(await page.locator(".next-item").count(), 4);
    assert.equal(
      await page.evaluate(() => localStorage.getItem(ClipVaultStorage.key)),
      null,
    );
    ok("isolated demo data");
    await shot("overview");
    await nav("accounts");
    assert.equal(await page.locator(".account-card").count(), 4);
    await shot("accounts");
    await page.locator("#search").fill("not-found");
    assert.equal(await page.locator(".account-card").count(), 0);
    await shot("empty");
    await click('[data-action="reset-filters"]');
    assert.equal(await page.locator(".account-card").count(), 4);
    ok("search and reset");
    await nav("board");
    await shot("board");
    const card = page.locator('[data-drop="queued"] .clip-card').first(),
      id = await card.getAttribute("data-clip-id");
    await card.locator("select").selectOption("cutting");
    await page.waitForSelector(
      '[data-drop="cutting"] [data-clip-id="' + id + '"]',
    );
    ok("status menu moves clips");
    const ready = page.locator('[data-drop="ready"] .clip-card').first(),
      rid = await ready.getAttribute("data-clip-id");
    await ready.dragTo(page.locator('[data-drop="posted"]'), {
      sourcePosition: { x: 8, y: 8 },
      targetPosition: { x: 15, y: 15 },
    });
    await page.waitForSelector(
      '[data-drop="posted"] [data-clip-id="' + rid + '"]',
    );
    ok("pointer drag and drop");
    await nav("analytics");
    await shot("analytics");
    ok("manual analytics rendered");
    await nav("settings");
    await page.locator("#theme").selectOption("dark");
    await shot("settings-dark");
    await page.locator("#theme").selectOption("light");
    await click('[data-action="exit"]');
    await click('[data-action="local"]');
    assert.equal(await page.locator(".next-item").count(), 0);
    ok("blank workspace separate from demo");
    await click('[data-action="account"]');
    await shot("account-dialog");
    await page.locator('[name="name"]').fill("<img src=x onerror=alert(1)>");
    await page.locator('[name="url"]').fill("javascript:alert(1)");
    await click('#record-form [type="submit"]');
    assert.ok(
      (await page.locator("dialog .form-error").textContent()).includes("http"),
    );
    ok("unsafe links rejected");
    await page.locator('[name="url"]').fill("https://youtube.com/@test");
    await click('#record-form [type="submit"]');
    await page.waitForSelector("dialog[open]", { state: "hidden" });
    await nav("accounts");
    assert.equal(await page.locator(".account-card img").count(), 0);
    ok("user HTML escaped");
    await click("[data-edit-account]");
    await page.locator('[name="name"]').fill("My channel");
    await click('#record-form [type="submit"]');
    await page.waitForSelector("dialog[open]", { state: "hidden" });
    ok("account edit");
    await click('[data-action="account"]');
    await page.locator('[name="name"]').fill("Should fail");
    await page.locator('[name="url"]').fill("https://example.com");
    await page.evaluate(() => {
      window.restoreSet = Storage.prototype.setItem;
      Storage.prototype.setItem = function () {
        throw Error("Quota");
      };
    });
    await click('#record-form [type="submit"]');
    assert.ok(
      (await page.locator("dialog .form-error").textContent()).includes(
        "Nothing was saved",
      ),
    );
    assert.equal(await page.locator(".account-card").count(), 1);
    await page.evaluate(() => (Storage.prototype.setItem = window.restoreSet));
    await page.keyboard.press("Escape");
    ok("failed save leaves form open and state unchanged");
    await nav("board");
    await click('[data-action="clip"]');
    await page.locator('[name="title"]').fill("First real clip");
    await page
      .locator('[name="account_id"]')
      .selectOption({ label: "My channel" });
    await page.locator('[name="status"]').selectOption("posted");
    await page.locator('[name="views"]').fill("100");
    await page.locator('[name="views_24h"]').fill("101");
    await click('#record-form [type="submit"]');
    assert.ok(
      (await page.locator(".form-error").textContent()).includes(
        "cannot exceed",
      ),
    );
    await page.locator('[name="views_24h"]').fill("20");
    await shot("clip-dialog");
    await click('#record-form [type="submit"]');
    await page.waitForSelector("dialog[open]", { state: "hidden" });
    ok("posted clip validation");
    await page.reload();
    await click('[data-action="local"]');
    await nav("board");
    assert.equal(await page.locator(".clip-card").count(), 1);
    ok("local persistence after reload");
    await nav("accounts");
    await click("[data-edit-account]");
    await click("[data-delete]");
    await shot("confirmation");
    await click("#confirm");
    await page.waitForSelector("dialog[open]", { state: "hidden" });
    await nav("board");
    assert.ok(await page.getByText("No account linked").isVisible());
    ok("delete account preserves clips");
    await nav("settings");
    const dp = page.waitForEvent("download");
    await click('[data-action="export"]');
    const download = await dp;
    const file = path.join(out, "backup.json");
    await download.saveAs(file);
    assert.equal(JSON.parse(await fs.readFile(file)).clips.length, 1);
    ok("JSON export");
    await page
      .locator("#backup-file")
      .setInputFiles({
        name: "bad.json",
        mimeType: "application/json",
        buffer: Buffer.from("{}"),
      });
    assert.ok(
      (await page.locator("#toast").textContent()).includes("ClipVault v1"),
    );
    ok("invalid import rejected");
    await click('[data-action="reset-local"]');
    await click("#confirm");
    await page.waitForSelector("dialog[open]", { state: "hidden" });
    await page.locator("#backup-file").setInputFiles(file);
    await page.waitForSelector("#confirm");
    await click("#confirm");
    await page.waitForSelector("dialog[open]", { state: "hidden" });
    await nav("board");
    assert.equal(await page.locator(".clip-card").count(), 1);
    ok("confirmed backup restore");
    await click('[data-action="exit"]');
    await click('[data-action="local"]');
    await nav("settings");
    await click('[data-action="login"]');
    await shot("auth");
    assert.ok((await page.locator(".auth-card").textContent()).includes("cloud workspace is ready"));
    ok("configured cloud sign-in is reachable");
    await page.evaluate(() => {
      window.CLIPVAULT_CONFIG = {
        supabaseUrl: "https://mock.supabase.co",
        supabasePublishableKey: "sb_publishable_mock",
      };
      window.supabase = {
        createClient: () => ({
          auth: {
            onAuthStateChange() {},
            signUp: async () => ({ data: { session: null } }),
            signInWithPassword: async () => ({
              data: {
                session: {
                  user: {
                    id: "11111111-1111-4111-a111-111111111111",
                    email: "test@example.com",
                  },
                },
              },
            }),
            signOut: async () => ({}),
          },
          from: () => ({
            select() {
              return this;
            },
            eq() {
              return this;
            },
            order() {
              return this;
            },
            range: async () => ({
              error: { message: "Mock database unavailable" },
            }),
          }),
        }),
      };
    });
    await click('[data-auth-mode="signup"]');
    await page.locator('[name="name"]').fill("Test");
    await page.locator('[name="email"]').fill("test@example.com");
    await page.locator('[name="password"]').fill("twelve-characters");
    await page.locator('[name="confirm"]').fill("twelve-characters");
    await click('#auth-form [type="submit"]');
    await page.waitForSelector('[data-mode="signin"]');
    assert.ok(
      (await page.locator(".form-error").textContent()).includes(
        "Check your email",
      ),
    );
    ok("signup confirmation message retained (mock)");
    await page.locator('[name="email"]').fill("test@example.com");
    await page.locator('[name="password"]').fill("password");
    await click('#auth-form [type="submit"]');
    await page.waitForTimeout(100);
    assert.ok(
      (await page.locator(".form-error").textContent()).includes(
        "Mock database unavailable",
      ),
    );
    assert.equal(await page.locator(".app").count(), 0);
    ok("cloud load failure prevents stale data display (mock)");
    await page.reload();
    await page.setViewportSize({ width: 390, height: 844 });
    await shot("home-mobile");
    await click('[data-action="demo"]');
    await shot("overview-mobile");
    for (const route of ["accounts", "board", "analytics", "settings"]) {
      await nav(route);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    ok("all routes fit 390px viewport");
    await nav("board");
    await shot("board-mobile");
    await click('[data-action="clip"]');
    await shot("dialog-mobile");
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
    ok("no uncaught browser exceptions");
    await fs.writeFile(
      path.join(out, "results.json"),
      JSON.stringify({ passed: checks.length, checks, errors }, null, 2),
    );
    console.log("DONE " + checks.length + " checks passed");
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
