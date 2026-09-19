"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Guide from "@/components/Guide";
import {
  buildApartmentContent,
  overlayBuildingLiveContent,
  type ApartmentFormInput,
  type BuildingTemplate,
} from "@/data/buildApartmentContent";
import { slugify } from "@/lib/slug";
import { formatPhoneBR } from "@/lib/phone";
import {
  createApartmentDetailed,
  listHostCheckinVideos,
  updateApartmentDetailed,
  type ApartmentWizardPayload,
  type ReusableVideo,
} from "@/app/admin/actions";
import type { Apartment } from "@/data/types";
import {
  amenitiesFromContent,
  checkinFromContent,
  checkoutFromContent,
  homeFromContent,
  placesFromContent,
  rulesFromContent,
} from "@/data/sectionContent";
import {
  AmenityListEditor,
  CheckinCardsEditor,
  CheckoutStepsEditor,
  HomeEditor,
  MediaField,
  PlaceListEditor,
  RulesListEditor,
} from "@/app/admin/section-editors";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";
const sectionTitle = "mt-6 font-display text-[19px] font-normal";

type FormState = ApartmentFormInput & { slug: string; label: string };

const EMPTY: FormState = {
  building: "",
  unit: "",
  heroImg: "",
  footerImg: "",
  tower: "",
  floor: "",
  parking: "",
  maxGuests: "",
  checkinTime: "",
  checkoutTime: "",
  doorCodeMode: "per_stay",
  doorCode: "",
  wifiNetwork: "",
  wifiPassword: "",
  rulesText: "",
  smoking: "no",
  pets: "no",
  hostWhatsapp: "",
  coHostName: "",
  coHostWhatsapp: "",
  internalNotes: "",
  locationAddress: "",
  locationMapsUrl: "",
  homeVideo: "",
  overrides: {},
  slug: "",
  label: "",
};

/**
 * Campo de texto livre + lista clicável dos prédios já cadastrados (filtra
 * enquanto digita). Digitar um nome que não bate com nenhum da lista é
 * válido — cria um prédio novo. `<input list>`/`<datalist>` nativo tem
 * suporte inconsistente entre navegadores pra "clicar e já ver as opções",
 * por isso um combobox próprio aqui.
 */
