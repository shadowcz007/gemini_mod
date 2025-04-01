import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {

  const [jsCode, setJsCode] = useState(`
    // 默认的JS注入代码
    console.log('JS代码已注入到Gemini窗口');
    // 这里可以添加更多的JS代码来修改Gemini页面
    document.body.style.backgroundColor = '#f0f8ff';
    
    // 自动点击具有特定属性的按钮并获取分享链接
    function clickShareButton() {
      const shareButton = document.querySelector('[data-test-id="share-button"]');
      if (shareButton) {
        shareButton.click();
        console.log('已自动点击分享按钮');
        // 点击后监听对话框的出现
        waitForShareDialog();
      } else {
        console.log('未找到分享按钮，将在1秒后重试');
        setTimeout(clickShareButton, 1000);
      }
    }
    
    // 等待分享对话框出现并获取链接
    function waitForShareDialog() {
      const checkDialog = setInterval(() => {
        const dialog = document.querySelector('[data-test-id="create-social-media-dialog"]');
        if (dialog) {
          clearInterval(checkDialog);
          console.log('分享对话框已出现');
          
          // 获取对话框中的链接
          const link = dialog.querySelector('a');
          if (link) {
            const href = link.getAttribute('href');
            console.log('获取到分享链接:', href);
            
            // 这里可以添加代码来处理获取到的链接
            // 例如，可以将链接发送到应用的其他部分或复制到剪贴板
            
            return href;
          } else {
            console.log('未在对话框中找到链接');
          }
        }
      }, 500); // 每500毫秒检查一次
      
      // 设置超时，防止无限等待
      setTimeout(() => {
        clearInterval(checkDialog);
        console.log('等待分享对话框超时');
      }, 15000); // 10秒后超时
    }
    
    // 页面加载完成后执行点击操作
    setTimeout(clickShareButton, 2000);
  `);

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
  const executeInjection = () => {
    const targetWindow = 'gemini'; // 目标窗口的标签名
    const codeToInject = `
    // 这里是要注入的 JavaScript 代码
    console.log('这段代码是通过 Tauri 注入的');
      // 自动点击具有特定属性的按钮并获取分享链接
    function clickShareButton() {
      const shareButton = document.querySelector('[data-test-id="share-button"]');
      if (shareButton) {
        shareButton.click();
        console.log('已自动点击分享按钮');
        // 点击后监听对话框的出现
        waitForShareDialog();
      } else {
        console.log('未找到分享按钮，将在1秒后重试');
        setTimeout(clickShareButton, 1000);
      }
    }
    
    // 等待分享对话框出现并获取链接
    function waitForShareDialog() {
      const checkDialog = setInterval(() => {
        const dialog = document.querySelector('[data-test-id="create-social-media-dialog"]');
        if (dialog) {
          clearInterval(checkDialog);
          console.log('分享对话框已出现');
          
          // 获取对话框中的链接
          const link = dialog.querySelector('a');
          if (link) {
            const href = link.getAttribute('href');
            console.log('获取到分享链接:', href);
            
            // 这里可以添加代码来处理获取到的链接
            // 例如，可以将链接发送到应用的其他部分或复制到剪贴板
            
            return href;
          } else {
            console.log('未在对话框中找到链接');
          }
        }
      }, 500); // 每500毫秒检查一次
      
      // 设置超时，防止无限等待
      setTimeout(() => {
        clearInterval(checkDialog);
        console.log('等待分享对话框超时');
      }, 10000); // 10秒后超时
    }
    
    // 页面加载完成后执行点击操作
    setTimeout(clickShareButton, 2000);
  `;

    injectJavaScript(targetWindow, codeToInject);
  };


  async function openGeminiWindow() {
    try {
      await invoke("open_gemini_window", { jsCode });
      console.log("Gemini窗口已打开，将在5秒后注入JS");
    } catch (error) {
      console.error("打开Gemini窗口失败:", error);
    }
  }

  return (
    <main className="container">
      <h1>Mod</h1>

      {/* Gemini按钮和JS代码输入 */}
      <div className="row" style={{ marginTop: "20px" }}>
        <button onClick={openGeminiWindow}>打开Gemini窗口</button>
      </div>

      <div className="row" style={{ marginTop: "20px" }}>
        <label htmlFor="js-code">要注入的JS代码:</label>
        <textarea
          id="js-code"
          rows={6}
          style={{ width: "100%", marginTop: "10px" }}
          value={jsCode}
          onChange={(e) => setJsCode(e.currentTarget.value)}
        />
        <button onClick={executeInjection}>注入JS代码</button>
      </div>

    </main>
  );
}

export default App;
