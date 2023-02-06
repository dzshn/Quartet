import requests : Request;

import std.algorithm : either;
import std.conv : octal, to;
import std.exception : enforce;
import std.file : exists, getAttributes, mkdir, rename, remove, rmdirRecurse, setAttributes;
import std.format : format;
import std.json : JSONOptions, JSONValue, toJSON;
import std.path : buildPath, expandTilde;
import std.stdio : File, toFile, writeln, writefln;
import std.string : toStringz;
import std.process : environment;

const DEVBUILD_DOWNLOAD = "https://github.com/dzshn/Quartet/releases/download/devbuild";

void downloadQuartet(const string installPath) {
    auto rq = Request();

    static foreach (filename; ["loader.js", "preload.js", "quartet.js"]) {{
        const filePath = installPath.buildPath(filename);
        if (filePath.exists)
            filePath.remove();

        writeln("Downloading ", filename, " to ", installPath);
        auto res = rq.get(DEVBUILD_DOWNLOAD ~ "/" ~ filename);
        enforce(res.code == 200, format!"failed to download %s"(filename));
        File(filePath, "wb").rawWrite(res.responseBody.data);
        version (Posix) filePath.fixPerms();
    }}
}


version (Posix) void fixPerms(const string path) {
    import core.sys.posix.unistd : chown;
    import core.sys.posix.pwd : getpwnam;

    auto realUser = getRealUser;
    enforce(realUser, path.format!"Can't fix permissions for %s. Please use either doas or sudo!");

    auto userpwd = getpwnam(realUser.toStringz);

    chown(path.toStringz, userpwd.pw_uid, userpwd.pw_gid);
}


string getRealUser() {
    return either(environment.get("DOAS_USER"), environment.get("SUDO_USER"));
}


string getInstallPath() {
    version (Windows) {
        auto base = environment.get("LOCALAPPDATA");
    } else version (OSX) {
        auto base = "~/Library/Application Support/Quartet/build".expandTilde;
    } else version (Posix) {
        auto realUser = getRealUser();
        if (!realUser)
            return null;
        auto base = environment.get("XDG_DATA_HOME", "~" ~ realUser ~ "/.local/share").expandTilde;
    } else {
        return null;
    }

    return base.buildPath("Quartet", "build");
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
        .toString(JSONOptions.doNotEscapeSlashes) // why is that not default?
        .format!"require(%s)"
        .toFile(asar.buildPath("main.js"));
}
