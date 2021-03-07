/// <reference types="vss-web-extension-sdk" />

VSS.require(["TFS/Build/RestClient"], async function (restClient: any) {
   var buildClient = restClient.getClient();   
   var webContext: WebContext = VSS.getWebContext(); 

   var definitions: any[]  = await buildClient.getDefinitions(webContext.project.id);

   definitions.forEach(definition => {      
      document.getElementById("buildefinitions").appendChild(new Option(definition.name, `${definition.id}`))
   });
});

async function init(): Promise<void> {   
}

VSS.init(null)

VSS.ready(function () {
   init();
});