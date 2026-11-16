import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { extractMiniatura } from "./extractMiniatura";

const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0;

/**
 * Gera um vídeo MPEG-4 feito de trechos de cor sólida, um depois do outro, a `rate` quadros por
 * segundo; `frames` corta o vídeo nesse número de quadros.
 */
function makeVideo(
  path: string,
  size: string,
  segments: [color: string, seconds: number][],
  { rate = "25", frames }: { rate?: string; frames?: number } = {},
) {
  const inputs = segments.flatMap(([color, seconds]) => ["-f", "lavfi", "-i", `color=c=${color}:s=${size}:r=${rate}:d=${seconds}`]);
  const concat = `${segments.map((_, i) => `[${i}]`).join("")}concat=n=${segments.length}:v=1:a=0`;
  const cut = frames === undefined ? [] : ["-frames:v", String(frames)];
  const result = spawnSync("ffmpeg", ["-v", "error", ...inputs, "-filter_complex", concat, ...cut, "-c:v", "mpeg4", "-q:v", "2", path]);
  assert.equal(result.status, 0, result.stderr.toString());
}

/**
 * Um vídeo de 3 s cortado logo depois de 0,6 s: o índice, no começo do arquivo, ainda diz 3 s,
 * mas os bytes do quadro de 1 s não existem. Imita uma leitura que falha no meio do vídeo.
 */
async function makeTruncatedVideo(path: string) {
  const full = `${path}.inteiro.mp4`;
  const encode = spawnSync("ffmpeg", [
    "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=64x48:r=25:d=3",
    "-c:v", "mpeg4", "-q:v", "2", "-movflags", "+faststart", full,
  ]);
  assert.equal(encode.status, 0, encode.stderr.toString());
  const packets = spawnSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time,pos", "-of", "csv=p=0", full,
  ]).stdout.toString();
  const cut = packets
    .split("\n")
    .map((line) => line.split(",").map(Number))
    .find(([time]) => time >= 0.6)![1];
  await writeFile(path, (await readFile(full)).subarray(0, cut));
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
    // 30 quadros a 29,97 fps: dura 1,001 s, mas o último quadro começa em 0,968 s.
    makeVideo(video("trinta-quadros.mp4"), "64x48", [["red", 0.5], ["blue", 1]], { rate: "30000/1001", frames: 30 });
    makeVideo(video("paisagem.mp4"), "1920x1080", [["red", 1.2]]);
    await makeTruncatedVideo(video("truncado.mp4"));
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

  it("num vídeo de pouco mais de 1 s sem quadro em 1 s, é o primeiro quadro", async () => {
    assert.equal(await dominantColor(await extractMiniatura(video("trinta-quadros.mp4"))), "vermelho");
  });

  it("tem o lado maior limitado a 1280 px, sem distorcer", async () => {
    const { width, height } = await sharp(await extractMiniatura(video("paisagem.mp4"))).metadata();
    assert.equal(`${width}x${height}`, "1280x720");
  });

  it("num vídeo longo cujo quadro de 1 s não sai, falha em vez de usar o primeiro quadro", async () => {
    await assert.rejects(extractMiniatura(video("truncado.mp4")));
  });

  it("falha com o motivo dado pelo ffmpeg", async () => {
    await assert.rejects(extractMiniatura(video("nao-e-video.mp4")), /Invalid data found when processing input/);
  });
});
