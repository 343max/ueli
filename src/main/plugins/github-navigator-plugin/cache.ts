export function setupCache<T>() {
    const cache: { [key: string]: T } = {};

    return async function cached(key: string, fn: () => Promise<T> | T): Promise<T> {
        if (cache[key]) {
            return cache[key];
        } else {
            const result = await fn();
            cache[key] = result;
            return result;
        }
    };
}

export type CachingFunction<T> = (key: string, fn: () => Promise<T>) => Promise<T>;
