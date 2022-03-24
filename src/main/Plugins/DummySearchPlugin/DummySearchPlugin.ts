import { Searchable } from "../../Core/Searchable";
import { MethodNotImplementedError } from "../../Errors/MethodNotImplementedError";
import { ExecutionContextFactory } from "../../ExecutionContextFactory";
import { SearchPlugin } from "../SearchPlugin";

export class DummySearchPlugin extends SearchPlugin<unknown> {
    public readonly pluginId = "DummySearchPlugin";

    protected readonly defaultSettings = {};

    constructor(
        applicationTempPath: string,
        public onGetAllSearchables?: () => Searchable[],
        public onRescan?: () => Promise<void>,
        public onClearCache?: () => Promise<void>
    ) {
        super(ExecutionContextFactory.fromDummy({ userDataPath: applicationTempPath }));
    }

    public getAllSearchables(): Searchable[] {
        if (this.onGetAllSearchables) {
            return this.onGetAllSearchables();
        }

        throw new MethodNotImplementedError();
    }

    public rescan(): Promise<void> {
        if (this.onRescan) {
            return this.onRescan();
        }

        throw new MethodNotImplementedError();
    }

    public clearCache(): Promise<void> {
        if (this.onClearCache) {
            return this.onClearCache();
        }

        throw new MethodNotImplementedError();
    }
}
