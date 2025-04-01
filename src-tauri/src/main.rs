// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    WebviewWindowBuilder, WebviewUrl, AppHandle, Runtime, Manager, Emitter,
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

#[tauri::command]
async fn inject_js<R: Runtime>(
    app: AppHandle<R>,
    window_label: String,
    js_code: String,
) -> Result<(), String> {
    // 获取指定标签的窗口
    let window = app.get_webview_window(&window_label)
        .ok_or_else(|| format!("找不到标签为 '{}' 的窗口", window_label))?;
    
    // 注入JS代码
    window.eval(&js_code)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn send_result_to_main<R: Runtime>(
    app: AppHandle<R>,
    result: String,
) -> Result<(), String> {
    // 获取主窗口
    let main_window = app.get_webview_window("main")
        .ok_or_else(|| "找不到主窗口".to_string())?;
    
    // 向主窗口发送事件，包含结果数据
    main_window.emit("result-from-gemini", result)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            open_gemini_window, 
            inject_js, 
            send_result_to_main
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}