/*
 * Unit tests for the reason claim checker, the regenerate/template path and the avoid tiers.
 * No API calls: npm run test:claims
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMenuItems, type JsonMenu } from "../src/data/menuModel.js";
import { emptySelections } from "../src/data/preferenceChips.js";
import type { MenuItem } from "../src/types/menu.js";
import type { Selections } from "../src/types/preferences.js";
import { claimViolations, enforceClaims, type ReasonRec } from "../src/utils/claims.js";
import { dataReason, recommend } from "../src/utils/recommend.js";

const MENU = buildMenuItems(JSON.parse(readFileSync("src/data/bomber_burger_menu.json", "utf-8")) as JsonMenu);
const BY_ID = new Map(MENU.map((m) => [m.id, m]));
const item = (id: string): MenuItem => BY_ID.get(id)!;
const sel = (s: Partial<Selections>): Selections => ({ ...emptySelections, ...s });

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (error) {
    console.log(`  FAIL ${name}\n       ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

console.log("claimViolations");
await test("flags speed/portion/intensity words", () => {
  for (const word of ["cepat", "simpel", "praktis", "ringan", "porsi kecil", "kuat", "sederhana", "seimbang"]) {
    assert.deepEqual(claimViolations(`Pilihan yang ${word} untukmu.`, item("beef_jr")), [word], word);
  }
});
await test('"tidak terlalu kuat" is reported once, not again as "kuat"', () => {
  assert.deepEqual(claimViolations("Rasanya tidak terlalu kuat.", item("beef_jr")), ["tidak terlalu kuat"]);
});
await test("clean data-based reason passes", () => {
  assert.deepEqual(claimViolations("Burger beef dengan saus BBQ dan smoked beef, rasa manis smoky.", item("bbq_strike")), []);
});
await test("absence claim on unknown-ingredient item is flagged", () => {
  // Buffalo Chicken uses Bomber Secret Sauce (contents unknown)
  assert.equal(claimViolations("Menu ini tidak menyebutkan bawang di bahannya.", item("buffalo_chicken")).length, 1);
  assert.equal(claimViolations("Tanpa keju sama sekali.", item("chicken_fingers_3")).length, 1);
});
await test("absence claim on complete, proven-free item passes", () => {
  assert.deepEqual(claimViolations("Burger ini tidak mengandung keju.", item("bbq_strike")), []);
});
await test("absence claim contradicted by the data is flagged", () => {
  assert.equal(claimViolations("Tanpa keju, cocok buatmu.", item("beef_cheddar_cheeseburger")).length, 1);
});

console.log("enforceClaims");
const clean: ReasonRec[] = [
  { id: "bbq_strike", reason: "Rasa manis smoky BBQ." },
  { id: "beef_jr", reason: "Gurih dengan saus keju." },
  { id: "double_beef", reason: "Dua patty beef, porsi besar." },
];
const dirty: ReasonRec[] = [
  { id: "bbq_strike", reason: "Pilihan yang cepat dan simpel." },
  clean[1],
  { id: "double_beef", reason: "Rasa keju yang kuat." },
];

await test("clean answer: no regenerate", async () => {
  let calls = 0;
  const out = await enforceClaims(clean, BY_ID, async () => (calls++, clean));
  assert.equal(calls, 0);
  assert.deepEqual(out, { recs: clean, regenerated: false, templated: 0 });
});
await test("dirty answer: regenerates once with the offending phrases, clean retry is used", async () => {
  const seen: string[][] = [];
  const out = await enforceClaims(dirty, BY_ID, async (v) => (seen.push(v), clean));
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0], ["cepat", "simpel", "kuat"]);
  assert.deepEqual(out, { recs: clean, regenerated: true, templated: 0 });
});
await test("still dirty after retry: offending reasons replaced by data template", async () => {
  const out = await enforceClaims(dirty, BY_ID, async () => dirty);
  assert.equal(out.templated, 2);
  assert.equal(out.recs[0].reason, dataReason(item("bbq_strike")));
  assert.equal(out.recs[1].reason, clean[1].reason);
  assert.equal(out.recs[2].reason, dataReason(item("double_beef")));
});
await test("retry invalid (null) or throws: first answer is templated", async () => {
  for (const regenerate of [async () => null, async () => Promise.reject(new Error("timeout"))]) {
    const out = await enforceClaims(dirty, BY_ID, regenerate);
    assert.equal(out.templated, 2);
  }
});
await test("data templates never trigger the checker themselves", () => {
  for (const m of MENU) assert.deepEqual(claimViolations(dataReason(m), m), [], m.id);
});

console.log("avoid tiers (local fallback)");
await test("hindari keju: verified first, then unverified fill; nothing proven to contain keju", () => {
  const recs = recommend(sel({ hindari: ["keju"] }), "Aku nggak bisa makan keju, pengen yang smoky BBQ", MENU);
  assert.equal(recs.length, 3);
  assert.equal(recs[0].item.id, "bbq_strike");
  assert.equal(recs[0].unverified, undefined);
  assert.ok(recs.slice(1).every((r) => r.unverified === true));
  assert.ok(recs.every((r) => !r.item.avoidData.contains.includes("keju")));
});
await test("hindari keju: trays with dipping cheese never appear", () => {
  const recs = recommend(sel({ hindari: ["keju"] }), "", MENU);
  assert.ok(recs.every((r) => r.item.type !== "bomber_shake"));
});
await test("hindari bawang: nothing proven to contain bawang, unverified flagged", () => {
  const recs = recommend(sel({ hindari: ["bawang"] }), "", MENU);
  assert.equal(recs.length, 3);
  assert.ok(recs.every((r) => !r.item.avoidData.contains.includes("bawang")));
  assert.ok(recs.filter((r) => !r.item.avoidData.complete).every((r) => r.unverified === true));
});
await test("no avoid: nothing is unverified", () => {
  assert.ok(recommend(sel({}), "", MENU).every((r) => r.unverified === undefined));
});
await test('local reasons are data-based and pass the checker ("smoky" recognised)', () => {
  const recs = recommend(sel({}), "pengen yang smoky bbq manis", MENU);
  assert.ok(recs[0].reason.includes("smoky BBQ"), recs[0].reason);
  for (const r of recs) {
    assert.ok(!r.reason.includes("lolos semua filter"), r.reason);
    assert.deepEqual(claimViolations(r.reason, r.item), [], r.reason);
  }
});

console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`);
