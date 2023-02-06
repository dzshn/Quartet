import core.stdc.errno : EACCES;
import core.stdc.stdlib : exit;

import std.algorithm : among, either;
import std.exception : enforce, ifThrown;
import std.file : exists, FileException, getcwd, isDir, mkdirRecurse;
import std.format : format;
import std.getopt : getopt, GetOptException;
import std.path : buildNormalizedPath, buildPath;
import std.stdio : readln, writeln, write;
import std.string : leftJustify, strip;

import common;

const CSI = "\x1b[";
const BLACK = CSI ~ "30m";
const RED = CSI ~ "31m";
const GREEN = CSI ~ "32m";
const YELLOW = CSI ~ "33m";
const BLUE = CSI ~ "34m";
const MAGENTA = CSI ~ "35m";
const CYAN = CSI ~ "36m";
const RESET = CSI ~ "0m";


const SHORT_HELP = YELLOW ~ "usage: " ~ BLUE ~ "qpatcher" ~ CYAN ~ " [options] <TETR.IO path>" ~ RESET;


string askPath() {
    writeln(YELLOW, "Couldn't find TETR.IO path. Please enter manually", RESET);
    string path;
    while (true) {
        write(BLUE, "? ", RESET);
        path = readln().strip();
        if (path is null) {
            writeln("^D");
            exit(0);
        }
        if (path.exists)
            return path;
        writeln(RED, path.format!"path %s does not exist");
    }
}


noreturn explode(const string msg, const string hint = "Try running --help\n    " ~ SHORT_HELP) {
    writeln(RED, "Error: ", RESET, msg);
    if (hint)
        writeln(BLUE, "Hint: ", RESET, hint);
    exit(1);
}


void main(string[] args) {
    string quartetPath;
    bool patch;
    bool unpatch;
    bool noDownload;
    bool noLocal;
    auto helpInformation = getopt(
        args,
        "patch", "Patch install without prompting", &patch,
        "unpatch", "Unpatch install without prompting", &unpatch,
        "repatch", "Unpatch then patch an install without prompting", { patch = true; unpatch = true; },
        "path", "Specify where Quartet will be downloaded to, or is already present", &quartetPath,
        "no-download", "Don't download anything", &noDownload,
        "no-local", "Don't use local dev build (../dist)", &noLocal,
    ).ifThrown!GetOptException(e => explode(e.msg));

    if (helpInformation.helpWanted) {
        writeln(YELLOW, "usage:");
        writeln("    ", BLUE, "qpatcher", CYAN, " [options] [TETR.IO path]", RESET);
        writeln();
        writeln("    If no path is provided, qpatcher will try common paths and fallback to");
        writeln("    prompting. On some platforms, you might need to run this as root (admin)");
        writeln();
        writeln("    More info can be found at: https://github.com/dzshn/Quartet");
        writeln();
        writeln(YELLOW, "flags:");
        foreach (opt; helpInformation.options) {
            string fmt = "";
            if (opt.optShort)
                fmt ~= opt.optShort;
            if (opt.optShort && opt.optLong)
                fmt ~= ", ";
            if (opt.optLong)
                fmt ~= opt.optLong;
            auto help = opt.help;
            if (opt.optLong == "--help")
                help = "Print this message and quit";
            writeln("    ", BLUE, fmt.leftJustify(15), " ", CYAN, help);
        }
        return;
    }

    if (args.length > 2)
        explode("unknown argument: " ~ args[2]);

    const string path = args.length > 1 ? args[1] : either(guessPath(), askPath());
    const string resources = path.buildPath("resources");

    enforce(path.isDir)
        .ifThrown(explode(path.format!"path %s does not exist or is not a directory"));
    enforce(resources.isDir)
        .ifThrown(explode("bad TETR.IO directory: no resources dir", "specify base dir, not resources"));

    const isPatched = resources.buildPath("app.asar").isDir;

    if (!patch && !unpatch) {
        if (isPatched) {
            write(CYAN, "Unpatch install?", RESET, " [y/N] ");
            if (!readln().strip().among("y", "yes"))
                writeln(RED, "Aborted.", RESET), exit(0);
            unpatch = true;
        } else {
            write(CYAN, "Patch install?", RESET, " [Y/n] ");
            if (!readln().strip().among("y", "yes", ""))
                writeln(RED, "Aborted.", RESET), exit(0);
            patch = true;
        }
    }

    if (isPatched && !unpatch)
        explode("Already patched!", null);

    if (!isPatched && unpatch)
        explode("Nothing to unpatch!", null);

    if (unpatch) {
        try
            unpatchAsar(resources);
        catch (FileException e)
            explode(e.msg, e.errno == EACCES ? "run as root!" : null);

        writeln(YELLOW, "Quartet uninstalled!", RESET);
    }
    if (patch) {
        const localQuartet = getcwd().buildNormalizedPath("..", "dist");
        if (!noLocal && !quartetPath && localQuartet.exists) {
            writeln("Using ../dist");
            quartetPath = localQuartet;
        } else {
            quartetPath = either(quartetPath, getInstallPath(), explode("no appropriate install path", null));

            if (!quartetPath.exists) {
                quartetPath.mkdirRecurse();
                version (Posix) {
                    quartetPath.fixPerms();
                }
            }

            if (!noDownload) {
                try
                    downloadQuartet(quartetPath);
                catch (Exception e)
                    explode(e.msg, null);
            }
        }

        try
            patchAsar(resources, quartetPath.buildPath("loader.js"));
        catch (FileException e)
            explode(e.msg, e.errno == EACCES ? "run as root!" : null);

        writeln(YELLOW, "Quartet installed!", RESET);
    }
}
