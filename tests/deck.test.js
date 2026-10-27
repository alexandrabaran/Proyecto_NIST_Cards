import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseRandomRecord,
  createDefinitionPreview,
  getHttpsUrl,
  getUniqueSupportingDetails,
  paginateRecords,
  searchRecords,
} from "../assets/js/deck.js";

const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];

test("chooses a random record from the whole set on first selection", () => {
  assert.equal(chooseRandomRecord(cards, null, () => 0).id, "a");
  assert.equal(chooseRandomRecord(cards, null, () => 0.99).id, "c");
});

test("never immediately repeats the current record when another exists", () => {
  assert.equal(chooseRandomRecord(cards, "a", () => 0).id, "b");
  assert.equal(chooseRandomRecord(cards, "b", () => 0.99).id, "c");
});

test("handles empty and single-card sets", () => {
  assert.equal(chooseRandomRecord([]), null);
  assert.equal(chooseRandomRecord([{ id: "only" }], "only", () => 0).id, "only");
});

test("accepts valid HTTPS URLs without restricting the hostname", () => {
  assert.equal(getHttpsUrl("https://csrc.nist.gov/glossary").hostname, "csrc.nist.gov");
  assert.equal(getHttpsUrl("https://example.com/resource").hostname, "example.com");
  assert.equal(getHttpsUrl("http://csrc.nist.gov/"), null);
  assert.equal(getHttpsUrl("https://user@example.com/"), null);
  assert.equal(getHttpsUrl("not a URL"), null);
});

test("searches terms case-insensitively and prefers exact term matches", () => {
  const records = [
    { id: "partial", term: "cybersecurity framework", abbrSyn: "" },
    { id: "exact", term: "framework", abbrSyn: "" },
    { id: "synonym", term: "other entry", abbrSyn: "framework" },
  ];

  const result = searchRecords(records, " FRAMEWORK ");
  assert.deepEqual(result.records.map(({ id }) => id), ["exact"]);
  assert.equal(result.matchType, "exact-term");
});

test("searches exact synonyms when no term matches exactly", () => {
  const records = [
    { id: "partial", term: "framework guide", abbrSyn: "" },
    { id: "synonym", term: "other entry", abbrSyn: "framework" },
  ];

  const result = searchRecords(records, "framework");
  assert.deepEqual(result.records.map(({ id }) => id), ["synonym"]);
  assert.equal(result.matchType, "exact-synonym");
});

test("searches partial matches in terms and synonyms without merging duplicates", () => {
  const records = [
    { id: "first", term: "data integrity", abbrSyn: "" },
    { id: "second", term: "data integrity", abbrSyn: "assurance" },
    { id: "third", term: "other", abbrSyn: "data assurance" },
  ];

  const result = searchRecords(records, "data");
  assert.equal(result.totalCount, 3);
  assert.deepEqual(result.records.map(({ id }) => id), ["first", "second", "third"]);
});

test("limits visible results while reporting total matches", () => {
  const records = Array.from({ length: 5 }, (_, index) => ({
    id: String(index),
    term: `security term ${index}`,
    abbrSyn: "",
  }));

  const result = searchRecords(records, "security", 2);
  assert.equal(result.totalCount, 5);
  assert.equal(result.records.length, 2);
});

test("does not truncate exact matches for duplicated terms", () => {
  const records = Array.from({ length: 44 }, (_, index) => ({
    id: String(index),
    term: "assessment",
    abbrSyn: "",
    definitions: `definition ${index}`,
  }));

  const result = searchRecords(records, "assessment");
  assert.equal(result.totalCount, 44);
  assert.equal(result.records.length, 44);
  assert.equal(result.matchType, "exact-term");
  assert.deepEqual(result.records.map(({ definitions }) => definitions), Array.from(
    { length: 44 },
    (_, index) => `definition ${index}`,
  ));
});

test("returns no results for an empty query", () => {
  assert.deepEqual(searchRecords(cards, "   "), { records: [], totalCount: 0, matchType: "none" });
});

