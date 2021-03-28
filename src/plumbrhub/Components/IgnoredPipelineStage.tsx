import { BuildDefinitionReference, TimelineRecord } from "azure-devops-extension-api/Build/Build";
import { useObservableArray } from "azure-devops-ui/Core/Observable";
import { FormItem } from "azure-devops-ui/FormItem";
import { ISuggestionItemProps } from "azure-devops-ui/SuggestionsList";
import { TagPicker } from "azure-devops-ui/TagPicker";
import React, { useEffect } from "react";
import { ISettingsService, SettingsService } from "../Services/SettingsService";

export interface IIgnoredPipelineStageProps {
    buildDefinition: BuildDefinitionReference,
    allStages: TimelineRecord[]
}

export const IgnoredPiplineStage: React.FunctionComponent<IIgnoredPipelineStageProps> = (props) => {
    const [ignoredStages, setIgnoredStages] = useObservableArray<string>([]);
    const [suggestions, setSuggestions] = useObservableArray<string>([]);

    let isLoading : boolean = false;

    let settingsService: ISettingsService | undefined = undefined;

    useEffect(() => {
        if (!isLoading) {
            isLoading = true;
            loadState();
        }
    })

    const loadState = async () => {
        settingsService = await SettingsService.getInstance();

        var ignoredStages = await settingsService.getIgnoredStagesForPipeline(props.buildDefinition.id);
        setIgnoredStages(ignoredStages);
    }

    const renderSuggestionItem = (tag: ISuggestionItemProps<string>) => {
        return <div className="body-m">{tag.item}</div>;
    }

    const onTagAdded = async (tag: string) => {
        setIgnoredStages([...ignoredStages.value, tag])

        await settingsService?.setIgnoredStagesForPipeline(props.buildDefinition.id, ignoredStages.value);
    }

    const onTagRemoved = async (tag: string) => {
        setIgnoredStages(ignoredStages.value.filter(x => x !== tag));
        await settingsService?.setIgnoredStagesForPipeline(props.buildDefinition.id, ignoredStages.value);
    };

    const onSearchChanged = (searchValue: string) => {
        var filteredItems = props.allStages
        .filter(
            testItem =>
                ignoredStages.value.findIndex(
                    testSuggestion => testSuggestion == testItem.name
                ) === -1
        )
        .filter(
            testItem => testItem.name.toLowerCase().indexOf(searchValue.toLowerCase()) > -1
        );

        setSuggestions(filteredItems.map(i => i.name));
    };

    const convertItemToPill = (tag: string) => {
        return {
            content: tag
        }
    };

    const areTagsEqual = (item1: string, item2: string): boolean => {
        return item1 === item2;
    };

    return (
        <div style={{ display: "flex-column", width: "50%", margin: "4px" }}>
            <FormItem label="Stage to Ignore:">
                <TagPicker
                    areTagsEqual={areTagsEqual}
                    convertItemToPill={convertItemToPill}
                    noResultsFoundText={"No Stages found"}
                    onSearchChanged={onSearchChanged}
                    onTagAdded={onTagAdded}
                    onTagRemoved={onTagRemoved}
                    renderSuggestionItem={renderSuggestionItem}
                    selectedTags={ignoredStages}
                    suggestions={suggestions}
                    suggestionsLoading={false}
                />
            </FormItem>
        </div>
    );
}