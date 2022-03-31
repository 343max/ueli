import { defaultCalculatorIcon } from "./../../../common/icon/default-icons";
import { IconType } from "../../../common/icon/icon-type";
import { SearchResultItem } from "../../../common/search-result-item";
import { PluginType } from "../../plugin-type";
import { Octokit } from "@octokit/rest";
import { Icon } from "../../../common/icon/icon";

export const searchResultItemFromOrg =
    (pluginType: PluginType) =>
    ({
        login,
        description,
        avatar_url,
    }: Awaited<ReturnType<Octokit["rest"]["orgs"]["listForAuthenticatedUser"]>>["data"][number]): SearchResultItem => ({
        name: login,
        description: description ?? "",
        icon: { type: IconType.URL, parameter: avatar_url },
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${login}/`,
        searchable: [login],
        supportsAutocompletion: true,
    });

export const searchResultItemFromUser =
    (pluginType: PluginType) =>
    ({
        login,
        name,
        avatar_url,
    }: Awaited<ReturnType<Octokit["users"]["getAuthenticated"]>>["data"]): SearchResultItem => ({
        name: login,
        description: name ?? "",
        icon: { type: IconType.URL, parameter: avatar_url },
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${login}/`,
        searchable: [login, ...(name ? [name] : [])],
        supportsAutocompletion: true,
    });

export const searchResultItemFromRepo = (pluginType: PluginType) =>
    function (
        repo: Pick<
            Awaited<ReturnType<Octokit["rest"]["repos"]["listForOrg"]>>["data"][number],
            "name" | "description" | "owner"
        >,
    ): SearchResultItem {
        return {
            name: repo.name,
            description: repo.description ?? "",
            icon: defaultCalculatorIcon,
            hideMainWindowAfterExecution: true,
            originPluginType: pluginType,
            executionArgument: `${repo.owner.login}/${repo.name}/`,
            searchable: [repo.name],
            supportsAutocompletion: true,
        };
    };

export const repoActionsSearchResults = (pluginType: PluginType, owner: string, repo: string): SearchResultItem[] => {
    type Action = { name: string; description: string };

    const actions: Action[] = [
        { name: "pulls", description: "Pull Requests" },
        { name: "actions", description: "Actions" },
        { name: "security", description: "Security" },
        { name: "insights", description: "Insights" },
        { name: "settings", description: "Settings" },
    ];

    return actions.map(({ name, description }) => ({
        name,
        description,
        icon: defaultCalculatorIcon,
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${owner}/${repo}/${name}/`,
        searchable: [name, description],
        supportsAutocompletion: false,
    }));
};

export const searchResultItemFromHistory = (
    pluginType: PluginType,
    history: string[],
    iconCache: Array<{ login: string; avatar_url: string }>,
): SearchResultItem[] => {
    const orgIcon = (value: string): Icon | undefined => {
        const cacheItem = iconCache.find(({ avatar_url }) => avatar_url === value);
        if (cacheItem === undefined) {
            return undefined;
        } else {
            return { type: IconType.URL, parameter: cacheItem.avatar_url };
        }
    };
    return history.map((value) => ({
        name: value,
        description: "",
        icon: orgIcon(value.split("/")[0]) ?? defaultCalculatorIcon,
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${value}/`,
        searchable: [value],
        supportsAutocompletion: true,
    }));
};
