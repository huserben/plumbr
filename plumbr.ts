/// <reference types="vss-web-extension-sdk" />

VSS.init(null)

VSS.ready(function() {
   document.getElementById("name").innerText = VSS.getWebContext().user.name;
});