import React from 'react';
import { Relationship } from '../types';

interface RelationshipCardProps {
  relationship: Relationship;
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({ relationship }) => {
  return (
    <div className="bg-black/80 border border-blue-500/30 rounded-lg p-4 mb-4 text-blue-100">
      <h3 className="text-lg font-semibold text-blue-300 mb-2">{relationship.label}</h3>
      <div className="text-sm space-y-2">
        <p className="flex justify-between">
          <span className="text-blue-400">From:</span>
          <span className="text-blue-100">{relationship.from}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-blue-400">To:</span>
          <span className="text-blue-100">{relationship.to}</span>
        </p>
        {/* <div className="space-y-1 mt-2">
          {Object.entries(relationship.properties).map(([key, value]) => (
            <p key={key} className="flex justify-between">
              <span className="text-blue-400">{key}:</span>
              <span className="text-blue-100">{String(value)}</span>
            </p>
          ))}
        </div> */}
      </div>
    </div>
  );
};