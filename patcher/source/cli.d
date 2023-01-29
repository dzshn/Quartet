import core.stdc.errno : EACCES;
import core.stdc.stdlib : exit;

import std.algorithm : among, either;
import std.exception : enforce, ifThrown;
import std.file : exists, FileException, getcwd, isDir;
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
    bool patch;
    bool unpatch;
    auto helpInformation = getopt(
        args,
        "patch", "Patch install without prompting", &patch,
        "unpatch", "Unpatch install without prompting", &unpatch,
        "repatch", "Re-patch an install", { patch = true; unpatch = true; },
    ).ifThrown!GetOptException(e => explode(e.msg));

    if (helpInformation.helpWanted) {
        writeln(YELLOW, "usage:");
        writeln("    ", BLUE, "qpatcher", CYAN, " [options] <TETR.IO path>");
        writeln();
        writeln(YELLOW, "flags:");
        foreach (opt; helpInformation.options) {
            string fmt = "";
            if (opt.optShort)
                fmt ~= opt.optShort ~ ", ";
            if (opt.optLong)
                fmt ~= opt.optLong;
            writeln("    ", BLUE, fmt.leftJustify(15), " ", CYAN, opt.help);
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
            write(YELLOW, "Unpatch", CYAN, " install?", RESET, " [y/N] ");
            if (!readln().strip().among("y", "yes"))
                writeln(RED, "Aborted.", RESET), exit(0);
            unpatch = true;
        } else {
            write(YELLOW, "Patch", CYAN, " install?", RESET, " [y/N] ");
            if (!readln().strip().among("y", "yes"))
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
        try
            patchAsar(resources, getcwd().buildNormalizedPath("..", "dist", "loader.js"));
        catch (FileException e)
            explode(e.msg, e.errno == EACCES ? "run as root!" : null);

        writeln(YELLOW, "Quartet installed!", RESET);
    }
}
