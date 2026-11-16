import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createMiniaturas, formatReport, plan } from "./backfill";

const BLOB = "https://k3x9qz7w.public.blob.vercel-storage.com";
const file = (pathname: string) => ({ pathname, url: `${BLOB}/${pathname}` });
const quiet = () => {};

describe("Lote de Miniaturas", () => {
  it("conta os vídeos encontrados e separa os que ainda não têm Miniatura", () => {
    const { found, pending } = plan([file("tour-A1.mp4"), file("tour-A1.jpg"), file("fogao-B2.webm"), file("sala-C3.jpg")]);
    assert.equal(found, 2);
    assert.deepEqual(pending, [file("fogao-B2.webm")]);
  });

  it("grava, no caminho do vídeo com .jpg, o quadro tirado do endereço público do vídeo", async () => {
    const extracted: string[] = [];
    const saved: [string, string][] = [];
    const { created } = await createMiniaturas([file("tour-A1.mp4"), file("IMG_0042-D4.MOV")], {
      extract: async (url) => {
        extracted.push(url);
        return Buffer.from(`quadro de ${url}`);
      },
      save: async (path, jpeg) => {
        saved.push([path, jpeg.toString()]);
      },
      onProgress: quiet,
    });
    assert.deepEqual(extracted, [`${BLOB}/tour-A1.mp4`, `${BLOB}/IMG_0042-D4.MOV`]);
    assert.deepEqual(saved, [
      ["tour-A1.jpg", `quadro de ${BLOB}/tour-A1.mp4`],
      ["IMG_0042-D4.jpg", `quadro de ${BLOB}/IMG_0042-D4.MOV`],
    ]);
    assert.deepEqual(created, ["tour-A1.jpg", "IMG_0042-D4.jpg"]);
  });

  it("uma falha não interrompe os demais vídeos e guarda o motivo", async () => {
    const { created, failures } = await createMiniaturas([file("hevc-A1.MOV"), file("tour-B2.mp4"), file("fogao-C3.webm")], {
      extract: async (url) => {
        if (url.endsWith("hevc-A1.MOV")) throw new Error("Decoder (codec hevc) not found");
        return Buffer.from("jpeg");
      },
      save: async (path) => {
        if (path === "tour-B2.jpg") throw new Error("This blob already exists");
      },
      onProgress: quiet,
    });
    assert.deepEqual(created, ["fogao-C3.jpg"]);
    assert.deepEqual(failures, [
      { video: "hevc-A1.MOV", reason: "Decoder (codec hevc) not found" },
      { video: "tour-B2.mp4", reason: "This blob already exists" },
    ]);
  });

  it("avisa o andamento, vídeo a vídeo", async () => {
    const progress: string[] = [];
    await createMiniaturas([file("hevc-A1.MOV"), file("tour-B2.mp4")], {
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
  it("traz as quatro contagens e o motivo de cada falha", () => {
    const text = formatReport(
      { found: 5, pending: ["hevc-A1.MOV", "tour-B2.mp4", "fogao-C3.webm", "sofa-D4.mp4"].map(file) },
      { kind: "gravar" },
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
