import React, { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    <Card className="w-full">
      <CardHeader className="pb-3">
        
      </CardHeader>
      <CardContent>
        {/* 连接控制 */}
        <div className="flex items-center space-x-2 mb-4">
          <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen} className="w-full">
            <div className="flex items-center space-x-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>

            </div>

            <CollapsibleContent>
              <div className="space-y-3 mt-2"> 
                <div className="space-y-1">
                  <label className="text-sm font-medium">MCP 服务器 URL</label>
                  <Input
                    type="text"
                    value={sseUrl}
                    onChange={(e) => setSseUrl(e.target.value)}
                    placeholder="MCP 服务器 URL"
                  />
                </div>

                {/* <div className="space-y-1">
                  <label className="text-sm font-medium">资源过滤器</label>
                  <Input
                    type="text"
                    value={resourceFilter}
                    onChange={(e) => setResourceFilter(e.target.value)}
                    placeholder="资源过滤器（可选）"
                  />
                </div> */}

              
                <Button onClick={handleConnect} disabled={loading} variant="default" className="ml-auto">
                  {loading ? '连接中...' : '连接'}
                </Button>

                <Card className="mt-2">
                  <CardHeader className="py-2">
                    <CardTitle className="text-md">API设置</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">API Base URL</label>
                        <Input
                          type="text"
                          value={baseUrl}
                          onChange={(e) => setBaseUrl(e.target.value)}
                          placeholder="API Base URL"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">API Key</label>
                        <Input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="API Key"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium">模型</label>
                        <Input
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="Model"
                        />
                      </div>

                      <Button onClick={saveSettings} className="w-full">保存设置</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigSettings;
export { ConfigSettings, loadConfigFromLocalStorage }; 