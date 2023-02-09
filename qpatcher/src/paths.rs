use std::{env, path::PathBuf, vec};

#[cfg(target_os = "linux")]
use nix::unistd::User;

#[macro_export]
macro_rules! path {
    ( $base:expr, $( $paths:expr ),* ) => {
        path!($base)$(.join($paths))*
    };
    ( $base:expr ) => {
        ::std::path::Path::new($base).to_path_buf()
    };
}

#[cfg(target_os = "linux")]
fn expand_tilde(path: &str) -> PathBuf {
    path.strip_prefix("~/")
        .map_or(path!(path), |p| get_real_user().dir.join(p))
}
#[cfg(target_os = "macos")]
fn expand_tilde(path: &str) -> PathBuf {
    path.strip_prefix("~/").map_or(path!(path), |p| {
        let home = env::var("HOME").expect("HOME not set");
        path!(&home, p)
    })
}

#[cfg(target_os = "linux")]
pub fn get_real_user() -> User {
    let doas_user = env::var("DOAS_USER");
    let sudo_user = env::var("SUDO_USER");
    match doas_user.or(sudo_user) {
        Ok(real_user) => match User::from_name(&real_user) {
            Ok(Some(user)) => user,
            Ok(None) => panic!("Can't get user id for {real_user}"),
            Err(e) => panic!("Can't get user id for {real_user}: {e}"),
        },
        _ => panic!("Can't get user. Please use either doas or sudo!"),
    }
}

#[cfg(target_os = "windows")]
pub fn get_install_path() -> Option<PathBuf> {
    env::var("LOCALAPPDATA")
        .ok()
        .map(|path| path!(&path, "Quartet/build"))
}

#[cfg(target_os = "linux")]
pub fn get_install_path() -> Option<PathBuf> {
    Some(expand_tilde("~/.local/share/Quartet/build"))
}

#[cfg(target_os = "macos")]
pub fn get_install_path() -> Option<PathBuf> {
    Some(expand_tilde("~/Library/Application Support/Quartet/build"))
}

#[cfg(target_os = "windows")]
pub fn guess_path() -> Option<PathBuf> {
    let local_app_data = env::var("LOCALAPPDATA").expect("LOCALAPPDATA not set");
    vec![path!(&local_app_data, "Programs/tetrio-desktop")]
        .iter()
        .find(|path| path.exists())
        .cloned()
}

#[cfg(target_os = "linux")]
pub fn guess_path() -> Option<PathBuf> {
    vec![path!("/opt/TETR.IO")]
        .iter()
        .find(|path| path.exists())
        .cloned()
}

#[cfg(target_os = "macos")]
pub fn guess_path() -> Option<PathBuf> {
    vec![expand_tilde("~/Applications/TETR.IO")]
        .iter()
        .find(|path| path.exists())
        .cloned()
}

#[cfg(target_os = "linux")]
pub fn fix_perms(path: &PathBuf) {
    let user = get_real_user();
    match nix::unistd::chown(path, Some(user.uid), Some(user.gid)) {
        Ok(_) => (),
        Err(e) => panic!("Can't change permissions for {}: {e}", path.display()),
    }
}
