import React from 'react';
 
interface EntityCardProps {
  entity: any;
  onDelete?: (entity: any) => void;
}

export const EntityCard: React.FC<EntityCardProps> = ({ entity, onDelete }) => {
  // console.log('#entity', entity);
  if (!entity) return null;
  return (
    <div className="relative bg-black/80 border border-blue-500/30 rounded-lg p-4 mb-4 text-blue-100">
      {onDelete && (
        <button
          onClick={() => onDelete(entity)}
          className="absolute top-2 right-2 text-blue-400 hover:text-blue-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      <h3 className="text-lg font-semibold text-blue-300 mb-2">{entity.label}</h3>
      <div className="text-sm">
        <p className="text-blue-200 mb-1">Type: {entity.type}</p>
        <div className="space-y-1">
          {Array.from(entity.observations, (value,key) => (
            <p key={key} className="flex justify-between">
              <span className="text-blue-400">{key}:</span>
              <span className="text-blue-100">{String(value)}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};