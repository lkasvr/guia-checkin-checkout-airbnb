import { isVideoUrl, miniaturaUrl, videosMissingMiniatura } from "../../src/lib/miniatura";

/** Um arquivo listado no Blob: o caminho dentro do armazenamento e o endereço público. */
export type BlobFile = { pathname: string; url: string };

export type Report = {
  /** Vídeos no Blob. */
  found: number;
  /** Vídeos que já tinham Miniatura. */
  skipped: number;
  /** Vídeos sem Miniatura: o que o lote tenta criar (no ensaio, o que criaria). */
  pending: string[];
  /** Caminhos das Miniaturas gravadas. */
  created: string[];
  /** Vídeos cuja Miniatura não saiu, com o motivo. */
  failures: { video: string; reason: string }[];
};

type Options =
  | { dryRun: true }
  | {
      dryRun?: false;
      /** Tira o JPEG do quadro de 1 s a partir do endereço público do vídeo. */
      extract: (videoUrl: string) => Promise<Buffer>;
      /** Grava o JPEG no caminho da Miniatura. */
      save: (miniaturaPath: string, jpeg: Buffer) => Promise<void>;
      /** Recebe uma linha por vídeo processado, para acompanhar um lote demorado. */
      onProgress?: (line: string) => void;
    };

/** Cria a Miniatura de cada vídeo do Blob que ainda não tem uma. */
export async function backfill(files: BlobFile[], options: Options): Promise<Report> {
  const paths = files.map((f) => f.pathname);
  const urls = new Map(files.map((f) => [f.pathname, f.url]));
  const found = paths.filter(isVideoUrl).length;
  const pending = videosMissingMiniatura(paths);
  const report: Report = { found, skipped: found - pending.length, pending, created: [], failures: [] };
  if (options.dryRun) return report;

  // Um vídeo de cada vez, e a falha de um não derruba o lote.
  for (const [i, video] of pending.entries()) {
    const miniatura = miniaturaUrl(video)!;
    const step = `[${i + 1}/${pending.length}] ${video}`;
    try {
      const jpeg = await options.extract(urls.get(video)!);
      await options.save(miniatura, jpeg);
      report.created.push(miniatura);
      options.onProgress?.(`${step} → ${miniatura}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      report.failures.push({ video, reason });
      options.onProgress?.(`${step}: falhou (${reason})`);
    }
  }
  return report;
}

/**
 * Para onde vão as Miniaturas, um modo por opção da linha de comando: `gravar` grava no Blob;
 * `pasta` salva numa pasta local, o que testa a extração sem gravar no Blob; `ensaio` não
 * guarda nada e só lista o que faria.
 */
export type Destination = { kind: "gravar" } | { kind: "pasta"; dir: string } | { kind: "ensaio" };

/** Os vídeos sem Miniatura, cada um com o caminho da Miniatura que vai ganhar. */
export function formatPending(report: Report): string {
  const lines = report.pending.map((video) => `  ${video} → ${miniaturaUrl(video)}`);
  return [`Vídeos sem Miniatura (${report.pending.length}):`, ...lines].join("\n");
}

/** O relatório que o script imprime no fim: as quatro contagens e o motivo de cada falha. */
export function formatReport(report: Report, destination: Destination): string {
  const out: string[] = [];
  if (destination.kind === "ensaio") {
    out.push("Ensaio: nada foi gravado.", formatPending(report), "");
  }
  if (destination.kind === "pasta") {
    out.push(`Miniaturas salvas em ${destination.dir}: nada foi gravado no Blob.`, "");
  }

  const wouldCreate = destination.kind === "ensaio" ? ` (o ensaio criaria ${report.pending.length})` : "";
  out.push(
    `Vídeos encontrados: ${report.found}`,
    `Miniaturas criadas: ${report.created.length}${wouldCreate}`,
    `Pulados (já tinham Miniatura): ${report.skipped}`,
    `Falhas: ${report.failures.length}`,
  );
  for (const { video, reason } of report.failures) out.push(`  ${video}: ${reason}`);
  return out.join("\n");
}
