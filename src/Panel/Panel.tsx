import "./Panel.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { showRootComponent } from "../Common";
import { VariableGroup } from "azure-devops-extension-api/TaskAgent";
import { Card } from "azure-devops-ui/Card";
import { FormItem } from "azure-devops-ui/FormItem";
import { TextField } from "azure-devops-ui/TextField";


export interface IPanelResult{
    approvalComment: string,
    variableGroups: VariableGroup[]
}

interface IPanelContentState {
    variableGroups: VariableGroup[],
    approvalComment: string
}

class PanelContent extends React.Component<{}, IPanelContentState> {

    constructor(props: {}) {
        super(props);
        this.state = {
            variableGroups: [],
            approvalComment: ""
        };
    }

    public componentDidMount() {
        SDK.init();

        SDK.ready().then(() => {
            const config = SDK.getConfiguration();
            const variableGroups = config.variableGroups || [];
            this.setState({ variableGroups });

            if (config.dialog) {
                // Give the host frame the size of our dialog content so that the dialog can be sized appropriately.
                // This is the case where we know our content size and can explicitly provide it to SDK.resize. If our
                // size is dynamic, we have to make sure our frame is visible before calling SDK.resize() with no arguments.
                // In that case, we would instead do something like this:
                //
                // SDK.notifyLoadSucceeded().then(() => {
                //    // we are visible in this callback.
                //    SDK.resize();
                // });
                SDK.resize(400, 400);
            }
        });
    }

    public render(): JSX.Element {
        const { variableGroups, approvalComment } = this.state;

        return (
            <div className="sample-panel flex-column flex-grow">
                <div className="flex-grow flex-column" style={{ border: "1px solid #eee", margin: "10px 0" }}>
                    <FormItem
                        label="Approval Comment">
                        <TextField
                            value={approvalComment}
                            onChange={(e, newValue) => {
                                this.setState({ approvalComment: newValue })
                            }}
                        />
                    </FormItem>

                    {variableGroups.map((vg, index) => (
                        <Card
                            titleProps={{ text: vg.name }}
                        >
                            <div className="page-content page-content-top flex-column rhythm-vertical-16">
                                {Object.keys(vg.variables).map((variableKey, index) => (
                                    <FormItem
                                        label={variableKey}>
                                        <TextField
                                            value={vg.variables[variableKey].value}
                                            inputType={vg.variables[variableKey].isSecret ? "password" : "text"}
                                            onChange={(e, newValue) => {
                                                (vg.variables[variableKey].value = newValue)
                                                this.setState({ variableGroups: this.state.variableGroups })
                                            }}
                                        />
                                    </FormItem>
                                ))
                                }
                            </div>
                        </Card>
                    ))}
                </div>
                <ButtonGroup className="sample-panel-button-bar">
                    <Button
                        primary={true}
                        text="Approve"
                        onClick={() => this.dismiss(true)}
                    />
                    <Button
                        text="Cancel"
                        onClick={() => this.dismiss(false)}
                    />
                </ButtonGroup>
            </div>
        );
    }

    private dismiss(isApproved: boolean) {
        var result: IPanelResult | undefined = undefined;

        if (isApproved) {
            result = {
                approvalComment: this.state.approvalComment,
                variableGroups: this.state.variableGroups
            }
        }

        const config = SDK.getConfiguration();
        if (config.dialog) {
            config.dialog.close(result);
        }
        else if (config.panel) {
            config.panel.close(result);
        }
    }
}

showRootComponent(<PanelContent />);