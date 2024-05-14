import { setupCache } from "./cache";

describe(setupCache.name, () => {
    test("returns expected result", async () => {
        const cached = setupCache<string>();
        const result = await cached("keyA", async () => "a");
        expect(result).toBe("a");
    });

    test("return different result for different key", async () => {
        const cached = setupCache<string>();
        const resultA = await cached("keyA", async () => "a");
        const resultB = await cached("keyB", async () => "b");
        expect(resultA).toBe("a");
        expect(resultB).toBe("b");
    });

    test("return cached result on second time", async () => {
        const cached = setupCache<string>();
        const work = jest.fn();
        await cached("key", async () => {
            work();
            return "a";
        });
        await cached("key", async () => {
            work();
            return "b";
        });
        expect(work).toHaveBeenCalledTimes(1);
    });
});
