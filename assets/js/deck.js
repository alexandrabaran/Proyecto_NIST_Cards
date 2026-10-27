export function chooseRandomRecord(records, currentId = null, random = Math.random) {
  if (records.length === 0) {
    return null;
  }

  const candidates = records.length > 1
    ? records.filter((record) => record.id !== currentId)
    : records;
  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);

  return candidates[index];
}

export function createDefinitionPreview(definition, maxLength = 140) {
  const text = definition.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }

  const excerpt = text.slice(0, maxLength + 1);
  const lastSpace = excerpt.lastIndexOf(" ");
  const cutoff = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;

  return `${text.slice(0, cutoff).trimEnd()}…`;
}

export function paginateRecords(records, pageIndex, pageSize = 4) {
  const pageCount = Math.ceil(records.length / pageSize);
  const currentPage = pageCount === 0
    ? 0
    : Math.max(0, Math.min(Math.floor(pageIndex), pageCount - 1));
  const startIndex = currentPage * pageSize;

  return {
    records: records.slice(startIndex, startIndex + pageSize),
    pageIndex: currentPage,
    pageCount,
    startIndex,
  };
}

export function getHttpsUrl(value) {
  try {
    const url = new URL(value);

    if (url.protocol !== "https:" || url.username || url.password) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function getUniqueSupportingDetails(records) {
  const seenSynonyms = new Set();
  const seenSources = new Set();
  const synonyms = [];
  const sources = [];

  records.forEach((record) => {
    const synonym = record.abbrSyn.trim();
    const synonymKey = synonym.normalize("NFC").toLocaleLowerCase("es");
    if (synonym && !seenSynonyms.has(synonymKey)) {
      seenSynonyms.add(synonymKey);
      synonyms.push(record.abbrSyn);
    }

    const source = getHttpsUrl(record.link);
    if (source && !seenSources.has(source.href)) {
      seenSources.add(source.href);
      sources.push({ record, url: source.href });
    }
  });

  return { synonyms, sources };
}

function normalizeSearchText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function searchRecords(records, query, limit = 20) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return { records: [], totalCount: 0, matchType: "none" };
  }

  const matches = [];
  records.forEach((record, index) => {
    const term = normalizeSearchText(record.term);
    const synonyms = normalizeSearchText(record.abbrSyn);
    let rank = -1;

    if (term === normalizedQuery) {
      rank = 0;
    } else if (synonyms === normalizedQuery) {
      rank = 1;
    } else if (term.startsWith(normalizedQuery)) {
      rank = 2;
    } else if (term.includes(normalizedQuery)) {
      rank = 3;
    } else if (synonyms.startsWith(normalizedQuery)) {
      rank = 4;
    } else if (synonyms.includes(normalizedQuery)) {
      rank = 5;
    }

    if (rank >= 0) {
      matches.push({ record, rank, index });
    }
  });

  const exactTermMatches = matches.filter(({ rank }) => rank === 0);
  const exactSynonymMatches = matches.filter(({ rank }) => rank === 1);
  const partialMatches = matches.filter(({ rank }) => rank > 1);
  const exactMatches = exactTermMatches.length > 0 ? exactTermMatches : exactSynonymMatches;
  const selectedMatches = exactMatches.length > 0 ? exactMatches : partialMatches;
  const visibleMatches = exactMatches.length > 0 ? selectedMatches : selectedMatches.slice(0, limit);
  const matchType = exactTermMatches.length > 0
    ? "exact-term"
    : exactSynonymMatches.length > 0
      ? "exact-synonym"
      : selectedMatches.length > 0
        ? "partial"
        : "none";

  return {
    records: visibleMatches.map(({ record }) => record),
    totalCount: selectedMatches.length,
    matchType,
  };
}
