import std.file : exists, mkdir, rename, rmdirRecurse;
import std.format : format;
import std.json : JSONValue, toJSON;
import std.path : buildPath;
import std.stdio : toFile, writeln;
import std.process : environment;


string guessPath() {
    // TODO: find more of these
    version (Windows) {
        auto localAppData = environment.get("LOCALAPPDATA");
        auto paths = [
            localAppData.buildPath("Programs", "tetrio-desktop")
        ];
    } else version (OSX) {
        auto paths = [
            "~/Applications".expandTilde,
        ];
    } else version (Posix) {
        auto paths = [
            "/opt/TETR.IO"
        ];
    } else {
        auto string[] paths = [];
    }

    foreach (path; paths) {
        if (path.exists) {
            writeln("Found path ", path);
            return path;
        }
    }

    return null;
}


void unpatchAsar(const string resources) {
    const asar = resources.buildPath("app.asar");
    const tempAsar = resources.buildPath("app.asar~");
    const originalAsar = resources.buildPath("_app.asar");

    asar.rename(tempAsar);
    scope(success) tempAsar.rmdirRecurse();
    scope(failure) tempAsar.rename(asar);
    originalAsar.rename(asar);
}


void patchAsar(const string resources, const string bundle) {
    const packageJson = `{"name": "tetrio-desktop", "main": "main.js"}`;
    const asar = resources.buildPath("app.asar");
    const originalAsar = resources.buildPath("_app.asar");

    asar.rename(originalAsar);
    asar.mkdir();
    packageJson.toFile(asar.buildPath("package.json"));
    JSONValue(bundle).toString().format!"require(%s)".toFile(asar.buildPath("main.js"));
}
