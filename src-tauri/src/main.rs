// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    WebviewWindowBuilder, WebviewUrl, AppHandle, Runtime,
};
use std::time::Duration;
use std::thread;

#[tauri::command]
async fn open_gemini_window<R: Runtime>(
    app: AppHandle<R>,
    js_code: String,
) -> Result<(), String> {
    let window = WebviewWindowBuilder::new(&app, "gemini", WebviewUrl::External("https://gemini.google.com/".parse().unwrap()))
        .title("Gemini")
        .inner_size(1000.0, 800.0)
        .build()
        .map_err(|e| e.to_string())?;
    
    // 克隆窗口和JS代码以在线程中使用
    let window_clone = window.clone();
    let js_code_clone = js_code.clone();
    
    // 创建一个新线程来处理延迟注入
    thread::spawn(move || {
        // 等待5000毫秒
        thread::sleep(Duration::from_millis(5000));
        
        // 注入JS代码
        let _ = window_clone.eval(&js_code_clone);
    });
    
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![open_gemini_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}