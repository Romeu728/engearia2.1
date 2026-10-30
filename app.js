"use strict";

const form = document.querySelector("#research-form");
const ideaInput = document.querySelector("#idea");
const researchButton = document.querySelector("#research-button");
const statusMessage = document.querySelector("#status");
const results = document.querySelector("#results");
const exportButton = document.querySelector("#export-button");
const examples = document.querySelectorAll("[data-example]");
let currentProject = null;
let activeJobToken = 0;
let lastLogMessage = "";

form.addEventListener("submit", (event) => {
  event.preventDefault();
  research(ideaInput.value);
});

for (const example of examples) {
  example.addEventListener("click", () => {
    ideaInput.value = example.dataset.example;
    ideaInput.focus();
  });
}

exportButton.addEventListener("click", exportProject);
document.querySelector("#download-game").addEventListener("click", downloadGame);
researchButton.disabled = true;
checkBackendAvailability();

async function checkBackendAvailability() {
  try {
    const response = await fetch("/api/status", { headers: { Accept: "application/json" } });
    const status = await response.json();
    if (!response.ok || !status.researchAvailable) throw new Error("backend indisponível");
    researchButton.disabled = false;
  } catch {
    researchButton.disabled = true;
    statusMessage.textContent = "Esta página está publicada como demonstração. Para pesquisar jogos e gerar um projeto personalizado, o servidor de IA ainda precisa ser instalado e configurado.";
    statusMessage.classList.add("deployment-notice");
  }
}

async function research(idea) {
  const cleanedIdea = idea.trim();
  if (!cleanedIdea) return;
  const token = ++activeJobToken;
  lastLogMessage = "";
  currentProject = null;
  document.querySelector("#job-log").replaceChildren();
  researchButton.disabled = true;
  researchButton.textContent = "Pesquisando na web…";
  exportButton.hidden = true;
  document.querySelector("#game-section").hidden = true;
  document.querySelector("#game-frame").removeAttribute("src");
  document.querySelector("#game-frame").srcdoc = "";
  document.querySelector("#studies").innerHTML = '<p class="muted">Os links aparecem primeiro. A IA vai estudar cada referência separadamente antes de combiná-las.</p>';
  results.hidden = false;
  setStatus("Abrindo uma pesquisa em etapas. Os links aparecem antes do projeto final.");
  try {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea: cleanedIdea })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `A pesquisa falhou (HTTP ${response.status}).`);
    await pollResearch(payload.id, token);
  } catch (error) {
    if (token === activeJobToken) setStatus(error.message || "Não foi possível concluir a pesquisa.", true);
  } finally {
    if (token === activeJobToken) {
      researchButton.disabled = false;
      researchButton.innerHTML = '<span aria-hidden="true">⌕</span> Estudar e criar';
      checkBackendAvailability();
    }
  }
}

