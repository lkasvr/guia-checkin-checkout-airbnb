import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blobToken } from "@/lib/blobToken";

describe("Chave do Blob no ambiente", () => {
  it("lê a variável com o prefixo que a Vercel deu ao conectar o Blob", () => {
    assert.equal(blobToken({ BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN: "chave-a" }), "chave-a");
  });

  it("aceita também o nome padrão do SDK", () => {
    assert.equal(blobToken({ BLOB_READ_WRITE_TOKEN: "chave-b" }), "chave-b");
  });

  it("com as duas definidas, fica com a do prefixo da Vercel", () => {
    assert.equal(
      blobToken({ BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN: "chave-a", BLOB_READ_WRITE_TOKEN: "chave-b" }),
      "chave-a",
    );
  });

  it("sem nenhuma das duas, não há chave", () => {
    assert.equal(blobToken({ OUTRA_VARIAVEL: "x" }), undefined);
  });

  it("uma variável vazia conta como ausente", () => {
    assert.equal(blobToken({ BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN: "", BLOB_READ_WRITE_TOKEN: "chave-b" }), "chave-b");
    assert.equal(blobToken({ BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN: "" }), undefined);
  });
});
