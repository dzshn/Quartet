use crate::path;
use std::fs;

pub fn unpatch_asar(resources: &str) -> std::io::Result<()> {
    let asar = path!(resources, "app.asar");
    let temp_asar = path!(resources, "app.asar~");
    let original_asar = path!(resources, "_app.asar");

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

pub fn patch_asar(resources: &str, bundle: &str) -> std::io::Result<()> {
    let package_json = r#"{"name": "tetrio-desktop", "main": "main.js"}"#;
    let asar = path!(resources, "app.asar");
    let original_asar = path!(resources, "_app.asar");
    let bundle_json = json::stringify(bundle);

    fs::rename(&asar, original_asar)?;
    fs::create_dir(&asar)?;
    fs::write(asar.join("package.json"), package_json)?;
    fs::write(asar.join("main.js"), format!("require({bundle_json})"))?;
    Ok(())
}

pub fn check_patched(resources: &str) -> bool {
    path!(resources, "app.asar").is_dir()
}
