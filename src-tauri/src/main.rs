// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    WebviewWindowBuilder, WebviewUrl, AppHandle, Runtime, Manager, Emitter, Listener,
};
use std::time::Duration;
use std::thread;

#[tauri::command]
async fn open_gemini_window<R: Runtime>(
    app: AppHandle<R>,
    js_code: String,
) -> Result<(), String> {
    println!("尝试打开 Gemini 窗口");
    
    // 使用 app.path() 获取路径，处理 Result 类型
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("无法获取应用数据目录: {}", e))?;
    
    // 创建 Gemini 专用的缓存目录
    let gemini_data_dir = app_data_dir.join("gemini_cache");
    
    // 确保目录存在
    if !gemini_data_dir.exists() {
        std::fs::create_dir_all(&gemini_data_dir)
            .map_err(|e| format!("创建缓存目录失败: {}", e))?;
    }
    
    println!("使用缓存目录: {:?}", gemini_data_dir);
    
    let window = WebviewWindowBuilder::new(&app, "gemini", WebviewUrl::External("https://gemini.google.com/".parse().unwrap()))
        .title("Gemini")
        .inner_size(1000.0, 800.0)
        // 设置持久化数据目录
        .data_directory(gemini_data_dir)
        // 移除不存在的方法调用
        // .local_storage(true)
        // .cookies(true)
        .build()
        .map_err(|e| {
            println!("创建 Gemini 窗口失败: {}", e);
            e.to_string()
        })?;
    
    println!("Gemini 窗口已创建");
    
    // 克隆窗口和JS代码以在线程中使用
    let window_clone = window.clone();
    let js_code_clone = js_code.clone();
    
    // 创建一个新线程来处理延迟注入
    thread::spawn(move || {
        // 等待5000毫秒
        println!("等待 5000ms 后注入 JS 代码");
        thread::sleep(Duration::from_millis(5000));
        
        // 注入JS代码
        println!("注入 JS 代码到 Gemini 窗口");
        if let Err(e) = window_clone.eval(&js_code_clone) {
            println!("JS 代码注入失败: {}", e);
        } else {
            println!("JS 代码注入成功");
        }
    });
    
    // 设置页面加载事件监听器
    let app_clone = app.clone();
    let js_code_for_listener = js_code.clone();
    
    // 使用正确的事件监听器方法
    window.listen("tauri://load", move |_| {
        println!("Gemini 窗口加载事件触发");
        let window_ref = app_clone.get_webview_window("gemini").unwrap();
        let js_code_ref = js_code_for_listener.clone();
        
        // 创建一个新线程来处理延迟注入
        thread::spawn(move || {
            // 等待3000毫秒，给页面加载一些时间
            println!("等待 3000ms 后重新注入 JS 代码");
            thread::sleep(Duration::from_millis(3000));
            
            // 重新注入JS代码
            println!("重新注入 JS 代码到 Gemini 窗口");
            if let Err(e) = window_ref.eval(&js_code_ref) {
                println!("重新注入 JS 代码失败: {}", e);
            } else {
                println!("重新注入 JS 代码成功");
            }
        });
    });
    
    Ok(())
}

#[tauri::command]
async fn inject_js<R: Runtime>(
    app: AppHandle<R>,
    window_label: String,
    js_code: String,
) -> Result<(), String> {
    println!("尝试向窗口 '{}' 注入 JS 代码", window_label);
    
    // 获取指定标签的窗口
    let window = app.get_webview_window(&window_label)
        .ok_or_else(|| {
            let err = format!("找不到标签为 '{}' 的窗口", window_label);
            println!("{}", err);
            err
        })?;
    
    // 注入JS代码
    window.eval(&js_code)
        .map_err(|e| {
            let err = e.to_string();
            println!("JS 代码注入失败: {}", err);
            err
        })?;
    
    println!("成功向窗口 '{}' 注入 JS 代码", window_label);
    Ok(())
}

#[tauri::command]
async fn send_result_to_main<R: Runtime>(
    app: AppHandle<R>,
    result: String,
) -> Result<(), String> {
    println!("尝试向主窗口发送结果");
    
    // 获取主窗口
    let main_window = app.get_webview_window("main")
        .ok_or_else(|| {
            let err = "找不到主窗口".to_string();
            println!("{}", err);
            err
        })?;
    
    // 向主窗口发送事件，包含结果数据
    main_window.emit("result-from-gemini", result.clone())
        .map_err(|e| {
            let err = e.to_string();
            println!("向主窗口发送结果失败: {}", err);
            err
        })?;
    
    println!("成功向主窗口发送结果: {}", result);
    Ok(())
}

fn main() {
    println!("应用程序启动");
    
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