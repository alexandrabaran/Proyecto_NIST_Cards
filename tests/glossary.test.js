import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { parseGlossary } from "../assets/js/csv.js";

test("full source CSV loads once into all unique records", async () => {
  const startedAt = performance.now();
  const source = await readFile(new URL("../data/nist_glossary.csv", import.meta.url), "utf8");
  const records = parseGlossary(source);
  const elapsedMs = performance.now() - startedAt;

  assert.equal(records.length, 15136);
  assert.equal(new Set(records.map((record) => record.id)).size, records.length);
  assert.ok(records.some((record) => record.definitions.includes("\n")));
  console.info(`CSV parse measurement: ${elapsedMs.toFixed(2)} ms for ${records.length} records.`);
});
