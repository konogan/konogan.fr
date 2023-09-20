try {
  var toto = "";
  for (var i = 63; i < app.panels.length; i++) {
    try {
      if (app.panels[i].isValid) {
        toto = toto + " - ("+app.panels[i].index+") " + app.panels[i].name;
      }
    } catch (error) {
      alert(i);
    }
  }
  alert(toto);
} catch (e) {
  alert(e.message + "\r(line " + e.line + ")");
}
