import { defaultCalculatorIcon } from "./../../../common/icon/default-icons";
import { IconType } from "../../../common/icon/icon-type";
import { SearchResultItem } from "../../../common/search-result-item";
import { PluginType } from "../../plugin-type";
import { Octokit } from "@octokit/rest";

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

export const searchResultItemFromRepo =
    (pluginType: PluginType) =>
    (repo: Awaited<ReturnType<Octokit["rest"]["repos"]["listForOrg"]>>["data"][number]): SearchResultItem => ({
        name: repo.name,
        description: repo.description ?? "",
        icon: defaultCalculatorIcon,
        hideMainWindowAfterExecution: true,
        originPluginType: pluginType,
        executionArgument: `${repo.owner}/${repo.name}/`,
        searchable: [repo.name],
        supportsAutocompletion: true,
    });
