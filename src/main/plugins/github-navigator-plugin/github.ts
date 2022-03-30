import { components } from "./../../../../node_modules/@octokit/openapi-types/types.d";
import { IconType } from "./../../../common/icon/icon-type";
import { ExecutionPlugin } from "./../../execution-plugin";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { SearchResultItem } from "../../../common/search-result-item";
import { TranslationSet } from "../../../common/translation/translation-set";
import { PluginType } from "../../plugin-type";
import { AutoCompletionPlugin } from "./../../auto-completion-plugin";
import { GitHubNavigatorOptions } from "../../../common/config/github-navigator-options";
import { Octokit } from "@octokit/rest";
import { getNoSearchResultsFoundResultItem } from "../../no-search-results-found-result-item";

const searchResultItemFromOrg =
    (pluginType: PluginType) =>
    ({ login, description, avatar_url }: components["schemas"]["organization-simple"]): SearchResultItem => ({
        name: login,
        description: description ?? "",
        icon: { type: IconType.URL, parameter: avatar_url },
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${login}/`,
        searchable: [login],
        supportsAutocompletion: true,
    });

const searchResultItemFromUser =
    (pluginType: PluginType) =>
    ({ name, login, avatar_url }: components["schemas"]["simple-user"]): SearchResultItem => ({
        name: login,
        description: name ?? "",
        icon: { type: IconType.URL, parameter: avatar_url },
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${login}/`,
        searchable: [login, ...(name ? [name] : [])],
        supportsAutocompletion: true,
    });

export class GitHubNavigationPlugin implements AutoCompletionPlugin, ExecutionPlugin {
    public pluginType = PluginType.GitHubNavigator;
    private config: GitHubNavigatorOptions;
    // private generalConfig: GeneralOptions;
    private translationSet: TranslationSet;
    private readonly clipboardCopier: (value: string) => Promise<void>;
    private readonly urlExecutor: (url: string) => Promise<void>;

    private gh: undefined | "invalid" | { octokit: Octokit; cache: { [key: string]: any } };

    constructor(
        config: UserConfigOptions,
        translationSet: TranslationSet,
        clipboardCopier: (value: string) => Promise<void>,
        urlExecutor: (url: string) => Promise<void>,
    ) {
        this.config = config.gitHubNavigatorOptions;
        // this.generalConfig = config.generalOptions;
        this.translationSet = translationSet;
        this.clipboardCopier = clipboardCopier;
        this.urlExecutor = urlExecutor;

        this.setupOctokit();
    }

    private async setupOctokit() {
        this.gh = undefined;

        if (this.config.apiKey.length > 0) {
            const octokit = new Octokit({ auth: this.config.apiKey });
            try {
                const authenticatedUser = (await octokit.users.getAuthenticated()).data;
                this.gh = { octokit, cache: { user: authenticatedUser } };
            } catch {
                this.gh = "invalid";
            }
        }
    }

    /// ExecutionPlugin

    isValidUserInput(userInput: string): boolean {
        return userInput.startsWith(this.config.prefix) && userInput.length >= this.config.prefix.length;
    }

    async getSearchResults(userInput: string, fallback?: boolean): Promise<SearchResultItem[]> {
        console.log({ getSearchResults: { userInput, fallback } });

        if (this.gh === undefined) {
            return [
                getNoSearchResultsFoundResultItem(
                    this.translationSet.githubNoApiKeyErrorMessage,
                    this.translationSet.githubNoApiKeyErrorDescription,
                ),
            ];
        }

        if (this.gh === "invalid") {
            return [
                getNoSearchResultsFoundResultItem(
                    this.translationSet.githubInvalidApiKeyErrorMessage,
                    this.translationSet.githubInvalidApiKeyErrorDescription,
                ),
            ];
        }

        return [
            searchResultItemFromUser(this.pluginType)(
                await this.cached("user", this.gh.octokit.users.getAuthenticated)(),
            ),
            ...(
                await this.cached("orgs", this.gh.octokit.rest.orgs.listForAuthenticatedUser)({ per_page: 200 })
            ).data.map(searchResultItemFromOrg(this.pluginType)),
        ].filter(({ executionArgument }) => `gh ${executionArgument}`.startsWith(userInput));
    }

    isEnabled(): boolean {
        return this.config.isEnabled;
    }

    execute(searchResultItem: SearchResultItem): Promise<void> {
        console.log({ searchResultItem });
        return this.urlExecutor(`https://github.com/${searchResultItem.executionArgument}`);
    }

    public updateConfig(updatedConfig: UserConfigOptions, translationSet: TranslationSet): Promise<void> {
        return new Promise((resolve) => {
            this.config = updatedConfig.gitHubNavigatorOptions;
            // this.generalConfig = updatedConfig.generalOptions;
            this.translationSet = translationSet;

            this.setupOctokit();

            resolve();
        });
    }

    /// AutoCompletionPlugin

    public autoComplete(searchResultItem: SearchResultItem): string {
        console.log({ autoComplete: { searchResultItem } });
        return `${this.config.prefix}${searchResultItem.executionArgument}`;
    }

    /// Helpers

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private cached(cacheKey: string, fn: (...args: any) => Promise<any>): typeof fn {
        return async (...params: Parameters<typeof fn>) => {
            if (this.gh === undefined || this.gh === "invalid") {
                return fn(params);
            } else if (this.gh.cache[cacheKey] !== undefined) {
                return this.gh.cache[cacheKey] as Parameters<ReturnType<typeof fn>["then"]>[0];
            } else {
                const result = await fn(params);
                this.gh.cache[cacheKey] = result;
                return result;
            }
        };
    }
}
