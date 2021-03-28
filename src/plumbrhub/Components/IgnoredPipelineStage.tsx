import { BuildDefinitionReference, TimelineRecord } from "azure-devops-extension-api/Build/Build";
import { ObservableArray, useObservableArray } from "azure-devops-ui/Core/Observable";
import { FormItem } from "azure-devops-ui/FormItem";
import { ISuggestionItemProps } from "azure-devops-ui/SuggestionsList";
import { TagPicker } from "azure-devops-ui/TagPicker";
import React, { useEffect } from "react";
import { BuildService } from "../Services/BuildService";
import { ISettingsService, SettingsService } from "../Services/SettingsService";

export interface IIgnoredPipelineStageProps {
    buildDefinition: BuildDefinitionReference,
}

export const IgnoredPiplineStage: React.FunctionComponent<IIgnoredPipelineStageProps> = (props) => {
    const [ignoredStages, setIgnoredStages] = useObservableArray<string>([]);
    const [suggestions, setSuggestions] = useObservableArray<string>([]);

    let availableStages: string[] = []

    let settingsService: ISettingsService | undefined = undefined;

    useEffect(() => {
        if (availableStages.length < 1) {
            loadState();
        }
    })

    const loadState = async () => {
        settingsService = await SettingsService.getInstance();

        var ignoredStages = await settingsService.getIgnoredStagesForPipeline(props.buildDefinition.id);

        var buildService = await BuildService.getInstance();
        var builds = await buildService.getBuildsForPipeline(props.buildDefinition.id, undefined, undefined, 5);

        var allStages: string[] = []

        for (var build of builds) {
            var buildTimeline = await buildService.getTimelineForBuild(build.id);
            var stages = buildTimeline?.records.filter((record, index) => record.type === "Stage") ?? [];

            stages.forEach(stage => {
                allStages.push(stage.name);
            });
        }

        var distinctStages = allStages.filter((stage, index) => allStages.indexOf(stage) === index);

        distinctStages.forEach(stage => {
            availableStages.push(stage);
        });

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
        var filteredItems =availableStages
        .filter(
            testItem =>
                ignoredStages.value.findIndex(
                    testSuggestion => testSuggestion == testItem
                ) === -1
        )
        .filter(
            testItem => testItem.toLowerCase().indexOf(searchValue.toLowerCase()) > -1
        );

        setSuggestions(filteredItems);
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
        <div style={{ display: "flex-column", width: "30%" }}>
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