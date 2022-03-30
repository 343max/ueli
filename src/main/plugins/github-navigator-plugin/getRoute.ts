export type Route = {
    items: string[];
    incomplete: string;
    complete: string;
    userInput: string;
};

export const getRoute = (userInput: string, prefix: string, divider: string): Route | null => {
    if (!userInput.startsWith(prefix)) {
        return null;
    }
    const path = userInput.substring(prefix.length);
    const complete = path.split(divider);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const incomplete = complete.pop()!;

    return { items: complete, incomplete, complete: [...complete, ""].join(divider), userInput };
};
