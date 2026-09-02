// apps/api/src/knx/ets-export.service.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { create } from "xmlbuilder2";

/**
 * Exportiert KNX-Projektdaten in einem ETS-kompatiblen Format.
 * - CSV folgt dem "ETS Gruppenadressen-Import" 3-Spalten-Format
 *   (Hauptgruppe/Mittelgruppe/Untergruppe;Name;DPT)
 * - XML folgt einer vereinfachten Knxproj-ähnlichen Struktur für Werkzeuge,
 *   die direkten XML-Import unterstützen.
 */
@Injectable()
export class EtsExportService {
  constructor(private prisma: PrismaService) {}

  private async loadDevices(projectId: string) {
    const knxProject = await this.prisma.knxProject.findUniqueOrThrow({
      where: { projectId },
      include: {
        devices: {
          include: {
            groupAddresses: true,
            topologyNode: true,
          },
        },
      },
    });
    return knxProject;
  }

  /**
   * CSV im 3-Level-Format: Hauptgruppe/Mittelgruppe/Untergruppe
   * Beispiel-Zeile: 1/1/12;Wohnzimmer Decke Schalten;1.001
   */
  async exportCsv(projectId: string): Promise<string> {
    const knxProject = await this.loadDevices(projectId);
    const header = "Gruppenadresse;Name;DPT;Gerät;Physikalische Adresse\n";

    const rows: string[] = [];
    for (const device of knxProject.devices) {
      for (const ga of device.groupAddresses) {
        rows.push(
          [
            ga.address,
            `${device.topologyNode.label} - ${ga.function}`,
            ga.dpt,
            device.topologyNode.label,
            device.physicalAddress,
          ].join(";")
        );
      }
    }

    return header + rows.join("\n");
  }

  /**
   * Vereinfachtes XML-Format angelehnt an die ETS GroupAddress-Struktur.
   * Für den vollständigen .knxproj-Import müsste dies zusätzlich in eine
   * ZIP-Struktur mit project.xml + 0.xml verpackt werden (ETS-Binärformat).
   */
  async exportXml(projectId: string): Promise<string> {
    const knxProject = await this.loadDevices(projectId);

    const root = create({ version: "1.0", encoding: "UTF-8" }).ele("GroupAddress-Export", {
      xmlns: "http://opencircuit.dev/knx-export/v1",
    });

    const devicesEl = root.ele("Devices");
    for (const device of knxProject.devices) {
      const deviceEl = devicesEl.ele("Device", {
        Name: device.topologyNode.label,
        PhysicalAddress: device.physicalAddress,
      });
      const gaEl = deviceEl.ele("GroupAddresses");
      for (const ga of device.groupAddresses) {
        gaEl.ele("GroupAddress", {
          Address: ga.address,
          Function: ga.function,
          DPT: ga.dpt,
        });
      }
    }

    return root.end({ prettyPrint: true });
  }
}
