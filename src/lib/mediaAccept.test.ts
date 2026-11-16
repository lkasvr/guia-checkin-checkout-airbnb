import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAX_UPLOAD_BYTES, MB, MEDIA_ACCEPT, refusal } from "@/lib/mediaAccept";

describe("Que arquivo o campo de mídia deixa enviar", () => {
  it("o campo só de foto (a Capa) aceita foto e recusa vídeo", () => {
    assert.equal(MEDIA_ACCEPT.image.allows("image/jpeg"), true);
    assert.equal(MEDIA_ACCEPT.image.allows("image/webp"), true);
    assert.equal(MEDIA_ACCEPT.image.allows("video/mp4"), false);
  });

  it("o campo só de vídeo (o Tour) aceita vídeo e recusa foto", () => {
    assert.equal(MEDIA_ACCEPT.video.allows("video/mp4"), true);
    assert.equal(MEDIA_ACCEPT.video.allows("video/quicktime"), true);
    assert.equal(MEDIA_ACCEPT.video.allows("image/jpeg"), false);
  });

  it("o campo sem restrição aceita foto e vídeo, e recusa o resto", () => {
    assert.equal(MEDIA_ACCEPT.any.allows("image/png"), true);
    assert.equal(MEDIA_ACCEPT.any.allows("video/webm"), true);
    assert.equal(MEDIA_ACCEPT.any.allows("application/pdf"), false);
    assert.equal(MEDIA_ACCEPT.any.allows("video/x-msvideo"), false);
  });
});

describe("Por que o arquivo escolhido é recusado antes de subir", () => {
  it("recusa o vídeo acima de 50 MB, citando o limite, e deixa passar o de 50 MB", () => {
    for (const accepts of ["video", "any"] as const) {
      assert.equal(refusal({ type: "video/quicktime", size: 50 * MB }, accepts), null);
      assert.match(refusal({ type: "video/mp4", size: 50 * MB + 1 }, accepts) ?? "", /50 MB/);
    }
  });

  it("mantém o limite da foto em 30 MB antes da redução", () => {
    for (const accepts of ["image", "any"] as const) {
      assert.equal(refusal({ type: "image/jpeg", size: 30 * MB }, accepts), null);
      assert.match(refusal({ type: "image/png", size: 30 * MB + 1 }, accepts) ?? "", /30 MB/);
    }
  });

  it("recusa pelo tipo antes de olhar o tamanho, citando os formatos do campo", () => {
    assert.equal(
      refusal({ type: "image/jpeg", size: 1 * MB }, "video"),
      "Envie um vídeo (MP4, WebM, MOV).",
    );
    assert.equal(
      refusal({ type: "video/mp4", size: 60 * MB }, "image"),
      "Envie uma foto (JPG, PNG, WebP).",
    );
  });
});

describe("O que o token de envio deixa gravar no Blob", () => {
  it("limita o tamanho em 50 MB, o mesmo teto que o painel confere no vídeo", () => {
    assert.equal(MAX_UPLOAD_BYTES, 50 * MB);
    assert.equal(refusal({ type: "video/mp4", size: MAX_UPLOAD_BYTES }, "any"), null);
    assert.notEqual(refusal({ type: "video/mp4", size: MAX_UPLOAD_BYTES + 1 }, "any"), null);
  });
});
