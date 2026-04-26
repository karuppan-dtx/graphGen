
export type NodeType = 'root' | 'page' | 'group' | 'param-group' | 'param-leaf' | 'path-group';

export interface SitemapNode {
  id: string; // The URL
  name: string; // The Title
  url: string;
  description?: string;
  depth: number;
  source?: string;
  category: string;
  fileType?: string;
  navigation?: {
    auth_required: boolean;
    instruction: string;
  };
  forms?: any;
  externalLinks?: string[];
  childrenIds?: string[];
  parentId?: string | null;
  // D3 added properties for interaction
  x?: number;
  y?: number;
  vOffset?: number; // Custom vertical offset for dragging
}

export interface SitemapLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: SitemapNode[];
  links: SitemapLink[];
}
