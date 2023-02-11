#![warn(clippy::pedantic)]
mod patcher;
mod paths;

use std::{
    env, fs,
    io::{self, Write},
    path::PathBuf,
    process::exit,
};

use clap::{arg, command, value_parser, Arg, ArgAction};
use owo_colors::{Style, StyledList};
use patcher::{check_patched, download_quartet, patch_asar};
use paths::{get_install_path, guess_path};

use crate::patcher::unpatch_asar;
#[cfg(target_os = "linux")]
use crate::paths::fix_perms;

macro_rules! colored {
    ([$color:ident $text:expr]) => {
        Style::new().$color().style($text)
    };
    ($text:literal) => {
        Style::new().style($text)
    };
    ($($text:tt)*) => {
        if do_color() {
            StyledList::from([
                $(colored!($text),)*
            ])
        } else {
            todo!()
        }
    };
}

macro_rules! cprint {
    ($($text:tt)*) => {
        print!("{}", colored!($($text)*))
    };
}

macro_rules! cprintln {
    ($($text:tt)*) => {
        println!("{}", colored!($($text)*))
    };
}

macro_rules! ask {
    ($($prompt:tt)*) => {{
        let mut res = String::new();
        cprint!($($prompt)*);
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut res).unwrap();
        if res.is_empty() {
            // EOF
            println!("^D");
            exit(0);
        }
        res.truncate(res.trim_end().len());
        res
    }};
}

macro_rules! confirm {
    (Y $q:literal) => {
        confirm!(true, [cyan $q] " [Y/n] ")
    };
    (N $q:literal) => {
        confirm!(false, [cyan $q] " [y/N] ")
    };
    ($default:expr, $($q:tt)*) => {
        match ask!($($q)*).as_str() {
            "y" | "yes" => true,
            "n" | "no" => false,
            _ => $default,
        }
    };
}

macro_rules! explode {
    ($msg:expr) => {
        {
            cprint!([red "Error: "]);
            println!("{}", $msg);
            exit(0)
        }
    };
    ($msg:expr, $hint:expr) => {
        {
            cprint!([red "Error: "]);
            println!("{}", $msg);
            cprint!([blue "Hint: "]);
            println!("{}", $hint);
            exit(0)
        }
    };
}

fn do_color() -> bool {
    env::var("NO_COLOR").is_err()
        && supports_color::on_cached(supports_color::Stream::Stdout)
            .map_or(false, |support| support.has_basic)
}

fn ask_path() -> PathBuf {
    cprintln!([yellow "Couldn't find TETR.IO path. Please enter manually"]);

    loop {
        let path = path!(&ask!([blue "? "]));
        if path.exists() {
            return path;
        }
        cprintln!([red "Inputted path does not exist."]);
    }
}

#[allow(clippy::too_many_lines)] // shrug
fn main() {
    let help_template = colored!(
        [blue "{name} "] [cyan "{version}\n"]
        "Justice Almanzar; Sofia Lima\n\n"

        [yellow "usage:\n"]
        "    If no path is provided, qpatcher will try common paths and fallback to\n"
        "    prompting. On some platforms, when using a system package manager, you\n"
        "    might need to run this as root with doas or sudo.\n\n"

        [blue "    More info can be found at: "] [cyan "https://github.com/dzshn/Quartet\n\n"]

        [yellow "flags:\n"]
        "{options}"
    );

    let m = command!()
        .help_template(help_template.to_string())
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
                .value_parser(value_parser!(PathBuf))
                .help("Path to TETR.IO install"),
        ])
        .get_matches();

    let repatch = m.get_flag("repatch");
    let mut patch = repatch || m.get_flag("patch");
    let mut unpatch = repatch || m.get_flag("unpatch");
    let mut download = m.get_flag("download");
    let local = m.get_flag("local");

    let mut default_quartet_path: PathBuf = PathBuf::default();
    let quartet_path = m.get_one::<PathBuf>("path").unwrap_or_else(|| {
        let local_quartet = path!("../dist");
        default_quartet_path = match local_quartet.try_exists() {
            Ok(true) if local => {
                println!("Using ../dist");
                download = false;
                local_quartet.canonicalize().unwrap()
            }
            _ => get_install_path(),
        };
        &default_quartet_path
    });

    let mut default_tetrio_path: PathBuf = PathBuf::default();
    let tetrio_path = m.get_one::<PathBuf>("tetrio_path").unwrap_or_else(|| {
        default_tetrio_path = guess_path().unwrap_or_else(ask_path);
        &default_tetrio_path
    });
    let resources = path!(&tetrio_path, "resources");

    if !tetrio_path.is_dir() {
        explode!(
            &format!(
                "path {} does not exist or is not a directory",
                tetrio_path.display()
            ),
            colored!(
                "Try running --help:\n"
                [yellow "  usage: "] [blue "qpatcher "] [cyan "[options] [TETR.IO path]"]
            )
        );
    }
    if !resources.is_dir() {
        explode!(
            "bad TETR.IO directory: no resources dir",
            "specify base dir, not resources"
        );
    }

    let is_patched = check_patched(&resources);

    if !(patch || unpatch) {
        #[allow(clippy::match_bool)]
        match is_patched {
            true if confirm!(N "Unpatch install?") => unpatch = true,
            false if confirm!(Y "Patch install?") => patch = true,
            _ => {
                cprintln!([red "Aborted."]);
                return;
            }
        }
    }

    match (is_patched, unpatch) {
        (true, false) => explode!("Already patched!"),
        (false, true) => explode!("Nothing to unpatch!"),
        _ => (),
    }

    if unpatch {
        match unpatch_asar(&resources) {
            Ok(()) => cprintln!([yellow "Quartet uninstalled!"]),
            Err(e) if e.kind() == io::ErrorKind::PermissionDenied => {
                explode!(format!("{e:?}").as_str(), "run as root!");
            }
            Err(e) => explode!(format!("{e:?}").as_str()),
        }
    }
    if patch {
        if download {
            // Iterate instead of using create_dir_all so we can fix perms
            // ::<> fishyy
            for p in quartet_path.ancestors().collect::<Vec<_>>().iter().rev() {
                if !p.exists() {
                    fs::create_dir(p).unwrap();
                    #[cfg(target_os = "linux")]
                    fix_perms(&p.to_path_buf());
                }
            }
            download_quartet(quartet_path).unwrap();
        }

        match patch_asar(&resources, &path!(quartet_path, "loader.js")) {
            Ok(()) => cprintln!([yellow "Quartet installed!"]),
            Err(e) if e.kind() == io::ErrorKind::PermissionDenied => {
                explode!(format!("{e:?}").as_str(), "run as root!");
            }
            Err(e) => explode!(format!("{e:?}").as_str()),
        }
    }
}
