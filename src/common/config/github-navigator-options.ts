export interface GitHubNavigatorOptions {
    isEnabled: boolean;
    prefix: string;
    apiKey: string;
}

export const defaultGitHubNavigatorOptions: GitHubNavigatorOptions = {
    isEnabled: false,
    prefix: "gh ",
    apiKey: "",
};
