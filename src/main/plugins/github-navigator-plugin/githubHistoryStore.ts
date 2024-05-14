import Store = require("electron-store");

export type GithubHistoryStore = {
    get: () => string[];
    add: (item: string) => Promise<void>;
};

export const setupGithubHistoryStore = (): GithubHistoryStore => {
    const storeKey = "githubNavigationHistory";
    const store = new Store();
    const historyFromStore = store.get(storeKey);
    let history: string[] = typeof historyFromStore === "object" ? (historyFromStore as string[]) : [];

    return {
        get: () => history,
        add: async (item) => {
            history = [item, ...history.filter((value) => item !== value)].slice(0, 20);
            store.set(storeKey, history);
        },
    };
};
