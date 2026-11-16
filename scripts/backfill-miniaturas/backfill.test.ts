import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { backlogOf, createMiniaturas } from "./backfill";

const BLOB = "https://k3x9qz7w.public.blob.vercel-storage.com";
const file = (pathname: string) => ({ pathname, url: `${BLOB}/${pathname}` });
/** Um vídeo pendente e o caminho da Miniatura dele. */
const pending = (pathname: string, miniatura: string) => ({ video: file(pathname), miniatura });
const quiet = () => {};

describe("Lote de Miniaturas", () => {
  it("conta os vídeos encontrados e separa os que ainda não têm Miniatura", () => {
    const backlog = backlogOf([file("tour-A1.mp4"), file("tour-A1.jpg"), file("fogao-B2.webm"), file("sala-C3.jpg")]);
    assert.equal(backlog.found, 2);
    assert.deepEqual(backlog.pending, [pending("fogao-B2.webm", "fogao-B2.jpg")]);
  });

  it("dá a cada vídeo pendente o caminho do vídeo com .jpg", () => {
    const { pending: videos } = backlogOf([file("tour-A1.mp4"), file("IMG_0042-D4.MOV")]);
    assert.deepEqual(videos, [pending("tour-A1.mp4", "tour-A1.jpg"), pending("IMG_0042-D4.MOV", "IMG_0042-D4.jpg")]);
  });

  it("grava, no caminho da Miniatura, o quadro tirado do endereço público do vídeo", async () => {
    const extracted: string[] = [];
    const saved: [string, string][] = [];
    const videos = [pending("tour-A1.mp4", "tour-A1.jpg"), pending("IMG_0042-D4.MOV", "IMG_0042-D4.jpg")];
    const { created } = await createMiniaturas(videos, {
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
    const videos = [pending("hevc-A1.MOV", "hevc-A1.jpg"), pending("tour-B2.mp4", "tour-B2.jpg"), pending("fogao-C3.webm", "fogao-C3.jpg")];
    const { created, failures } = await createMiniaturas(videos, {
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
    await createMiniaturas([pending("hevc-A1.MOV", "hevc-A1.jpg"), pending("tour-B2.mp4", "tour-B2.jpg")], {
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
