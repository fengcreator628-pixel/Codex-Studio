import { FileSystemNode, Project, NodeType } from '../types';

export const buildTree = (nodes: FileSystemNode[], parentId: string | null = null): FileSystemNode[] => {
  return nodes
    .filter(node => node.parentId === parentId)
    .sort((a, b) => a.order - b.order);
};

export const createNode = (
  project: Project, 
  type: NodeType, 
  title: string, 
  parentId: string | null = null
): { project: Project, newNode: FileSystemNode } => {
  
  const siblings = (project.nodes || []).filter(n => n.parentId === parentId);
  const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(n => n.order)) : -1;
  
  const newNode: FileSystemNode = {
    id: crypto.randomUUID(),
    type,
    title,
    content: '',
    parentId,
    order: maxOrder + 1,
    isOpen: true
  };

  const updatedProject = {
    ...project,
    nodes: [...(project.nodes || []), newNode]
  };

  return { project: updatedProject, newNode };
};

export const deleteNode = (project: Project, nodeId: string): Project => {
  if (!project.nodes) return project;
  
  // Recursive delete
  const nodeToDelete = project.nodes.find(n => n.id === nodeId);
  if (!nodeToDelete) return project;

  const idsToDelete = new Set<string>([nodeId]);
  
  // Find all children recursively
  const collectChildren = (pid: string) => {
    const children = project.nodes.filter(n => n.parentId === pid);
    children.forEach(c => {
      idsToDelete.add(c.id);
      collectChildren(c.id);
    });
  };
  collectChildren(nodeId);

  return {
    ...project,
    nodes: project.nodes.filter(n => !idsToDelete.has(n.id))
  };
};

export const moveNode = (
  project: Project, 
  nodeId: string, 
  targetId: string, 
  position: 'before' | 'after' | 'inside'
): Project => {
  const nodes = [...(project.nodes || [])];
  const movedNodeIndex = nodes.findIndex(n => n.id === nodeId);
  const targetNode = nodes.find(n => n.id === targetId);

  if (movedNodeIndex === -1 || !targetNode) return project;
  if (nodeId === targetId) return project;

  // Prevent moving a folder into its own child
  let checkParent = targetNode.parentId;
  while(checkParent) {
      if (checkParent === nodeId) return project; // Cycle detected
      const p = nodes.find(n => n.id === checkParent);
      checkParent = p ? p.parentId : null;
  }
  if (targetId === nodeId) return project;

  const movedNode = { ...nodes[movedNodeIndex] };

  if (position === 'inside') {
    if (targetNode.type !== 'folder') return project; // Can only drop inside folders
    
    movedNode.parentId = targetId;
    // Append to end of target folder
    const siblings = nodes.filter(n => n.parentId === targetId && n.id !== nodeId);
    movedNode.order = siblings.length > 0 ? Math.max(...siblings.map(n => n.order)) + 1 : 0;
    targetNode.isOpen = true; // Auto open folder
  } else {
    // Reorder logic
    movedNode.parentId = targetNode.parentId;
    
    // Get all siblings in current order excluding moved node
    const siblings = nodes
      .filter(n => n.parentId === targetNode.parentId && n.id !== nodeId)
      .sort((a, b) => a.order - b.order);
      
    const targetIndex = siblings.findIndex(n => n.id === targetId);
    
    // Insert into siblings array
    if (position === 'before') {
        siblings.splice(targetIndex, 0, movedNode);
    } else {
        siblings.splice(targetIndex + 1, 0, movedNode);
    }

    // Reassign orders
    siblings.forEach((node, index) => {
        const originalIndex = nodes.findIndex(n => n.id === node.id);
        if (originalIndex >= 0) {
            nodes[originalIndex] = { ...nodes[originalIndex], order: index };
        }
    });
    
    // Explicitly update moved node in the main array (since it was a copy)
    nodes[movedNodeIndex] = movedNode;
  }
  
  // Update the moved node in the main array one last time to ensure parentId is set
  const finalIdx = nodes.findIndex(n => n.id === nodeId);
  nodes[finalIdx] = movedNode;

  return { ...project, nodes };
};