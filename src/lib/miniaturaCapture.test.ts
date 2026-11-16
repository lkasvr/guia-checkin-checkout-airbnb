import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { frameSize, frameTime } from "@/lib/miniaturaCapture";

describe("Quadro da Miniatura", () => {
  it("é o de 1 s", () => {
    assert.equal(frameTime(3), 1);
    assert.equal(frameTime(1), 1);
  });

  it("num vídeo de menos de 1 s, é o primeiro quadro", () => {
    assert.equal(frameTime(0.5), 0);
  });

  it("sem duração conhecida (alguns WebM), tenta 1 s", () => {
    assert.equal(frameTime(Infinity), 1);
    assert.equal(frameTime(NaN), 1);
  });
});

describe("Tamanho da Miniatura", () => {
  it("limita o lado maior a 1280 px, mantendo a proporção", () => {
    assert.deepEqual(frameSize(1920, 1080), { width: 1280, height: 720 });
    assert.deepEqual(frameSize(1080, 1920), { width: 720, height: 1280 });
    assert.deepEqual(frameSize(3840, 2160), { width: 1280, height: 720 });
  });

  it("não amplia um vídeo menor que isso", () => {
    assert.deepEqual(frameSize(640, 360), { width: 640, height: 360 });
  });
});
