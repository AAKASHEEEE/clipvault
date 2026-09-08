const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  C = require("../js/core");
const a = {
  name: "Test",
  platform: "youtube",
  url: "youtube.com/@test",
  views: 10,
};
test("URL normalization", () =>
  assert.equal(C.url(a.url), "https://youtube.com/@test"));
test("unsafe protocols rejected", () => {
  for (const u of [
    "javascript:alert(1)",
    "data:text/html,x",
    "file:///etc/passwd",
  ])
    assert.throws(() => C.url(u));
});
test("embedded credentials rejected", () =>
  assert.throws(() => C.url("https://user:pass@example.com")));
test("secrets and ownership stripped", () => {
  const x = C.account({
    ...a,
    password: "secret",
    backup: "1234",
    user_id: "foreign",
  });
  assert.equal(x.password, undefined);
  assert.equal(x.backup, undefined);
  assert.equal(x.user_id, undefined);
});
test("HTML escaped", () =>
  assert.equal(C.esc('<img "x">'), "&lt;img &quot;x&quot;&gt;"));
test("negative fractional unsafe NaN views rejected", () => {
  for (const views of [-1, 0.2, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => C.account({ ...a, views }));
});
test("original niches supported", () => {
  for (const niche of ["sports", "comedy"])
    assert.equal(C.account({ ...a, niche }).niche, niche);
});
test("invalid platform rejected", () =>
  assert.throws(() => C.account({ ...a, platform: "bad" })));
test("cross-account references rejected", () =>
  assert.throws(() => C.clip({ title: "T", account_id: "foreign" }, [])));
test("24h views bounded", () =>
  assert.throws(() => C.clip({ title: "T", views: 10, views_24h: 11 }, [])));
test("metrics exclude unpublished and separate totals", () => {
  const m = C.metrics({
    accounts: [{ ...a, status: "active" }],
    clips: [
      { status: "posted", views: 100, views_24h: 20 },
      { status: "queued", views: 1000, views_24h: 0 },
    ],
  });
  assert.equal(m.clipViews, 100);
  assert.equal(m.channelViews, 10);
  assert.equal(m.recorded24h, 20);
});
test("demo validates", () => assert.equal(C.backup(C.demo()).clips.length, 8));
test("duplicate IDs rejected", () => {
  const d = C.demo();
  d.clips[0].id = d.accounts[0].id;
  assert.throws(() => C.backup(d));
});
test("bad backup date rejected", () => {
  const d = C.demo();
  d.clips[0].created_at = "not a date";
  assert.throws(() => C.backup(d));
});
test("backup strips old secrets", () => {
  const d = C.demo();
  d.accounts[0].password = "secret";
  assert.equal(C.backup(d).accounts[0].password, undefined);
});
test("length limits enforced", () =>
  assert.throws(() => C.account({ ...a, notes: "x".repeat(2001) })));
