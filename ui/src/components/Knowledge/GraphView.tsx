import { useState, useEffect, useRef, useCallback } from 'react';
import type { GraphData, GraphNode } from '@/types';
import { useJarvis } from '@/hooks/use-jarvis';

interface GraphViewProps {
  onSelectNode: (nodeId: string) => void;
}

const COLORS = ['#58a6ff', '#3fb950', '#a371f7', '#d29922', '#f778ba', '#8b949e'];

export function GraphView({ onSelectNode }: GraphViewProps) {
  const bridge = useJarvis();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const animationRef = useRef<number>(0);

  const nodesRef = useRef<{
    id: string; label: string; x: number; y: number; vx: number; vy: number; radius: number; color: string;
  }[]>([]);
  const edgesRef = useRef<{ source: string; target: string }[]>([]);

  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setLoading(true);
    bridge.getGraph()
      .then((g) => {
        setGraph(g);
        initLayout(g);
      })
      .catch(() => setGraph(null))
      .finally(() => setLoading(false));
  }, [bridge]);

  function initLayout(g: GraphData) {
    const centerX = 300;
    const centerY = 250;
    const angleStep = (2 * Math.PI) / Math.max(g.nodes.length, 1);
    nodesRef.current = g.nodes.map((n, i) => ({
      id: n.id,
      label: n.label,
      x: centerX + 150 * Math.cos(angleStep * i),
      y: centerY + 150 * Math.sin(angleStep * i),
      vx: 0,
      vy: 0,
      radius: Math.min(30, 10 + n.linkCount * 3),
      color: COLORS[i % COLORS.length],
    }));
    edgesRef.current = g.edges.map((e) => ({ source: e.source, target: e.target }));
  }

  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    if (nodes.length === 0) return;
    const REPULSION = 5000;
    const ATTRACTION = 0.005;
    const DAMPING = 0.85;
    const MIN_DIST = 30;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        let dx = nodes[j].x - nodes[i].x;
        let dy = nodes[j].y - nodes[i].y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MIN_DIST) dist = MIN_DIST;
        let force = REPULSION / (dist * dist);
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }
    for (const edge of edges) {
      const si = nodes.findIndex((n) => n.id === edge.source);
      const ti = nodes.findIndex((n) => n.id === edge.target);
      if (si < 0 || ti < 0) continue;
      let dx = nodes[ti].x - nodes[si].x;
      let dy = nodes[ti].y - nodes[si].y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) dist = 1;
      let force = dist * ATTRACTION;
      nodes[si].vx += (dx / dist) * force;
      nodes[si].vy += (dy / dist) * force;
      nodes[ti].vx -= (dx / dist) * force;
      nodes[ti].vy -= (dy / dist) * force;
    }
    for (const n of nodes) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;
    }
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(zoomRef.current, zoomRef.current);

    const nodes = nodesRef.current;

    ctx.strokeStyle = 'rgba(139, 148, 158, 0.15)';
    ctx.lineWidth = 1;
    for (const edge of edgesRef.current) {
      const sn = nodes.find((n) => n.id === edge.source);
      const tn = nodes.find((n) => n.id === edge.target);
      if (!sn || !tn) continue;
      ctx.beginPath();
      ctx.moveTo(sn.x, sn.y);
      ctx.lineTo(tn.x, tn.y);
      ctx.stroke();
    }

    for (const n of nodes) {
      const isSelected = n.id === selectedNode;
      const isHovered = hoveredNode?.id === n.id;
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? 'rgba(88, 166, 255, 0.2)' : 'rgba(88, 166, 255, 0.1)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
      ctx.fillStyle = n.color;
      ctx.globalAlpha = isSelected ? 1 : 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (isSelected || isHovered) {
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.fillStyle = '#e6edf3';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(n.label, n.x, n.y + n.radius + 4);
    }
    ctx.restore();
  }

  function animate() {
    simulate();
    draw();
    animationRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    if (!graph) return;
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [graph]);

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offsetRef.current.x) / zoomRef.current,
      y: (e.clientY - rect.top - offsetRef.current.y) / zoomRef.current,
    };
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const pt = getCanvasPoint(e);
    for (const n of nodesRef.current) {
      const dx = pt.x - n.x;
      const dy = pt.y - n.y;
      if (dx * dx + dy * dy < (n.radius + 5) * (n.radius + 5)) {
        setSelectedNode(n.id);
        onSelectNode(n.id);
        return;
      }
    }
    setSelectedNode(null);
  }

  function handleCanvasMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const pt = getCanvasPoint(e);
    let found: GraphNode | null = null;
    for (const n of nodesRef.current) {
      const dx = pt.x - n.x;
      const dy = pt.y - n.y;
      if (dx * dx + dy * dy < (n.radius + 5) * (n.radius + 5)) {
        found = { id: n.id, label: n.label, folder: '', tags: [], linkCount: 0 };
        break;
      }
    }
    setHoveredNode(found);
    if (canvasRef.current) canvasRef.current.style.cursor = found ? 'pointer' : 'grab';
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    zoomRef.current = Math.max(0.1, Math.min(5, zoomRef.current * delta));
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    draggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetStartRef.current = { ...offsetRef.current };
  }

  function handleMouseUp() { draggingRef.current = false; }

  function handleMouseLeave() {
    draggingRef.current = false;
    setHoveredNode(null);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (draggingRef.current) {
      offsetRef.current.x = dragOffsetStartRef.current.x + (e.clientX - dragStartRef.current.x);
      offsetRef.current.y = dragOffsetStartRef.current.y + (e.clientY - dragStartRef.current.y);
    } else {
      handleCanvasMove(e);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-muted-foreground animate-pulse">
        Loading graph...
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-muted-foreground">
        <div className="text-center">
          <p className="text-2xl mb-2">🕸</p>
          <p>No notes to graph yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-[350px] rounded-lg cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground/50">
        <span>{graph.nodes.length} nodes · {graph.edges.length} edges</span>
        <span>scroll to zoom · drag to pan</span>
        {selectedNode && (
          <span className="text-primary/70">selected: {nodesRef.current.find(n => n.id === selectedNode)?.label}</span>
        )}
      </div>
    </div>
  );
}
