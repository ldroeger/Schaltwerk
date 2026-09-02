// apps/web/components/topology-tree/TopologyTreeEditor.tsx
"use client";

import { useCallback, useEffect } from "react";
import ReactFlow, {
  Node, Edge, Controls, Background, addEdge, useNodesState, useEdgesState, Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import { fetchTopology, updateNodeParent } from "@/lib/api-client";

interface TopologyNodeDto {
  id: string; parentId: string | null; label: string; nodeType: string; orderIndex: number;
}

function nodeStyleFor(type: string) {
  const colors: Record<string, string> = {
    EINSPEISUNG: "#1e293b", SAMMELSCHIENE: "#0891b2", RCD: "#b45309",
    LS_SCHALTER: "#15803d", VERBRAUCHER: "#64748b", KLEMME: "#475569",
  };
  return { background: colors[type] ?? "#94a3b8", color: "white", borderRadius: 6, padding: 8 };
}

function buildFlowGraph(nodes: TopologyNodeDto[]) {
  const flowNodes: Node[] = nodes.map((n, i) => ({
    id: n.id, data: { label: `${n.nodeType}: ${n.label}` },
    position: { x: (i % 5) * 220, y: Math.floor(i / 5) * 120 }, style: nodeStyleFor(n.nodeType),
  }));
  const flowEdges: Edge[] = nodes.filter((n) => n.parentId)
    .map((n) => ({ id: `${n.parentId}-${n.id}`, source: n.parentId!, target: n.id }));
  return { flowNodes, flowEdges };
}

export default function TopologyTreeEditor({ projectId }: { projectId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    fetchTopology(projectId).then((data) => {
      const { flowNodes, flowEdges } = buildFlowGraph(data);
      setNodes(flowNodes);
      setEdges(flowEdges);
    });
  }, [projectId]);

  const onConnect = useCallback(async (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    await updateNodeParent(connection.target, connection.source);
    setEdges((eds) => addEdge(connection, eds));
  }, [setEdges]);

  return (
    <div className="h-[80vh] w-full border rounded-lg">
      <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
