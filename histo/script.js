let elvisContext;
let elvisApi;
let contextService;
let hitsCount = 0;

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
  console.log("------init-------101");
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

  if (
    ArchivesOrMedias !== "Medias" ||
    AfterArchivesOrMedias !== "Originales" ||
    !isImage
  ) {
    updateMsgInPanel(lang.onlyMediasImages);
    hideForm();
    return;
  }

  // console.log("assetPath", assetPath);
  // console.log("asset.metadata", asset.metadata);

  // display cf_HistoriqueParutions in FORM
  // TODO
  let cf_HistoriqueParutions = asset.metadata.cf_HistoriqueParutions;
  console.log("cf_HistoriqueParutions", cf_HistoriqueParutions);
  console.log(
    "cf_HistoriqueParutions.split(',')",
    cf_HistoriqueParutions.split[","]
  );


  // list all publications from the same Fond
  // for the moment is a config files
  // TODO with new API query folders of asset "fond"
  let publicationSelect = document.querySelector(
    "#histo-panel-form-add-publication"
  );
  for (let p = 0; p < publications[fond].length; p++) {
    const publication = publications[fond][p];
    publicationSelect.add(new Option(publication, publication));
  }


  // listerner on submit
  let submitForm = document.querySelector("#histo-panel-form-add-submit");
  submitForm.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    let currentPublication = document
      .querySelector("#histo-panel-form-add-publication")
      .value.trim();
    let currentParution = document
      .querySelector("#histo-panel-form-add-parution")
      .value.trim();
    let currentEdition = document
      .querySelector("#histo-panel-form-add-edition")
      .value.trim();
    let currentFolio = document
      .querySelector("#histo-panel-form-add-folio")
      .value.trim();

    if (
      currentPublication !== "" &&
      currentParution !== "" &&
      currentEdition !== "" &&
      currentFolio !== "" &&
      isNumeric(currentFolio)
    ) {
      //TODO
      // verifier que la string généré n'est pas dans la liste des hostorique de parution de l'asset selectionné
      let toHistoryToAdd = `${currentPublication}#${currentParution}#${currentEdition}#${currentFolio}`;
      console.log(toHistoryToAdd);
      // si pas dans la liste l'ajouter à la liste

      // resoummetre la liste à ASSETS

      // update(id: string, metadata: {}, successHandler?: any): void

      console.log(
        "CHOOSE",
        currentPublication,
        currentParution,
        currentEdition,
        currentFolio
      );
    } else {
      updateMsgInPanel(lang.setValidContext);
    }
  });
}
