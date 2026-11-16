import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { backfill, formatReport } from "./backfill";

const BLOB = "https://k3x9qz7w.public.blob.vercel-storage.com";
const file = (pathname: string) => ({ pathname, url: `${BLOB}/${pathname}` });

describe("Lote de Miniaturas", () => {
  it("conta os vídeos encontrados e pula os que já têm Miniatura", async () => {
    const report = await backfill([file("tour-A1.mp4"), file("tour-A1.jpg"), file("fogao-B2.webm"), file("sala-C3.jpg")], {
      dryRun: true,
    });
    assert.equal(report.found, 2);
    assert.equal(report.skipped, 1);
    assert.deepEqual(report.pending, ["fogao-B2.webm"]);
  });

  it("grava, no caminho do vídeo com .jpg, o quadro tirado do endereço público do vídeo", async () => {
    const extracted: string[] = [];
    const saved: [string, string][] = [];
    const report = await backfill([file("tour-A1.mp4"), file("IMG_0042-D4.MOV")], {
      extract: async (url) => {
        extracted.push(url);
        return Buffer.from(`quadro de ${url}`);
      },
      save: async (path, jpeg) => {
        saved.push([path, jpeg.toString()]);
      },
    });
    assert.deepEqual(extracted, [`${BLOB}/tour-A1.mp4`, `${BLOB}/IMG_0042-D4.MOV`]);
    assert.deepEqual(saved, [
      ["tour-A1.jpg", `quadro de ${BLOB}/tour-A1.mp4`],
      ["IMG_0042-D4.jpg", `quadro de ${BLOB}/IMG_0042-D4.MOV`],
    ]);
    assert.deepEqual(report.created, ["tour-A1.jpg", "IMG_0042-D4.jpg"]);
  });

  it("uma falha não interrompe os demais vídeos e guarda o motivo", async () => {
    const report = await backfill([file("hevc-A1.MOV"), file("tour-B2.mp4"), file("fogao-C3.webm")], {
      extract: async (url) => {
        if (url.endsWith("hevc-A1.MOV")) throw new Error("Decoder (codec hevc) not found");
        return Buffer.from("jpeg");
      },
      save: async (path) => {
        if (path === "tour-B2.jpg") throw new Error("This blob already exists");
      },
    });
    assert.deepEqual(report.created, ["fogao-C3.jpg"]);
    assert.deepEqual(report.failures, [
      { video: "hevc-A1.MOV", reason: "Decoder (codec hevc) not found" },
      { video: "tour-B2.mp4", reason: "This blob already exists" },
    ]);
  });

  it("avisa o andamento, vídeo a vídeo", async () => {
    const progress: string[] = [];
    await backfill([file("hevc-A1.MOV"), file("tour-B2.mp4")], {
      extract: async (url) => {
        if (url.endsWith(".MOV")) throw new Error("Decoder (codec hevc) not found");
        return Buffer.from("jpeg");
      },
      save: async () => {},
      onProgress: (line) => progress.push(line),
    });
    assert.deepEqual(progress, [
      "[1/2] hevc-A1.MOV: falhou (Decoder (codec hevc) not found)",
      "[2/2] tour-B2.mp4 → tour-B2.jpg",
    ]);
  });
});

describe("Relatório final", () => {
  const lines = (text: string) => text.split("\n").map((line) => line.trim());

  it("traz as quatro contagens e o motivo de cada falha", () => {
    const text = formatReport(
      {
        found: 5,
        skipped: 1,
        pending: ["hevc-A1.MOV", "tour-B2.mp4", "fogao-C3.webm", "sofa-D4.mp4"],
        created: ["fogao-C3.jpg", "sofa-D4.jpg"],
        failures: [
          { video: "hevc-A1.MOV", reason: "Decoder (codec hevc) not found" },
          { video: "tour-B2.mp4", reason: "This blob already exists" },
        ],
      },
      { kind: "blob" },
    );
    for (const line of [
      "Vídeos encontrados: 5",
      "Miniaturas criadas: 2",
      "Pulados (já tinham Miniatura): 1",
      "Falhas: 2",
      "hevc-A1.MOV: Decoder (codec hevc) not found",
      "tour-B2.mp4: This blob already exists",
    ]) {
      assert.ok(lines(text).includes(line), `falta a linha "${line}" em:\n${text}`);
    }
  });

  it("no ensaio, diz que nada foi gravado e lista o que criaria", () => {
    const text = formatReport(
      { found: 3, skipped: 1, pending: ["fogao-B2.webm", "IMG_0042-D4.MOV"], created: [], failures: [] },
      { kind: "ensaio" },
    );
    for (const line of [
      "Ensaio: nada foi gravado.",
      "fogao-B2.webm → fogao-B2.jpg",
      "IMG_0042-D4.MOV → IMG_0042-D4.jpg",
      "Vídeos encontrados: 3",
      "Miniaturas criadas: 0 (o ensaio criaria 2)",
      "Pulados (já tinham Miniatura): 1",
      "Falhas: 0",
    ]) {
      assert.ok(lines(text).includes(line), `falta a linha "${line}" em:\n${text}`);
    }
  });

  it("salvando numa pasta local, diz onde estão as Miniaturas e que o Blob não foi tocado", () => {
    const text = formatReport(
      { found: 1, skipped: 0, pending: ["tour-A1.mp4"], created: ["tour-A1.jpg"], failures: [] },
      { kind: "pasta", dir: "/tmp/miniaturas" },
    );
    assert.ok(
      lines(text).includes("Miniaturas salvas em /tmp/miniaturas: nada foi gravado no Blob."),
      text,
    );
    assert.ok(lines(text).includes("Miniaturas criadas: 1"), text);
  });
});
