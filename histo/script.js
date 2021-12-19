let elvisContext;
let elvisApi;
let contextService;
let hitsCount = 0;
let currentId;

const publications = {
  "Art et Décoration": ["Art et Décoration", "Art et Décoration Hors-Série"],
  Elle: ["Elle", "Elle Hors-Série", "Elle Hors-Série Icône"],
  "Elle à Table": ["Elle à Table", "Elle à Table Hors-Série"],
  "Elle Décoration": [
    "Elle Décoration",
    "Elle Décoration Hors-Série",
    "Elle Décoration Hors-Série Inspirations",
  ],
};

(async () => {
  console.log("------init-------107");
  try {
    // use the old Elvis Context
    // TODO pass on webpack with new context
    elvisContext = await AssetsClientSdk.legacyElvisContext();
    contextService = await window.AssetsClientSdk.AssetsPluginContext.get();
    elvisApi = await AssetsClientSdk.legacyElvisAPI();
    elvisContext.updateCallback = updateSelection;
    updateSelection();
  } catch (error) {
    console.log(error);
  }
})();

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

function updateMsgInPanel(content = "") {
  const panelMsg = document.querySelector("#histo-panel-message");
  if (panelMsg) {
    if (content === "") {
      panelMsg.innerHTML = ``;
    } else {
      panelMsg.innerHTML = `${content}`;
    }
  } else {
    console.error("DEBUG : #message NOT FOUND");
  }
}

function hideForm() {
  const panelFormDiv = document.querySelector("#histo-panel-form-add");
  panelFormDiv.style.display = "none";
}

function showForm() {
  const panelFormDiv = document.querySelector("#histo-panel-form-add");
  panelFormDiv.style.display = "block";
}

function updateSelection() {
  console.log("----updateSelection-----");

  if (!elvisContext) {
    console.log("elvisContext NOT FOUND");
    return;
  }
  let hits = elvisContext.activeTab.originalAssetSelection;

  console.log("elvisContext", elvisContext);
  console.log("elvisContext.hasSelection()", elvisContext.hasSelection());
  console.log(
    "elvisContext.hasFilteredSelection()",
    elvisContext.hasFilteredSelection()
  );

  hitsCount = hits.length;

  console.log("hitsCount", hitsCount);

  if (hits.length > 1) {
    updateMsgInPanel(lang.multipleSelection);
    hideForm();
    return;
  } else if (hits.length == 0) {
    updateMsgInPanel(lang.noSelection);
    hideForm();
    return;
  } else {
    updateMsgInPanel();
    showForm();
  }
  const asset = hits[0];
  const assetPath = asset.metadata.folderPath.split("/");
  const fond = assetPath[1];
  const ArchivesOrMedias = assetPath[2];
  const AfterArchivesOrMedias = assetPath[3];
  const assetDomain = asset.metadata.assetDomain;
  const isImage = assetDomain === "image";
  currentId = asset.id;

  if (
    ArchivesOrMedias !== "Medias" ||
    AfterArchivesOrMedias !== "Originales" ||
    !isImage
  ) {
    updateMsgInPanel(lang.onlyMediasImages);
    hideForm();
    return;
  }
  // DOM Elements--------------------------------------------
  let DOM_content = document.querySelector("#histo-panel-content");
  let DOM_publicationSelect = document.querySelector(
    "#histo-panel-form-add-publication"
  );
  let DOM_currentPublication = document.querySelector(
    "#histo-panel-form-add-publication"
  );
  let DOM_currentParution = document.querySelector(
    "#histo-panel-form-add-parution"
  );
  let DOM_currentEdition = document.querySelector(
    "#histo-panel-form-add-edition"
  );
  let DOM_currentFolio = document.querySelector("#histo-panel-form-add-folio");

  let DOM_submitForm = document.querySelector("#histo-panel-form-add-submit");

  // cf_HistoriqueParutions ------------------------------
  let cf_HistoriqueParutions = asset.metadata.cf_HistoriqueParutions;

  if (cf_HistoriqueParutions === undefined) {
    cf_HistoriqueParutions = [];
  }

  // TODO display cf_HistoriqueParutions in FORM for delete
  if (cf_HistoriqueParutions.length > 0) {
    let ul = document.createElement("ul");

    for (let h = 0; h < cf_HistoriqueParutions.length; h++) {
      const histo = cf_HistoriqueParutions[h];
      let li = document.createElement("li");
      li.innerHTML = cf_HistoriqueParutions[i];
    }

    DOM_content.appendChild(ul);
  }

  // BUILD FORM---------------------------------------------
  // list all publications from the same "Fond"
  // for the moment is a config files
  // TODO with new API query folders of asset "Fond"

  for (let p = 0; p < publications[fond].length; p++) {
    const publication = publications[fond][p];
    DOM_publicationSelect.add(new Option(publication, publication));
  }

  // listerners --------------------------------------------
  // on other parutions

  // on submit
  DOM_submitForm.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    let currentPublication = DOM_currentPublication.value.trim();
    let currentParution = DOM_currentParution.value.trim();
    let currentEdition = DOM_currentEdition.value.trim();
    let currentFolio = DOM_currentFolio.value.trim();

    if (
      currentPublication !== "" &&
      currentParution !== "" &&
      currentEdition !== "" &&
      currentFolio !== "" &&
      isNumeric(currentFolio)
    ) {
      // force padding 0 on folios
      currentFolio.padStart(3, "0");
      // verifier que la string généré n'est pas dans la liste des hostorique de parution de l'asset selectionné
      let toHistoryToAdd = `${currentPublication}#${currentParution}#${currentEdition}#${currentFolio}`;
      // si pas dans la liste l'ajouter à la liste
      // soummetre la liste à ASSETS
      if (cf_HistoriqueParutions.includes(toHistoryToAdd)) {
        updateMsgInPanel(lang.historicAlreadySet);
      } else {
        cf_HistoriqueParutions.push(toHistoryToAdd);
        let metadata = {
          cf_HistoriqueParutions: cf_HistoriqueParutions,
        };
        elvisApi.update(currentId, metadata, () => {
          // vider le formulaire
          // refresh asset/panel
          DOM_currentParution.value = "";
          DOM_currentFolio.value = "";
          updateSelection();
        });
      }
    } else {
      updateMsgInPanel(lang.setValidContext);
    }
  });
}
