import React, { useState, useEffect } from "react";

const loadConfigFromLocalStorage = () => {
  const savedConfig = localStorage.getItem('appConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);

      console.log('已从本地存储加载配置');
      return config
    } catch (error) {
      console.error('解析本地存储配置失败:', error);
    }
  }
};

const saveConfigToLocalStorage = (sseUrl: string, baseUrl: string, apiKey: string, model: string) => {
  const config = {
    sseUrl,
    baseUrl,
    apiKey,
    model
  };
  localStorage.setItem('appConfig', JSON.stringify(config));
  console.log('配置已保存到本地存储');
};


interface ConfigSettingsProps {
  onConnect: (sseUrl: string, resourceFilter: string) => void;
  initialSseUrl?: string;
  initialResourceFilter?: string;
}

const ConfigSettings: React.FC<ConfigSettingsProps> = ({
  onConnect,
  initialSseUrl = 'http://127.0.0.1:8080',
  initialResourceFilter = ''
}) => {
  const [sseUrl, setSseUrl] = useState(initialSseUrl);
  const [resourceFilter, setResourceFilter] = useState(initialResourceFilter);
  const [baseUrl, setBaseUrl] = useState<string>("https://api.siliconflow.cn/v1/chat/completions");
  const [apiKey, setApiKey] = useState<string>("");
  const [model, setModel] = useState<string>("Qwen/Qwen2.5-7B-Instruct");
  const [loading, setLoading] = useState(false);

  // 组件初始化时加载配置
  useEffect(() => {
    let config = loadConfigFromLocalStorage();
    if (config) {
      setSseUrl(config.sseUrl || initialSseUrl);
      setBaseUrl(config.baseUrl || 'https://api.siliconflow.cn/v1/chat/completions');
      setApiKey(config.apiKey || '');
      setModel(config.model || 'Qwen/Qwen2.5-7B-Instruct');
    }
  }, [initialSseUrl]);

  // 连接到 MCP 服务器
  const handleConnect = () => {
    setLoading(true);
    console.log("连接到 MCP 服务器", sseUrl, resourceFilter);
    onConnect(sseUrl, resourceFilter);
    setLoading(false);
  };

  // 保存设置
  const saveSettings = () => {
    saveConfigToLocalStorage(sseUrl, baseUrl, apiKey, model);
  };

  return (
    <>
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
    </>
  );
};

export default ConfigSettings;
export { ConfigSettings, loadConfigFromLocalStorage }; 