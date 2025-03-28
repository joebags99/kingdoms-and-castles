// src/components/resources/ResourceDisplay.tsx
import React from 'react';
import styled from 'styled-components';
import { ResourcePool, ResourceType, RESOURCES, NATION_RESOURCES } from '../../types/resources';

const ResourceDisplayContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ResourceItem = styled.div<{ color: string; active: boolean }>`
  display: flex;
  align-items: center;
  background-color: ${props => props.active ? '#ffffff' : '#f1f3f5'};
  border-radius: 6px;
  padding: 8px;
  min-width: 80px;
  border: 2px solid ${props => props.active ? props.color : 'transparent'};
  opacity: ${props => props.active ? '1' : '0.6'};
  transition: all 0.2s;
  
  &:hover {
    transform: ${props => props.active ? 'translateY(-2px)' : 'none'};
    box-shadow: ${props => props.active ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'};
  }
`;

const ResourceIcon = styled.div<{ color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-right: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
`;

const ResourceName = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
`;

const ResourceAmount = styled.div<{ color: string }>`
  margin-left: auto;
  font-size: 1rem;
  font-weight: bold;
  color: ${props => props.color};
`;

interface ResourceDisplayProps {
  resources: ResourcePool;
  nation: string;
}

const ResourceDisplay: React.FC<ResourceDisplayProps> = ({ resources, nation }) => {
  // Get which resources the nation uses
  const nationResources = NATION_RESOURCES[nation] || [];
  
  // Display all resources, but highlight only those used by the nation
  return (
    <ResourceDisplayContainer>
      {Object.keys(RESOURCES).map((resourceKey) => {
        const resourceType = resourceKey as ResourceType;
        const resource = RESOURCES[resourceType];
        const amount = resources[resourceType];
        const isActive = nationResources.includes(resourceType);
        
        // Determine the first character for the icon
        const iconChar = resource.name.charAt(0);
        
        return (
          <ResourceItem 
            key={resourceType} 
            color={resource.color}
            active={isActive}
            title={`${resource.name}: ${resource.description}`}
          >
            <ResourceIcon color={resource.color}>
              {iconChar}
            </ResourceIcon>
            <ResourceName>{resource.name}</ResourceName>
            <ResourceAmount color={resource.color}>
              {amount}
            </ResourceAmount>
          </ResourceItem>
        );
      })}
    </ResourceDisplayContainer>
  );
};

export default ResourceDisplay;