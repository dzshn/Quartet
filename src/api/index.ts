function formattedLog(level: "log" | "error" | "warn" | "info" | "debug", scope: string, ...args: any[]) {
    const altPalette = level === "error" || level === "warn";
    const bgColors = altPalette ? ["#7d2850", "#963060"] : ["#fb84bc", "#fdb9d9"];
    const fgColor = altPalette ? "#feedf5" : "#321020";
    console[level](
        "%c Quartet %c %s %c",
        `background: ${bgColors[0]}; color: ${fgColor}; font-weight: bold;`,
        `background: ${bgColors[1]}; color: ${fgColor};`,
        scope,
        "",
        ...args,
    );
}

export const Log = {
    log: formattedLog.bind(null, "log"),
    error: formattedLog.bind(null, "error"),
    warn: formattedLog.bind(null, "warn"),
    info: formattedLog.bind(null, "info"),
    debug: formattedLog.bind(null, "debug"),
};
