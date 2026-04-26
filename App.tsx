
import React, { useState, useCallback } from 'react';
import { GraphData, SitemapNode } from './types';
import GraphContainer from './components/GraphContainer';
import NodePanel from './components/NodePanel';

const App: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<SitemapNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processCrawlData = (json: any): GraphData => {
    const nodes: SitemapNode[] = [];
    const nodeMap = json.nodes || {};
    const rootUrl = json.root;

    Object.keys(nodeMap).forEach(url => {
      const raw = nodeMap[url];
      if (!raw) return;

      let category = (raw.category && raw.category !== "none") ? raw.category : undefined;
      let fileType = (raw.file_type && raw.file_type !== "none") ? raw.file_type : undefined;

      // Logic: if filetype is null/none
      if (!fileType) {
        if (category === "uri_with_params") {
          fileType = "PARAM";
        } else {
          // if filetype is null then category is page not file
          category = "page";
          fileType = undefined;
        }
      }

      nodes.push({
        id: url,
        name: raw.title || url.split('/').pop() || url,
        url: url,
        description: raw.description,
        depth: raw.depth ?? 0,
        source: raw.source,
        category: category as string,
        fileType: fileType,
        navigation: raw.navigation,
        forms: raw.forms,
        externalLinks: raw.links,
        childrenIds: raw.children,
        parentId: raw.parent
      });
    });

    const rootNode = nodes.find(n => n.id === rootUrl || n.depth === 0);
    if (rootNode) {
      rootNode.category = 'root';
    }

    return { nodes, links: [] };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        if (!json || !json.nodes) throw new Error("Invalid Katana JSON format.");
        setGraphData(processCrawlData(json));
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="px-10 py-5 bg-white border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="bg-slate-900 p-3 rounded-2xl shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Sitemap Architect</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Collapsible Tree Explorer</p>
          </div>
        </div>

        <div className="relative">
          <input type="file" accept=".json" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
          <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-all flex items-center gap-3 shadow-xl active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            UPLOAD JSON
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        {error && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-4 font-bold">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="hover:opacity-60">✕</button>
          </div>
        )}

        {!graphData ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white p-10">
            <div className="max-w-md text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Visualize Hierarchy</h2>
              <p className="text-slate-400 mb-10 font-medium text-lg leading-relaxed">
                Analyze sitemap exports. Double-click to expand. Root displays full URL, while child nodes show cleaned URI paths.
              </p>
              <div className="relative inline-block">
                <input type="file" accept=".json" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                <button className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:bg-black transition-all shadow-2xl hover:scale-105 active:scale-95">
                  Select Katana File
                </button>
              </div>
            </div>
          </div>
        ) : (
          <GraphContainer data={graphData} onNodeClick={setSelectedNode} />
        )}
        <NodePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      </main>
    </div>
  );
};

export default App;
