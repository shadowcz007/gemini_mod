import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MCPProvider } from "./mcp/MCPProvider";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MCPProvider>
      <App />
    </MCPProvider>
  </React.StrictMode>,
);
