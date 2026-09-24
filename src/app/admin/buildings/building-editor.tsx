"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createBuilding,
  updateBuilding,
  type BuildingEditPayload,
} from "@/app/admin/buildings/actions";
import {
  AmenityListEditor,
  CheckinCardsEditor,
  CheckoutStepsEditor,
  HomeEditor,
  MediaField,
  PlaceListEditor,
  RulesListEditor,
} from "@/app/admin/section-editors";
import type { BuildingTemplate } from "@/data/buildApartmentContent";
import { formatPhoneBR } from "@/lib/phone";
import {
  amenitiesFromContent,
  checkinFromContent,
  checkoutFromContent,
  homeFromContent,
  placesFromContent,
  rulesFromContent,
} from "@/data/sectionContent";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";
const sectionTitle = "mt-6 font-display text-[19px] font-normal";

export type BuildingOption = {
  id: string;
  name: string;
  defaultHeroImg: string | null;
  defaultFooterImg: string | null;
} & BuildingTemplate;

// As fotos padrão (capa/despedida) têm o próprio botão de copiar, e o endereço
// é específico de cada prédio — não fazem parte das 7 seções com editor de lista.
type Section = Exclude<
  keyof BuildingEditPayload,
  "defaultHeroImg" | "defaultFooterImg" | "location"
>;

function CopyFromSelector({
  buildings,
  onApply,
}: {
  buildings: BuildingOption[];
  onApply: (sourceId: string) => void;
}) {
  const [selected, setSelected] = useState("");
  if (buildings.length === 0) return null;
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <select
        className={`${field} text-[13.5px]`}
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Copiar de…</option>
        {buildings.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!selected}
        onClick={() => selected && onApply(selected)}
        className="rounded-full border border-line bg-card px-4 py-2 text-[13px] font-semibold text-soft disabled:opacity-50"
      >
        Aplicar
      </button>
    </div>
  );
}

