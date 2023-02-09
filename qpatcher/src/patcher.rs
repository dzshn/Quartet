use crate::{path, paths::fix_perms};
use std::{fs, path::PathBuf};

use ureq;

const DEVBUILD_URL: &str = "https://github.com/dzshn/Quartet/releases/devbuild";

pub fn download_quartet(install_path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    let agent = ureq::agent();
    for filename in ["loader.js", "preload.js", "quartet.js"] {
        let file_path = path!(install_path, filename);
        let url = DEVBUILD_URL.to_owned() + filename;

        println!("Downloading {} to {}", filename, install_path.display());
        // into_string is okay since we expect less than a mb of data
        fs::write(&file_path, agent.get(&url).call()?.into_string()?)?;
        #[cfg(target_os = "linux")]
        fix_perms(&file_path);
    }
    Ok(())
}

pub fn unpatch_asar(resources: &PathBuf) -> std::io::Result<()> {
    let asar = path!(&resources, "app.asar");
    let temp_asar = path!(&resources, "app.asar~");
    let original_asar = path!(&resources, "_app.asar");

    fs::rename(&asar, &temp_asar)?;
    match fs::rename(original_asar, &asar) {
        Ok(_) => {
            fs::remove_dir_all(&temp_asar)?;
            Ok(())
        }
        Err(e) => {
            fs::rename(&temp_asar, &asar)?;
            Err(e)
        }
    }
}

pub fn patch_asar(resources: &PathBuf, bundle: &PathBuf) -> std::io::Result<()> {
    let package_json = r#"{"name": "tetrio-desktop", "main": "main.js"}"#;
    let asar = path!(&resources, "app.asar");
    let original_asar = path!(&resources, "_app.asar");
    let bundle_string = bundle
        .to_str()
        .expect("Invalid path string")
        .replace(r#"\"#, r#"\\"#)
        .replace(r#"""#, r#"\""#);

    fs::rename(&asar, original_asar)?;
    fs::create_dir(&asar)?;
    fs::write(asar.join("package.json"), package_json)?;
    fs::write(asar.join("main.js"), format!("require({bundle_string})"))?;
    Ok(())
}

pub fn check_patched(resources: &PathBuf) -> bool {
    path!(&resources, "app.asar").is_dir()
}
