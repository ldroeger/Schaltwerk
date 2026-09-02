// apps/pdf-service/src/server.ts
import Fastify from "fastify";
import { generateSchematicPages, TopologyNode } from "./layout-engine";
import { renderPagesToPdf } from "./renderer";

const app = Fastify();

app.post("/render", async (req, reply) => {
  const { rootNode } = req.body as { rootNode: TopologyNode };
  const pages = generateSchematicPages(rootNode);
  const pdfBuffer = await renderPagesToPdf(pages);
  reply.type("application/pdf").send(pdfBuffer);
});

// Separater, einfacherer Endpunkt für den VDE-0100-600-Prüfbericht
// (Tabellenlayout statt Stromlaufplan-Symbole) — Template: test-report.typ
app.post("/render/test-report", async (req, reply) => {
  const { report } = req.body as { report: any };
  reply.type("application/pdf").send(Buffer.from(`%PDF-1.4 Platzhalter für Report ${report?.id}`));
  // Produktiv: eigenes Typst-Template templates/test-report.typ analog zu schematic.typ ansteuern
});

app.listen({ port: Number(process.env.PORT) || 5000, host: "0.0.0.0" });
