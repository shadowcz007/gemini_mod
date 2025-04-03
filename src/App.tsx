import { useEffect, useRef, useState } from 'react';
import { Settings, MessageCircle } from 'lucide-react';

import { listen } from "@tauri-apps/api/event";
import { Window, LogicalSize, LogicalPosition, primaryMonitor } from "@tauri-apps/api/window";
import { parseMemoryContent, openGeminiWindow } from './customJsCode';

import { SettingsModal, loadConfigFromLocalStorage } from './components/SettingsModal';
import { ChatInterface } from './components/ChatInterface';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { EntityCard } from './components/EntityCard';
import { RelationshipCard } from './components/RelationshipCard';
import { useSettingsStore } from './store';
import { MCPProvider, useMCP } from 'mcp-uiux';
import { MemoryExtractor } from './memory/MemoryExtractor';


interface GraphData {
  entities: any[];
  relations: any[];
}

function AppContent() {

  const {
    connect,
    reconnect,
    loading: mcpLoading,
    error,
    tools,
    prompts
  } = useMCP();

  const [initialLoading, setInitialLoading] = useState(true);

  const { toggleSettings, toggleChat } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<'entities' | 'relationships'>('entities');
  const [geminiWindowOpen, setGeminiWindowOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [mcpServiceUrl, setMcpServiceUrl] = useState('http://127.0.0.1:8080')
  const [baseUrl, setBaseUrl] = useState('https://api.siliconflow.cn/v1/chat/completions');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('Qwen/Qwen2.5-7B-Instruct');
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);


  // Sample data - replace with actual data from your API
  // const sampleEntities: Entity[] = [
  //   {
  //     id: '1',
  //     label: 'Person',
  //     type: 'Human',
  //     properties: { name: 'John Doe', age: 30 }
  //   },
  //   {
  //     id: '2',
  //     label: 'Location',
  //     type: 'Place',
  //     properties: { name: 'New York', country: 'USA' }
  //   }
  // ];

  // const sampleRelationships: Relationship[] = [
  //   {
  //     id: '1',
  //     from: '1',
  //     to: '2',
  //     label: 'LIVES_IN',
  //     properties: { since: '2020' }
  //   }
  // ];

  // 引用MemoryExtractor组件
  const memoryExtractorRef = useRef<{
    sendToMemory: (content: string) => Promise<void>;
    extractSilently: (content: string) => Promise<void>;
  }>(null);


  const fetchGraphData = async () => {
    setLoading(true);

    try {
      // 查找read_graph工具
      const readGraphTool = tools.find((t: any) => t.name === 'read_graph');

      if (!readGraphTool) {
        throw new Error("未找到read_graph工具");
      }

      // 执行工具获取图谱数据
      const result = await readGraphTool.execute({});

      try {
        let graphData = JSON.parse(result[0].text);
        console.log('#执行工具获取图谱数据', graphData);

        graphData.entities = graphData.entities.map((entity: any, index: number) => ({
          id: entity.id || entity.name || `entity-${index}`,
          label: entity.name || `实体 #${index + 1}`,
          title: entity.entityType || "未知类型",
          group: entity.entityType || "default",
          type: entity.entityType,
          observations: entity.observations || {}
        }))

        graphData.relations = graphData.relations.map((relation: any, index: number) => ({
          id: `relation-${index}`,
          from: relation.from_ || relation.from || "",
          to: relation.to || "",
          label: relation.type || relation.relationType || "",
          arrows: "to"
        }))

        setGraphData({
          entities: graphData.entities || [],
          relations: graphData.relations || []
        });
      } catch (error) {

      }

    } catch (err) {
      console.log(`获取知识图谱失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (settings: any) => {
    console.log(settings);
    // settings.mcpServiceUrl,
    // settings.baseUrl,
    // settings.apiKey,
    // settings.model
    reconnect(settings.mcpServiceUrl, '');
  }

  const handleSave = (settings: any) => {
    console.log('#handleSave', settings);
    setApiKey(settings.apiKey);
    setBaseUrl(settings.baseUrl);
    setMcpServiceUrl(settings.mcpServiceUrl);
    setModel(settings.model);
  }

  const appIcon = async () => {
    const window = await Window.getCurrent();
    window.setSize(new LogicalSize(128, 24));
    const monitor = await primaryMonitor();
    const screenWidth = monitor ? monitor.size.width : 1920;
    const screenHeight = monitor ? monitor.size.height : 1080;
    window.setPosition(new LogicalPosition(screenWidth - 148, screenHeight - 98));
    window.setAlwaysOnTop(true);
  }

  // 修改窗口控制函数
  const handleMinimize = async () => {
    console.log('handleMinimize');
    setIsMaximized(false);
    appIcon()
  };

  const handleToggleSize = async () => {
    const m = !isMaximized;
    setIsMaximized(m);
    console.log('handleToggleSize');
    const window = await Window.getCurrent();
    if (!m) {
      appIcon()
    } else {
      window.setSize(new LogicalSize(800, 600));
      window.center();
      window.setAlwaysOnTop(false);
    }
  };

  // 处理打开Gemini窗口
  const handleOpenGeminiWindow = () => {
    openGeminiWindow();
    setGeminiWindowOpen(true);
    handleMinimize()
  };

  const handleClose = async () => {
    const window = await Window.getCurrent();
    window.close();
  };


  // 添加删除实体的函数
  const handleDeleteEntity = async (entityName: string) => {
    try {
      const deleteEntityTool = tools.find((t: any) => t.name === 'delete_entities');
      if (!deleteEntityTool) {
        throw new Error("未找到delete_entities工具");
      }

      await deleteEntityTool.execute({
        entityNames: [entityName]
      });

      // 删除成功后重新获取数据
      await fetchGraphData();
    } catch (err) {
      console.log(`删除实体失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 添加删除关系的函数
  const handleDeleteRelation = async (relation: any) => {
    try {
      const deleteRelationTool = tools.find((t: any) => t.name === 'delete_relations');
      if (!deleteRelationTool) {
        throw new Error("未找到delete_relations工具");
      }

      await deleteRelationTool.execute({
        relations: [{
          from_: relation.from_ || relation.from,
          to: relation.to,
          relationType: relation.type || relation.relationType
        }]
      });

      // 删除成功后重新获取数据
      await fetchGraphData();
    } catch (err) {
      console.log(`删除关系失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDelete = (type: string, data: any) => {
    console.log('#handleDelete', type, data);
    if (type === 'entity') {
      handleDeleteEntity(data.id);
    }
    if (type === 'relationship') {
      handleDeleteRelation(data);
    }
  }

  // 组件初始化时加载配置
  useEffect(() => {
    // 程序加载时自动打开Gemini窗口，添加2秒延迟
    setTimeout(() => {
      handleOpenGeminiWindow();
      setInitialLoading(false);
      console.log("初始化完成");
    }, 3000);

    let config = loadConfigFromLocalStorage();
    connect(config.mcpServiceUrl || mcpServiceUrl, '');
    if (config) {
      setMcpServiceUrl(config.mcpServiceUrl);
      setBaseUrl(config.baseUrl);
      setApiKey(config.apiKey);
      setModel(config.model);
    }
  }, []);

  useEffect(() => {

    fetchGraphData()

    const unlisten = listen("result-from-gemini", (event) => {
      const result = event.payload as string;
      let data = JSON.parse(result);
      console.log('result-from-gemini', data);
      if (data.type === 'message_content' && data.content) {
        // 在 if 语句内部
        const markdown = parseMemoryContent(data.content);
        let content = `User:${data.userQuery}\n\nAssistant:${markdown}`
        console.log(mcpServiceUrl, memoryExtractorRef.current, content);

        // 如果设置了 SSE URL，可以发送数据
        if (mcpServiceUrl && memoryExtractorRef.current) {
          // 如果 isMaximized 为 true，则调用 sendToMemory 方法
          if (isMaximized) {
            memoryExtractorRef.current.sendToMemory(content);
          } else {
            memoryExtractorRef.current.extractSilently(content);
          }

        }
      }
    });

    // 监听Gemini窗口关闭事件
    const unlistenClose = listen("gemini-window-closed", () => {
      setGeminiWindowOpen(false);
      handleToggleSize()
    });

    return () => {
      unlisten.then((unlisten) => unlisten());
      unlistenClose.then((unlisten) => unlisten());
    }
  }, [mcpServiceUrl, prompts]) // 添加 mcpServiceUrl 作为依赖项

  return initialLoading ? (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>正在初始化应用...</p>
    </div>
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* 添加标题栏 */}
      <div className="title-bar" data-tauri-drag-region style={{ backgroundColor: !isMaximized ? 'blue' : 'transparent' }}>
        <div data-tauri-drag-region style={{ width: 128, display: 'flex', justifyContent: 'center' }}>
          <button className="control-button" style={{ width: 115, fontSize: 12 }}
            onClick={handleToggleSize}
          >Gemini-Memory</button>

        </div>
        {isMaximized && <div className="window-controls">
          <button className="control-button minimize"
            onClick={handleMinimize}
          >─</button>
          <button className="control-button close"
            onClick={handleClose}
          >×</button>
        </div>}
      </div>
      {isMaximized && <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">Memory Management System</h1>
          <div className="flex gap-4">
            <button
              onClick={toggleChat}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
              title="Open Chat"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
            <button
              onClick={toggleSettings}
              className={`p-2 rounded-full transition-colors ${tools.length > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-600 hover:bg-gray-700'
                }`}
              title="Open Settings"
            >
              <Settings className={`w-6 h-6 ${tools.length > 0
                ? 'text-white'
                : 'text-gray-400'
                }`} />
            </button>
            <div className="row" style={{ marginTop: "20px" }}>
                <button onClick={handleOpenGeminiWindow}>打开Gemini窗口</button>
              </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-8">
          {/* Knowledge Graph */}
          <div className="col-span-2 bg-black/40 rounded-lg border border-blue-500/30 p-4 h-[600px]">
            <KnowledgeGraph
              entities={graphData?.entities || []}
              relationships={graphData?.relations || []}
            />
          </div>

          {/* Right Panel */}
          <div className="col-span-1">
            {/* Tab Navigation */}
            <div className="flex mb-4 bg-black/40 rounded-lg overflow-hidden">
              <button
                className={`flex-1 py-2 px-4 ${activeTab === 'entities'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-300 hover:bg-blue-600/20'
                  }`}
                onClick={() => setActiveTab('entities')}
              >
                Entities
              </button>
              <button
                className={`flex-1 py-2 px-4 ${activeTab === 'relationships'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-300 hover:bg-blue-600/20'
                  }`}
                onClick={() => setActiveTab('relationships')}
              >
                Relationships
              </button>
            </div>

            {/* Cards Container */}
            {graphData && <div className="overflow-y-auto h-[540px] pr-2 space-y-4">
              {activeTab === 'entities'
                ? graphData?.entities.map((entity) => (
                  <EntityCard key={entity.id} entity={entity}
                    onDelete={(entity) => handleDelete('entity', entity)}
                  />
                ))
                : graphData?.relations.map((relationship) => (
                  <RelationshipCard key={relationship.id}
                    onDelete={(relationship) => handleDelete('relationship', relationship)}
                    relationship={relationship} />
                ))}
            </div>}
          </div>
        </div>
      </div>}

      {/* 添加MemoryExtractor组件 */}
      <MemoryExtractor
        ref={memoryExtractorRef}
        mcpServiceUrl={mcpServiceUrl}
        baseUrl={baseUrl}
        apiKey={apiKey}
        model={model}
        tools={tools}
        prompts={prompts}
      />

      <SettingsModal
        onConnect={handleConnect}
        onSave={handleSave}
      />
      <ChatInterface />
    </div>
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