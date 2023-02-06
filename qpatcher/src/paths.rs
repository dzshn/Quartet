use std::{
    env,
    path::{Path, PathBuf},
    vec,
};

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

#[cfg(all(target_family = "unix", not(target_os = "macos")))]
fn expand_tilde(path: &str) -> PathBuf {
    path.strip_prefix("~/")
        .map_or(path!(path), |p| get_real_user().dir.join(p))
}
#[cfg(target_family = "macos")]
fn expand_tilde(path: &str) -> PathBuf {
    path.strip_prefix("~/").map_or(path!(path), |p| {
        let home = env::var("HOME").expect("HOME not set");
        path!(&home, p)
    })
}

pub fn get_real_user() -> User {
    let doas_user = env::var("DOAS_USER");
    let sudo_user = env::var("SUDO_USER");
    match doas_user.or(sudo_user).ok() {
        Some(real_user) => match User::from_name(&real_user) {
            Ok(Some(user)) => user,
            Ok(None) => panic!("Can't get user id for {real_user}"),
            Err(e) => panic!("Can't get user id for {real_user}: {e}"),
        },
        None => panic!("Can't get user. Please use either doas or sudo!"),
    }
}

pub fn get_install_path() -> Option<PathBuf> {
    if cfg!(windows) {
        env::var("LOCALAPPDATA").ok().map(|path| path.into())
    } else if cfg!(macos) {
        Some(expand_tilde("~/Library/Application Support"))
    } else if cfg!(unix) {
        Some(expand_tilde("~/.local/share"))
    } else {
        None
    }
    .map(|path| path!(&path, "Quartet/build"))
}

pub fn guess_path() -> Option<PathBuf> {
    // TODO: find more
    let mut paths: Vec<PathBuf> = vec![];
    if cfg!(windows) {
        let local_app_data = env::var("LOCALAPPDATA").expect("LOCALAPPDATA not set");
        paths.push(path!(&local_app_data, "Programs/tetrio-desktop"));
    } else if cfg!(macos) {
        paths.push(expand_tilde("~/Applications/TETR.IO"));
    } else if cfg!(unix) {
        paths.push(path!("/opt/TETR.IO"));
    }
    paths
        .iter()
        .find(|path| path.exists())
        .map(|path| path.to_path_buf())
}

#[cfg(target_family = "unix")]
pub fn fix_perms(path: &Path) {
    use nix::unistd::chown;
    let user = get_real_user();
    match chown(path, Some(user.uid), Some(user.gid)) {
        Ok(_) => (),
        Err(e) => panic!("Can't change permissions for {}: {e}", path.display()),
    }
}
