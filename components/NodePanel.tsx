
import React from 'react';
import { SitemapNode } from '../types';

interface NodePanelProps {
  node: SitemapNode | null;
  onClose: () => void;
}

const NodePanel: React.FC<NodePanelProps> = ({ node, onClose }) => {
  if (!node) return null;

  const categoryColors: Record<string, string> = {
    'root': 'bg-indigo-600',
    'group': 'bg-amber-500',
    'page': 'bg-emerald-600'
  };

  const headerColor = node.forms ? 'bg-red-600' : (categoryColors[node.category] || 'bg-slate-700');

  return (
    <div className="fixed top-4 right-4 w-[28rem] max-h-[calc(100vh-2rem)] bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col z-50 animate-in slide-in-from-right duration-300">
      <div className={`p-8 text-white flex justify-between items-start ${headerColor}`}>
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
             <span className="text-[9px] font-black bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest">Depth {node.depth}</span>
             <span className="text-[9px] font-black bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest">{node.category}</span>
             {node.fileType && (
               <span className="text-[9px] font-black bg-black/10 px-2 py-1 rounded-full uppercase tracking-widest">{node.fileType}</span>
             )}
          </div>
          <h3 className="font-black text-xl leading-tight truncate">{node.name}</h3>
        </div>
        <button onClick={onClose} className="hover:bg-black/10 rounded-full p-2 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <div className="p-8 overflow-y-auto space-y-8">
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Target Endpoint</h4>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <a href={node.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 break-all font-mono hover:underline font-bold leading-relaxed">
              {node.url}
            </a>
          </div>
        </div>

        {node.description && (
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Meta Description</h4>
            <p className="text-sm text-slate-600 leading-relaxed font-medium border-l-4 border-slate-100 pl-5">
              {node.description}
            </p>
          </div>
        )}

        {node.navigation && (
          <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100">
             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Discovery Context</h4>
             <p className="text-xs text-slate-700 font-bold italic leading-relaxed">
               "{node.navigation.instruction}"
             </p>
             {node.navigation.auth_required && (
               <div className="mt-4 flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase">
                 <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                 Authentication Required
               </div>
             )}
          </div>
        )}

        {node.forms && (
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
             <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-3 underline decoration-red-200 decoration-2">POST Request Structure</h4>
             <pre className="text-[10px] text-red-800 font-mono whitespace-pre-wrap mt-4 bg-white/50 p-4 rounded-xl border border-red-50/50">
               {JSON.stringify(node.forms, null, 2)}
             </pre>
          </div>
        )}

        {node.externalLinks && node.externalLinks.length > 0 && (
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Referenced URLs</h4>
            <div className="grid gap-2">
              {node.externalLinks.map((link, i) => (
                <div key={i} className="text-[10px] text-slate-500 hover:text-indigo-600 truncate bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 font-bold">
                  {link}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodePanel;
