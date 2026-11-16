import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { blobToken } from "@/lib/blobToken";
import { uploadTokenOptions } from "@/lib/uploadToken";

/**
 * Emite o token de envio direto pro Blob (o arquivo nunca passa pelo corpo
 * desta rota, só o pedido de token e a confirmação) — só pro superadmin,
 * mesma checagem de `requireAdmin` em `src/app/admin/actions.ts`. O que o
 * token deixa gravar, inclusive a Miniatura de um vídeo, está em `uploadTokenOptions`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito" }, { status: 403 });
  }

  const body = (await request.json()) as HandleUploadBody;
  const token = blobToken(process.env);

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname, clientPayload) => uploadTokenOptions(pathname, clientPayload),
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha no upload" },
      { status: 400 },
    );
  }
}
