import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [jsCode, setJsCode] = useState(`
    // 默认的JS注入代码
    console.log('JS代码已注入到Gemini窗口');
    // 这里可以添加更多的JS代码来修改Gemini页面
    document.body.style.backgroundColor = '#f0f8ff';
  `);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

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
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

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
      </div>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
    </main>
  );
}

export default App;
