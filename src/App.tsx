import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

import { parseMemoryContent, openGeminiWindow } from './customJsCode';
import { MCPProvider, useMCP } from './mcp/MCPProvider';

import "./App.css";
import { ConfigSettings, loadConfigFromLocalStorage } from './mcp/ConfigSettings';

function AppContent() {
  const {
    connect,
    reconnect,
    loading,
    error,
    tools,
    prompts
  } = useMCP();
  const [sseUrl, setSseUrl] = useState('http://127.0.0.1:8080');
  const [resourceFilter, setResourceFilter] = useState('');

  const [baseUrl, setBaseUrl] = useState<string>("https://api.siliconflow.cn/v1/chat/completions");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("Qwen/Qwen2.5-7B-Instruct");

  // 连接到 MCP 服务器
  const handleConnect = () => {
    console.log("连接到 MCP 服务器", sseUrl, resourceFilter);
    connect(sseUrl, resourceFilter);
  };

  // 组件初始化时加载配置
  useEffect(() => {
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
        if (sseUrl) {
          sendToMemory(content);
        }
      }
    });

    return () => {
      unlisten.then((unlisten) => unlisten());
    }
  }, [sseUrl, prompts]) // 添加 sseUrl 作为依赖项

  // 添加发送到记忆服务的函数
  const sendToMemory = async (content: string) => {
    console.log("发送数据到记忆服务", prompts);
    try {
      // llm api调用，提取记忆
      const prompt = prompts.find(p => p.name === 'knowledge_extractor');
      const toolsList = Array.from(tools.filter(t => t.name === 'create_entities' || t.name === 'create_relations'), t => {
        return {
          type: 'function',
          function: {
            name: t.name,
            description: t.description || `执行${t.name}操作`,
            parameters: t.inputSchema || {}
          }
        }
      });
      if (!prompt) {
        console.error("未找到知识提取器提示");
        return;
      }

      // llm api调用
      const messages = [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content }
      ];

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.65,
          max_tokens: 3000,
          tools: toolsList
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      const message = result.choices[0]?.message;
      console.log("提取的知识:", message);
      messages.push(message);
      let toolsResult: any[] = [];
      if (message.tool_calls?.length > 0) {
        for (const toolCall of message.tool_calls) {
          let param: any = toolCall.function.arguments,
            name = toolCall.function.name;

          if (name === 'create_entities') {
            try {
              param = JSON.parse(param);
              // 弹出确认对话框
              if (window.confirm(`是否创建以下实体？\n${JSON.stringify(param, null, 2)}`)) {
                let result = await tools.find(t => t.name === name)?.execute(param);
                toolsResult.push(result);
              } else {
                console.log("用户取消了实体创建");
                toolsResult.push({ status: "canceled", message: "用户取消了操作" });
              }
            } catch (error) {
              console.error("创建实体失败:", error);
            }
          };

          if (name === 'create_relations') {
            try {
              param = JSON.parse(param);
              // 弹出确认对话框
              if (window.confirm(`是否创建以下关系？\n${JSON.stringify(param, null, 2)}`)) {
                let result = await tools.find(t => t.name === name)?.execute(param);
                toolsResult.push(result);
              } else {
                console.log("用户取消了关系创建");
                toolsResult.push({ status: "canceled", message: "用户取消了操作" });
              }
            } catch (error) {
              console.error("创建关系失败:", error);
            }
          }
        }

        console.log("工具调用结果:", toolsResult);
        messages.push({
          role: 'tool',
          content: toolsResult
        })
      }
      console.log("数据已发送到记忆服务", messages);
    } catch (error) {
      console.error("发送数据到记忆服务失败:", error);
    }
  }

  return (
    <main className="container">
      <h1>Mod</h1>
      {/* 使用抽象出的配置组件 */}
      <ConfigSettings
        onConnect={connect}
        initialSseUrl={sseUrl}
        initialResourceFilter={resourceFilter}
      />

      {/* 状态显示 */}
      {error && <div className="error-message">错误: {error}</div>}
      {loading && <div className="loading-indicator">正在加载...</div>}

      {/* 数据显示 */}
      <div className="mcp-data">
        <h2>工具 ({tools.length})</h2>
      </div>

      {/* Gemini按钮和JS代码输入 */}
      <div className="row" style={{ marginTop: "20px" }}>
        <button onClick={openGeminiWindow}>打开Gemini窗口</button>
      </div>
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
