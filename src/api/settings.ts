// TODO: bother with ipc and all that (tetr.io also uses localStorage btw)

export interface Settings {
    plugins: Record<string, {
        enabled: boolean;
    }>;
}

const defaults = {
    plugins: {},
};

const settings = (() => {
    try {
        return { ...defaults, ...JSON.parse(localStorage.getItem("quartetConfig") || "") };
    } catch {
        return defaults;
    }
})() as Settings;

function makeProxy<T extends object>(settings: T): T {
    return new Proxy(settings, {
        get(target, prop: Extract<keyof T, string>) {
            const value = target[prop];

            if (typeof value === "object" && !Array.isArray(value) && value != null)
                return makeProxy(value);

            return value;
        },
        set(target, prop: Extract<keyof T, string>, value) {
            target[prop] = value;
            localStorage.setItem("quartetConfig", JSON.stringify(settings));
            return true;
        },
    });
}

export const Settings = makeProxy(settings);
