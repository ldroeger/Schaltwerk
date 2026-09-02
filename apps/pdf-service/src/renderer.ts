// apps/pdf-service/src/renderer.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { PageLayout, RenderedBlock } from "./layout-engine";

const execFileAsync = promisify(execFile);
const round2 = (n: number) => Math.round(n * 100) / 100;

function serializeBlock(block: RenderedBlock): any {
  return {
    nodeId: block.nodeId, type: block.type,
    x: round2(block.x), y: round2(block.y),
    width: round2(block.width), height: round2(block.height),
    children: block.children.map(serializeBlock),
  };
}

function serializePage(page: PageLayout) {
  return {
    pageIndex: page.pageIndex,
    busbars: page.busbars,
    blocks: page.blocks.map(serializeBlock),
    crossRefsOut: page.crossRefsOut,
    crossRefsIn: page.crossRefsIn,
  };
}

export async function renderPagesToPdf(pages: PageLayout[]): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(tmpdir(), "opencircuit-"));
  const dataPath = path.join(workDir, "data.json");
  const outputPath = path.join(workDir, "output.pdf");
  const templatePath = path.resolve(__dirname, "../templates/schematic.typ");

  try {
    const payload = { pages: pages.map(serializePage) };
    await writeFile(dataPath, JSON.stringify(payload), "utf-8");

    await execFileAsync("typst", [
      "compile", templatePath, outputPath,
      "--input", `data-path=${dataPath}`,
      "--root", workDir,
    ]);

    return await readFile(outputPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
