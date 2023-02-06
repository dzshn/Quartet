mod patcher;
mod paths;

fn main() {
    print!(
        "require({})",
        json::stringify("/home/vap/Downloads/Quartet/dist/loader.js")
    )
}
