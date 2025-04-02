import { useEffect, useRef } from "react"; 
import { Network, DataSet } from "vis-network/standalone";


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

export { NetworkVisualization };