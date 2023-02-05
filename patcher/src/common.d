import etc.c.curl :
    curl_easy_init, curl_easy_cleanup, curl_easy_setopt, curl_easy_strerror, curl_easy_perform,
    CurlOption, CurlError;

import std.conv : to;
import std.file : exists, mkdir, rename, remove, rmdirRecurse;
import std.format : format;
import std.json : JSONOptions, JSONValue, toJSON;
import std.path : buildPath;
import std.stdio : File, toFile, writeln;
import std.string : toStringz;
import std.process : environment;

const DEVBUILD_DOWNLOAD = "https://github.com/dzshn/Quartet/releases/download/devbuild";

alias easy_cleanup = curl_easy_cleanup;
alias easy_perform = curl_easy_perform;
alias easy_setopt = curl_easy_setopt;
alias easy_strerror = curl_easy_strerror;

void downloadQuartet(const string path) {
    auto curl = curl_easy_init();
    if (!curl)
        throw new Error("could not initialise curl");
    scope (exit) curl.easy_cleanup();

    static foreach (filename; ["loader.js", "preload.js", "quartet.js"]) {{
        const fpath = path.buildPath(filename);
        if (fpath.exists)
            fpath.remove();

        auto file = File(path.buildPath(filename), "w");
        writeln("Downloading ", filename, " to ", path);
        curl.easy_setopt(CurlOption.url, (DEVBUILD_DOWNLOAD ~ "/" ~ filename).toStringz);
        curl.easy_setopt(CurlOption.file, file.getFP);
        curl.easy_setopt(CurlOption.followlocation, true);
        auto res = curl.easy_perform();
        if (res != CurlError.ok)
            throw new Exception("could not download " ~ filename ~ ": " ~ res.easy_strerror.to!string);
    }}
}


string guessPath() {
    // TODO: find more of these
    version (Windows) {
        auto localAppData = environment.get("LOCALAPPDATA");
        auto paths = [
            localAppData.buildPath("Programs", "tetrio-desktop"),
        ];
    } else version (OSX) {
        auto paths = [
            "~/Applications".expandTilde,
        ];
    } else version (Posix) {
        auto paths = [
            "/opt/TETR.IO",
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
    packageJson
        .toFile(asar.buildPath("package.json"));
    JSONValue(bundle)
        .toString(JSONOptions.doNotEscapeSlashes)
        .format!"require(%s)"
        .toFile(asar.buildPath("main.js"));
}
