import { defaultCalculatorIcon } from "./../../../common/icon/default-icons";
import { ExecutionPlugin } from "./../../execution-plugin";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { SearchResultItem } from "../../../common/search-result-item";
import { TranslationSet } from "../../../common/translation/translation-set";
import { PluginType } from "../../plugin-type";
import { AutoCompletionPlugin } from "./../../auto-completion-plugin";
import { GitHubNavigatorOptions } from "../../../common/config/github-navigator-options";

export class GitHubNavigationPlugin implements AutoCompletionPlugin, ExecutionPlugin {
    public pluginType = PluginType.GitHubNavigator;
    private config: GitHubNavigatorOptions;
    // private generalConfig: GeneralOptions;
    private translationSet: TranslationSet;
    private readonly clipboardCopier: (value: string) => Promise<void>;

    constructor(
        config: UserConfigOptions,
        translationSet: TranslationSet,
        clipboardCopier: (value: string) => Promise<void>,
    ) {
        this.config = config.gitHubNavigatorOptions;
        // this.generalConfig = config.generalOptions;
        this.translationSet = translationSet;
        this.clipboardCopier = clipboardCopier;
    }

    /// ExecutionPlugin

    isValidUserInput(userInput: string, fallback?: boolean): boolean {
        console.log({ userInput, fallback });
        return userInput.startsWith(this.config.prefix) && userInput.length > this.config.prefix.length;
    }

    getSearchResults(userInput: string, fallback?: boolean): Promise<SearchResultItem[]> {
        console.log({ userInput, fallback });
        return new Promise((resolve) => {
            resolve([
                {
                    description: "description",
                    executionArgument: "executionArgument",
                    hideMainWindowAfterExecution: false,
                    icon: defaultCalculatorIcon, // TODO: change
                    name: "name",
                    originPluginType: this.pluginType,
                    searchable: [],
                },
            ]);
        });
    }

    isEnabled(): boolean {
        return this.config.isEnabled;
    }

    execute(searchResultItem: SearchResultItem, privileged: boolean): Promise<void> {
        console.log({ searchResultItem, privileged });
        return this.clipboardCopier(JSON.stringify({ searchResultItem, privileged }));
    }

    public updateConfig(updatedConfig: UserConfigOptions, translationSet: TranslationSet): Promise<void> {
        return new Promise((resolve) => {
            this.config = updatedConfig.gitHubNavigatorOptions;
            // this.generalConfig = updatedConfig.generalOptions;
            this.translationSet = translationSet;
            resolve();
        });
    }

    /// AutoCompletionPlugin

    public autoComplete(searchResultItem: SearchResultItem): string {
        console.log(searchResultItem);
        return "x";
    }
}
