import { Build, BuildDefinitionReference } from "azure-devops-extension-api/Build/Build";
import { useObservableArray } from "azure-devops-ui/Core/Observable";
import { FormItem } from "azure-devops-ui/FormItem";
import { ISuggestionItemProps } from "azure-devops-ui/SuggestionsList";
import { TagPicker } from "azure-devops-ui/TagPicker";
import React, { useEffect } from "react";
import { BuildService } from "../Services/BuildService";
import { ISettingsService, SettingsService } from "../Services/SettingsService";

export interface IIncludedBranchesProps {
    buildDefinition: BuildDefinitionReference,
    builds: Build[]
}

export const IncludedBranches: React.FunctionComponent<IIncludedBranchesProps> = (props) => {
    const [includedBranches, setIncludedBranches] = useObservableArray<string>([]);
    const [suggestions, setSuggestions] = useObservableArray<string>([]);

    let isLoading : boolean = false;
    let availableBranches: string[] = []

    let settingsService: ISettingsService | undefined = undefined;

    useEffect(() => {
        if (!isLoading) {
            isLoading = true;
            loadState();
        }
    })

    const loadState = async () => {
        settingsService = await SettingsService.getInstance();

        var includedBranches = await settingsService.getIncludedBranches(props.buildDefinition.id);

        setIncludedBranches(includedBranches);

        var branches: string[] = props.builds.map((build, index) => (build.sourceBranch));
        availableBranches = branches.filter((branch, index) => branches.indexOf(branch) === index);
    }

    const renderSuggestionItem = (tag: ISuggestionItemProps<string>) => {
        return <div className="body-m">{tag.item}</div>;
    }

    const onTagAdded = async (tag: string) => {
        setIncludedBranches([...includedBranches.value, tag])

        await settingsService?.setIncludedBranches(props.buildDefinition.id, includedBranches.value);
    }

    const onTagRemoved = async (tag: string) => {
        setIncludedBranches(includedBranches.value.filter(x => x !== tag));
        await settingsService?.setIncludedBranches(props.buildDefinition.id, includedBranches.value);
    };

    const onSearchChanged = (searchValue: string) => {
        var filteredItems = availableBranches
            .filter(
                testItem =>
                    includedBranches.value.findIndex(
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
        <div style={{ display: "flex-column", width: "50%", margin: "4px" }}>
            <FormItem label="Branches to include:">
                <TagPicker
                    areTagsEqual={areTagsEqual}
                    convertItemToPill={convertItemToPill}
                    noResultsFoundText={"No Branches found"}
                    onSearchChanged={onSearchChanged}
                    onTagAdded={onTagAdded}
                    onTagRemoved={onTagRemoved}
                    renderSuggestionItem={renderSuggestionItem}
                    selectedTags={includedBranches}
                    suggestions={suggestions}
                    suggestionsLoading={false}
                />
            </FormItem>
        </div>
    );
}