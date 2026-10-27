import { loadGlossary } from "./csv.js";
import {
  chooseRandomRecord,
  createDefinitionPreview,
  getHttpsUrl,
  getUniqueSupportingDetails,
  paginateRecords,
  searchRecords,
} from "./deck.js";

const elements = {
  loading: document.querySelector("#loading-message"),
  error: document.querySelector("#error-message"),
  studyMessage: document.querySelector("#study-message"),
  card: document.querySelector("#flashcard"),
  term: document.querySelector("#term"),
  details: document.querySelector("#card-details"),
  definitions: document.querySelector("#definitions"),
  definitionPagination: document.querySelector("#definition-pagination"),
  previousDefinitionPage: document.querySelector("#previous-definition-page"),
  definitionPageStatus: document.querySelector("#definition-page-status"),
  nextDefinitionPage: document.querySelector("#next-definition-page"),
  synonymBlock: document.querySelector("#synonym-block"),
  synonyms: document.querySelector("#synonyms"),
  sourceLinks: document.querySelector("#source-links"),
  reveal: document.querySelector("#reveal-button"),
  controls: document.querySelector("#study-controls"),
  next: document.querySelector("#next-button"),
  deckNotice: document.querySelector("#deck-notice"),
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  clearSearch: document.querySelector("#clear-search-button"),
  searchMessage: document.querySelector("#search-message"),
  searchResults: document.querySelector("#search-results"),
};

let records = [];
let currentRecords = [];
let definitionPageIndex = 0;
const DEFINITIONS_PER_PAGE = 4;

function hideDetails() {
  elements.details.hidden = true;
  elements.reveal.setAttribute("aria-expanded", "false");
  elements.reveal.textContent = "Revelar definición y datos";
}

function appendSourceLink(record, url, index) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = currentRecords.length > 1 ? `NIST · registro ${index + 1}` : "Consultar fuente en NIST";
  link.setAttribute("aria-label", `Abrir la fuente NIST para ${record.term} en una pestaña nueva`);
  item.append(link);
  elements.sourceLinks.append(item);
}

function showCurrentRecords(message = "Se cargó otra tarjeta aleatoria.", revealDetails = false) {
  elements.term.textContent = currentRecords[0].term;
  elements.definitions.replaceChildren();
  elements.synonyms.replaceChildren();
  elements.sourceLinks.replaceChildren();

  const definitionPage = paginateRecords(currentRecords, definitionPageIndex, DEFINITIONS_PER_PAGE);
  definitionPageIndex = definitionPage.pageIndex;
  elements.definitions.start = definitionPage.startIndex + 1;
  definitionPage.records.forEach((record) => {
    const definition = document.createElement("li");
    definition.className = "definition";
    definition.textContent = record.definitions;
    elements.definitions.append(definition);
  });

  elements.definitionPagination.hidden = definitionPage.pageCount <= 1;
  elements.previousDefinitionPage.disabled = definitionPageIndex === 0;
  elements.nextDefinitionPage.disabled = definitionPageIndex >= definitionPage.pageCount - 1;
  elements.definitionPageStatus.textContent = `Página ${definitionPageIndex + 1} de ${definitionPage.pageCount} · definiciones ${definitionPage.startIndex + 1}–${Math.min(definitionPage.startIndex + DEFINITIONS_PER_PAGE, currentRecords.length)} de ${currentRecords.length}`;

  const { synonyms, sources } = getUniqueSupportingDetails(currentRecords);
  synonyms.forEach((synonymText) => {
    const synonym = document.createElement("li");
    synonym.textContent = synonymText;
    elements.synonyms.append(synonym);
  });

  sources.forEach(({ record, url }, index) => {
    appendSourceLink(record, url, index);
  });

  elements.synonymBlock.hidden = synonyms.length === 0;
  elements.sourceLinks.closest(".detail-block").hidden = elements.sourceLinks.childElementCount === 0;
  hideDetails();
  if (revealDetails) {
    elements.details.hidden = false;
    elements.reveal.setAttribute("aria-expanded", "true");
    elements.reveal.textContent = "Ocultar definición y datos";
  }
  elements.studyMessage.textContent = message;
}

function clearSearchResults() {
  elements.searchResults.replaceChildren();
  elements.searchResults.hidden = true;
}

function clearSearchFeedback() {
  clearSearchResults();
  elements.searchMessage.textContent = "";
  elements.searchMessage.hidden = true;
}

function selectRecords(selectedRecords, message, revealDetails = false) {
  currentRecords = selectedRecords;
  definitionPageIndex = 0;
  showCurrentRecords(message, revealDetails);
  clearSearchResults();
  elements.searchMessage.textContent = message;
  elements.searchMessage.hidden = false;
  elements.searchInput.focus();
}

