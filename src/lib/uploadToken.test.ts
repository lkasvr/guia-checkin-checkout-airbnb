import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { miniaturaRequest, uploadTokenOptions } from "@/lib/uploadToken";

const MB = 1024 * 1024;

describe("Token de envio de foto ou vídeo", () => {
  it("sem pedido de Miniatura, aceita foto e vídeo de até 50 MB, com sufixo aleatório", () => {
    const options = uploadTokenOptions("tour.mp4", null);
    assert.equal(options.addRandomSuffix, true);
    assert.equal(options.maximumSizeInBytes, 50 * MB);
    for (const type of ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"]) {
      assert.ok(options.allowedContentTypes.includes(type), type);
    }
  });
});

describe("Token de envio da Miniatura", () => {
  it("aceita só JPEG de até 2 MB, no caminho pedido, sem sobrescrever", () => {
    assert.deepEqual(uploadTokenOptions("tour-Xy8QzR2b.jpg", miniaturaRequest("image/jpeg")), {
      allowedContentTypes: ["image/jpeg"],
      addRandomSuffix: false,
      maximumSizeInBytes: 2 * MB,
      allowOverwrite: false,
    });
  });

  it("recusa o pedido de Miniatura de outro tipo que não JPEG", () => {
    assert.throws(() => uploadTokenOptions("tour-Xy8QzR2b.jpg", miniaturaRequest("image/png")), /JPEG/);
    assert.throws(() => uploadTokenOptions("tour-Xy8QzR2b.jpg", miniaturaRequest("video/mp4")), /JPEG/);
  });

  it("recusa o pedido de Miniatura num caminho que não termina em .jpg", () => {
    for (const path of ["tour-Xy8QzR2b.mp4", "tour-Xy8QzR2b.jpeg", "tour-Xy8QzR2b.JPG", "tour-Xy8QzR2b"]) {
      assert.throws(() => uploadTokenOptions(path, miniaturaRequest("image/jpeg")), /\.jpg/, path);
    }
  });

  it("um pedido que se diz Miniatura sem dizer o tipo é recusado", () => {
    assert.throws(() => uploadTokenOptions("tour-Xy8QzR2b.jpg", JSON.stringify({ miniatura: {} })), /JPEG/);
  });
});
