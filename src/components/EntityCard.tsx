import React from 'react';
 
interface EntityCardProps {
  entity: any;
}

export const EntityCard: React.FC<EntityCardProps> = ({ entity }) => {
  // console.log('#entity', entity);
  if (!entity) return null;
  return (
    <div className="bg-black/80 border border-blue-500/30 rounded-lg p-4 mb-4 text-blue-100">
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