export function BuildingEditor({
  mode,
  buildingId,
  buildingName,
  initial,
  initialUpdatedAt,
  buildings,
}: {
  mode: "create" | "edit";
  buildingId?: string;
  buildingName?: string;
  initial: BuildingEditPayload;
  /**
   * `updatedAt` de quando esta página carregou — evita que salvar aqui
   * sobrescreva uma mudança feita por outra aba/sessão nesse meio-tempo (ex.:
   * duas abas abertas no mesmo prédio, uma delas com dado desatualizado).
   */
  initialUpdatedAt?: string;
  /** Todos os outros prédios já cadastrados — alimenta o "Copiar de" em cada seção. */
  buildings: BuildingOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(buildingName ?? "");
  const [form, setForm] = useState<BuildingEditPayload>(initial);

  function updateIntercom(i: number, patch: Partial<{ tower: string; code: string }>) {
    setForm((f) => ({
      ...f,
      location: {
        ...f.location,
        intercom: f.location.intercom.map((r, j) => (j === i ? { ...r, ...patch } : r)),
      },
    }));
  }
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function copyFrom(section: Section, sourceId: string) {
    const src = buildings.find((b) => b.id === sourceId);
    if (!src) return;
    setForm((f) => {
      switch (section) {
        case "rules":
          return { ...f, rules: rulesFromContent(src.rules) };
        case "home":
          return { ...f, home: homeFromContent(src.home) };
        case "checkin":
          return { ...f, checkin: checkinFromContent(src.checkinTemplate) };
        case "checkout":
          return { ...f, checkout: checkoutFromContent(src.checkoutTemplate) };
        case "amenities":
          return { ...f, amenities: amenitiesFromContent(src.amenities) };
        case "tourism":
          return { ...f, tourism: placesFromContent(src.tourism) };
        case "dining":
          return { ...f, dining: placesFromContent(src.dining) };
      }
    });
  }

  function copyPhotos(sourceId: string) {
    const src = buildings.find((b) => b.id === sourceId);
    if (!src) return;
    setForm((f) => ({
      ...f,
      defaultHeroImg: src.defaultHeroImg ?? f.defaultHeroImg,
      defaultFooterImg: src.defaultFooterImg ?? f.defaultFooterImg,
    }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createBuilding(name, form);
          router.push(`/admin/buildings/${created.id}/edit`);
        } else {
          await updateBuilding(buildingId!, form, initialUpdatedAt);
          router.push("/admin");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      }
    });
  }

  return (
    <div>
      <h1 className="font-display text-[30px] font-normal">
        {mode === "create" ? "Novo prédio" : "Editar prédio"}
      </h1>
      {mode === "create" ? (
        <label className={`${labelCls} mt-3`}>
          Nome do prédio
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex.: Blend Apartments"
          />
        </label>
      ) : (
        <p className="mt-1 text-[15px] text-soft">
          <b className="text-ink">{buildingName}</b>. Regras, A Casa, Lazer, guia da cidade e
          onde comer são compartilhados — mudar aqui atualiza todos os apartamentos deste
          prédio (menos o item que um apartamento tiver editado à mão). Check-in/check-out também.
        </p>
      )}

      <h2 className={sectionTitle}>Endereço e Google Maps</h2>
      <p className="mt-1 text-[13px] text-soft">
        Aparece como um cartão com mapa logo antes do check-in, em todos os apartamentos deste
        prédio (o apartamento pode ter um endereço próprio, que vale no lugar deste). Preencha
        o endereço para mostrar a prévia do mapa; o link é para onde o hóspede cai ao clicar.
      </p>
      <div className="mt-3 grid gap-3">
        <label className={labelCls}>
          Endereço completo
          <input
            className={field}
            value={form.location.address}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: { ...f.location, address: e.target.value } }))
            }
            placeholder="ex.: Rua Copaíba, 01 - Águas Claras, Brasília, DF"
          />
        </label>
        <label className={labelCls}>
          Link do Google Maps
          <input
            className={field}
            value={form.location.mapsUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, location: { ...f.location, mapsUrl: e.target.value } }))
            }
            placeholder="ex.: https://maps.app.goo.gl/..."
            inputMode="url"
          />
        </label>
      </div>

      <h2 className={sectionTitle}>Portaria</h2>
      <p className="mt-1 text-[13px] text-soft">
        Telefone da portaria e o código do interfone de cada torre (ex.: *1). Aparece nos
        contatos de todos os apartamentos; ao digitar a torre no apartamento, o código dela é
        preenchido sozinho (e pode ser trocado só naquele apartamento).
      </p>
      <div className="mt-3 grid gap-3">
        <label className={labelCls}>
          Telefone da portaria
          <input
            className={field}
            value={form.location.portariaPhone}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                location: { ...f.location, portariaPhone: formatPhoneBR(e.target.value) },
              }))
            }
            placeholder="+55 61 99290-9099"
            inputMode="tel"
          />
        </label>
        <div className="grid gap-2">
          <span className={labelCls}>Código do interfone por torre</span>
          {form.location.intercom.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={`${field} min-w-0 flex-1`}
                value={row.tower}
                onChange={(e) => updateIntercom(i, { tower: e.target.value })}
                placeholder="Torre C"
              />
              <input
                className={`${field} w-24`}
                value={row.code}
                onChange={(e) => updateIntercom(i, { code: e.target.value })}
                placeholder="*1"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    location: {
                      ...f.location,
                      intercom: f.location.intercom.filter((_, j) => j !== i),
                    },
                  }))
                }
                className="text-[13px] font-semibold text-terra"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                location: { ...f.location, intercom: [...f.location.intercom, { tower: "", code: "" }] },
              }))
            }
            className="self-start rounded-full border border-line bg-card px-4 py-2 text-[13px] font-semibold text-soft"
          >
            + Torre
          </button>
        </div>
      </div>

      <h2 className={sectionTitle}>Fotos padrão do modelo</h2>
      <p className="mt-1 text-[13px] text-soft">
        Sugestão de capa e despedida ao criar um apartamento novo neste prédio — cada
        apartamento guarda a própria foto depois, trocável a qualquer momento; mudar aqui não
        afeta apartamento já criado.
      </p>
      <div className="mt-3">
        <CopyFromSelector buildings={buildings} onApply={copyPhotos} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="text-[12.5px] font-semibold text-soft">Capa</span>
            <div className="mt-1">
              <MediaField
                value={form.defaultHeroImg}
                onChange={(defaultHeroImg) => setForm((f) => ({ ...f, defaultHeroImg }))}
              />
            </div>
          </div>
          <div>
            <span className="text-[12.5px] font-semibold text-soft">Despedida</span>
            <div className="mt-1">
              <MediaField
                value={form.defaultFooterImg}
                onChange={(defaultFooterImg) => setForm((f) => ({ ...f, defaultFooterImg }))}
              />
            </div>
          </div>
        </div>
      </div>

      <h2 className={sectionTitle}>Regras da Casa</h2>
      <p className="mt-1 text-[13px] text-soft">
        Regras gerais do condomínio (silêncio, lixo, garagem...). Cada apartamento ainda soma
        suas próprias regras específicas a estas.
      </p>
      <div className="mt-3">
        <CopyFromSelector buildings={buildings} onApply={(id) => copyFrom("rules", id)} />
        <RulesListEditor value={form.rules} onChange={(rules) => setForm((f) => ({ ...f, rules }))} />
      </div>

      <h2 className={sectionTitle}>A Casa</h2>
      <p className="mt-1 text-[13px] text-soft">
        Destaques do apartamento-modelo e equipamentos com instrução de uso (ex.: cafeteira).
      </p>
      <div className="mt-3">
        <CopyFromSelector buildings={buildings} onApply={(id) => copyFrom("home", id)} />
        <HomeEditor value={form.home} onChange={(home) => setForm((f) => ({ ...f, home }))} />
      </div>

      <h2 className={sectionTitle}>Check-in</h2>
      <div className="mt-3">
        <CopyFromSelector buildings={buildings} onApply={(id) => copyFrom("checkin", id)} />
        <CheckinCardsEditor
          value={form.checkin}
          onChange={(checkin) => setForm((f) => ({ ...f, checkin }))}
        />
      </div>

      <h2 className={sectionTitle}>Check-out</h2>
      <div className="mt-3">
        <CopyFromSelector buildings={buildings} onApply={(id) => copyFrom("checkout", id)} />
        <CheckoutStepsEditor
          value={form.checkout}
          onChange={(checkout) => setForm((f) => ({ ...f, checkout }))}
        />
      </div>

      <h2 className={sectionTitle}>Lazer</h2>
      <div className="mt-3">
        <CopyFromSelector buildings={buildings} onApply={(id) => copyFrom("amenities", id)} />
        <AmenityListEditor
          value={form.amenities}
          onChange={(amenities) => setForm((f) => ({ ...f, amenities }))}
        />
      </div>

      <h2 className={sectionTitle}>Guia da cidade</h2>
      <div className="mt-3">
        <CopyFromSelector buildings={buildings} onApply={(id) => copyFrom("tourism", id)} />
        <PlaceListEditor
          value={form.tourism}
          onChange={(tourism) => setForm((f) => ({ ...f, tourism }))}
        />
      </div>

      <h2 className={sectionTitle}>Onde Comer</h2>
      <div className="mt-3">
        <CopyFromSelector buildings={buildings} onApply={(id) => copyFrom("dining", id)} />
        <PlaceListEditor
          value={form.dining}
          onChange={(dining) => setForm((f) => ({ ...f, dining }))}
        />
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-3 text-[14px] text-terra">
          {error}
        </p>
      )}

      <button
        onClick={save}
        disabled={pending || (mode === "create" && !name.trim())}
        className="mt-7 w-full rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-bg disabled:opacity-60"
      >
        {pending ? "Salvando…" : mode === "create" ? "Criar prédio" : "Salvar"}
      </button>
    </div>
  );
}
