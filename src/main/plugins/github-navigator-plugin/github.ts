import Fuse from "fuse.js";
import { UserConfigOptions } from "../../../common/config/user-config-options";
import { TranslationSet } from "../../../common/translation/translation-set";
import { repoActions, searchResultItemFromOrg, searchResultItemFromRepo, searchResultItemFromUser } from "./converters";
import { SearchResultItem } from "./../../../common/search-result-item";
import { PluginType } from "../../plugin-type";
import { Octokit } from "@octokit/rest";
import { GitHubNavigatorOptions } from "../../../common/config/github-navigator-options";
import { getRoute, Route } from "./getRoute";
import { getNoSearchResultsFoundResultItem } from "../../no-search-results-found-result-item";
import { ExecutionPlugin } from "./../../execution-plugin";
import { CachingFunction, setupCache } from "./cache";
import { AutoCompletionPlugin } from "./../../auto-completion-plugin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GH = { octokit: Octokit; cached: CachingFunction<SearchResultItem[]> };

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
                void (await octokit.users.getAuthenticated());
                const cached = setupCache<SearchResultItem[]>();
                this.gh = { octokit, cached };
            } catch {
                this.gh = "invalid";
            }
        }
    }

    /// ExecutionPlugin

    isValidUserInput(userInput: string): boolean {
        return getRoute(userInput, this.config.prefix, this.divider) !== null;
    }

    async getSearchResults(userInput: string): Promise<SearchResultItem[]> {
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

        return await this.search(route, this.gh);
    }

    isEnabled(): boolean {
        return this.config.isEnabled;
    }

    execute(searchResultItem: SearchResultItem): Promise<void> {
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

    private async search(route: Route, { octokit, cached }: GH): Promise<SearchResultItem[]> {
        if (route.items.length === 0) {
            // owner & orgs
            return filterResults(route.searchTerm, [
                ...(await cached("/", async () => [
                    await searchResultItemFromUser(this.pluginType)((await octokit.users.getAuthenticated()).data),
                ])),
                ...(
                    await octokit.paginate(
                        octokit.rest.orgs.listForAuthenticatedUser,
                        { per_page: 100 },
                        ({ data }) => data,
                    )
                ).map(searchResultItemFromOrg(this.pluginType)),
            ]);
        } else if (route.items.length === 1) {
            // repos
            const owner = route.items[0];
            return filterResults(
                route.searchTerm,
                await cached(route.complete, async () => {
                    if (owner === (await octokit.users.getAuthenticated()).data.login) {
                        return await (
                            await octokit.paginate(
                                octokit.repos.listForAuthenticatedUser,
                                { per_page: 100 },
                                ({ data }) => data,
                            )
                        ).map(searchResultItemFromRepo(this.pluginType));
                    } else {
                        return (
                            await octokit.paginate(
                                octokit.rest.repos.listForOrg,
                                { org: owner, per_page: 100 },
                                ({ data }) => data,
                            )
                        ).map(searchResultItemFromRepo(this.pluginType));
                    }
                }),
            );
        } else if (route.items.length === 2) {
            // actions on repos
            const [owner, repo] = route.items;
            return filterResults(route.searchTerm, repoActions(this.pluginType, owner, repo));
        } else {
            return [];
        }
    }
}

function filterResults(searchTerm: string, results: SearchResultItem[]): SearchResultItem[] {
    if (searchTerm.length === 0) {
        return results;
    } else {
        const fuse = new Fuse(results, {
            distance: 100,
            includeScore: true,
            keys: ["searchable"],
            location: 0,
            minMatchCharLength: 1,
            shouldSort: true,
            threshold: 0.4,
        });
        const fuseResult = fuse.search(searchTerm);
        return fuseResult.map((item) => item.item);
    }
}
