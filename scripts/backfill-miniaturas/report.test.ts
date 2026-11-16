import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { backlogOf } from "./backfill";
import { formatPending, formatReport } from "./report";

const BLOB = "https://k3x9qz7w.public.blob.vercel-storage.com";
const file = (pathname: string) => ({ pathname, url: `${BLOB}/${pathname}` });

describe("Relatório final", () => {
  it("traz as quatro contagens e o motivo de cada falha", () => {
    const text = formatReport(
      backlogOf(["hevc-A1.MOV", "tour-B2.mp4", "fogao-C3.webm", "sofa-D4.mp4", "sala-E5.mp4", "sala-E5.jpg"].map(file)),
      {
        created: ["fogao-C3.jpg", "sofa-D4.jpg"],
        failures: [
          { video: "hevc-A1.MOV", reason: "Decoder (codec hevc) not found" },
          { video: "tour-B2.mp4", reason: "This blob already exists" },
        ],
      },
    );
    const lines = text.split("\n").map((line) => line.trim());
    for (const line of [
      "Vídeos encontrados: 5",
      "Miniaturas criadas: 2",
      "Pulados (já tinham Miniatura): 1",
      "Falhas: 2",
      "hevc-A1.MOV: Decoder (codec hevc) not found",
      "tour-B2.mp4: This blob already exists",
    ]) {
      assert.ok(lines.includes(line), `falta a linha "${line}" em:\n${text}`);
    }
  });
});

describe("Lista do que falta", () => {
  it("mostra cada vídeo sem Miniatura e o caminho da Miniatura que ele vai ganhar", () => {
    const text = formatPending(backlogOf(["tour-A1.mp4", "fogao-B2.webm", "fogao-B2.jpg"].map(file)));
    const lines = text.split("\n").map((line) => line.trim());
    assert.ok(lines.includes("tour-A1.mp4 → tour-A1.jpg"), text);
    assert.ok(!text.includes("fogao-B2"), text);
  });
});
