import { useEffect, useState, useRef } from "react";
import { listen } from "@tauri-apps/api/event";

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
  const memoryExtractorRef = useRef<{ sendToMemory: (content: string) => Promise<void> }>(null);


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
          memoryExtractorRef.current.sendToMemory(content);
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

  return (
    <main className="container">
      {initialLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>正在初始化应用...</p>
        </div>
      ) : (
        <>
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

          {/* Gemini按钮和JS代码输入 - 只在窗口未打开时显示 */}
          {!geminiWindowOpen && (
            <div className="row" style={{ marginTop: "20px" }}>
              <button onClick={handleOpenGeminiWindow}>打开Gemini窗口</button>
            </div>
          )}
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
