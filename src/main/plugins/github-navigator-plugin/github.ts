import { MapFunction } from "./../../../../node_modules/@octokit/plugin-paginate-rest/dist-types/types.d";
import { SearchResultItem } from "./../../../common/search-result-item";
import { getRoute, Route } from "./getRoute";
import { ExecutionPlugin } from "./../../execution-plugin";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { TranslationSet } from "../../../common/translation/translation-set";
import { PluginType } from "../../plugin-type";
import { AutoCompletionPlugin } from "./../../auto-completion-plugin";
import { GitHubNavigatorOptions } from "../../../common/config/github-navigator-options";
import { Octokit } from "@octokit/rest";
import { getNoSearchResultsFoundResultItem } from "../../no-search-results-found-result-item";
import { searchResultItemFromOrg, searchResultItemFromRepo, searchResultItemFromUser } from "./converters";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GH = { octokit: Octokit; cache: { [key: string]: any } };

export class GitHubNavigationPlugin implements AutoCompletionPlugin, ExecutionPlugin {
    public pluginType = PluginType.GitHubNavigator;
    private config: GitHubNavigatorOptions;
    // private generalConfig: GeneralOptions;
    private translationSet: TranslationSet;
    private readonly clipboardCopier: (value: string) => Promise<void>;
    private readonly urlExecutor: (url: string) => Promise<void>;
    private readonly divider = "/";

    private gh: undefined | "invalid" | GH;

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
        return getRoute(userInput, this.config.prefix, this.divider) !== null;
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

        const route = getRoute(userInput, this.config.prefix, this.divider) as Route;

        return this.search(route, this.gh);
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
        return `${this.config.prefix}${searchResultItem.executionArgument}`;
    }

    /// Helpers

    private async search(route: Route, gh: GH): Promise<SearchResultItem[]> {
        console.log(route);
        if (route.items.length === 0) {
            return filterResults(
                [
                    searchResultItemFromUser(this.pluginType)(
                        await (
                            await this.cached(gh, "user", gh.octokit.users.getAuthenticated)()
                        ).data,
                    ),
                    ...(
                        await this.cached(gh, "orgs", gh.octokit.rest.orgs.listForAuthenticatedUser)({ per_page: 200 })
                    ).data.map(searchResultItemFromOrg(this.pluginType)),
                ],
                route.userInput,
            );
        } else if (route.items.length === 1) {
            const owner = route.items[0];
            return filterResults(
                (await this.cached(gh, `${owner}/repos/`, gh.octokit.rest.repos.listForOrg)({ org: owner })).data.map(
                    searchResultItemFromRepo(this.pluginType),
                ),
                route.userInput,
            );
        } else {
            return [];
        }
    }

    private cached<T extends (...args: any[]) => Promise<any>>(gh: GH, cacheKey: string, fn: T) {
        return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
            if (gh.cache[cacheKey] !== undefined) {
                return gh.cache[cacheKey] as Awaited<ReturnType<T>>;
            } else {
                const result = await fn(...args);
                gh.cache[cacheKey] = result;
                return result;
            }
        };
    }
}

function filterResults(results: SearchResultItem[], userInput: string): SearchResultItem[] {
    return results.filter(({ executionArgument }) => `gh ${executionArgument}`.startsWith(userInput));
}
