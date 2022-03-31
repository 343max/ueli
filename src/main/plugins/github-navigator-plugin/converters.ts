import {
    defaultGitHubActionIcon,
    defaultGitHubInsightsIcon,
    defaultGitHubPrivateRepoIcon,
    defaultGitHubPullRequestIcon,
    defaultGitHubRepoIcon,
    defaultGitHubSecurityIcon,
} from "./../../../common/icon/default-icons";
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
            "name" | "description" | "owner" | "private"
        >,
    ): SearchResultItem {
        return {
            name: repo.name,
            description: repo.description ?? "",
            icon: repo.private ? defaultGitHubPrivateRepoIcon : defaultGitHubRepoIcon,
            hideMainWindowAfterExecution: true,
            originPluginType: pluginType,
            executionArgument: `${repo.owner.login}/${repo.name}/`,
            searchable: [repo.name],
            supportsAutocompletion: true,
        };
    };

export const repoActionsSearchResults = (
    pluginType: PluginType,
    org: string,
    repo: string,
    owner: string,
): SearchResultItem[] => {
    type Action = { name: string; description: string; icon: Icon };

    const actions: Action[] = [
        { name: "pulls", description: "Pull Requests", icon: defaultGitHubPullRequestIcon },
        { name: `pulls/${owner}`, description: "My Pull Requests", icon: defaultGitHubPullRequestIcon },
        { name: "actions", description: "Actions", icon: defaultGitHubActionIcon },
        { name: "security", description: "Security", icon: defaultGitHubSecurityIcon },
        { name: "insights", description: "Insights", icon: defaultGitHubInsightsIcon },
        { name: "settings", description: "Settings", icon: defaultGitHubSecurityIcon },
    ];

    return actions.map(({ name, description, icon }) => ({
        name,
        description,
        icon,
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${org}/${repo}/${name}/`,
        searchable: [name, description],
        supportsAutocompletion: false,
    }));
};

export const searchResultItemFromHistory = (
    pluginType: PluginType,
    history: string[],
    iconCache: Array<{ name: string; icon: Icon }>,
): SearchResultItem[] => {
    return history.map((value) => ({
        name: value,
        description: "",
        icon: iconCache.find(({ name }) => name === value.split("/")[0])?.icon ?? defaultGitHubRepoIcon,
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${value}/`,
        searchable: [value],
        supportsAutocompletion: true,
    }));
};