function BuildingCombobox({
  value,
  onChange,
  buildings,
}: {
  value: string;
  onChange: (v: string) => void;
  buildings: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const filtered = query
    ? buildings.filter((b) => b.name.toLowerCase().includes(query))
    : buildings;

  return (
    <div className="relative">
      <input
        className={field}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="ex.: DF Plaza Shopping"
        autoComplete="off"
      />
      {open && buildings.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-line bg-card shadow-[0_6px_20px_rgb(59_45_36/0.14)]">
          {filtered.length > 0 ? (
            filtered.map((b) => (
              <button
                key={b.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(b.name);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[14px] text-ink hover:bg-blush"
              >
                {b.name}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-[13px] text-soft">
              Nenhum prédio com esse nome — será criado um novo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type OverridableSection = "rules" | "home" | "amenities" | "tourism" | "dining";

const sectionLabel: Record<OverridableSection, string> = {
  rules: "Regras",
  home: "A Casa",
  amenities: "Lazer",
  tourism: "Guia de Brasília",
  dining: "Onde Comer",
};

function SectionOverrideBlock({
  section,
  active,
  summary,
  onEnable,
  onDisable,
  children,
}: {
  section: OverridableSection;
  active: boolean;
  summary: string;
  onEnable: () => void;
  onDisable: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className={sectionTitle}>{sectionLabel[section]}</h2>
      {!active ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line p-3">
          <span className="text-[14px] text-soft">{summary}</span>
          <button
            type="button"
            onClick={onEnable}
            className="whitespace-nowrap text-[13.5px] font-semibold text-terra underline underline-offset-2"
          >
            Personalizar para este apartamento
          </button>
        </div>
      ) : (
        <div className="mt-3">
          {children}
          <button
            type="button"
            onClick={onDisable}
            className="mt-3 text-[13px] font-semibold text-soft underline underline-offset-2"
          >
            ‹ Voltar a herdar do prédio
          </button>
        </div>
      )}
    </>
  );
}

type BuildingOption = {
  id: string;
  name: string;
  defaultHeroImg: string | null;
  defaultFooterImg: string | null;
} & BuildingTemplate;

export function ApartmentWizard({
  hostId,
  hostName,
  mode,
  apartmentId,
  initial,
  existingContent,
  buildings,
}: {
  hostId: string;
  hostName: string;
  mode: "create" | "edit";
  apartmentId?: string;
  initial?: FormState;
  existingContent?: Apartment;
  buildings: BuildingOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (!slugTouched && (key === "building" || key === "unit")) {
        next.slug = [slugify(next.building), slugify(next.unit)].filter(Boolean).join("-");
      }
      if (key === "unit" && !f.label) next.label = value ? `Ap ${String(value).toUpperCase()}` : "";
      // Prédio escolhido pela primeira vez: sugere a capa/despedida padrão
      // dele, só quando a pessoa ainda não escolheu foto própria.
      if (key === "building") {
        const b = buildings.find(
          (x) => x.name.trim().toLowerCase() === String(value).trim().toLowerCase(),
        );
        if (b?.defaultHeroImg && !f.heroImg) next.heroImg = b.defaultHeroImg;
        if (b?.defaultFooterImg && !f.footerImg) next.footerImg = b.defaultFooterImg;
      }
      return next;
    });
  }

  const matchedBuilding = useMemo(
    () => buildings.find((b) => b.name.trim().toLowerCase() === form.building.trim().toLowerCase()),
    [buildings, form.building],
  );

  // Vídeos de check-in já enviados por este anfitrião (do modelo do prédio ou
  // de outro apartamento dele) — pra reaproveitar sem subir arquivo de novo.
  const [reuseVideos, setReuseVideos] = useState<ReusableVideo[]>([]);
  useEffect(() => {
    let cancelled = false;
    listHostCheckinVideos(hostId, matchedBuilding?.id, apartmentId)
      .then((v) => {
        if (!cancelled) setReuseVideos(v);
      })
      .catch(() => {
        if (!cancelled) setReuseVideos([]);
      });
    return () => {
      cancelled = true;
    };
  }, [hostId, matchedBuilding?.id, apartmentId]);

  const preview = useMemo<Apartment>(() => {
    const content = buildApartmentContent(form, hostName, existingContent, matchedBuilding);
    return matchedBuilding
      ? overlayBuildingLiveContent(content, matchedBuilding, form.overrides)
      : content;
  }, [form, hostName, existingContent, matchedBuilding]);

  function enableOverride(section: OverridableSection) {
    setForm((f) => {
      const overrides = { ...f.overrides, [section]: true };
      switch (section) {
        case "rules":
          return { ...f, overrides, overrideRules: rulesFromContent(preview.rules) };
        case "home":
          return { ...f, overrides, overrideHome: homeFromContent(preview.home) };
        case "amenities":
          return { ...f, overrides, overrideAmenities: amenitiesFromContent(preview.amenities) };
        case "tourism":
          return { ...f, overrides, overrideTourism: placesFromContent(preview.tourism) };
        case "dining":
          return { ...f, overrides, overrideDining: placesFromContent(preview.dining) };
      }
    });
  }
  function disableOverride(section: OverridableSection) {
    setForm((f) => {
      const overrides = { ...f.overrides, [section]: false };
      switch (section) {
        case "rules":
          return { ...f, overrides, overrideRules: undefined };
        case "home":
          return { ...f, overrides, overrideHome: undefined };
        case "amenities":
          return { ...f, overrides, overrideAmenities: undefined };
        case "tourism":
          return { ...f, overrides, overrideTourism: undefined };
        case "dining":
          return { ...f, overrides, overrideDining: undefined };
      }
    });
  }

  function toggleCheckinEdit() {
    setForm((f) =>
      f.checkinOverride
        ? { ...f, checkinOverride: undefined }
        : { ...f, checkinOverride: checkinFromContent(preview.checkin) },
    );
  }
  function toggleCheckoutEdit() {
    setForm((f) =>
      f.checkoutOverride
        ? { ...f, checkoutOverride: undefined }
        : preview.checkout
          ? { ...f, checkoutOverride: checkoutFromContent(preview.checkout) }
          : f,
    );
  }

  function confirm() {
    setError(null);
    const payload: ApartmentWizardPayload = form;
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createApartmentDetailed(hostId, payload);
        } else {
          await updateApartmentDetailed(apartmentId!, payload);
        }
        router.push("/admin");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      }
    });
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-bg">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-bg/95 px-5 py-3 backdrop-blur">
          <button
            onClick={() => setStep(1)}
            className="text-[14px] font-semibold text-soft"
          >
            ‹ Voltar e editar
          </button>
          <span className="ml-auto max-w-[45%] truncate text-[13.5px] text-soft">
            {form.slug || "—"}.anfyi.com.br
          </span>
          <button
            onClick={confirm}
            disabled={pending}
            className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-bold text-bg disabled:opacity-60"
          >
            {pending
              ? "Salvando…"
              : mode === "create"
                ? "Confirmar e criar"
                : "Confirmar alterações"}
          </button>
        </div>
        {error && (
          <p className="mx-5 mt-3 rounded-xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-3 text-[14px] text-terra">
            {error}
          </p>
        )}
        <Guide apartment={preview} stay={null} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[30px] font-normal">
        {mode === "create" ? "Novo apartamento" : "Editar apartamento"}
      </h1>
      <p className="mt-1 text-[15px] text-soft">
        Anfitrião: <b className="text-ink">{hostName}</b>. Preencha o essencial — dá para
        ajustar depois.
      </p>

      <h2 className={sectionTitle}>Identificação</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          Edifício
          <BuildingCombobox
            value={form.building}
            onChange={(v) => set("building", v)}
            buildings={buildings}
          />
          {form.building.trim() && (
            <span className="text-[12.5px] text-soft">
              {matchedBuilding
                ? "✓ prédio já cadastrado — Lazer, guia da cidade e onde comer vêm dele"
                : "Prédio novo — você cadastra o Lazer dele depois em \"Editar prédio\""}
            </span>
          )}
        </label>
        <label className={labelCls}>
          Número do apartamento
          <input
            className={field}
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="ex.: 1305"
          />
        </label>
        <label className={labelCls}>
          Torre / bloco
          <input
            className={field}
            value={form.tower}
            onChange={(e) => set("tower", e.target.value)}
            placeholder="ex.: Torre C"
          />
        </label>
        <label className={labelCls}>
          Andar
          <input
            className={field}
            value={form.floor}
            onChange={(e) => set("floor", e.target.value)}
            placeholder="ex.: 13º andar"
          />
        </label>
        <label className={labelCls}>
          Vaga(s) na garagem
          <input
            className={field}
            value={form.parking}
            onChange={(e) => set("parking", e.target.value)}
            placeholder="ex.: Vaga 269, subsolo -3"
          />
        </label>
        <label className={labelCls}>
          Nº máximo de hóspedes
          <input
            type="number"
            min={1}
            className={field}
            value={form.maxGuests}
            onChange={(e) => set("maxGuests", e.target.value)}
            placeholder="ex.: 4"
          />
        </label>
        <label className={labelCls}>
          Rótulo interno
          <input
            className={field}
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="ex.: Ap 1305C · DF Plaza"
          />
        </label>
        <label className={labelCls}>
          Link do guia
          <div className="flex items-center gap-1">
            <input
              className={`${field} flex-1`}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
            />
            <span className="whitespace-nowrap text-[13px] text-soft">.anfyi.com.br</span>
          </div>
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <span className={labelCls}>Foto de capa</span>
          <div className="mt-1">
            <MediaField value={form.heroImg} onChange={(v) => set("heroImg", v)} />
          </div>
        </div>
        <div>
          <span className={labelCls}>Foto de despedida</span>
          <div className="mt-1">
            <MediaField value={form.footerImg} onChange={(v) => set("footerImg", v)} />
          </div>
        </div>
      </div>

      <h2 className={sectionTitle}>Endereço e Google Maps</h2>
      <p className="mt-1 text-[13px] text-soft">
        {matchedBuilding?.location?.address || matchedBuilding?.location?.mapsUrl
          ? "Em branco, este apartamento usa o endereço do prédio (mostrado abaixo). Preencha só se este apartamento tiver um endereço diferente."
          : "Aparece como um cartão com mapa logo antes do check-in. Você também pode cadastrar isso uma vez só no prédio, e todos os apartamentos dele herdam."}
      </p>
      <div className="mt-3 grid gap-3">
        <label className={labelCls}>
          Endereço completo
          <input
            className={field}
            value={form.locationAddress}
            onChange={(e) => set("locationAddress", e.target.value)}
            placeholder={matchedBuilding?.location?.address || "ex.: Rua Copaíba, 01 - Águas Claras, Brasília, DF"}
          />
        </label>
        <label className={labelCls}>
          Link do Google Maps
          <input
            className={field}
            value={form.locationMapsUrl}
            onChange={(e) => set("locationMapsUrl", e.target.value)}
            placeholder={matchedBuilding?.location?.mapsUrl || "ex.: https://maps.app.goo.gl/..."}
            inputMode="url"
          />
        </label>
      </div>

      <h2 className={sectionTitle}>Check-in e fechadura</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          Check-in (horário)
          <input
            className={field}
            value={form.checkinTime}
            onChange={(e) => set("checkinTime", e.target.value)}
            placeholder="ex.: A partir das 15h"
          />
        </label>
        <label className={labelCls}>
          Check-out (horário)
          <input
            className={field}
            value={form.checkoutTime}
            onChange={(e) => set("checkoutTime", e.target.value)}
            placeholder="ex.: Até as 11h"
          />
        </label>
        <label className={labelCls}>
          Senha da fechadura
          <select
            className={field}
            value={form.doorCodeMode}
            onChange={(e) => set("doorCodeMode", e.target.value as "fixed" | "per_stay")}
          >
            <option value="per_stay">Por hóspede (gerada a cada reserva)</option>
            <option value="fixed">Fixa do apartamento</option>
          </select>
        </label>
        {form.doorCodeMode === "fixed" && (
          <label className={labelCls}>
            Senha fixa
            <input
              className={field}
              value={form.doorCode}
              onChange={(e) => set("doorCode", e.target.value)}
              placeholder="ex.: 4517#"
            />
          </label>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line p-3">
        <span className="text-[14px] text-soft">
          {form.checkinOverride
            ? "Editando o passo a passo de check-in manualmente."
            : `Passo a passo de check-in: ${preview.checkin.cards.length} cartão(ões), gerado a partir do prédio.`}
        </span>
        <button
          type="button"
          onClick={toggleCheckinEdit}
          className="whitespace-nowrap text-[13.5px] font-semibold text-terra underline underline-offset-2"
        >
          {form.checkinOverride ? "Descartar edição" : "Ajustar check-in manualmente"}
        </button>
      </div>
      {form.checkinOverride && (
        <div className="mt-3">
          <CheckinCardsEditor
            value={form.checkinOverride}
            onChange={(v) => set("checkinOverride", v)}
            reuseOptions={reuseVideos}
          />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line p-3">
        <span className="text-[14px] text-soft">
          {form.checkoutOverride
            ? "Editando o passo a passo de check-out manualmente."
            : `Passo a passo de check-out: ${preview.checkout?.steps.length ?? 0} passo(s), gerado a partir do prédio.`}
        </span>
        <button
          type="button"
          onClick={toggleCheckoutEdit}
          className="whitespace-nowrap text-[13.5px] font-semibold text-terra underline underline-offset-2"
        >
          {form.checkoutOverride ? "Descartar edição" : "Ajustar check-out manualmente"}
        </button>
      </div>
      {form.checkoutOverride && (
        <div className="mt-3">
          <CheckoutStepsEditor
            value={form.checkoutOverride}
            onChange={(v) => set("checkoutOverride", v)}
          />
        </div>
      )}

      <h2 className={sectionTitle}>Wi-Fi</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          Nome da rede
          <input
            className={field}
            value={form.wifiNetwork}
            onChange={(e) => set("wifiNetwork", e.target.value)}
            placeholder="ex.: DF_Plaza_1305C"
          />
        </label>
        <label className={labelCls}>
          Senha do Wi-Fi
          <input
            className={field}
            value={form.wifiPassword}
            onChange={(e) => set("wifiPassword", e.target.value)}
            placeholder="ex.: casa1305plaza"
          />
        </label>
      </div>

      <h2 className={sectionTitle}>Regras</h2>
      <div className="mt-3 grid gap-3">
        <label className={labelCls}>
          Regras específicas deste apartamento (uma por linha)
          <textarea
            rows={4}
            className={field}
            value={form.rulesText}
            onChange={(e) => set("rulesText", e.target.value)}
            placeholder={"Não mexer no quadro de energia da área de serviço"}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>
            Fumo
            <select
              className={field}
              value={form.smoking}
              onChange={(e) => set("smoking", e.target.value as "yes" | "no" | "balcony")}
            >
              <option value="no">Proibido</option>
              <option value="balcony">Permitido somente na varanda</option>
              <option value="yes">Permitido</option>
            </select>
          </label>
          <label className={labelCls}>
            Animais
            <select
              className={field}
              value={form.pets}
              onChange={(e) => set("pets", e.target.value as "yes" | "no")}
            >
              <option value="no">Não permitido</option>
              <option value="yes">Permitido</option>
            </select>
          </label>
        </div>
      </div>
      <SectionOverrideBlock
        section="rules"
        active={!!form.overrides.rules}
        summary={`Lista completa de regras: ${preview.rules.items.length} itens (prédio + as acima).`}
        onEnable={() => enableOverride("rules")}
        onDisable={() => disableOverride("rules")}
      >
        {form.overrideRules && (
          <RulesListEditor
            value={form.overrideRules}
            onChange={(v) => set("overrideRules", v)}
          />
        )}
      </SectionOverrideBlock>

      <SectionOverrideBlock
        section="home"
        active={!!form.overrides.home}
        summary={`Herdado do prédio: ${preview.home.slides.length} destaque(s), ${preview.home.accordions.length} equipamento(s) com manual.`}
        onEnable={() => enableOverride("home")}
        onDisable={() => disableOverride("home")}
      >
        {form.overrideHome && (
          <HomeEditor value={form.overrideHome} onChange={(v) => set("overrideHome", v)} />
        )}
      </SectionOverrideBlock>

      <div className="mt-3 rounded-xl border border-line p-3">
        <span className="text-[13.5px] font-semibold text-ink">
          Vídeo deste apartamento (topo de A Casa)
        </span>
        <p className="mt-0.5 text-[12.5px] text-soft">
          Tour mostrando o apartamento inteiro — é a primeira coisa que o hóspede vê em A Casa.
          {preview.home.video && !form.homeVideo
            ? " Em branco, usa o vídeo do prédio (já cadastrado)."
            : " Em branco, usa o vídeo do prédio, se houver."}{" "}
          Não desliga o resto de A Casa que vem do prédio.
        </p>
        <div className="mt-2">
          <MediaField
            videoOnly
            value={form.homeVideo}
            onChange={(v) => set("homeVideo", v)}
          />
          {form.homeVideo && (
            <button
              type="button"
              onClick={() => set("homeVideo", "")}
              className="mt-1.5 text-[13px] font-semibold text-terra"
            >
              Remover vídeo
            </button>
          )}
        </div>
      </div>

      <SectionOverrideBlock
        section="amenities"
        active={!!form.overrides.amenities}
        summary={`Herdado do prédio: ${preview.amenities.items.length} itens de lazer.`}
        onEnable={() => enableOverride("amenities")}
        onDisable={() => disableOverride("amenities")}
      >
        {form.overrideAmenities && (
          <AmenityListEditor
            value={form.overrideAmenities}
            onChange={(v) => set("overrideAmenities", v)}
          />
        )}
      </SectionOverrideBlock>

      <SectionOverrideBlock
        section="tourism"
        active={!!form.overrides.tourism}
        summary={`Herdado do prédio: ${preview.tourism.items.length} pontos turísticos.`}
        onEnable={() => enableOverride("tourism")}
        onDisable={() => disableOverride("tourism")}
      >
        {form.overrideTourism && (
          <PlaceListEditor
            value={form.overrideTourism}
            onChange={(v) => set("overrideTourism", v)}
          />
        )}
      </SectionOverrideBlock>

      <SectionOverrideBlock
        section="dining"
        active={!!form.overrides.dining}
        summary={`Herdado do prédio: ${preview.dining.items.length} restaurantes.`}
        onEnable={() => enableOverride("dining")}
        onDisable={() => disableOverride("dining")}
      >
        {form.overrideDining && (
          <PlaceListEditor
            value={form.overrideDining}
            onChange={(v) => set("overrideDining", v)}
          />
        )}
      </SectionOverrideBlock>

      <h2 className={sectionTitle}>Contatos</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          WhatsApp do anfitrião
          <input
            className={field}
            value={form.hostWhatsapp}
            onChange={(e) => set("hostWhatsapp", formatPhoneBR(e.target.value))}
            placeholder="+55 61 99999-9999"
          />
        </label>
        <div />
        <label className={labelCls}>
          Coanfitrião / gestor (nome)
          <input
            className={field}
            value={form.coHostName}
            onChange={(e) => set("coHostName", e.target.value)}
            placeholder="ex.: Marcos"
          />
        </label>
        <label className={labelCls}>
          Coanfitrião / gestor (WhatsApp)
          <input
            className={field}
            value={form.coHostWhatsapp}
            onChange={(e) => set("coHostWhatsapp", formatPhoneBR(e.target.value))}
            placeholder="+55 61 98888-8888"
          />
        </label>
      </div>

      <h2 className={sectionTitle}>Notas internas</h2>
      <p className="mt-1 text-[13px] text-soft">
        Só o superadmin e o anfitrião veem isso — nunca aparece no guia do hóspede.
      </p>
      <label className={`${labelCls} mt-3`}>
        Observações do apartamento / item com defeito ou em reparo
        <textarea
          rows={3}
          className={field}
          value={form.internalNotes}
          onChange={(e) => set("internalNotes", e.target.value)}
          placeholder={"A janela do quarto 2 emperra\nVentilador da varanda em manutenção"}
        />
      </label>

      <button
        onClick={() => setStep(2)}
        disabled={!form.building || !form.unit || !form.slug}
        className="mt-7 w-full rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-bg disabled:opacity-50"
      >
        Ver prévia →
      </button>
    </div>
  );
}
