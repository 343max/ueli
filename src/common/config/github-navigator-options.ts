export interface GitHubNavigatorOptions {
    isEnabled: boolean;
    prefix: string;
    apiKey: string | null;
}

export const defaultGitHubNavigatorOptions: GitHubNavigatorOptions = {
    isEnabled: false,
    prefix: "gh",
    apiKey: null,
};
