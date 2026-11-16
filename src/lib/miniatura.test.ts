import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isVideoUrl, miniaturaToShow, miniaturaUrl, videosMissingMiniatura } from "@/lib/miniatura";

describe("O que conta como vídeo", () => {
  it("decide pela extensão, sem diferenciar maiúsculas", () => {
    assert.equal(isVideoUrl("https://exemplo.com/tour.mp4"), true);
    assert.equal(isVideoUrl("/media/IMG_0042.MOV"), true);
    assert.equal(isVideoUrl("https://exemplo.com/sala.jpg"), false);
  });

  it("olha só o caminho, não a query nem o fragmento", () => {
    assert.equal(isVideoUrl("https://exemplo.com/tour.webm?v=2"), true);
    assert.equal(isVideoUrl("/media/tour.mp4#t=0.1"), true);
    assert.equal(isVideoUrl("https://exemplo.com/sala.jpg?de=tour.mp4"), false);
  });

  it("não confunde o domínio com a extensão (.mov também é domínio de topo)", () => {
    assert.equal(isVideoUrl("https://exemplo.mov"), false);
    assert.equal(isVideoUrl("//cdn.exemplo.mov"), false);
    assert.equal(isVideoUrl("https://exemplo.mov/sala.jpg"), false);
  });
});

describe("Miniatura de um endereço de vídeo", () => {
  it("troca .mp4 por .jpg", () => {
    assert.equal(miniaturaUrl("https://exemplo.com/tour.mp4"), "https://exemplo.com/tour.jpg");
  });

  it("troca .webm e .mov por .jpg", () => {
    assert.equal(miniaturaUrl("https://exemplo.com/tour.webm"), "https://exemplo.com/tour.jpg");
    assert.equal(miniaturaUrl("https://exemplo.com/tour.mov"), "https://exemplo.com/tour.jpg");
  });

  it("não diferencia maiúsculas na extensão (.MOV do iPhone)", () => {
    assert.equal(miniaturaUrl("https://exemplo.com/IMG_0042.MOV"), "https://exemplo.com/IMG_0042.jpg");
  });

  it("preserva domínio e sufixo aleatório de um endereço do Blob", () => {
    assert.equal(
      miniaturaUrl("https://k3x9qz7w.public.blob.vercel-storage.com/tour-Xy8mp4QzR2bT5nLk9vW3aD.mp4"),
      "https://k3x9qz7w.public.blob.vercel-storage.com/tour-Xy8mp4QzR2bT5nLk9vW3aD.jpg",
    );
  });

  it("funciona num caminho da pasta pública", () => {
    assert.equal(miniaturaUrl("/media/como-estacionar.mp4"), "/media/como-estacionar.jpg");
  });

  it("preserva query e fragmento do endereço", () => {
    assert.equal(miniaturaUrl("https://exemplo.com/tour.mp4?v=2"), "https://exemplo.com/tour.jpg?v=2");
    // O guia monta o `src` do vídeo com `#t=0.1` (sections.tsx).
    assert.equal(miniaturaUrl("/media/tour.mp4#t=0.1"), "/media/tour.jpg#t=0.1");
  });

  it("nunca troca o domínio", () => {
    assert.equal(miniaturaUrl("https://exemplo.mov/tour.mp4"), "https://exemplo.mov/tour.jpg");
    assert.equal(miniaturaUrl("https://exemplo.mov"), undefined);
  });

  it("foto não tem Miniatura", () => {
    assert.equal(miniaturaUrl("https://exemplo.com/sala.jpg"), undefined);
    assert.equal(miniaturaUrl("https://exemplo.com/sala.webp"), undefined);
    // Quadro exportado de um vídeo: a extensão do vídeo no meio do nome não conta.
    assert.equal(miniaturaUrl("https://exemplo.com/IMG_0042.MOV.png"), undefined);
    // Nem uma extensão de vídeo que aparece só na query.
    assert.equal(miniaturaUrl("https://exemplo.com/sala.jpg?de=tour.mp4"), undefined);
  });

  it("endereço vazio não tem Miniatura", () => {
    assert.equal(miniaturaUrl(""), undefined);
  });
});

describe("Miniatura a exibir", () => {
  it("a miniatura explícita vence a deduzida", () => {
    assert.equal(
      miniaturaToShow("/media/como-estacionar.mp4", "/media/como-estacionar-poster.jpg"),
      "/media/como-estacionar-poster.jpg",
    );
  });

  it("sem miniatura explícita, exibe a deduzida do vídeo", () => {
    assert.equal(
      miniaturaToShow("https://k3x9qz7w.public.blob.vercel-storage.com/tour-Xy8QzR2b.mp4"),
      "https://k3x9qz7w.public.blob.vercel-storage.com/tour-Xy8QzR2b.jpg",
    );
  });

  it("miniatura explícita vazia conta como ausente", () => {
    assert.equal(miniaturaToShow("/media/como-estacionar.mp4", ""), "/media/como-estacionar.jpg");
  });
});

describe("Vídeos sem Miniatura", () => {
  it("vídeo sem .jpg ao lado entra na lista", () => {
    assert.deepEqual(videosMissingMiniatura(["tour-Xy8QzR2b.mp4"]), ["tour-Xy8QzR2b.mp4"]);
  });

  it("vídeo com .jpg ao lado sai da lista", () => {
    assert.deepEqual(videosMissingMiniatura(["tour-Xy8QzR2b.mp4", "tour-Xy8QzR2b.jpg"]), []);
  });

  it("só conta o .jpg minúsculo, que é o que a convenção grava", () => {
    assert.deepEqual(videosMissingMiniatura(["IMG_0042-Xy8QzR2b.MOV", "IMG_0042-Xy8QzR2b.JPG"]), [
      "IMG_0042-Xy8QzR2b.MOV",
    ]);
  });

  it("numa lista mista, ignora fotos soltas e trata igual toda extensão de vídeo", () => {
    const paths = [
      "tour-A1b2C3.mp4",
      "tour-A1b2C3.jpg",
      "fogao-D4e5F6.webm",
      "sala-G7h8I9.jpg",
      "quarto-J1k2L3.webp",
      "IMG_0042-M4n5O6.MOV",
      "estacionar-P7q8R9.mov",
      "estacionar-P7q8R9.jpg",
    ];
    assert.deepEqual(videosMissingMiniatura(paths), ["fogao-D4e5F6.webm", "IMG_0042-M4n5O6.MOV"]);
  });
});
