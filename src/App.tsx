import { useEffect, useState, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { Window, LogicalSize, LogicalPosition, primaryMonitor } from "@tauri-apps/api/window";
import { parseMemoryContent, openGeminiWindow } from './customJsCode';
import { MCPProvider, useMCP } from './mcp/MCPProvider';
import { MemoryExtractor } from './memory/MemoryExtractor';
import { GraphViewer } from './memory/GraphViewer';
import "./App.css";
import { ConfigSettings, loadConfigFromLocalStorage } from './mcp/ConfigSettings';

function AppContent() {
  const {
    connect,
    reconnect,
    loading: mcpLoading,
    error,
    tools,
    prompts
  } = useMCP();
  const [sseUrl, setSseUrl] = useState('http://127.0.0.1:8080');
  const [resourceFilter, setResourceFilter] = useState('');
  const [geminiWindowOpen, setGeminiWindowOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [baseUrl, setBaseUrl] = useState<string>("https://api.siliconflow.cn/v1/chat/completions");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("Qwen/Qwen2.5-7B-Instruct");

  // 引用MemoryExtractor组件
  const memoryExtractorRef = useRef<{
    sendToMemory: (content: string) => Promise<void>;
    extractSilently: (content: string) => Promise<void>;
  }>(null);

  // 添加窗口控制状态 
  const [isMaximized, setIsMaximized] = useState(true);

  // 组件初始化时加载配置
  useEffect(() => {
    // 程序加载时自动打开Gemini窗口，添加2秒延迟
    setTimeout(() => {
      handleOpenGeminiWindow();
      setInitialLoading(false);
      console.log("初始化完成");
    }, 3000);

    let config = loadConfigFromLocalStorage();
    if (config) {
      setSseUrl(config.sseUrl || 'http://127.0.0.1:8080');
      setBaseUrl(config.baseUrl || 'https://api.siliconflow.cn/v1/chat/completions');
      setApiKey(config.apiKey || '');
      setModel(config.model || 'Qwen/Qwen2.5-7B-Instruct');
      if (config?.sseUrl) {
        connect(config.sseUrl, resourceFilter);
        return
      }
    }
    if (sseUrl) {
      connect(sseUrl, resourceFilter);
    }


  }, []);

  // 处理打开Gemini窗口
  const handleOpenGeminiWindow = () => {
    openGeminiWindow();
    setGeminiWindowOpen(true);
    handleMinimize()
  };

  useEffect(() => {
    const unlisten = listen("result-from-gemini", (event) => {
      const result = event.payload as string;
      let data = JSON.parse(result);
      console.log('result-from-gemini', data);
      if (data.type === 'message_content' && data.content) {
        // 在 if 语句内部
        const markdown = parseMemoryContent(data.content);
        let content = `User:${data.userQuery}\n\nAssistant:${markdown}`
        console.log(content);

        // 如果设置了 SSE URL，可以发送数据
        if (sseUrl && memoryExtractorRef.current) {
          // 如果 isMaximized 为 true，则调用 sendToMemory 方法
          if (isMaximized) {
            memoryExtractorRef.current.sendToMemory(content);
          } else {
            memoryExtractorRef.current.extractSilently(content);
          }

        }
      }
    });

    // 监听Gemini窗口关闭事件
    const unlistenClose = listen("gemini-window-closed", () => {
      setGeminiWindowOpen(false);
    });

    return () => {
      unlisten.then((unlisten) => unlisten());
      unlistenClose.then((unlisten) => unlisten());
    }
  }, [sseUrl, prompts]) // 添加 sseUrl 作为依赖项

  const appIcon = async () => {
    const window = await Window.getCurrent();
    window.setSize(new LogicalSize(128, 24));
    const monitor = await primaryMonitor();
    const screenWidth = monitor ? monitor.size.width : 1920;
    const screenHeight = monitor ? monitor.size.height : 1080;
    window.setPosition(new LogicalPosition(screenWidth - 148, screenHeight - 98));
    window.setAlwaysOnTop(true);
  }

  // 修改窗口控制函数
  const handleMinimize = async () => {
    console.log('handleMinimize');
    setIsMaximized(false);
    appIcon()
  };

  const handleToggleSize = async () => {
    const m = !isMaximized;
    setIsMaximized(m);
    console.log('handleToggleSize');
    const window = await Window.getCurrent();
    if (!m) {
      appIcon()
    } else {
      window.setSize(new LogicalSize(800, 600));
      window.center();
      window.setAlwaysOnTop(false);
    }
  };

  const handleClose = async () => {
    const window = await Window.getCurrent();
    window.close();
  };

  return (
    <main className="container">
      {initialLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>正在初始化应用...</p>
        </div>
      ) : (
        <>
          {/* 添加标题栏 */}
          <div className="title-bar" data-tauri-drag-region>
            <div data-tauri-drag-region style={{ width: 128, display: 'flex', justifyContent: 'center' }}>
              <button className="control-button" style={{ width: 115 }}
                onClick={handleToggleSize}
              >Gemini-Memory</button>

            </div>
            {isMaximized && <div className="window-controls">
              <button className="control-button minimize"
                onClick={handleMinimize}
              >─</button>
              <button className="control-button close"
                onClick={handleClose}
              >×</button>
            </div>}
          </div>

          {isMaximized && <div >
            <h1>
              Mod
              {mcpLoading ?
                <span className="connection-status loading"> (连接中...)</span> :
                error ?
                  <span className="connection-status error"> (连接错误)</span> :
                  <span className="connection-status connected"> (已连接 - {tools.length} 个工具)</span>
              }
            </h1>
            {/* 使用抽象出的配置组件 */}
            <ConfigSettings
              onConnect={connect}
              initialSseUrl={sseUrl}
              initialResourceFilter={resourceFilter}
            />

            {/* 状态显示 */}
            {error && <div className="error-message">错误: {error}</div>}

            <GraphViewer
              baseUrl={baseUrl}
              apiKey={apiKey}
              tools={tools}
            />
            {/* Gemini按钮和JS代码输入 - 只在窗口未打开时显示 */}
            {!geminiWindowOpen && (
              <div className="row" style={{ marginTop: "20px" }}>
                <button onClick={handleOpenGeminiWindow}>打开Gemini窗口</button>
              </div>
            )}
          </div>}

          {/* 添加MemoryExtractor组件 */}
          <MemoryExtractor
            ref={memoryExtractorRef}
            sseUrl={sseUrl}
            baseUrl={baseUrl}
            apiKey={apiKey}
            model={model}
            tools={tools}
            prompts={prompts}
          />

        </>
      )}
    </main>
  );
}

function App() {
  return (
    <MCPProvider>
      <AppContent />
    </MCPProvider>
  );
}

export default App;