function showSearchResults(query) {
  const { records: matches, totalCount, matchType } = searchRecords(records, query);
  clearSearchResults();

  if (totalCount === 0) {
    elements.searchMessage.textContent = `No se encontraron coincidencias para “${query}”.`;
    elements.searchMessage.hidden = false;
    return;
  }

  if (totalCount === 1) {
    selectRecords(matches, `Se seleccionó “${matches[0].term}”.`);
    return;
  }

  if (matchType === "exact-term") {
    const term = matches[0].term;
    selectRecords(
      matches,
      `“${term}” aparece en ${totalCount} registros. Se muestran todas sus definiciones junto al término.`,
      true,
    );
    return;
  }

  const visibleCount = matches.length;
  elements.searchMessage.textContent = totalCount > visibleCount
    ? `Hay ${totalCount} coincidencias. Mostrando las primeras ${visibleCount}; elegí una tarjeta o afiná la búsqueda.`
    : `Hay ${totalCount} coincidencias. Elegí la tarjeta que querés estudiar.`;
  elements.searchMessage.hidden = false;

  matches.forEach((record, index) => {
    const item = document.createElement("li");
    const result = document.createElement("div");
    const button = document.createElement("button");
    const title = document.createElement("span");
    const preview = document.createElement("p");
    const actions = document.createElement("div");
    button.className = "search-result";
    button.type = "button";
    title.className = "search-result-title";
    title.textContent = `${record.term}${record.abbrSyn ? ` · ${record.abbrSyn}` : ""}`;
    preview.className = "search-result-preview";
    preview.textContent = createDefinitionPreview(record.definitions) || "No hay una definición disponible.";
    button.setAttribute("aria-label", `Estudiar ${record.term}, opción ${index + 1}`);
    button.append(title, preview);
    button.addEventListener("click", () => selectRecords([record], `Se seleccionó “${record.term}”.`));

    result.className = "search-result-row";
    result.append(button);
    const source = getHttpsUrl(record.link);
    if (source) {
      const link = document.createElement("a");
      link.className = "search-result-source";
      link.href = source.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Fuente NIST ↗";
      link.setAttribute("aria-label", `Abrir la fuente NIST para ${record.term} en una pestaña nueva`);
      actions.className = "search-result-actions";
      actions.append(link);
      result.append(actions);
    }
    item.append(result);
    elements.searchResults.append(item);
  });
  elements.searchResults.hidden = false;
}

elements.clearSearch.addEventListener("click", () => {
  elements.searchInput.value = "";
  clearSearchFeedback();
  elements.searchInput.focus();
});

elements.searchInput.addEventListener("input", clearSearchFeedback);

elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = elements.searchInput.value.trim();
  if (!query) {
    clearSearchResults();
    elements.searchMessage.textContent = "Escribí un término o sinónimo para buscar.";
    elements.searchMessage.hidden = false;
    elements.searchInput.focus();
    return;
  }
  showSearchResults(query);
});

elements.reveal.addEventListener("click", () => {
  const willReveal = elements.details.hidden;
  elements.details.hidden = !willReveal;
  elements.reveal.setAttribute("aria-expanded", String(willReveal));
  elements.reveal.textContent = willReveal
    ? "Ocultar definición y datos"
    : "Revelar definición y datos";
});

elements.previousDefinitionPage.addEventListener("click", () => {
  if (definitionPageIndex === 0) {
    return;
  }
  definitionPageIndex -= 1;
  showCurrentRecords(elements.studyMessage.textContent, !elements.details.hidden);
});

elements.nextDefinitionPage.addEventListener("click", () => {
  const lastPageIndex = Math.ceil(currentRecords.length / DEFINITIONS_PER_PAGE) - 1;
  if (definitionPageIndex >= lastPageIndex) {
    return;
  }
  definitionPageIndex += 1;
  showCurrentRecords(elements.studyMessage.textContent, !elements.details.hidden);
});

elements.next.addEventListener("click", () => {
  clearSearchFeedback();
  const nextRecord = chooseRandomRecord(records, currentRecords[0].id);
  if (nextRecord.id === currentRecords[0].id) {
    elements.studyMessage.textContent = "El glosario contiene una sola tarjeta; no hay otra disponible.";
    return;
  }
  currentRecords = [nextRecord];
  definitionPageIndex = 0;
  showCurrentRecords();
});

async function startApp() {
  try {
    records = await loadGlossary();
  } catch (error) {
    elements.loading.hidden = true;
    elements.error.textContent = `No se pudo iniciar el estudio. ${error.message}`;
    elements.error.hidden = false;
    return;
  }

  currentRecords = [chooseRandomRecord(records)];
  definitionPageIndex = 0;
  elements.loading.hidden = true;
  elements.card.hidden = false;
  elements.controls.hidden = false;
  elements.reveal.disabled = false;
  elements.searchInput.disabled = false;
  elements.searchForm.querySelector('button[type="submit"]').disabled = false;
  elements.clearSearch.disabled = false;
  elements.next.disabled = records.length < 2;
  elements.deckNotice.hidden = records.length > 1;
  elements.deckNotice.textContent = records.length < 2
    ? "El glosario contiene una sola tarjeta; no hay otra disponible."
    : "";
  showCurrentRecords();

  if (records.length < 2) {
    elements.studyMessage.textContent = "El glosario contiene una sola tarjeta; no hay otra disponible.";
  }
}

startApp();
