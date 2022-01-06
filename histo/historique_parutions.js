let elvisContext;
let elvisApi;
let contextService;
let hitsCount = 0;

// globals for current selected asset
let assetId = null;

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
  "Télé 7 Jours": ["Télé 7 Jours", "Télé 7 Jours Hors-Série"],
  "Télé 7 Jours Jeux": ["Télé 7 Jours Jeux"],
  "Télé 7 Jeux": ["Télé 7 Jeux", "Télé 7 Jeux Hors-Série"],
  "S Le Mag": ["S Le Mag"],
  "Ciné Fiction": [
    "Art et Décoration",
    "Art et Décoration Hors-Série",
    "Elle",
    "Elle Hors-Série",
    "Elle Hors-Série Icône",
    "Elle à Table",
    "Elle à Table Hors-Série",
    "Elle Décoration",
    "Elle Décoration Hors-Série",
    "Elle Décoration Hors-Série Inspirations",
    "Télé 7 Jours",
    "Télé 7 Jours Hors-Série",
    "Télé 7 Jours Jeux",
    "Télé 7 Jeux",
    "Télé 7 Jeux Hors-Série",
    "S Le Mag",
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

function overlay(display = false) {
  let overlay = document.querySelector(".overlay");
  if (display) {
    overlay.style.display = "flex";
  } else {
    overlay.style.display = "none";
  }
}

function showForm() {
  const panelFormDiv = document.querySelector("#histo-panel-form-add");
  panelFormDiv.style.display = "block";
}

function handleDeleteHistory(event) {
  event.preventDefault();
  overlay(true);
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

  elvisApi.update(assetId, metadata);
}

function handleSubmitForm(event) {
  event.preventDefault();
  overlay(true);
  let currentPublication = DOM_currentPublication.value.trim();
  let currentParution = DOM_currentParution.value.trim();
  let currentEdition = DOM_currentEdition.value.trim();
  let currentFolio = DOM_currentFolio.value.trim();

  if (
    currentPublication !== "" &&
    currentParution !== "" &&
    currentEdition !== "" &&
    currentFolio !== ""
  ) {
    // on peut recevoir le folio avec une virgule
    // dans ce cas il faut generer autant de lignes que de folios
    let folios = currentFolio.split(",");
    let new_cf_HistoriqueParutions = cf_HistoriqueParutions;
    let needUpdate = false;
    let needUpdateParutionMetadatas = cf_HistoriqueParutions.length === 0;
    for (let f = 0; f < folios.length; f++) {
      // force padding 0 on folios
      const fo = folios[f].trim().padStart(3, "0");
      // verifier que la string généré n'est pas dans la liste des hostorique de parution de l'asset selectionné
      let toHistoryToAdd = `${currentPublication}#${currentParution}#${currentEdition}#${fo}`;
      // la chaine construite n'est pas dans la liste
      if (!cf_HistoriqueParutions.includes(toHistoryToAdd)) {
        new_cf_HistoriqueParutions.push(toHistoryToAdd);
        needUpdate = true;
      }
    }
    //si on doit update
    if (needUpdate) {
      let metadata = {
        cf_HistoriqueParutions: new_cf_HistoriqueParutions,
      };
      // si le champ etait vide auparavant
      // il faut definir les autres metadonnnes
      // publicationName,edition pageRange,issueName
      if (needUpdateParutionMetadatas) {
        metadata["publicationName"] = currentPublication;
        metadata["issueName"] = currentParution;
        metadata["edition"] = currentEdition;
        metadata["pageRange"] = folios
          .sort()
          .map((f) => f.trim().padStart(3, "0"))
          .join(",");
      }

      elvisApi.update(assetId, metadata, () => {
        // vider le formulaire
        DOM_currentParution.value = "";
        DOM_currentFolio.value = "";
      });
    }
  } else {
    updateMsgInPanel(lang.setValidContext);
    overlay(false);
  }
}

function updateSelection() {
  if (!elvisContext) {
    console.log("elvisContext NOT FOUND");
    return;
  }
  overlay(false);
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
  const assetDomain = asset.metadata.assetDomain;
  const isImage = assetDomain === "image";

  // on defini les valeurs globales de l'asset selectionné
  assetId = asset.id;
  assetPublication = asset.metadata["publicationName"]
    ? asset.metadata["publicationName"]
    : null;
  assetParution = asset.metadata["issueName"]
    ? asset.metadata["issueName"]
    : null;
  assetEdition = asset.metadata["edition"] ? asset.metadata["edition"] : null;
  assetPageRange = asset.metadata["pageRange"]
    ? asset.metadata["pageRange"]
    : null;

  if (!isImage) {
    updateMsgInPanel(lang.onlyImages);
    hideForm();
    return;
  }

  // IF ONLY ONE COMPATIBLE ASSET IS SELECTED---------------------

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

      li.innerHTML = `<span class="histo">${histoBeauty}</span><span id="${histo}" class='delBtn'></span>`;

      ul.appendChild(li);
    }
    DOM_content.appendChild(ul);
  }

  // BUILD FORM---------------------------------------------
  // list all publications from the same "Fond"
  // for the moment is a config files
  // TODO with new API query folders of asset "Fond"
  if (publications[fond]) {
    for (let p = 0; p < publications[fond].length; p++) {
      const publication = publications[fond][p];
      DOM_publicationSelect.add(new Option(publication, publication));
    }
  }

  // si il n'y a pas d'historique de parution on propose la parution cible
  if (cf_HistoriqueParutions.length === 0) {
    let parutionCible = asset.metadata.eissn ? asset.metadata.eissn : "";
    DOM_currentParution.value = parutionCible;
  }

  // listerners  on other parutions
  const deleteBtns = document.querySelectorAll(".delBtn");
  for (const deleteBtn of deleteBtns) {
    deleteBtn.addEventListener("click", handleDeleteHistory);
    deleteBtn.style.display = "block";
  }
}

(async () => {
  try {
    console.log("Plugin Historique Parution v1.0.10");
    // use the old Elvis Context
    // TODO REWORK on webpack with new context
    elvisContext = await AssetsClientSdk.legacyElvisContext();
    contextService = await window.AssetsClientSdk.AssetsPluginContext.get();
    elvisApi = await AssetsClientSdk.legacyElvisAPI();
    elvisContext.updateCallback = updateSelection;
    overlay(true);
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
