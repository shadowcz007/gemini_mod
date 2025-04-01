import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import TurndownService from 'turndown';


import "./App.css";



function App() {
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
if (window.__memory_fun === true) {
  console.log('已经注入过代码，跳过本次注入');
  
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
    replacement: function (content:string, node:HTMLElement) { 
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
      await invoke("open_gemini_window", { jsCode:codeToInject });
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
        let content=`User:${data.userQuery}\n\nAssistant:${markdown}`
        console.log(content);
      }
    });

    return () => {
      unlisten.then((unlisten) => unlisten());
    }
  }, [])

  return (
    <main className="container">
      <h1>Mod</h1>

      {/* Gemini按钮和JS代码输入 */}
      <div className="row" style={{ marginTop: "20px" }}>
        <button onClick={openGeminiWindow}>打开Gemini窗口</button>
      </div>
      <button onClick={executeInjection}>注入JS代码</button>
    </main>
  );
}

export default App;
