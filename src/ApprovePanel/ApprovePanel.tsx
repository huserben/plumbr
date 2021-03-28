import "./ApprovePanel.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";

import { Button } from "azure-devops-ui/Button";
import { ButtonGroup } from "azure-devops-ui/ButtonGroup";
import { showRootComponent } from "../Common";
import { VariableGroup } from "azure-devops-extension-api/TaskAgent";
import { Card } from "azure-devops-ui/Card";
import { FormItem } from "azure-devops-ui/FormItem";
import { TextField } from "azure-devops-ui/TextField";
import { CustomHeader, HeaderTitleArea, HeaderTitleRow, HeaderTitle, TitleSize } from "azure-devops-ui/Header";
import { Page } from "azure-devops-ui/Page";


export interface IApprovePanelResult {
    approvalComment: string,
    variableGroups: VariableGroup[]
}

interface IApprovePanelContentState {
    variableGroups: VariableGroup[],
    approvalComment: string
}

class ApprovePanel extends React.Component<{}, IApprovePanelContentState> {

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
                SDK.resize(400, 400);
            }
        });
    }

    public render(): JSX.Element {
        const { variableGroups, approvalComment } = this.state;

        return (
            <div className="sample-panel flex-column flex-grow">
                <div className="flex-grow flex-column" style={{ margin: "10px 0" }}>
                    <FormItem
                        label="Approval Comment">
                        <TextField
                            value={approvalComment}
                            multiline={true}
                            placeholder="Approved via Plumbr"
                            onChange={(e, newValue) => {
                                this.setState({ approvalComment: newValue })
                            }}
                        />
                    </FormItem>

                    {variableGroups.map((vg, index) => (
                        <Page>
                            <CustomHeader className="bolt-header-with-commandbar">
                                <HeaderTitleArea>
                                    <HeaderTitleRow>
                                        <HeaderTitle className="text-ellipsis" titleSize={TitleSize.Large}>
                                            {vg.name}
                                        </HeaderTitle>
                                    </HeaderTitleRow>
                                </HeaderTitleArea>
                            </CustomHeader>

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
                        </Page>
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
        var result: IApprovePanelResult | undefined = undefined;

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

showRootComponent(<ApprovePanel />);