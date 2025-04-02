import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettingsStore } from '../store';

const loadConfigFromLocalStorage = () => {
  const savedConfig = localStorage.getItem('appConfig');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);

      console.log('已从本地存储加载配置',config);
      return config
    } catch (error) {
      console.error('解析本地存储配置失败:', error);
    }
  }
};

const saveConfigToLocalStorage = (mcpServiceUrl: string, baseUrl: string, apiKey: string, model: string) => {
  const config = {
    mcpServiceUrl,
    baseUrl,
    apiKey,
    model
  };
  localStorage.setItem('appConfig', JSON.stringify(config));
  console.log('配置已保存到本地存储');
};

interface SettingsModalProps {
  onConnect: (settings: any) => void;
  onSave: (settings: any) => void;
}

 const SettingsModal: React.FC<SettingsModalProps> = ({ onConnect,onSave }) => {
  const { settings, setSettings, isSettingsOpen, toggleSettings } = useSettingsStore();

  useEffect(() => {
    const config = loadConfigFromLocalStorage();
    if (config) {
      try {
        setSettings({
          mcpServiceUrl: config.mcpServiceUrl || settings.mcpServiceUrl,
          baseUrl: config.baseUrl || settings.baseUrl,
          apiKey: config.apiKey || settings.apiKey,
          modelName: config.model || settings.modelName,
        });
        console.log('已从本地存储加载配置');
      } catch (error) {
        console.error('解析本地存储配置失败:', error);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigToLocalStorage(
      settings.mcpServiceUrl,
      settings.baseUrl,
      settings.apiKey,
      settings.modelName);

    onConnect(settings);
    onSave(settings);
    toggleSettings();
  };

  return isSettingsOpen ? (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-black/80 border border-blue-500/30 rounded-lg p-6 w-96 text-blue-100 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-blue-300">Settings</h2>
          <button onClick={toggleSettings} className="text-blue-300 hover:text-blue-100">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">MCP Service URL</label>
            <input
              type="text"
              value={settings.mcpServiceUrl}
              onChange={(e) => setSettings({ ...settings, mcpServiceUrl: e.target.value })}
              className="w-full bg-black/50 border border-blue-500/30 rounded px-3 py-2 text-blue-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API URL</label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              className="w-full bg-black/50 border border-blue-500/30 rounded px-3 py-2 text-blue-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              className="w-full bg-black/50 border border-blue-500/30 rounded px-3 py-2 text-blue-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Model Name</label>
            <input
              type="text"
              value={settings.modelName}
              onChange={(e) => setSettings({ ...settings, modelName: e.target.value })}
              className="w-full bg-black/50 border border-blue-500/30 rounded px-3 py-2 text-blue-100 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button

            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  ) : null;
};

export { loadConfigFromLocalStorage,SettingsModal }; 