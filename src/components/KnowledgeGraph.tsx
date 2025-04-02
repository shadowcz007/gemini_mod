import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { Entity, Relationship } from '../types';

interface KnowledgeGraphProps {
  entities: Entity[];
  relationships: Relationship[];
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ entities, relationships }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = new DataSet(
      entities.map((entity) => ({
        id: entity.id,
        label: entity.label,
        color: {
          background: '#1d4ed8',
          border: '#60a5fa',
          highlight: { background: '#2563eb', border: '#93c5fd' },
        },
        font: { color: '#fff' },
      }))
    );

    const edges = new DataSet(
      relationships.map((rel) => ({
        id: rel.id,
        from: rel.from,
        to: rel.to,
        label: rel.label,
        color: { color: '#60a5fa', highlight: '#93c5fd' },
        font: { color: '#fff' },
        arrows: 'to',
      }))
    );

    const options = {
      nodes: {
        shape: 'dot',
        size: 16,
        borderWidth: 2,
        shadow: true,
      },
      edges: {
        width: 2,
        shadow: true,
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -2000,
          springLength: 200,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
      },
    };

    networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [entities, relationships]);

  return <div ref={containerRef} className="w-full h-full" />;
};