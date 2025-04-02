import { useState, forwardRef, useImperativeHandle } from "react";
import "./MemoryExtractor.css";
import { NetworkVisualization } from "./GraphViewer";
interface MemoryExtractorProps {
  mcpServiceUrl: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  tools: any;
  prompts: any[];
}

enum ProcessStatus {
  IDLE = "空闲",
  EXTRACTING = "提取中",
  CONFIRMING = "等待确认",
  CREATING = "创建中",
  COMPLETED = "完成",
  ERROR = "错误"
}

interface EntityOrRelation {
  type: string;
  name: string;
  data: any;
}

const MemoryExtractor = forwardRef<
  { sendToMemory: (content: string) => Promise<void>, extractSilently: (content: string) => Promise<void> },
  MemoryExtractorProps
>(({
  mcpServiceUrl,
  baseUrl,
  apiKey,
  model,
  tools,
  prompts
}, ref) => {
  const [status, setStatus] = useState<ProcessStatus>(ProcessStatus.IDLE);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [extractedItems, setExtractedItems] = useState<EntityOrRelation[]>([]);
  const [error, setError] = useState("");
  const [extractionQueue, setExtractionQueue] = useState<EntityOrRelation[][]>([]);

  // 处理确认或拒绝
  const handleConfirm = async (accept: boolean) => {
    if (!accept) {
      setExtractedItems([]);
      setStatus(ProcessStatus.IDLE);
      setMessage("用户取消了操作");
      return;
    }

    try {
      setStatus(ProcessStatus.CREATING);
      setMessage("正在创建实体和关系...");

      const results = [];
      for (const item of extractedItems) {
        const tool = tools.find((t: any) => t.name === (item.type === 'entity' ? 'create_entities' : 'create_relations'));
        if (tool) {
          const result = await tool.execute(item.data);
          results.push(result);
        }
      }

      setStatus(ProcessStatus.COMPLETED);
      setMessage(`成功创建 ${results.length} 个项目`);
      setTimeout(() => {
        setStatus(ProcessStatus.IDLE);
        setExtractedItems([]);
        setProgress(0);
      }, 3000);
    } catch (err) {
      setStatus(ProcessStatus.ERROR);
      setError(`创建失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 添加重试处理函数
  const handleRetry = async () => {
    setStatus(ProcessStatus.IDLE);
    setExtractedItems([]);
    setProgress(0);
    // 获取最后一次的内容并重新发送
    const lastContent = message.replace("请确认是否创建以下实体和关系", "").trim();
    await sendToMemory(lastContent);
  };

  // 将提取的项目转换为网络可视化所需的格式
  const convertToGraphData = (items: EntityOrRelation[]) => {
    const entities: any[] = [];
    const relations: any[] = [];
    const entitySet = new Set<string>();

    // 处理实体
    items.forEach(item => {
      if (item.type === 'entity' && item.data.entities) {
        item.data.entities.forEach((entity: any) => {
          entities.push({
            id: entity.name,
            name: entity.name,
            entityType: entity.entityType,
            data: {
              ...entity,
              observations: entity.observations.join('\n')
            }
          });
          entitySet.add(entity.name);
        });
      }
    });

    // 处理关系
    items.forEach(item => {
      if (item.type === 'relation' && item.data.relations) {
        item.data.relations.forEach((relation: any) => {
          // 检查并添加缺失的实体
          [relation.from_, relation.to].forEach(entityName => {
            if (!entitySet.has(entityName)) {
              entities.push({
                id: entityName,
                name: entityName,
                entityType: '未知',
                data: {
                  name: entityName,
                  entityType: '未知',
                  observations: []
                }
              });
              entitySet.add(entityName);
            }
          });

          relations.push({
            id: `${relation.from_}-${relation.to}`,
            from_: relation.from_,
            to: relation.to,
            relationType: relation.relationType,
            data: relation
          });
        });
      }
    });
    console.log(entities, relations);
    return { entities, relations };
  };

  // 发送到记忆服务的函数
  const sendToMemory = async (content: string) => {
    if (!mcpServiceUrl) {
      setError("未设置SSE URL，无法发送数据");
      return;
    }

    setStatus(ProcessStatus.EXTRACTING);
    setProgress(10);
    setMessage("正在从对话中提取知识...");
    setError("");

    try {
      // 查找知识提取器提示
      const prompt = prompts.find(p => p.name === 'knowledge_extractor');
      if (!prompt) {
        throw new Error("未找到知识提取器提示");
      }

      setProgress(20);

      // 准备工具列表
      const toolsList = Array.from(
        tools.filter((t: any) => t.name === 'create_entities' || t.name === 'create_relations'),
        (t: any) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description || `执行${t.name}操作`,
            parameters: t.inputSchema || {}
          }
        })
      );

      setProgress(30);

      // 准备消息
      const messages = [
        { role: "system", content: prompt.systemPrompt },
        { role: "user", content }
      ];

      // 调用LLM API
      setMessage("正在调用AI进行知识提取...");
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

      setProgress(60);

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const result = await response.json();
      const message = result.choices[0]?.message;

      setProgress(80);

      // 处理工具调用
      if (message.tool_calls?.length > 0) {
        const items: EntityOrRelation[] = [];

        for (const toolCall of message.tool_calls) {
          const name = toolCall.function.name;
          let param = toolCall.function.arguments;

          try {
            param = JSON.parse(param);

            if (name === 'create_entities') {
              items.push({
                type: 'entity',
                name: '实体',
                data: param
              });
            } else if (name === 'create_relations') {
              items.push({
                type: 'relation',
                name: '关系',
                data: param
              });
            }
          } catch (error) {
            console.error(`解析参数失败 (${name}):`, error, param);
          }
        }

        if (items.length > 0) {
          setExtractedItems(items);
          setStatus(ProcessStatus.CONFIRMING);
          setMessage("请确认是否创建以下实体和关系");
        } else {
          setStatus(ProcessStatus.COMPLETED);
          setMessage("未提取到任何实体或关系");
          setTimeout(() => setStatus(ProcessStatus.IDLE), 3000);
        }
      } else {
        setStatus(ProcessStatus.COMPLETED);
        setMessage("AI未识别出需要提取的知识");
        setTimeout(() => setStatus(ProcessStatus.IDLE), 3000);
      }

      setProgress(100);
    } catch (error) {
      setStatus(ProcessStatus.ERROR);
      setError(`提取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 新增无界面提取方法
  const extractSilently = async (content: string) => {
    if (!mcpServiceUrl) {
      console.error("未设置SSE URL，无法发送数据");
      return;
    }

    try {
      const prompt = prompts.find(p => p.name === 'knowledge_extractor');
      if (!prompt) {
        throw new Error("未找到知识提取器提示");
      }

      const toolsList = Array.from(
        tools.filter((t: any) => t.name === 'create_entities' || t.name === 'create_relations'),
        (t: any) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description || `执行${t.name}操作`,
            parameters: t.inputSchema || {}
          }
        })
      );

      const messages = [
        { role: "system", content: prompt.systemPrompt },
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
      const message = result.choices[0]?.message;

      if (message.tool_calls?.length > 0) {
        const items: EntityOrRelation[] = [];

        for (const toolCall of message.tool_calls) {
          const name = toolCall.function.name;
          let param = toolCall.function.arguments;

          try {
            param = JSON.parse(param);
            if (name === 'create_entities') {
              items.push({
                type: 'entity',
                name: '实体',
                data: param
              });
            } else if (name === 'create_relations') {
              items.push({
                type: 'relation',
                name: '关系',
                data: param
              });
            }
          } catch (error) {
            console.error(`解析参数失败 (${name}):`, error, param);
          }
        }

        if (items.length > 0) {
          setExtractionQueue(prev => [...prev, items]);
        }
      }
    } catch (error) {
      console.error(`提取失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 处理队列项点击
  const handleQueueItemClick = (items: EntityOrRelation[]) => {
    setExtractedItems(items);
    setStatus(ProcessStatus.CONFIRMING);
    setMessage("请确认是否创建以下实体和关系");
    // 从队列中移除该项
    setExtractionQueue(prev => prev.filter(queueItems => queueItems !== items));
  };

  // 向父组件暴露方法
  useImperativeHandle(ref, () => ({
    sendToMemory,
    extractSilently
  }));

  return (
    <div className="memory-extractor">
      {/* 添加队列显示 */}
      {extractionQueue.length > 0 && (
        <div className="extraction-queue">
          <div className="queue-badge" onClick={() => handleQueueItemClick(extractionQueue[0])}>
            待确认: {extractionQueue.length}
          </div>
        </div>
      )}
      
      {status !== ProcessStatus.IDLE && (
        <div className="extractor-overlay">
          <div className="extractor-modal">
            <h3>知识提取 - {status}</h3>

            {status === ProcessStatus.EXTRACTING && (
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                <div className="progress-text">{progress}%</div>
                <p>{message}</p>
              </div>
            )}

            {status === ProcessStatus.CONFIRMING && (
              <div className="confirm-container">
                <p>{message}</p>

                <div className="network-visualization-container">
                  <NetworkVisualization
                    graphData={convertToGraphData(extractedItems)}
                    height={300}
                    width="100%"
                  />
                </div>

                <div className="extracted-items">
                  {extractedItems.map((item, index) => (
                    <div key={index} className="item-card">
                      <h4>{item.name} #{index + 1}</h4>
                      <pre>{JSON.stringify(item.data, null, 2)}</pre>
                    </div>
                  ))}
                </div>

                <div className="action-buttons">
                  <button
                    className="confirm-button"
                    onClick={() => handleConfirm(true)}
                  >
                    确认创建
                  </button>
                  <button
                    className="retry-button"
                    onClick={handleRetry}
                  >
                    重新提取
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => handleConfirm(false)}
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {status === ProcessStatus.CREATING && (
              <div className="progress-container">
                <div className="spinner"></div>
                <p>{message}</p>
              </div>
            )}

            {status === ProcessStatus.COMPLETED && (
              <div className="complete-container">
                <div className="success-icon">✓</div>
                <p>{message}</p>
              </div>
            )}

            {status === ProcessStatus.ERROR && (
              <div className="error-container">
                <div className="error-icon">✗</div>
                <p>{error}</p>
                <button onClick={() => setStatus(ProcessStatus.IDLE)}>关闭</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default MemoryExtractor;
export { MemoryExtractor, type MemoryExtractorProps };