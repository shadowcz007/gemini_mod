// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

 
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            // 在这里添加应用程序启动时需要执行的代码
            // 例如：初始化日志、设置全局状态等
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
 