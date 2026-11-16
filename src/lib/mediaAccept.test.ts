import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MEDIA_ACCEPT } from "@/lib/mediaAccept";

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
