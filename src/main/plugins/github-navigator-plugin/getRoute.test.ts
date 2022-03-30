import { getRoute } from "./getRoute";
describe(getRoute.name, () => {
    const prefix = "mr ";
    const divider = "/";
    test("no prefix", () => {
        const res = getRoute("fdgdg", prefix, divider);
        expect(res).toBeNull();
    });

    test("prefix", () => {
        const res = getRoute("mr ", prefix, divider);
        expect(res).toStrictEqual({ items: [], incomplete: "", complete: "", path: "" });
    });

    test("starting", () => {
        const res = getRoute("mr 343m", prefix, divider);
        expect(res).toStrictEqual({ items: [], incomplete: "343m", complete: "", path: "343m" });
    });

    test("starting", () => {
        const res = getRoute("mr 343max/", prefix, divider);
        expect(res).toStrictEqual({ items: ["343max"], incomplete: "", complete: "343max/", path: "343max/" });
    });

    test("starting", () => {
        const res = getRoute("mr 343max/ue", prefix, divider);
        expect(res).toStrictEqual({
            items: ["343max"],
            incomplete: "ue",
            complete: "343max/",
            path: "343max/ue",
        });
    });
    test("starting", () => {
        const res = getRoute("mr 343max/ueli/", prefix, divider);
        expect(res).toStrictEqual({
            items: ["343max", "ueli"],
            incomplete: "",
            complete: "343max/ueli/",
            path: "343max/ueli/",
        });
    });
    test("starting", () => {
        const res = getRoute("mr 343max/ueli/pull", prefix, divider);
        expect(res).toStrictEqual({
            items: ["343max", "ueli"],
            incomplete: "pull",
            complete: "343max/ueli/",
            path: "343max/ueli/pull",
        });
    });

    test("starting", () => {
        const res = getRoute("mr 343max/ueli/pull/", prefix, divider);
        expect(res).toStrictEqual({
            items: ["343max", "ueli", "pull"],
            incomplete: "",
            complete: "343max/ueli/pull/",
            path: "343max/ueli/pull/",
        });
    });
});
