// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use dirs;
use tauri::Manager;
use tauri::http::{Request, Response};
use tauri::Listener;


fn load_script() -> String {
    let mut script_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    script_path.push("scripts");
    script_path.push("content.js");
    fs::read_to_string(script_path).expect("无法读取脚本文件")
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn save_content(content: String) -> Result<(), String> {
    let docs_dir = dirs::document_dir()
        .ok_or("无法获取文档目录")?;
    
    let mut path = docs_dir;
    path.push("mixlab knowledge");
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let filename = format!("content_{}.txt", timestamp);
    path.push(filename);
    
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .register_uri_scheme_protocol("mixlab", move |_app, _request: Request<Vec<u8>>| {
            let script = load_script();
            Response::builder()
                .header("Content-Type", "text/javascript")
                .status(200)
                .body(script.into_bytes())
                .unwrap()
        })
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            
            // 直接加载脚本内容并注入
            let script_content = load_script();
            println!("已加载脚本内容，长度: {}", script_content.len());
            
            // 创建窗口克隆用于事件监听器
            let window_clone = window.clone();
            
            // 在闭包前克隆 script_content
            let script_content_for_listener = script_content.clone();
            
            // 监听页面导航变化事件
            window.listen("tauri://location-changed", move |event| {
                let url = event.payload().to_string();
                println!("页面导航变化: {}", url);
                
                // 等待短暂延迟后注入脚本
                let window_for_inject = window_clone.clone();
                let script_content_clone = script_content_for_listener.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    inject_script(&window_for_inject, &script_content_clone);
                });
            });

            // 监听页面刷新事件
            let window_clone = window.clone();
            let script_content_for_reload = script_content.clone();
            window.listen("tauri://reload", move |_| {
                println!("检测到页面刷新");
                let window_for_inject = window_clone.clone();
                let script_content_clone = script_content_for_reload.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    inject_script(&window_for_inject, &script_content_clone);
                });
            });
            
            // 初始注入尝试
            inject_script(&window, &script_content);
            
            // 创建一个窗口的克隆，可以安全地在线程间传递
            let window_clone = window.clone();
            
            // 为新线程克隆 script_content
            let script_content_clone = script_content.clone();
            
            // 添加延迟后的二次注入尝试
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(2));
                println!("尝试二次注入脚本");
                inject_script(&window_clone, &script_content_clone);
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, save_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// 提取注入脚本的函数，使代码更清晰
fn inject_script(window: &tauri::WebviewWindow, script_content: &str) {
    let inject_script = format!(r#"
        (function() {{
             console.log('准备注入脚本...');
             console.log('当前文档状态:', document.readyState);
             
             // 使用多种事件确保脚本被注入
             if (document.readyState === 'complete' || document.readyState === 'interactive') {{
                 console.log('文档已准备好，立即注入');
                 injectScript();
             }} else {{
                 console.log('文档尚未准备好，添加事件监听器');
                 window.addEventListener('DOMContentLoaded', function() {{
                     console.log('DOMContentLoaded 事件触发');
                     injectScript();
                 }});
                 window.addEventListener('load', function() {{
                     console.log('load 事件触发');
                     injectScript();
                 }});
             }}
             
             function injectScript() {{
                 console.log('开始注入脚本，时间:', new Date().toISOString());
                try {{
                     // 直接执行脚本内容
                     (function() {{
                         {script_content}
                     }})();
                     console.log('脚本注入成功');
                 }} catch (error) {{
                     console.error('脚本注入失败:', error);
                 }}
             }}
        }})();
    "#);
    
    println!("准备执行注入脚本");
    window.eval(&inject_script).unwrap_or_else(|err| {
        println!("脚本注入失败: {}", err);
    });
    
    println!("脚本注入请求已发送");
}
