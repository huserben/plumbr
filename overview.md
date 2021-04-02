# Plumbr - Your Pipeline Manager
Do you want to be able to easily promote builds into the next stage on demand? Would you like to configure variables before triggering the next stage?
Or do you just want to get a nice overview over your pipelines and different stages? Either way, Plumbr got you covered!

## Overview
At its very basic, Plumbr will just give you a different view on your [Multistage Yaml Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/stages?view=azure-devops&tabs=yaml).  

Via the added item in the *Pipelines* menu, you can get an overview over past and present pipelines and the state of the various stages:  
![Plumbr Overview](https://raw.githubusercontent.com/huserben/plumbr/main/Images/overview.png)

Artifacts produced by a job within any stage will be displayed and can be downloaded with one click.

If you have configured [approvals](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/approvals?view=azure-devops&tabs=check-pass) for any stage, you'll see it on the respective stage that an approval is pending and you can approve directly.

## Approving Stages
Without any extra configuration, an approval can be done by the click of a button with a comment that can be provided (but is not necessary):
![Simple Approval](https://raw.githubusercontent.com/huserben/plumbr/main/Images/simple_approval.png)

There is however an extended option to also configure [variable group](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml) variables before approving the stage. This can be useful if you want to to manually run a stage and you have to provide some specific input to that stage. Via a variable group this can be set and then read from within the stage.

Assuming we have following Variable Groups:
![Variable Groups](https://raw.githubusercontent.com/huserben/plumbr/main/Images/variable_groups.png)  

We can configure a stage to require the user to set values for the group "Variable Group" upon approval (see below for the details on the configuration).
This will make the approval look like this:
![Variable Config Approval](https://raw.githubusercontent.com/huserben/plumbr/main/Images/variable_config_approval.png)

Every variable in the variable group will be displayed - secure variables will be protected using password fields. After clicking *Approve* the specified values will be set to the variable group before the environment is approved.

## Configuration
On first open you'll be greated by the following screen

![Zero Data](https://raw.githubusercontent.com/huserben/plumbr/main/Images/zero_data.png)

In order to display something, you'll need to head over to the settings and configure:
- Which Pipelines you want to include
- Which branches you want to include (per Pipeline)
- Which stages you want to exclude (per Pipeline)
- Which Stages should have a "Variable Group Configuration" (per Pipeline)

![Settings](https://raw.githubusercontent.com/huserben/plumbr/main/Images/settings.png)

You will see all Pipelines configured for your Team Project and can individually include the ones you want to see:

![Pipeline Display](https://raw.githubusercontent.com/huserben/plumbr/main/Images/pipeline_display.png)

Once included, you must choose the branches to include. By clicking on the *+* sign you can enter a name, you'll see available branches that match what you typed. You'll only see branches where at least one build of this pipeline is available for.

![Include Branch](https://raw.githubusercontent.com/huserben/plumbr/main/Images/include_branch.png)

Once you've done this you can switch back to the *Overview* and you should see your pipelines being loaded.

If you're not interested in all the stages that are displayed, you can head back to the settings and add all stages you want to hide for a pipeline to the *Stages to Ignore*.
As with the branches to include, you'll see the matching stages once you start typing. After adding the stage you won't see the dedicated box anymore in the overview.
*Note: The stage identifier (and not display name) shall be specified here*

If you like to have a *Variable Group Configuration Approval*, you can just click on the variable group you want to have included in the approval for the stage in the specific *Variable Group Configuration* box. You can also select more than one variable group if needed.

## Issues, Feedbacks, Contributions
This extension was made as a hobby project for me to learn more about Azure DevOps extensions, Typescript and React. I expect that there are some things that won't work as you would expect them. As this extension is maintained in my free time, I cannot guarantee that any of the feedbacks will be implemented. However I do appreciate getting feedbacks in case you have questions, found a problem or have a proposal for a new feature.

In any of those cases, please raise an [Issue on the github repository](https://github.com/huserben/plumbr/issues).

*Please check if the same/similar request was already made and rather upvote this one than creating a new one*

## Icons

Plumbr Icons made by [itim2101](https://www.flaticon.com/authors/itim2101) from [www.flaticon.com](https://www.flaticon.com/)