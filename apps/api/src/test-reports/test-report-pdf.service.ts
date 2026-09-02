// apps/api/src/test-reports/test-report-pdf.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class TestReportPdfService {
  private readonly pdfServiceUrl = process.env.PDF_SERVICE_URL ?? "http://pdf-service:5000";

  async render(report: any): Promise<Buffer> {
    const response = await fetch(`${this.pdfServiceUrl}/render/test-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException("Prüfprotokoll-PDF konnte nicht erzeugt werden.");
    }

    return Buffer.from(await response.arrayBuffer());
  }
}
