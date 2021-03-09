async function onBuildDefinitionChanged() {
    var buildDefinition: any = document.getElementById("buildefinitions");

    console.log(`Selected Build Definition ${buildDefinition} with id ${buildDefinition} - loading builds...`);

    var allBranches = ["main", "feature 1", "main", "main"]

    var branches: string[] = []

    allBranches.forEach(branch => {
        branches.push(branch);
    });

    const distinct = (value: string, index: number, self: any) => {
        return self.indexOf(value) === index;
    }

    var distinctBranches: string[] = branches.filter(distinct);
    document.getElementById("branches").innerHTML = ''

    distinctBranches.forEach(branch => {
        document.getElementById("branches").appendChild(new Option(branch, branch));
    });

    onBranchesChanged();
}

async function onBranchesChanged(){
    var pipelinesList = document.getElementById("pipelines")
    pipelinesList.innerHTML = ''
    var pipelineEntry = document.createElement("li");
    pipelineEntry.appendChild(document.createTextNode("Something"));
    pipelinesList.appendChild(pipelineEntry);
}

document.getElementById("buildefinitions").addEventListener("change", onBuildDefinitionChanged);
document.getElementById("branches").addEventListener("change", onBranchesChanged);

["1", "2", "3"].forEach(definition => {
    console.log(`Build Definition found: ${definition}`);
    document.getElementById("buildefinitions").appendChild(new Option(definition, `${definition}`));
});
onBuildDefinitionChanged();