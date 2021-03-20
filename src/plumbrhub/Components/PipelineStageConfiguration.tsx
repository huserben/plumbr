import { BuildDefinitionReference } from "azure-devops-extension-api/Build/Build";
import { Button } from "azure-devops-ui/Button";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { FormItem } from "azure-devops-ui/FormItem";
import { TextField } from "azure-devops-ui/TextField";
import React from "react";
import { ISettingsService, SettingsService } from "../Services/SettingsService";
import { bindSelectionToObservable } from "azure-devops-ui/MasterDetailsContext";
import { SingleLayerMasterPanelHeader } from "azure-devops-ui/Components/SingleLayerMasterPanel/SingleLayerMasterPanel";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { SingleLayerMasterPanel } from "azure-devops-ui/MasterDetails";
import { Observer } from "azure-devops-ui/Observer";
import { Page } from "azure-devops-ui/Page";
import { IListItemDetails, List, ListItem, ListSelection } from "azure-devops-ui/List";
import { ArrayItemProvider, IItemProvider } from "azure-devops-ui/Utilities/Provider";

export interface IPipelineStageConfigurationProps {
    buildDefinition: BuildDefinitionReference,
}


const PipelineStageConfiguration: React.FunctionComponent<IPipelineStageConfigurationProps> = (props) => {

    //const settingsService = await SettingsService.getInstance();
    //var ignoredStages = await this.settingsService.getIgnoredStagesForPipeline(this.props.buildDefinition.id);
    var stagesWithConfig = ["Stage2", "Stage3", "Stage 12", "42", "1337"];

    const [selection] = React.useState(new ListSelection({ selectOnFocus: false }));
    const [itemProvider] = React.useState(new ArrayItemProvider(stagesWithConfig));
    const [selectedItemObservable] = React.useState(new ObservableValue<string>(stagesWithConfig[0]));

    React.useEffect(() => {
        bindSelectionToObservable(selection, itemProvider, selectedItemObservable);
    });

    return (
        <div style={{ display: "flex-column", width: "70%" }}>

            <div className="master-example-scroll-container flex-row">
                <SingleLayerMasterPanel
                    className="master-example-panel show-on-small-screens"
                    renderHeader={reanderHeader}
                    renderContent={() => renderContent(selection, itemProvider)}
                />
                <Observer selectedItem={selectedItemObservable}>
                    {(observerProps: { selectedItem: string }) => (
                        <Page className="flex-grow single-layer-details">
                            {observerProps.selectedItem && (
                                <Tooltip text={observerProps.selectedItem} overflowOnly={true}>
                                    <span className="single-layer-details-contents">
                                        {observerProps.selectedItem}
                                    </span>
                                </Tooltip>
                            )}
                        </Page>
                    )}
                </Observer>
            </div>
        </div>
    );
};

const reanderHeader = () => {
    return <SingleLayerMasterPanelHeader title="Stages with Configuration" />;
}

const renderContent = (selection: ListSelection, itemProvider: IItemProvider<string>) => {
    return (
        <List
            ariaLabel={"Commits Master Table"}
            itemProvider={itemProvider}
            selection={selection}
            renderRow={renderListItem}
            width="100%"
            singleClickActivation={true}
        />
    );
};

const renderListItem = (
    index: number,
    item: string,
    details: IListItemDetails<string>,
    key?: string
): JSX.Element => {
    return (
        <ListItem
            className="master-example-row"
            key={key || "list-item" + index}
            index={index}
            details={details}
        >
            <div className="master-example-row-content flex-row flex-center h-scroll-hidden">
                <Tooltip overflowOnly={true}>
                    <div className="primary-text text-ellipsis">{item}</div>
                </Tooltip>
            </div>
        </ListItem >
    );
};

export default PipelineStageConfiguration;