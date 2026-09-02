// apps/pdf-service/src/layout-engine.ts
export type TopologyNodeType =
  | "EINSPEISUNG" | "HAUPTSCHALTER" | "ZAEHLER" | "SAMMELSCHIENE"
  | "RCD" | "LS_SCHALTER" | "KLEMME" | "VERBRAUCHER" | "KNX_LINIE";

export interface TopologyNode {
  id: string;
  parentId: string | null;
  nodeType: TopologyNodeType;
  orderIndex: number;
  children: TopologyNode[];
}

export interface BusbarSegment {
  phase: "L1" | "L2" | "L3" | "N" | "PE";
  y: number; xStart: number; xEnd: number;
}

export interface RenderedBlock {
  nodeId: string; type: TopologyNodeType;
  x: number; y: number; width: number; height: number;
  children: RenderedBlock[];
}

export interface CrossRef {
  fromNodeId: string; toPage: number; toColumn: number; label: string;
}

export interface PageLayout {
  pageIndex: number;
  busbars: BusbarSegment[];
  blocks: RenderedBlock[];
  crossRefsOut: CrossRef[];
  crossRefsIn: CrossRef[];
}

const PAGE_WIDTH_MM = 420;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 15;
const COLUMN_WIDTH_MM = 40;
const ROW_HEIGHT_MM = 8;

const SYMBOL_HEIGHT_MM: Record<TopologyNodeType, number> = {
  EINSPEISUNG: 10, HAUPTSCHALTER: 10, ZAEHLER: 10, SAMMELSCHIENE: 4,
  RCD: 16, LS_SCHALTER: 8, KLEMME: 6, VERBRAUCHER: 8, KNX_LINIE: 8,
};

function sortByOrderIndex(nodes: TopologyNode[]): TopologyNode[] {
  return [...nodes].sort((a, b) => a.orderIndex - b.orderIndex);
}

function symbolHeightFor(type: TopologyNodeType): number {
  return SYMBOL_HEIGHT_MM[type] ?? 8;
}

function estimateSubtreeHeight(node: TopologyNode): number {
  const own = symbolHeightFor(node.nodeType) + 2;
  if (node.children.length === 0) return own;
  return own + Math.max(...node.children.map(estimateSubtreeHeight));
}

function subtreeVerticalExtent(block: RenderedBlock): number {
  if (block.children.length === 0) return block.height + 2;
  return block.height + 2 + Math.max(...block.children.map(subtreeVerticalExtent));
}

function findFirstOfType(node: TopologyNode, type: TopologyNodeType): TopologyNode {
  if (node.nodeType === type) return node;
  for (const child of node.children) {
    try { return findFirstOfType(child, type); } catch { /* weiter suchen */ }
  }
  throw new Error(`Kein Knoten vom Typ ${type} im Baum gefunden.`);
}

function layoutBusbars(_node: TopologyNode, availableWidth: number): BusbarSegment[] {
  const phases: BusbarSegment["phase"][] = ["L1", "L2", "L3", "N", "PE"];
  return phases.map((phase, i) => ({
    phase, y: MARGIN_MM + i * 4, xStart: MARGIN_MM, xEnd: MARGIN_MM + availableWidth,
  }));
}

function renderBranchRecursive(node: TopologyNode, x: number, y: number): RenderedBlock {
  const height = symbolHeightFor(node.nodeType);
  const block: RenderedBlock = {
    nodeId: node.id, type: node.nodeType, x, y,
    width: COLUMN_WIDTH_MM - 4, height, children: [],
  };
  let childY = y + height + 2;
  for (const child of sortByOrderIndex(node.children)) {
    const childBlock = renderBranchRecursive(child, x, childY);
    block.children.push(childBlock);
    childY += subtreeVerticalExtent(childBlock);
  }
  return block;
}

function createEmptyPage(pageIndex: number): PageLayout {
  return { pageIndex, busbars: [], blocks: [], crossRefsOut: [], crossRefsIn: [] };
}

function createCrossReference(_page: PageLayout, node: TopologyNode, nextPageIndex: number): CrossRef {
  return { fromNodeId: node.id, toPage: nextPageIndex, toColumn: 0, label: `Fortsetzung → Seite ${nextPageIndex + 1}` };
}

export function generateSchematicPages(rootNode: TopologyNode): PageLayout[] {
  const pages: PageLayout[] = [];
  let currentPage = createEmptyPage(0);
  pages.push(currentPage);

  const busbarNode = findFirstOfType(rootNode, "SAMMELSCHIENE");
  currentPage.busbars = layoutBusbars(busbarNode, PAGE_WIDTH_MM - 2 * MARGIN_MM);

  const branches = sortByOrderIndex(busbarNode.children);
  let cursorX = MARGIN_MM;
  let cursorY = MARGIN_MM + 20;

  for (const branch of branches) {
    const blockHeight = estimateSubtreeHeight(branch);

    if (cursorY + blockHeight > PAGE_HEIGHT_MM - MARGIN_MM) {
      currentPage.crossRefsOut.push(createCrossReference(currentPage, branch, pages.length));
      currentPage = createEmptyPage(pages.length);
      pages.push(currentPage);
      currentPage.crossRefsIn.push({
        fromNodeId: branch.parentId ?? "", toPage: pages.length - 1, toColumn: 0,
        label: `← S.${pages.length - 1}`,
      });
      cursorX = MARGIN_MM;
      cursorY = MARGIN_MM + 10;
    }

    const block = renderBranchRecursive(branch, cursorX, cursorY);
    currentPage.blocks.push(block);

    cursorX += COLUMN_WIDTH_MM;
    if (cursorX + COLUMN_WIDTH_MM > PAGE_WIDTH_MM - MARGIN_MM) {
      cursorX = MARGIN_MM;
      cursorY += blockHeight;
    }
  }

  return pages;
}
