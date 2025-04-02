import { useState, useEffect } from "react";
import "./GraphViewer.css";

interface GraphViewerProps {
    baseUrl: string;
    apiKey: string;
    tools: any[];
}

interface GraphData {
    entities: any[];
    relations: any[];
}

const GraphViewer: React.FC<GraphViewerProps> = ({ baseUrl, apiKey, tools }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [activeTab, setActiveTab] = useState<"entities" | "relations">("entities");

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
                                                <h4>{entity.name || `实体 #${index + 1}`}</h4>
                                                <div className="item-properties">
                                                    <p><strong>类型:</strong> {entity.entityType
                                                        || "未知"}</p>
                                                    {entity.observations && Array.from(entity.observations, value => (
                                                        <p> {String(value)}</p>
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
                                                <h4>{relation.type || `关系 #${index + 1}`}</h4>
                                                <div className="item-properties">
                                                    <p><strong>源实体:</strong> {relation.from_ || "未知"}</p>
                                                    <p><strong>目标实体:</strong> {relation.to || "未知"}</p>
                                                    {relation.relationType && <p  > {String(relation.relationType)}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphViewer;
export { GraphViewer, type GraphViewerProps };