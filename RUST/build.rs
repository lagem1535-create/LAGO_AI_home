// 앱 명령에 이름표(권한)를 붙여서, capabilities/main.json 에 적힌 LAGO 주소만 부를 수 있게 해요.
fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "pick", "current", "list", "read", "write", "run", "upd_check", "upd_download", "upd_install",
        ]),
    ))
    .expect("tauri build");
}
