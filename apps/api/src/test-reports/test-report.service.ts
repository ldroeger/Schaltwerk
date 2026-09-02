// apps/api/src/test-reports/test-report.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

// Grenzwerte nach VDE 0100-600 (vereinfachte Referenztabelle für die Plausibilitätsprüfung)
const MAX_LOOP_IMPEDANCE_OHM: Record<number, number> = {
  16: 2.87, // Ω bei B16, 230V, Auslösestrom 5x In
  20: 2.3,
  25: 1.84,
  32: 1.44,
};
const MAX_RCD_TRIP_TIME_MS = 300; // für 30mA RCD, Typ AC/A bei 1x IΔn

@Injectable()
export class TestReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Erstellt ein neues Prüfprotokoll und befüllt die Messfelder automatisch
   * mit allen RCDs und LS-Schaltern (=Stromkreisen) aus der Projekt-Topologie.
   */
  async createWithPrefill(projectId: string, inspector: string) {
    const relevantNodes = await this.prisma.topologyNode.findMany({
      where: {
        projectId,
        nodeType: { in: ["RCD", "LS_SCHALTER"] },
      },
      orderBy: { orderIndex: "asc" },
    });

    if (relevantNodes.length === 0) {
      throw new BadRequestException(
        "Keine RCDs/LS in der Topologie gefunden — Projekt zuerst planen."
      );
    }

    return this.prisma.testReport.create({
      data: {
        projectId,
        inspector,
        measurements: {
          create: relevantNodes.map((node: { id: string }) => ({
            topologyNodeId: node.id,
            // Messwerte initial leer — nur die Zuordnung wird vorbefüllt
          })),
        },
      },
      include: {
        measurements: { include: { topologyNode: true } },
      },
    });
  }

  async updateMeasurement(
    measurementId: string,
    data: {
      isolationResistanceMOhm?: number;
      loopImpedanceOhm?: number;
      rcdTripCurrentMa?: number;
      rcdTripTimeMs?: number;
      continuityOk?: boolean;
      polarityOk?: boolean;
      notes?: string;
    }
  ) {
    const measurement = await this.prisma.measurement.findUniqueOrThrow({
      where: { id: measurementId },
      include: { topologyNode: true },
    });

    const warnings = this.validateAgainstLimits(measurement.topologyNode, data);

    const updated = await this.prisma.measurement.update({
      where: { id: measurementId },
      data,
    });

    return { measurement: updated, warnings };
  }

  /**
   * Plausibilitätsprüfung gegen VDE-0100-600-Grenzwerte.
   * Gibt Warnungen zurück (blockiert das Speichern NICHT — der Prüfer
   * trägt die Verantwortung, aber wird auf Grenzwertüberschreitung hingewiesen).
   */
  private validateAgainstLimits(
    node: { ratedCurrentA: number | null; rcdSensitivityMa: number | null; nodeType: string },
    data: { loopImpedanceOhm?: number; rcdTripTimeMs?: number; rcdTripCurrentMa?: number }
  ): string[] {
    const warnings: string[] = [];

    if (node.nodeType === "LS_SCHALTER" && data.loopImpedanceOhm != null && node.ratedCurrentA) {
      const limit = MAX_LOOP_IMPEDANCE_OHM[node.ratedCurrentA];
      if (limit && data.loopImpedanceOhm > limit) {
        warnings.push(
          `Schleifenimpedanz ${data.loopImpedanceOhm}Ω überschreitet Grenzwert ${limit}Ω für ${node.ratedCurrentA}A-LS.`
        );
      }
    }

    if (node.nodeType === "RCD" && data.rcdTripTimeMs != null) {
      if (data.rcdTripTimeMs > MAX_RCD_TRIP_TIME_MS) {
        warnings.push(
          `RCD-Auslösezeit ${data.rcdTripTimeMs}ms überschreitet zulässige ${MAX_RCD_TRIP_TIME_MS}ms.`
        );
      }
    }

    if (
      node.nodeType === "RCD" &&
      data.rcdTripCurrentMa != null &&
      node.rcdSensitivityMa &&
      data.rcdTripCurrentMa > node.rcdSensitivityMa
    ) {
      warnings.push(
        `Auslösestrom ${data.rcdTripCurrentMa}mA liegt über Nennfehlerstrom ${node.rcdSensitivityMa}mA.`
      );
    }

    return warnings;
  }

  async getReport(reportId: string) {
    return this.prisma.testReport.findUniqueOrThrow({
      where: { id: reportId },
      include: {
        measurements: { include: { topologyNode: { include: { catalogItem: true } } } },
        project: true,
      },
    });
  }
}
