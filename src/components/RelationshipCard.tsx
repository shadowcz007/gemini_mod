import React from 'react';
import { Relationship } from '../types';

interface RelationshipCardProps {
  relationship: Relationship;
  onDelete?: (relationship: Relationship) => void;
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({ relationship, onDelete }) => {
  return (
    <div className="relative bg-black/80 border border-blue-500/30 rounded-lg p-4 mb-4 text-blue-100">
      {onDelete && (
        <button
          onClick={() => onDelete(relationship)}
          className="absolute top-2 right-2 text-blue-400 hover:text-blue-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
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