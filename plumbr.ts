/// <reference types="vss-web-extension-sdk" />

define(["require", "exports", "VSS/Service", "TFS/Build/RestClient"],
   function (require: any, exports: any, VssService: any, TfsBuildRest: any) {
      var Plumbr: any = (function () {

         function Plumbr() {
            console.log("Plumbr constructor");
         }

         Plumbr.prototype.start = async function () {
            console.log("Plumbr start");

            var self = this;
            
            var buildClient = VssService.getCollectionClient(TfsBuildRest.BuildHttpClient);

            var webContext: WebContext = VSS.getWebContext();

            var definitions: any[]  = await buildClient.getDefinitions(webContext.project.id);
         
            definitions.forEach(definition => {      
               console.log(`Build Definition found: ${definition.name}`);
               document.getElementById("buildefinitions").appendChild(new Option(definition.name, `${definition.id}`))
            }); 
         }
         return Plumbr;
      })();

      exports.plmbr = new Plumbr();
   });