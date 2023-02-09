mod patcher;
mod paths;

use std::{
    fs,
    io::{self, Write},
    path::PathBuf,
    process::exit,
};

use clap::{arg, command, value_parser, Arg, ArgAction};
use is_terminal::IsTerminal;
use patcher::{check_patched, download_quartet, patch_asar};
use paths::{get_install_path, guess_path};

use crate::patcher::unpatch_asar;
#[cfg(target_os = "linux")]
use crate::paths::fix_perms;

const HELP_TEMPLATE: &str = "\
%blue%{name} %cyan%{version}%reset%
Justice Almanzar; Sofia Lima

%yellow%usage:%reset%
    If no path is provided, qpatcher will try common paths and fallback to
    prompting. On some platforms, when using a system package manager, you
    might need to run this as root with doas or sudo.

    %blue%More info can be found at: %cyan%https://github.com/dzshn/Quartet%reset%

%yellow%flags:%reset%
{options}
";

macro_rules! sgr {
    ($c:expr) => {
        concat!("\x1b[", stringify!($c), "m")
    };
}

macro_rules! interpolate {
    ($base:expr, $( $a:ident = $b:expr ),*) => {
        $base$(.replace(concat!("%", stringify!($a), "%"), $b))*
    };
}

macro_rules! confirm {
    ($q:expr, $pat:pat) => {
        match ask($q).as_str() {
            $pat => true,
            _ => false,
        }
    };
    (Y $q:expr) => {
        confirm!($q, "y" | "yes" | "")
    };
    (N $q:expr) => {
        confirm!($q, "y" | "yes")
    };
}

macro_rules! explode {
    ($msg:expr) => {
        explode!($msg, "Try running --help\n%yellow%usage: %blue%qpatcher %cyan%[options] <TETR.IO path>%reset%");
    };
    ($msg:expr, $hint:expr) => {
        print!("{}", colored("%red%Error: %reset%"));
        println!("{}", colored($msg));
        if $hint.len() > 0 {
            print!("{}", colored("%blue%Hint: %reset%"));
            println!("{}", colored($hint));
        }
        exit(0);
    };
}

fn colored(text: &str) -> String {
    if io::stdout().is_terminal() {
        interpolate!(
            text,
            red = sgr!(31),
            green = sgr!(32),
            yellow = sgr!(33),
            blue = sgr!(34),
            cyan = sgr!(36),
            reset = sgr!(0)
        )
    } else {
        interpolate!(
            text,
            red = "",
            green = "",
            yellow = "",
            blue = "",
            cyan = "",
            reset = ""
        )
    }
}

fn ask(prompt: &str) -> String {
    let mut res = String::new();
    print!("{}", colored(prompt));
    io::stdout().flush().unwrap();
    io::stdin().read_line(&mut res).expect("j");
    if res.len() == 0 {
        // EOF
        println!("^D");
        exit(0);
    }
    res.truncate(res.trim_end().len());
    res
}

fn ask_path() -> PathBuf {
    println!(
        "{}",
        colored("%yellow%Couldn't find TETR.IO path. Please enter manually%reset%")
    );

    loop {
        let path = path!(&ask("%blue%? %reset%"));
        if path.exists() {
            return path;
        }
        println!("{}", colored("%red%That path does not exist.%reset%"));
    }
}

fn main() {
    let m = command!()
        .help_template(colored(HELP_TEMPLATE))
        .disable_colored_help(true)
        .args([
            arg!(--patch "Patch install without prompting"),
            arg!(--unpatch "Unpatch install without prompting"),
            arg!(--repatch "Unpatch then patch install"),
            Arg::new("path")
                .long("path")
                .value_parser(value_parser!(PathBuf))
                .help("Specify where Quartet will be located at"),
            Arg::new("download")
                .long("no-download")
                .action(ArgAction::SetFalse)
                .help("Don't download anything"),
            Arg::new("local")
                .long("no-local")
                .action(ArgAction::SetFalse)
                .help("Don't use local build (../dist)"),
            Arg::new("tetrio_path")
                .value_name("TETR.IO path")
                .help("Path to TETR.IO install"),
        ])
        .get_matches();

    let repatch = m.get_flag("repatch");
    let mut patch = repatch || m.get_flag("patch");
    let mut unpatch = repatch || m.get_flag("unpatch");
    let mut download = m.get_flag("download");
    let local = m.get_flag("local");

    let mut default_quartet_path: PathBuf = Default::default();
    let quartet_path = m.get_one::<PathBuf>("path").unwrap_or_else(|| {
        let local_quartet = path!("../dist").canonicalize();
        default_quartet_path = match (local, local_quartet) {
            (true, Ok(path)) if path.exists() => {
                println!("Using ../dist");
                download = false;
                path
            }
            _ => get_install_path().expect("no appropriate install path"),
        };
        &default_quartet_path
    });

    let path = guess_path().unwrap_or_else(ask_path);
    let resources = path!(&path, "resources");

    if !path.is_dir() {
        explode!(&format!(
            "path {} does not exist or is not a directory",
            path.display()
        ));
    }
    if !resources.is_dir() {
        explode!(
            "bad TETR.IO directory: no resources dir",
            "specify base dir, not resources"
        );
    }

    let is_patched = check_patched(&resources);

    if !(patch || unpatch) {
        if is_patched {
            if !confirm!(Y "%cyan%Unpatch install? %reset%[y/N] ") {
                println!("{}", colored("%redAborted.%reset%"));
                return;
            }
            unpatch = true;
        } else {
            if !confirm!(N "%cyan%Patch install? %reset%[Y/n] ") {
                println!("{}", colored("%red%Aborted.%reset%"));
                return;
            }
            patch = true;
        }
    }

    if is_patched && !unpatch {
        explode!("Already patched!", "");
    }
    if !is_patched && unpatch {
        explode!("Nothing to unpatch!", "");
    }

    if unpatch {
        match unpatch_asar(&resources) {
            Ok(()) => println!("{}", colored("%yellow%Quartet uninstalled!%reset%")),
            Err(e) if e.kind() == io::ErrorKind::PermissionDenied => {
                explode!(format!("{:?}", e).as_str(), "run as root!");
            }
            Err(e) => {
                explode!(format!("{:?}", e).as_str(), "");
            }
        }
    }
    if patch {
        if download {
            fs::create_dir_all(quartet_path).unwrap();
            #[cfg(target_os = "linux")]
            fix_perms(&quartet_path);
            download_quartet(&quartet_path).unwrap();
        }

        match patch_asar(&resources, &path!(quartet_path, "loader.js")) {
            Ok(()) => println!("{}", colored("%yellow%Quartet installed!%reset%")),
            Err(e) if e.kind() == io::ErrorKind::PermissionDenied => {
                explode!(format!("{:?}", e).as_str(), "run as root!");
            }
            Err(e) => {
                explode!(format!("{:?}", e).as_str(), "");
            }
        }
    }
}
