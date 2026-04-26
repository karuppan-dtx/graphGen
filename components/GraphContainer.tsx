
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphData, SitemapNode } from '../types';

interface GraphContainerProps {
  data: GraphData;
  onNodeClick: (node: SitemapNode) => void;
}

const GraphContainer: React.FC<GraphContainerProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Initial State: Collapse all except root
  useEffect(() => {
    if (data.nodes.length > 0 && !initialized) {
      const rootNode = data.nodes.find(n => n.depth === 0) || data.nodes[0];
      const others = data.nodes.filter(n => n.id !== rootNode.id).map(n => n.id);
      setCollapsedIds(new Set(others));
      setInitialized(true);
    }
  }, [data.nodes, initialized]);

  const toggleCollapse = (nodeId: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const getDisplayUrl = (url: string, depth: number) => {
    if (depth === 0) return url;
    try {
      const parsed = new URL(url);
      const path = parsed.pathname === "/" ? "/" : parsed.pathname;
      return path + (parsed.search || '');
    } catch (e) {
      return url.split('/').pop() || url;
    }
  };

  const getTheme = (node: SitemapNode) => {
    if (node.forms && node.forms.length > 0) return { color: "#ef4444", label: "Form" };
    switch (node.category?.toLowerCase()) {
      case 'root': return { color: "#4f46e5", label: "Root" };
      case 'group': return { color: "#f59e0b", label: "Group" };
      case 'page': return { color: "#10b981", label: "Page" };
      case 'api_endpoints': return { color: "#ec4899", label: "API" };
      case 'uri_with_params': return { color: "#8b5cf6", label: "Param" };
      case 'imagefile': return { color: "#0ea5e9", label: "Image" };
      default: return { color: "#94a3b8", label: "Node" };
    }
  };

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    
    let g = svg.select<SVGGElement>("g.main-container");
    if (g.empty()) {
      g = svg.append("g").attr("class", "main-container");
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.05, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));
      svg.call(zoom);
      svg.call(zoom.transform, d3.zoomIdentity.translate(100, height / 2).scale(0.5));
    }

    const stratify = d3.stratify<SitemapNode>()
      .id(d => d.id)
      .parentId(d => d.parentId || null);

    try {
      const rootHierarchy = stratify(data.nodes);

      const nodeWidth = 320;
      const nodeHeight = 85;

      // Tree layout: [Vertical Spacing, Horizontal Spacing]
      const treeLayout = d3.tree<SitemapNode>()
        .nodeSize([140, 500]); 

      treeLayout(rootHierarchy);

      const visibleNodes = rootHierarchy.descendants().filter(n => {
        let p = n.parent;
        while (p) {
          if (collapsedIds.has(p.id as string)) return false;
          p = p.parent;
        }
        return true;
      });

      const visibleLinks = rootHierarchy.links().filter(l => {
        let p = l.source;
        while (p) {
          if (collapsedIds.has(p.id as string)) return false;
          p = p.parent;
        }
        return true;
      });

      // Links
      const linkGenerator = d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x);

      const links = g.selectAll<SVGPathElement, d3.HierarchyLink<SitemapNode>>("path.link")
        .data(visibleLinks, (d: any) => `${d.source.id}-${d.target.id}`);

      links.exit().transition().duration(400).attr("opacity", 0).remove();

      links.enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 2)
        .attr("opacity", 0)
        .merge(links as any)
        .transition().duration(500)
        .attr("opacity", 1)
        .attr("d", linkGenerator);

      // Nodes
      const nodes = g.selectAll<SVGGElement, d3.HierarchyNode<SitemapNode>>("g.node")
        .data(visibleNodes, (d: any) => d.id);

      nodes.exit().transition().duration(400).attr("opacity", 0).remove();

      const nodeEnter = nodes.enter()
        .append("g")
        .attr("class", "node")
        .attr("opacity", 0)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("click", (event, d) => {
          event.stopPropagation();
          onNodeClick(d.data);
        })
        .on("dblclick", (event, d) => {
          event.stopPropagation();
          if (d.children || d.data.childrenIds?.length) {
            toggleCollapse(d.id as string);
          }
        });

      // Card
      nodeEnter.append("rect")
        .attr("class", "card")
        .attr("x", -nodeWidth / 2)
        .attr("y", -nodeHeight / 2)
        .attr("width", nodeWidth)
        .attr("height", nodeHeight)
        .attr("rx", 16)
        .attr("fill", "#ffffff")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 2)
        .attr("filter", "drop-shadow(0 4px 6px rgb(0 0 0 / 0.05))");

      // Cat Chip
      nodeEnter.append("rect")
        .attr("class", "cat-bg")
        .attr("y", -nodeHeight / 2 + 15)
        .attr("height", 20)
        .attr("rx", 10);

      nodeEnter.append("text")
        .attr("class", "cat-text")
        .attr("y", -nodeHeight / 2 + 29)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .style("font-size", "9px")
        .style("font-weight", "900")
        .style("text-transform", "uppercase");

      // File Chip
      nodeEnter.append("rect")
        .attr("class", "file-bg")
        .attr("y", -nodeHeight / 2 + 15)
        .attr("height", 20)
        .attr("rx", 10)
        .attr("fill", "#f1f5f9")
        .attr("stroke", "#e2e8f0");

      nodeEnter.append("text")
        .attr("class", "file-text")
        .attr("y", -nodeHeight / 2 + 29)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .style("font-size", "9px")
        .style("font-weight", "800")
        .style("text-transform", "uppercase");

      // URL
      nodeEnter.append("text")
        .attr("class", "url-text")
        .attr("x", -nodeWidth / 2 + 15)
        .attr("y", 15)
        .attr("fill", "#1e293b")
        .style("font-size", "13px")
        .style("font-weight", "700");

      // Summary
      nodeEnter.append("text")
        .attr("class", "summary-text")
        .attr("x", -nodeWidth / 2 + 15)
        .attr("y", 33)
        .attr("fill", "#94a3b8")
        .style("font-size", "10px")
        .style("font-weight", "600");

      // Indicator
      const indicator = nodeEnter.append("g").attr("class", "indicator");
      indicator.append("circle").attr("cx", nodeWidth / 2).attr("cy", 0).attr("r", 12).attr("stroke-width", 2);
      indicator.append("text").attr("x", nodeWidth / 2).attr("y", 5).attr("text-anchor", "middle").style("font-weight", "900");

      const nodeUpdate = nodeEnter.merge(nodes as any);
      
      nodeUpdate.transition().duration(500)
        .attr("opacity", 1)
        .attr("transform", d => `translate(${d.y},${d.x})`);

      nodeUpdate.each(function(d) {
        const theme = getTheme(d.data);
        const self = d3.select(this);
        
        self.select("rect.card").attr("stroke", theme.color).attr("stroke-width", d.data.depth === 0 ? 5 : 2);
        
        const hasCat = !!d.data.category;
        const catLabel = hasCat ? (d.data.category === 'uri_with_params' ? "Param" : theme.label) : "";
        
        self.select("rect.cat-bg")
          .style("display", hasCat ? "block" : "none")
          .attr("x", -nodeWidth / 2 + 15)
          .attr("width", hasCat ? catLabel.length * 7 + 24 : 0)
          .attr("fill", theme.color);
        
        self.select("text.cat-text")
          .style("display", hasCat ? "block" : "none")
          .attr("x", -nodeWidth / 2 + 15 + (hasCat ? (catLabel.length * 7 + 24) / 2 : 0))
          .text(catLabel);

        const hasFile = !!d.data.fileType;
        const catWidth = hasCat ? (catLabel.length * 7 + 24) : 0;
        
        self.select("rect.file-bg")
          .style("display", hasFile ? "block" : "none")
          .attr("x", -nodeWidth / 2 + 15 + catWidth + (hasCat ? 8 : 0))
          .attr("width", hasFile ? d.data.fileType!.length * 6 + 18 : 0);
        
        self.select("text.file-text")
          .style("display", hasFile ? "block" : "none")
          .attr("x", -nodeWidth / 2 + 15 + catWidth + (hasCat ? 8 : 0) + (hasFile ? (d.data.fileType!.length * 6 + 18) / 2 : 0))
          .text(d.data.fileType || "");

        const displayUrl = getDisplayUrl(d.data.url, d.data.depth);
        self.select("text.url-text").text(displayUrl.length > 42 ? displayUrl.substring(0, 39) + "..." : displayUrl);

        const childCounts: Record<string, number> = {};
        (d.children || []).forEach((c: any) => {
          const l = getTheme(c.data).label;
          childCounts[l] = (childCounts[l] || 0) + 1;
        });
        const summary = Object.entries(childCounts).map(([k, v]) => `${v} ${k}${v > 1 ? 's' : ''}`).join(", ");
        self.select("text.summary-text").text(summary ? `Branch: ${summary}` : "");

        const canExpand = d.children || d.data.childrenIds?.length;
        const isCollapsed = collapsedIds.has(d.id);
        self.select("g.indicator").style("display", canExpand ? "block" : "none");
        self.select("g.indicator circle")
          .attr("fill", isCollapsed ? theme.color : "#ffffff")
          .attr("stroke", isCollapsed ? "#ffffff" : "#e2e8f0");
        self.select("g.indicator text")
          .attr("fill", isCollapsed ? "#ffffff" : theme.color)
          .text(isCollapsed ? "+" : "−");
      });

    } catch (e) {
      console.error("Layout Error:", e);
    }
  }, [data, onNodeClick, collapsedIds]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#fafbfc]">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-8 left-8 pointer-events-none flex flex-col gap-3">
        <div className="bg-white/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-indigo-600 animate-pulse"></div>
          <span className="text-xs font-black uppercase text-slate-700 tracking-widest">Double-click to Toggle Branches</span>
        </div>
      </div>
      <div className="absolute bottom-10 left-10 p-8 bg-white/90 backdrop-blur shadow-2xl rounded-[3rem] border border-slate-100 flex gap-10 items-center">
        {[
          { color: "bg-indigo-600", label: "Root" },
          { color: "bg-emerald-500", label: "Page" },
          { color: "bg-amber-500", label: "Group" },
          { color: "bg-red-500", label: "Form" },
          { color: "bg-purple-500", label: "Param" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${item.color} shadow-sm`}></div>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraphContainer;
