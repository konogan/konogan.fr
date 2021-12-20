let elvisContext;
let elvisApi;
let contextService;
let hitsCount = 0;
let currentId = null;
let cf_HistoriqueParutions = null;
let DOM_content;
let DOM_currentPublication;
let DOM_currentParution;
let DOM_currentEdition;
let DOM_currentFolio;
let DOM_submitForm;

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

function handleDeleteHistory(event) {
  event.preventDefault();

  let histoToDel = event.target.id;

  let new_cf_HistoriqueParutions = cf_HistoriqueParutions.filter(
    (hist) => hist !== histoToDel
  );

  let metadata = {
    cf_HistoriqueParutions: new_cf_HistoriqueParutions,
  };

  if (new_cf_HistoriqueParutions.length === 0) {
    // si ZERO  historique de parution il faut supprimuer les autres metadonnnes de Publication
    // publicationName,edition pageRange,issueName
    //To clear the value for a metadata field, pass an empty string for that field.
    metadata["publicationName"] = "";
    metadata["issueName"] = "";
    metadata["edition"] = "";
    metadata["pageRange"] = "";
  }

  elvisApi.update(currentId, metadata);
}

function handleSubmitForm(event) {
  event.preventDefault();
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
      let new_cf_HistoriqueParutions = cf_HistoriqueParutions;
      new_cf_HistoriqueParutions.push(toHistoryToAdd);
      let metadata = {
        cf_HistoriqueParutions: new_cf_HistoriqueParutions,
      };
      // si UN seul historique de parution il faut definir les autres metadonnnes
      // publicationName,edition pageRange,issueName
      if (new_cf_HistoriqueParutions.length === 1) {
        metadata["publicationName"] = currentPublication;
        metadata["issueName"] = currentParution;
        metadata["edition"] = currentEdition;
        metadata["pageRange"] = currentFolio;
      }

      elvisApi.update(currentId, metadata, () => {
        // vider le formulaire
        DOM_currentParution.value = "";
        DOM_currentFolio.value = "";
      });
    }
  } else {
    updateMsgInPanel(lang.setValidContext);
  }
}

function updateSelection() {
  if (!elvisContext) {
    console.log("elvisContext NOT FOUND");
    return;
  }

  hideForm();
  // EMPTY PREVIOUS INSTANCES OF PANEL-------------------------
  DOM_content.innerHTML = "";
  DOM_publicationSelect.innerHTML = "";

  // WORK ON SELECTED ASSET------------------------------------
  let hits = elvisContext.activeTab.originalAssetSelection;

  if (hits.length > 1) {
    updateMsgInPanel(lang.multipleSelection);
    return;
  } else if (hits.length == 0) {
    updateMsgInPanel(lang.noSelection);
    return;
  }
  // ONE ASSET IS SELECTED--------------------------------
  updateMsgInPanel();
  showForm();

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
  // ONE COMPATIBLE ASSET IS SELECTED---------------------

  // cf_HistoriqueParutions ------------------------------
  cf_HistoriqueParutions = asset.metadata.cf_HistoriqueParutions;

  if (cf_HistoriqueParutions === undefined || cf_HistoriqueParutions === null) {
    cf_HistoriqueParutions = [];
  }

  if (cf_HistoriqueParutions.length > 0) {
    let ul = document.createElement("ul");

    for (let h = 0; h < cf_HistoriqueParutions.length; h++) {
      let histo = cf_HistoriqueParutions[h];
      let histoBeauty = histo.split("#").join(" ");
      let li = document.createElement("li");
      li.innerHTML = `${histoBeauty} <span id="${histo}" class='histoDel'>Supp.</span>`;
      ul.appendChild(li);
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

  // si il n'y a pas d'historique de parution on propose la parution cible
  if (cf_HistoriqueParutions.length === 0) {
    let parutionCible = asset.metadata.eissn
      ? parseInt(asset.metadata.eissn)
      : "";
    DOM_currentParution.value = parutionCible;
  }

  // listerners  on other parutions
  const deleteBtns = document.querySelectorAll(".histoDel");
  for (const deleteBtn of deleteBtns) {
    deleteBtn.addEventListener("click", handleDeleteHistory);
  }
}

(async () => {
  try {
    console.log("Plugin Historique Parution v1.0.3");
    // use the old Elvis Context
    // TODO REWORK on webpack with new context
    elvisContext = await AssetsClientSdk.legacyElvisContext();
    contextService = await window.AssetsClientSdk.AssetsPluginContext.get();
    elvisApi = await AssetsClientSdk.legacyElvisAPI();
    elvisContext.updateCallback = updateSelection;

    // INIT--------------------------------------------
    DOM_content = document.querySelector("#histo-panel-content");
    DOM_publicationSelect = document.querySelector(
      "#histo-panel-form-add-publication"
    );
    DOM_currentPublication = document.querySelector(
      "#histo-panel-form-add-publication"
    );
    DOM_currentParution = document.querySelector(
      "#histo-panel-form-add-parution"
    );
    DOM_currentEdition = document.querySelector(
      "#histo-panel-form-add-edition"
    );
    DOM_currentFolio = document.querySelector("#histo-panel-form-add-folio");

    DOM_submitForm = document.querySelector("#histo-panel-form-add-submit");
    try {
      // avoid multiple initialisation
      DOM_submitForm.removeEventListener("click", handleSubmitForm);
    } catch (error) {
      console.log("ici");
    }

    DOM_submitForm.addEventListener("click", handleSubmitForm);

    updateSelection();
  } catch (error) {
    console.log(`DEBUG : ${error}`);
  }
})();