async function pollResearch(jobId, token) {
  while (token === activeJobToken) {
    const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
    const job = await response.json();
    if (!response.ok) throw new Error(job.error || "Não foi possível acompanhar a pesquisa.");
    renderJob(job);
    researchButton.textContent = `${job.phase} · ${job.progress}%`;
    if (job.status === "done") {
      currentProject = job;
      renderProject(job);
      exportButton.hidden = false;
      setStatus("Pesquisa finalizada. Os links e as análises aparecem antes do projeto original.");
      return;
    }
    if (job.status === "needs_ai") {
      setStatus("As fontes foram reunidas e estão visíveis. Para estudar cada jogo e criar o projeto, configure AI_BASE_URL, AI_API_KEY e AI_MODEL no servidor e inicie uma nova pesquisa.", true);
      return;
    }
    if (job.status === "failed") {
      setStatus(job.error || "A pesquisa foi interrompida.", true);
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
  }
}

function renderJob(job) {
  document.querySelector("#result-heading").textContent = `Pesquisa: ${job.idea}`;
  document.querySelector("#work-title").textContent = job.phase;
  document.querySelector("#phase-message").textContent = job.message;
  document.querySelector("#research-progress").value = job.progress;
  document.querySelector("#progress-value").textContent = `${job.progress}%`;
  document.querySelector("#research-summary").textContent = job.message;
  renderSources(job.sources || []);
  renderStudies(job.studies || []);
  if (job.message !== lastLogMessage) {
    lastLogMessage = job.message;
    const log = document.querySelector("#job-log");
    const item = document.createElement("li");
    item.textContent = job.message;
    log.append(item);
    while (log.children.length > 12) log.firstElementChild.remove();
  }
}

function renderProject(job) {
  const gameSpec = job.game;
  document.querySelector("#game-section").hidden = false;
  document.querySelector("#prototype-title").textContent = gameSpec.title;
  document.querySelector("#prototype-intro").textContent = "Jogo HTML criado para este pedido. Ele roda isolado nesta página e também pode ser baixado.";
  document.querySelector("#game-frame").src = `/api/jobs/${encodeURIComponent(job.id)}/game`;
  renderConcept(job);
  renderOriginalIdea(gameSpec);
}

function createSandboxedGame(gameHtml) {
  const policy = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src \'none\'; frame-src \'none\'; object-src \'none\'; form-action \'none\'; base-uri \'none\';">';
  return `<!doctype html>${policy}${gameHtml}`;
}

function renderConcept(project) {
  const card = document.querySelector("#concept");
  card.replaceChildren();
  const tag = document.createElement("p");
  tag.className = "eyebrow";
  tag.textContent = "PROJETO ORIGINAL · PESQUISA E ESTUDO CONCLUÍDOS";
  const title = document.createElement("h3");
  title.textContent = project.game.title;
  const pitch = document.createElement("p");
  pitch.className = "concept-pitch";
  pitch.textContent = project.game.pitch;
  card.append(tag, title, pitch);
}

function renderSources(sources) {
  const container = document.querySelector("#sources");
  container.replaceChildren();
  if (!sources.length) {
    addText(container, "p", "Nenhuma fonte apareceu nesta pesquisa. Tente outro nome ou uma descrição mais específica.");
    return;
  }
  for (const [index, source] of sources.entries()) {
    const item = document.createElement("article");
    item.className = "source-item";
    const reference = document.createElement("p");
    reference.className = "source-reference";
    reference.textContent = `Referência: ${source.reference}`;
    const title = document.createElement("a");
    title.href = source.url;
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    title.textContent = `[${index + 1}] ${source.title}`;
    item.append(reference, title);
    addText(item, "p", source.domain);
    const excerpt = document.createElement("p");
    excerpt.className = "source-excerpt";
    excerpt.textContent = source.excerpt;
    item.append(excerpt);
    const readStatus = document.createElement("p");
    readStatus.className = "source-read-status";
    readStatus.textContent = source.readStatus;
    item.append(readStatus);
    container.append(item);
  }
}

function renderStudies(studies) {
  const container = document.querySelector("#studies");
  container.replaceChildren();
  if (!studies.length) {
    const message = addText(container, "p", "Os links aparecem primeiro. A IA vai estudar cada referência separadamente antes de combiná-las.");
    message.className = "muted";
    return;
  }
  for (const study of studies) {
    const section = document.createElement("article");
    section.className = "study-item";
    addText(section, "h4", study.reference);
    addText(section, "p", study.summary);
    for (const label of ["evidence", "mechanics", "uncertainties"]) {
      if (!study[label]?.length) continue;
      addText(section, "strong", { evidence: "O que as fontes indicam", mechanics: "Mecânicas observadas", uncertainties: "Limites da pesquisa" }[label]);
      const list = document.createElement("ul");
      for (const observation of study[label]) addText(list, "li", observation);
      section.append(list);
    }
    container.append(section);
  }
}

function renderOriginalIdea(gameSpec) {
  const container = document.querySelector("#original-idea");
  container.replaceChildren();
  const blocks = [
    { title: "Ciclo principal", text: gameSpec.core_loop },
    { title: "Mecânicas combinadas", list: gameSpec.mechanics },
    { title: "Primeira missão", text: gameSpec.first_mission },
    { title: "Escopo do primeiro protótipo", list: gameSpec.prototype_scope },
    { title: "Identidade própria", text: gameSpec.originality_notes }
  ];
  for (const block of blocks) {
    const section = document.createElement("div");
    section.className = "idea-section";
    addText(section, "h4", block.title);
    if (block.text) addText(section, "p", block.text);
    if (block.list) {
      const list = document.createElement("ul");
      for (const item of block.list) addText(list, "li", item);
      section.append(list);
    }
    container.append(section);
  }
}

function exportProject() {
  if (!currentProject) return;
  const blob = new Blob([JSON.stringify(currentProject, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "projeto-forja.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadGame() {
  if (!currentProject?.game?.game_html) return;
  const blob = new Blob([createSandboxedGame(currentProject.game.game_html)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentProject.game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "jogo-forja"}.html`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function addText(parent, tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}
