import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { extractMiniatura } from "./extractMiniatura";

const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

/** Gera um vídeo MPEG-4 feito de trechos de cor sólida, um depois do outro. */
function makeVideo(path: string, size: string, segments: [color: string, seconds: number][]) {
  const inputs = segments.flatMap(([color, seconds]) => ["-f", "lavfi", "-i", `color=c=${color}:s=${size}:r=25:d=${seconds}`]);
  const concat = `${segments.map((_, i) => `[${i}]`).join("")}concat=n=${segments.length}:v=1:a=0`;
  const result = spawnSync("ffmpeg", ["-v", "error", ...inputs, "-filter_complex", concat, "-c:v", "mpeg4", "-q:v", "2", path]);
  assert.equal(result.status, 0, result.stderr.toString());
}

/** A cor dominante do JPEG: o canal com a maior média. */
async function dominantColor(jpeg: Buffer): Promise<string> {
  const { channels } = await sharp(jpeg).stats();
  const means = channels.slice(0, 3).map((c) => c.mean);
  return ["vermelho", "verde", "azul"][means.indexOf(Math.max(...means))];
}

describe("Miniatura tirada do vídeo pelo ffmpeg", { skip: !hasFfmpeg && "precisa do ffmpeg instalado" }, () => {
  let dir: string;
  const video = (name: string) => join(dir, name);

  before(async () => {
    dir = await mkdtemp(join(tmpdir(), "miniatura-"));
    makeVideo(video("tres-segundos.mp4"), "64x48", [["red", 0.7], ["blue", 0.6], ["lime", 1.7]]);
    makeVideo(video("meio-segundo.mp4"), "64x48", [["red", 0.2], ["blue", 0.3]]);
    makeVideo(video("paisagem.mp4"), "1920x1080", [["red", 1.2]]);
    makeVideo(video("retrato.mp4"), "1080x1920", [["red", 1.2]]);
    makeVideo(video("pequeno.mp4"), "320x240", [["red", 1.2]]);
    await writeFile(video("nao-e-video.mp4"), "isto não é um vídeo");
  });

  after(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("é o quadro de 1 s, em JPEG", async () => {
    const jpeg = await extractMiniatura(video("tres-segundos.mp4"));
    assert.equal((await sharp(jpeg).metadata()).format, "jpeg");
    assert.equal(await dominantColor(jpeg), "azul");
  });

  it("num vídeo com menos de 1 s, é o primeiro quadro", async () => {
    assert.equal(await dominantColor(await extractMiniatura(video("meio-segundo.mp4"))), "vermelho");
  });

  it("tem o lado maior limitado a 1280 px, sem distorcer nem ampliar", async () => {
    const size = async (name: string) => {
      const { width, height } = await sharp(await extractMiniatura(video(name))).metadata();
      return `${width}x${height}`;
    };
    assert.equal(await size("paisagem.mp4"), "1280x720");
    assert.equal(await size("retrato.mp4"), "720x1280");
    assert.equal(await size("pequeno.mp4"), "320x240");
  });

  it("falha com o motivo dado pelo ffmpeg", async () => {
    await assert.rejects(extractMiniatura(video("nao-e-video.mp4")), /Invalid data found when processing input/);
  });
});
