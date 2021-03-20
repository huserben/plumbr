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
    stagesWithConfig: ArrayItemProvider<string>,
    selectedItem: ObservableValue<string>
}


const PipelineStageConfiguration: React.FunctionComponent<IPipelineStageConfigurationProps> = (props) => {
    const [selection] = React.useState(new ListSelection({ selectOnFocus: false }));    

    React.useEffect(() => {
        bindSelectionToObservable(selection, props.stagesWithConfig, props.selectedItem);
    });

    return (
        <div style={{ display: "flex-column", width: "70%" }}>

            <div className="master-example-scroll-container flex-row">
                <SingleLayerMasterPanel
                    className="master-example-panel show-on-small-screens"
                    renderContent={() => renderContent(selection, props.stagesWithConfig)}
                />
                <Observer selectedItem={props.selectedItem}>
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