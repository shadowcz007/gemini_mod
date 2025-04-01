import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import TurndownService from 'turndown';

import { useMCP } from './mcp/MCPProvider';

import "./App.css";

function App() {

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

  // 保存配置到本地存储
  const saveConfigToLocalStorage = () => {
    const config = {
      sseUrl,
      baseUrl,
      apiKey,
      model
    };
    localStorage.setItem('appConfig', JSON.stringify(config));
    console.log('配置已保存到本地存储');
  };

  // 连接到 MCP 服务器
  const handleConnect = () => {
    console.log("连接到 MCP 服务器", sseUrl, resourceFilter);
    connect(sseUrl, resourceFilter);
  };

  // 重新连接
  const handleReconnect = () => {
    reconnect(sseUrl, resourceFilter);
  };


  // 从本地存储加载配置
  const loadConfigFromLocalStorage = () => {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setSseUrl(config.sseUrl || 'http://127.0.0.1:8080');
        setBaseUrl(config.baseUrl || 'https://api.siliconflow.cn/v1/chat/completions');
        setApiKey(config.apiKey || '');
        setModel(config.model || 'Qwen/Qwen2.5-7B-Instruct');
        console.log('已从本地存储加载配置');
        return config
      } catch (error) {
        console.error('解析本地存储配置失败:', error);
      }
    }
  };

  // 组件初始化时加载配置
  useEffect(() => {
    let config = loadConfigFromLocalStorage();
    if (config?.sseUrl) {
      connect(config.sseUrl, resourceFilter);
    } else if (sseUrl) {
      connect(sseUrl, resourceFilter);
    }
  }, []);


  // 添加状态管理


  // 在组件内部
  const turndownService = new TurndownService();

  const codeToInject = ` 
console.log('这段代码是通过 Tauri 注入的');

// 创建一个函数来添加自定义按钮
function addCustomButton() {
    // 获取所有 message-actions 元素
    const messageActions = document.querySelectorAll('message-actions');
    
    // 遍历每个 message-actions
    messageActions.forEach(actionsContainer => {
        // 检查是否已经添加了自定义按钮，避免重复添加
        if (!actionsContainer.querySelector('.custom-button-x')) {
            // 创建新按钮
            const customButton = document.createElement('button');
            customButton.className = 'custom-button-x';
            customButton.textContent = 'Memory';
            // 可选：添加自定义样式
            customButton.style.marginLeft = '5px';
            customButton.style.padding = '2px 8px';
            customButton.style.backgroundColor = 'black';
            customButton.style.border = '1px solid white';
            customButton.style.cursor = 'pointer';
            customButton.style.color = 'white';
            
            // 添加点击事件
            customButton.addEventListener('click', () => {
                console.log('Custom X button clicked!');
                // 获取 messageAction 的父级元素
                const parentElement = actionsContainer.parentElement;
                if (parentElement) {
                    // 查找 model-response 父级元素
                    let currentElement = parentElement;
                    let modelResponseElement = null;
                    
                    // 向上遍历DOM树查找 model-response 元素
                    while (currentElement && !modelResponseElement) {
                        if (currentElement.tagName && currentElement.tagName.toLowerCase() === 'model-response') {
                            modelResponseElement = currentElement;
                        } else {
                            currentElement = currentElement.parentElement;
                        }
                    }
                    
                    // 如果找到了 model-response 元素
                    let userQuery = '';
                    if (modelResponseElement && modelResponseElement.parentElement) {
                        // 获取 model-response 的父元素
                        const conversationTurn = modelResponseElement.parentElement;
                        // 查找 user-query 元素
                        const userQueryElement = conversationTurn.querySelector('user-query');
                        if (userQueryElement) {
                            userQuery = userQueryElement.innerText || '';
                            console.log('找到用户查询:', userQuery);
                        }
                    }
                    
                    // 获取前一个邻居元素的 innerHTML (原有功能保留)
                    const previousSibling = parentElement.previousElementSibling;
                    if (previousSibling) {
                        // 获取前一个邻居元素的 innerHTML
                        const innerHTML = previousSibling.innerHTML;
                        console.log('前一个邻居元素的 innerHTML:', innerHTML);
                        
                        // 如果需要，可以将获取到的内容发送到主应用
                        if(window.__TAURI_INTERNALS__){ 
                            window.__TAURI_INTERNALS__.invoke('send_result_to_main', { 
                                result: JSON.stringify({
                                    type: 'message_content',
                                    content: innerHTML,
                                    userQuery: userQuery // 添加用户查询内容
                                }) 
                            });
                        }
                    } else {
                        console.log('没有找到前一个邻居元素');
                    }
                } else {
                    console.log('没有找到父级元素');
                }
            });
            
            actionsContainer.querySelector(
            '.buttons-container-v2'
            )?.appendChild(customButton);
        }
    });
}

// 创建 MutationObserver 来监听 DOM 变化
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        // 检查是否有新的节点被添加
        if (mutation.addedNodes.length > 0) {
            // 检查新添加的节点中是否包含 message-actions
            const hasMessageActions = Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && 
                (node.classList?.contains('message-actions') || 
                node.querySelector?.('.message-actions'))
            );
            
            if (hasMessageActions) {
                addCustomButton();
            }
        }
    });
});

// 检查是否已经注入过代码，避免重复注入
if (!window.__memory_fun) {
  console.log('注入过代码');
  // 配置观察选项
  const config = {
      childList: true,    // 观察子节点的变化
      subtree: true       // 观察整个子树
  };

  // 开始观察（假设消息出现在 body 内，你可以调整目标元素）
  const targetNode = document.body;
  observer.observe(targetNode, config);

  // 初始加载时也执行一次，处理已存在的 message-actions
  addCustomButton();

  // 可选：提供停止观察的方法
  function stopObserving() {
      observer.disconnect();
  }
}
window.__memory_fun=true;



`;

  // 为 immersive-entry-chip 标签添加自定义规则
  turndownService.addRule('immersiveEntryChip', {
    filter: 'immersive-entry-chip',
    replacement: function (content: string, node: HTMLElement) {
      // 将内容按换行符分割
      const lines = content.split('\n').filter(line => line.trim() !== '');

      // 如果有足够的行数，只取文件名和创建时间
      if (lines.length >= 2) {
        const fileName = lines[0].trim();
        const creationTime = lines[1].trim();
        return `[${fileName} - ${creationTime}]`;
      } else if (lines.length === 1) {
        // 如果只有一行，就只返回这一行
        return `[${lines[0].trim()}]`;
      } else {
        // 如果没有内容，返回空字符串
        return '';
      }
    }
  });


  /**
  * 向指定窗口注入 JavaScript 代码
  * @param {string} windowLabel - 目标窗口的标签名
  * @param {string} jsCode - 要注入的 JavaScript 代码
  */
  async function injectJavaScript(windowLabel: string, jsCode: string) {
    try {
      // 调用后端的 inject_js 命令
      await invoke('inject_js', {
        windowLabel: windowLabel,
        jsCode: jsCode
      });
      console.log('JavaScript 代码已成功注入到窗口:', windowLabel);
    } catch (error) {
      console.error('注入 JavaScript 代码失败:', error);
    }
  }
  // 使用示例
  const executeInjection = async () => {
    const targetWindow = 'gemini'; // 目标窗口的标签名

    injectJavaScript(targetWindow, codeToInject);

  };

  async function openGeminiWindow() {
    try {
      await invoke("open_gemini_window", { jsCode: codeToInject });
      console.log("Gemini窗口已打开，将在5秒后注入JS");
    } catch (error) {
      console.error("打开Gemini窗口失败:", error);
    }
  }

  useEffect(() => {
    const unlisten = listen("result-from-gemini", (event) => {
      const result = event.payload as string;
      let data = JSON.parse(result);
      console.log(data);
      if (data.type === 'message_content' && data.content) {
        // 在 if 语句内部
        const markdown = turndownService.turndown(data.content);
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
  }, [sseUrl]) // 添加 sseUrl 作为依赖项

  // 添加发送到记忆服务的函数
  const sendToMemory = async (content: string) => {
    try {
      // llm api调用，提取记忆
      const prompt = prompts.find(p => p.name === 'knowledge_extractor');
      const toolsList = tools.filter(t => t.name === 'create_entities' || t.name === 'create_relations')
      if (!prompt) {
        console.error("未找到知识提取器提示");
        return;
      }

      // llm api调用
      const messages = [
        { role: "system", content: prompt.content },
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
      const extractedKnowledge = result.choices[0];
      console.log("提取的知识:", extractedKnowledge);

      // // tool工具调用
      // const memoryTool = tools.find(t => t.name === 'memory_store');
      // if (memoryTool) {
      //   const toolResponse = await invoke(memoryTool.command, {
      //     content: extractedKnowledge
      //   });
      //   console.log("记忆存储结果:", toolResponse);
      // } else {
      //   console.error("未找到记忆存储工具");
      // }

      console.log("数据已发送到记忆服务");
    } catch (error) {
      console.error("发送数据到记忆服务失败:", error);
    }
  }

  // 保存设置
  const saveSettings = () => {
    console.log("保存设置:", { sseUrl, baseUrl, apiKey, model });
    saveConfigToLocalStorage();
  }

  return (
    <main className="container">
      <h1>Mod</h1>

      {/* 连接控制 */}
      <div className="connection-controls">
        <input
          type="text"
          value={sseUrl}
          onChange={(e) => setSseUrl(e.target.value)}
          placeholder="MCP 服务器 URL"
        />

        <button onClick={handleConnect} disabled={loading}>
          {loading ? '连接中...' : '连接'}
        </button>

      </div>
      {/* API设置 */}
      <div className="api-settings">
        <h3>API设置</h3>
        <div className="setting-row">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="API Base URL"
          />
        </div>
        <div className="setting-row">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API Key"
          />
        </div>

        <div className="setting-row">
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model"
          />
        </div>

        <button onClick={saveSettings}>保存设置</button>
      </div>

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
      <button onClick={executeInjection}>注入JS代码</button>


    </main>
  );
}

export default App;