test("identifies duplicate exact terms for displaying all definitions together", () => {
  const records = [
    { id: "one", term: "assessment", abbrSyn: "", definitions: "first definition" },
    { id: "two", term: "assessment", abbrSyn: "", definitions: "second definition" },
  ];

  const result = searchRecords(records, "assessment");
  assert.equal(result.matchType, "exact-term");
  assert.deepEqual(result.records.map(({ definitions }) => definitions), [
    "first definition",
    "second definition",
  ]);
  assert.equal(result.matchType, "exact-term");
});

test("search scope remains limited to terms and synonyms, not definitions", () => {
  const records = [{
    id: "only",
    term: "network control",
    abbrSyn: "",
    definitions: "A distinctive phrase only present in the definition.",
  }];

  assert.equal(searchRecords(records, "distinctive phrase").totalCount, 0);
});

test("creates a short definition preview without changing the source text", () => {
  const definition = "A definition with multiple\nlines and enough words to show a shortened preview while preserving the original.";
  const preview = createDefinitionPreview(definition, 45);

  assert.ok(preview.length <= 46);
  assert.ok(preview.endsWith("…"));
  assert.ok(definition.includes("\n"));
  assert.equal(createDefinitionPreview("  Short definition.  "), "Short definition.");
  assert.equal(createDefinitionPreview("<img src=x onerror=alert(1)>"), "<img src=x onerror=alert(1)>");
});

test("deduplicates repeated supporting details without changing definitions or record order", () => {
  const records = [
    {
      term: "assessment",
      abbrSyn: "Security control assessment",
      link: "https://csrc.nist.gov/glossary/term/assessment",
      definitions: "first definition",
    },
    {
      term: "assessment",
      abbrSyn: "security control assessment ",
      link: "https://csrc.nist.gov/glossary/term/assessment",
      definitions: "second definition",
    },
    {
      term: "assessment",
      abbrSyn: "Risk assessment",
      link: "https://csrc.nist.gov/glossary/term/assessment?source=other",
      definitions: "third definition",
    },
  ];

  assert.deepEqual(getUniqueSupportingDetails(records), {
    synonyms: ["Security control assessment", "Risk assessment"],
    sources: [
      { record: records[0], url: "https://csrc.nist.gov/glossary/term/assessment" },
      { record: records[2], url: "https://csrc.nist.gov/glossary/term/assessment?source=other" },
    ],
  });
  assert.deepEqual(records.map(({ definitions }) => definitions), [
    "first definition",
    "second definition",
    "third definition",
  ]);
});

test("omits invalid and non-HTTPS source links", () => {
  const records = [
    { term: "one", abbrSyn: "", link: "not a URL", definitions: "" },
    { term: "two", abbrSyn: "", link: "http://csrc.nist.gov", definitions: "" },
    { term: "three", abbrSyn: "", link: "https://example.com/glossary", definitions: "" },
  ];

  assert.deepEqual(getUniqueSupportingDetails(records).sources, [
    { record: records[2], url: "https://example.com/glossary" },
  ]);
});

test("paginates every definition in groups of at most four", () => {
  const definitions = Array.from({ length: 44 }, (_, index) => ({
    definitions: `definition ${index + 1}`,
  }));

  const firstPage = paginateRecords(definitions, 0);
  const lastPage = paginateRecords(definitions, 10);
  assert.equal(firstPage.pageCount, 11);
  assert.deepEqual(firstPage.records.map(({ definitions: text }) => text), [
    "definition 1",
    "definition 2",
    "definition 3",
    "definition 4",
  ]);
  assert.deepEqual(lastPage.records.map(({ definitions: text }) => text), ["definition 41", "definition 42", "definition 43", "definition 44"]);
  assert.equal(lastPage.startIndex, 40);
  assert.deepEqual(paginateRecords(definitions, 50), lastPage);
  assert.deepEqual(paginateRecords([], 0), {
    records: [],
    pageIndex: 0,
    pageCount: 0,
    startIndex: 0,
  });
});
