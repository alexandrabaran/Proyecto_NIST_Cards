export const EXPECTED_COLUMNS = ["term", "link", "abbrSyn", "definitions"];

export function parseCSV(source) {
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let quoteClosed = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (quoteClosed && character !== "," && character !== "\r" && character !== "\n") {
      throw new Error(`Carácter inesperado después de un campo entrecomillado en la posición ${index}.`);
    }

    if (character === '"' && field.length === 0 && !quoteClosed) {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
      quoteClosed = false;
    } else if (character === "\r" || character === "\n") {
      row.push(field);
      if (!(row.length === 1 && row[0] === "")) {
        rows.push(row);
      }
      row = [];
      field = "";
      quoteClosed = false;
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
    } else {
      if (character === '"' && field.length > 0) {
        throw new Error(`Comilla inesperada dentro de un campo sin entrecomillar en la posición ${index}.`);
      }
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error("El CSV termina antes de cerrar un campo entrecomillado.");
  }

  if (field.length > 0 || row.length > 0 || quoteClosed) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function hashRecord(value) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = (hash * prime) & mask;
  }

  return hash.toString(16).padStart(16, "0");
}

export function assignRecordIds(records, hash = hashRecord) {
  const occurrences = new Map();
  const usedIds = new Set();

  return records.map((record) => {
    const identity = JSON.stringify([
      record.term,
      record.link,
      record.abbrSyn,
      record.definitions,
    ]);
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);

    const baseId = `${hash(identity)}-${occurrence}`;
    let id = baseId;
    let collision = 1;
    while (usedIds.has(id)) {
      id = `${baseId}-collision-${collision}`;
      collision += 1;
    }
    usedIds.add(id);

    return { ...record, id };
  });
}

export function parseGlossary(source) {
  const [header, ...dataRows] = parseCSV(source);
  if (!header) {
    throw new Error("El CSV está vacío.");
  }

  const expected = new Set(EXPECTED_COLUMNS);
  if (
    header.length !== EXPECTED_COLUMNS.length
    || new Set(header).size !== header.length
    || header.some((column) => !expected.has(column))
  ) {
    throw new Error(`El encabezado del CSV debe contener: ${EXPECTED_COLUMNS.join(", ")}.`);
  }

  const columnIndexes = Object.fromEntries(
    EXPECTED_COLUMNS.map((column) => [column, header.indexOf(column)]),
  );
  const records = [];

  dataRows.forEach((row, rowIndex) => {
    if (row.length !== EXPECTED_COLUMNS.length) {
      throw new Error(`La fila ${rowIndex + 2} tiene ${row.length} campos; se esperaban ${EXPECTED_COLUMNS.length}.`);
    }

    records.push({
      term: row[columnIndexes.term],
      link: row[columnIndexes.link],
      abbrSyn: row[columnIndexes.abbrSyn],
      definitions: row[columnIndexes.definitions],
    });
  });

  if (records.length === 0) {
    throw new Error("El CSV no contiene tarjetas para estudiar.");
  }

  return assignRecordIds(records);
}

export async function loadGlossary(url = new URL("../../data/nist_glossary.csv", import.meta.url)) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el CSV (HTTP ${response.status}).`);
  }

  return parseGlossary(await response.text());
}
