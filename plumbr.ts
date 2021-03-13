/// <reference types="vss-web-extension-sdk" />

define(["require", "exports", "VSS/Service", "TFS/Build/RestClient"],
   function (require: any, exports: any, VssService: any, TfsBuildRest: any) {
      var Plumbr: any = (function () {

         let buildClient: any = null;
         let webContext: WebContext = null;

         function Plumbr() {
            console.log("Plumbr constructor");
         }

         async function onBuildDefinitionChanged(): Promise<void> {
            var buildDefinition: any = document.getElementById("buildefinitions");

            console.log(`Selected Build Definition id ${buildDefinition.value} - loading builds...`);

            var definitionFilter: any[] = [buildDefinition.value];
            var buildsForDefinition : any[] = await buildClient.getBuilds(webContext.project.id, definitionFilter)

            var branches: string[] = []

            buildsForDefinition.forEach(build => {
               branches.push(build.sourceBranch);
            });

            const distinct = (value: string, index: number, self: any) => {
               return self.indexOf(value) === index;
            }

            var distinctBranches: string[] = branches.filter(distinct);
            var isFirst = true;
            document.getElementById("branches").innerHTML = ''

            distinctBranches.forEach(branch => {
               document.getElementById("branches").appendChild(new Option(branch, branch, isFirst));
               isFirst = false;
            });

            onBranchChanged();
         }

         async function onBranchChanged() {
            var branch: any = document.getElementById("branches");

            console.log(`Selected Branch ${branch.value}`);

            var buildDefinition: any = document.getElementById("buildefinitions");
            var definitionFilter: any[] = [buildDefinition.value];

            var buildsForBranch : any[] = await buildClient.getBuilds(webContext.project.id, definitionFilter, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, branch.value)

            var pipelinesList = document.getElementById("pipelines")
            while(pipelinesList.firstChild){
               pipelinesList.removeChild(pipelinesList.firstChild);
            }

            buildsForBranch.forEach(build => {
               var pipelineEntry = document.createElement("li");
               pipelineEntry.appendChild(document.createTextNode(`${build.buildNumber} (ID ${build.id}) - ${build.status} - Result: ${build.result}`));
               pipelinesList.appendChild(pipelineEntry);
            });
         }

         Plumbr.prototype.start = async function () {
            console.log("Plumbr start");

            document.getElementById("buildefinitions").addEventListener("change", onBuildDefinitionChanged);
            document.getElementById("branches").addEventListener("change", onBranchChanged);

            buildClient = VssService.getCollectionClient(TfsBuildRest.BuildHttpClient);
            webContext = VSS.getWebContext();

            var definitions: any[] = await buildClient.getDefinitions(webContext.project.id);

            definitions.forEach(definition => {
               console.log(`Build Definition found: ${definition.name}`);
               document.getElementById("buildefinitions").appendChild(new Option(definition.name, definition.id));
            });

            onBuildDefinitionChanged();
         }
         return Plumbr;
      })();

      exports.plmbr = new Plumbr();
   });