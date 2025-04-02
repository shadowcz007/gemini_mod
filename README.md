# Gemini-Mod 项目说明

## 项目概述

Gemini-Mod 是一个基于 Tauri 框架开发的桌面应用程序，用于增强 Google Gemini 的功能。该应用程序允许用户打开 Gemini 窗口并注入自定义 JavaScript 代码，以实现额外的功能，如记忆管理和知识提取。

## 技术栈

- **前端**：React + TypeScript
- **后端**：Rust (Tauri)
- **UI 组件**：Shadcn UI
- **图标**：Lucide React

## 安装依赖
```
npm i
```


## 主要功能

1. **Gemini 窗口集成**：打开 Gemini 窗口并保持会话状态
2. **JavaScript 注入**：向 Gemini 窗口注入自定义 JavaScript 代码
3. **记忆管理**：从对话中提取知识并存储
4. **MCP 客户端**：连接到 MCP (Model Control Protocol) 服务器，实现工具调用

## 项目结构

- `src/` - React 前端代码
  - `mcp/` - MCP 客户端实现
  - `components/` - UI 组件
  - `customJsCode.ts` - 注入到 Gemini 的 JavaScript 代码
- `src-tauri/` - Rust 后端代码
  - `src/main.rs` - Tauri 应用程序入口点
  - `src/lib.rs` - Rust 库代码

## 开发指南

### 开发环境设置

1. 安装 Node.js 和 Rust
2. 克隆仓库
3. 安装依赖：`npm install`
4. 启动开发服务器：`npm run tauri dev`

### 构建应用
npm run tauri build


## 配置

应用程序支持以下配置：

- **SSE URL**：MCP 服务器的 URL
- **资源过滤器**：用于过滤 MCP 资源
- **API 设置**：用于知识提取的 LLM API 配置
  - Base URL
  - API Key
  - 模型名称

## 使用方法

1. 启动应用程序
2. 配置 MCP 连接设置
3. 点击"连接"按钮连接到 MCP 服务器
4. 点击"打开 Gemini 窗口"按钮
5. 在 Gemini 对话中，使用注入的"Memory"按钮提取知识

## 注意事项

- 应用程序需要网络连接才能访问 Gemini 和 MCP 服务器
- 首次使用时需要配置 API 设置
- 所有配置都会保存在本地存储中

## 许可证

[添加您的许可证信息]

## 贡献指南

[添加贡献指南]