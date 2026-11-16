import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { uploadVideo } from "@/lib/videoUpload";

const BLOB = "https://k3x9qz7w.public.blob.vercel-storage.com";
const video = new File(["vídeo"], "tour.mp4", { type: "video/mp4" });
const jpeg = new Blob(["quadro"], { type: "image/jpeg" });

/** O Blob acrescenta o sufixo aleatório antes da extensão, como no envio de verdade. */
const putVideoAs = (pathname: string) => async () => ({ url: `${BLOB}/${encodeURIComponent(pathname)}`, pathname });

describe("Envio de vídeo com Miniatura", () => {
  it("grava a Miniatura no caminho final do vídeo, trocando a extensão por .jpg", async () => {
    const saved: [string, Blob][] = [];
    const result = await uploadVideo(video, {
      captureMiniatura: async () => jpeg,
      putVideo: putVideoAs("tour-Xy8QzR2b.mp4"),
      putMiniatura: async (pathname, file) => {
        saved.push([pathname, file]);
      },
    });
    assert.deepEqual(result, { url: `${BLOB}/tour-Xy8QzR2b.mp4` });
    assert.deepEqual(saved, [["tour-Xy8QzR2b.jpg", jpeg]]);
  });

  it("se o navegador não gera a Miniatura, o vídeo sobe mesmo assim e o resultado traz o motivo", async () => {
    const uploaded: string[] = [];
    const result = await uploadVideo(video, {
      captureMiniatura: async () => {
        throw new Error("o navegador não decodifica HEVC");
      },
      putVideo: async (file) => {
        uploaded.push(file.name);
        return putVideoAs("tour-Xy8QzR2b.mov")();
      },
      putMiniatura: async (pathname) => {
        uploaded.push(pathname);
      },
    });
    assert.deepEqual(uploaded, ["tour.mp4"]);
    assert.equal(result.url, `${BLOB}/tour-Xy8QzR2b.mov`);
    assert.match(result.miniaturaError?.message ?? "", /não decodifica HEVC/);
  });

  it("se gravar a Miniatura falha depois que o vídeo subiu, o vídeo fica e o resultado traz o motivo", async () => {
    const result = await uploadVideo(video, {
      captureMiniatura: async () => jpeg,
      putVideo: putVideoAs("tour-Xy8QzR2b.mp4"),
      putMiniatura: async () => {
        throw new Error("This blob already exists");
      },
    });
    assert.equal(result.url, `${BLOB}/tour-Xy8QzR2b.mp4`);
    assert.match(result.miniaturaError?.message ?? "", /already exists/);
  });

  it("vídeo cujo nome não tem extensão de vídeo fica sem Miniatura, porque a convenção não dá caminho para ela", async () => {
    const m4v = new File(["vídeo"], "clip.m4v", { type: "video/mp4" });
    const saved: unknown[] = [];
    const result = await uploadVideo(m4v, {
      captureMiniatura: async () => jpeg,
      putVideo: putVideoAs("clip-Xy8QzR2b.m4v"),
      putMiniatura: async (pathname) => {
        saved.push(pathname);
      },
    });
    assert.deepEqual(saved, []);
    assert.equal(result.url, `${BLOB}/clip-Xy8QzR2b.m4v`);
    assert.match(result.miniaturaError?.message ?? "", /extensão de vídeo/);
  });

  it("se o vídeo não sobe, o envio falha com o motivo", async () => {
    await assert.rejects(
      uploadVideo(video, {
        captureMiniatura: async () => jpeg,
        putVideo: async () => {
          throw new Error("Failed to retrieve the client token");
        },
        putMiniatura: async () => assert.fail("sem vídeo, nada a gravar"),
      }),
      /Failed to retrieve the client token/,
    );
  });
});
