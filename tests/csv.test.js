import test from "node:test";
import assert from "node:assert/strict";
import { assignRecordIds, parseCSV, parseGlossary } from "../assets/js/csv.js";

test("parseCSV preserves commas, escaped quotes, and multiline fields", () => {
  const source = 'term,link,abbrSyn,definitions\r\n"term, one",https://example.test,"say ""hello""","first line\nsecond line"\r\n';
  const rows = parseCSV(source);

  assert.deepEqual(rows, [
    ["term", "link", "abbrSyn", "definitions"],
    ["term, one", "https://example.test", 'say "hello"', "first line\nsecond line"],
  ]);
});

test("parseGlossary accepts a valid header in a different order", () => {
  const records = parseGlossary("definitions,term,link,abbrSyn\ndefinition,term,https://example.test,synonym\n");

  assert.equal(records[0].term, "term");
  assert.equal(records[0].definitions, "definition");
  assert.equal(records[0].abbrSyn, "synonym");
});

test("parseGlossary rejects missing columns and malformed records", () => {
  assert.throws(() => parseGlossary("term,link,definitions\nterm,url,definition\n"), /encabezado/);
  assert.throws(() => parseGlossary("term,link,abbrSyn,definitions\nterm,url,synonym\n"), /campos/);
  assert.throws(() => parseCSV('term,link,abbrSyn,definitions\nterm,url,synonym,"unfinished'), /termina antes de cerrar/);
});

test("identifiers are unique and deterministic for duplicate rows", () => {
  const row = { term: "same", link: "url", abbrSyn: "", definitions: "same definition" };
  const records = [row, row, { ...row, term: "another" }];
  const firstPass = assignRecordIds(records);
  const secondPass = assignRecordIds(records);

  assert.equal(new Set(firstPass.map((record) => record.id)).size, records.length);
  assert.deepEqual(firstPass.map((record) => record.id), secondPass.map((record) => record.id));
  assert.notEqual(firstPass[0].id, firstPass[1].id);
});

test("identifier assignment resolves hash collisions without losing stability", () => {
  const records = [
    { term: "one", link: "", abbrSyn: "", definitions: "" },
    { term: "two", link: "", abbrSyn: "", definitions: "" },
    { term: "one", link: "", abbrSyn: "", definitions: "" },
  ];
  const collisionHash = () => "same-hash";
  const firstPass = assignRecordIds(records, collisionHash);
  const secondPass = assignRecordIds(records, collisionHash);

  assert.equal(new Set(firstPass.map((record) => record.id)).size, records.length);
  assert.deepEqual(firstPass.map((record) => record.id), secondPass.map((record) => record.id));
});
