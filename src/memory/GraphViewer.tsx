import { useState, useEffect, useRef } from "react";
import "./GraphViewer.css";
import { Network, DataSet } from "vis-network/standalone";

interface GraphViewerProps {
    baseUrl: string;
    apiKey: string;
    tools: any[];
}

interface GraphData {
    entities: any[];
    relations: any[];
}

interface NetworkVisualizationProps {
    graphData: GraphData;
    height?: string | number;
    width?: string | number;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ 
    graphData, 
    height = "500px", 
    width = "100%" 
}) => {
    const networkRef = useRef<HTMLDivElement>(null);
    const networkInstanceRef = useRef<any>(null);

    useEffect(() => {
        // 当图数据准备好时，渲染网络图
        if (graphData && networkRef.current) {
            renderNetwork();
        }
        
        // 组件卸载时清理
        return () => {
            if (networkInstanceRef.current) {
                networkInstanceRef.current.destroy();
                networkInstanceRef.current = null;
            }
        };
    }, [graphData]);

    const renderNetwork = () => {
        if (!graphData || !networkRef.current) return;

        // 清除之前的网络实例
        if (networkInstanceRef.current) {
            networkInstanceRef.current.destroy();
            networkInstanceRef.current = null;
        }

        // 准备节点数据
        const nodes = new DataSet(
            graphData.entities.map((entity, index) => ({
                id: entity.id || entity.name || `entity-${index}`,
                label: entity.name || `实体 #${index + 1}`,
                title: entity.entityType || "未知类型",
                group: entity.entityType || "default"
            }))
        );

        // 准备边数据
        const edges = new DataSet(
            graphData.relations.map((relation, index) => ({
                id: `relation-${index}`,
                from: relation.from_ || relation.from || "",
                to: relation.to || "",
                label: relation.type || relation.relationType || "",
                arrows: "to"
            }))
        );

        // 网络配置
        const options = {
            nodes: {
                shape: "dot",
                size: 16,
                font: {
                    size: 12,
                    face: "Arial"
                },
                borderWidth: 2
            },
            edges: {
                width: 1,
                font: {
                    size: 10,
                    align: "middle"
                },
                color: { color: "#848484", highlight: "#1890ff" }
            },
            physics: {
                stabilization: true,
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 95,
                    springConstant: 0.04
                }
            },
            groups: {
                default: { color: { background: "#97C2FC", border: "#2B7CE9" } },
                person: { color: { background: "#FFA807", border: "#FF6F00" } },
                location: { color: { background: "#7BE141", border: "#4CAF50" } },
                organization: { color: { background: "#FB7E81", border: "#E91E63" } }
            }
        };

        // 创建网络
        const network = new Network(
            networkRef.current,
            { nodes, edges },
            options
        );

        networkInstanceRef.current = network;
    };

    return (
        <div className="visualization-container">
            {graphData.entities.length === 0 ? (
                <p className="empty-message">暂无实体数据，无法可视化</p>
            ) : (
                <div 
                    ref={networkRef} 
                    className="network-graph"
                    style={{ height, width }}
                ></div>
            )}
        </div>
    );
};

const GraphViewer: React.FC<GraphViewerProps> = ({ baseUrl, apiKey, tools }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [activeTab, setActiveTab] = useState<"entities" | "relations" | "visualization">("entities");

    const fetchGraphData = async () => {
        setLoading(true);
        setError("");

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
                setGraphData({
                    entities: graphData.entities || [],
                    relations: graphData.relations || []
                });
            } catch (error) {

            }

        } catch (err) {
            setError(`获取知识图谱失败: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
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
            setError(`删除实体失败: ${err instanceof Error ? err.message : String(err)}`);
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
            setError(`删除关系失败: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    useEffect(() => {
        // 组件挂载时自动获取数据
        if (tools?.length > 0) fetchGraphData();
    }, [tools]);

    return (
        <div className="graph-viewer">
            <div className="graph-viewer-header">
                <h3>知识图谱查看器</h3>
                <button
                    className="refresh-button"
                    onClick={fetchGraphData}
                    disabled={loading}
                >
                    {loading ? "加载中..." : "刷新"}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            {loading && !graphData && (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>正在加载知识图谱数据...</p>
                </div>
            )}

            {graphData && (
                <div className="graph-content">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === "entities" ? "active" : ""}`}
                            onClick={() => setActiveTab("entities")}
                        >
                            实体 ({graphData.entities.length})
                        </button>
                        <button
                            className={`tab ${activeTab === "relations" ? "active" : ""}`}
                            onClick={() => setActiveTab("relations")}
                        >
                            关系 ({graphData.relations.length})
                        </button>
                        <button
                            className={`tab ${activeTab === "visualization" ? "active" : ""}`}
                            onClick={() => setActiveTab("visualization")}
                        >
                            可视化
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === "entities" && (
                            <div className="entities-list">
                                {graphData.entities.length === 0 ? (
                                    <p className="empty-message">暂无实体数据</p>
                                ) : (
                                    <div className="items-grid">
                                        {graphData.entities.map((entity, index) => (
                                            <div key={index} className="item-card">
                                                <div className="item-header">
                                                    <h4>{entity.name || `实体 #${index + 1}`}</h4>
                                                    <button 
                                                        className="delete-button"
                                                        onClick={() => handleDeleteEntity(entity.name)}
                                                        title="删除实体"
                                                    >
                                                        ✖
                                                    </button>
                                                </div>
                                                <div className="item-properties">
                                                    <p><strong>类型:</strong> {entity.entityType || "未知"}</p>
                                                    <br></br>
                                                    {entity.observations && Array.from(entity.observations, (value, index) => (
                                                        <p key={index}><strong>观察:</strong> {String(value)}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "relations" && (
                            <div className="relations-list">
                                {graphData.relations.length === 0 ? (
                                    <p className="empty-message">暂无关系数据</p>
                                ) : (
                                    <div className="items-grid">
                                        {graphData.relations.map((relation, index) => (
                                            <div key={index} className="item-card">
                                                <div className="item-header">
                                                    <h4>{relation.type || `关系 #${index + 1}`}</h4>
                                                    <button 
                                                        className="delete-button"
                                                        onClick={() => handleDeleteRelation(relation)}
                                                        title="删除关系"
                                                    >
                                                        ✖
                                                    </button>
                                                </div>
                                                <div className="item-properties">
                                                    <p><strong>源实体:</strong> {relation.from_ || "未知"}</p>
                                                    <p><strong>目标实体:</strong> {relation.to || "未知"}</p>
                                                    {relation.relationType && <p>{String(relation.relationType)}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "visualization" && (
                            <NetworkVisualization graphData={graphData} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphViewer;
export { GraphViewer, type GraphViewerProps, NetworkVisualization};