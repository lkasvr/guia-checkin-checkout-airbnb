import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Emite o token de upload direto-pro-Blob (o arquivo nunca passa pelo corpo
 * desta rota, só o pedido de token e a confirmação) — só pro superadmin,
 * mesma checagem de `requireAdmin` em `src/app/admin/actions.ts`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;

  // O prefixo que a Vercel deu à variável ao conectar o Blob Store veio
  // diferente do padrão esperado pelo SDK (`BLOB_READ_WRITE_TOKEN`) — aceita
  // os dois nomes pra não depender de qual prefixo foi usado.
  const token =
    process.env.BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN ?? process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        addRandomSuffix: true,
        maximumSizeInBytes: 8 * 1024 * 1024,
      }),
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha no upload" },
      { status: 400 },
    );
  }
}
