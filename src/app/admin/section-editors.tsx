"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { isVideoUrl, uploadMedia } from "@/lib/upload";
import type { ReusableVideo } from "@/app/admin/actions";
import {
  emptyAccordion,
  emptyAlert,
  emptyAmenity,
  emptyCard,
  emptyPlace,
  emptyRule,
  emptySlide,
  emptyStep,
  type AlertInput,
  type AmenitiesValue,
  type CheckinCardInput,
  type CheckinValue,
  type CheckoutValue,
  type HomeValue,
  type PlacesValue,
  type RulesValue,
  type StepInput,
} from "@/data/sectionContent";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";
const rowCls = "grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2";
const nestedRowCls = "grid gap-2 rounded-lg border border-dashed border-line bg-bg p-2.5 sm:grid-cols-2";
const removeCls = "text-[13px] font-semibold text-terra";
const addCls =
  "justify-self-start text-[13.5px] font-semibold text-terra underline underline-offset-2";

function updateAt<T>(arr: T[], i: number, patch: Partial<T>): T[] {
  return arr.map((x, j) => (j === i ? { ...x, ...patch } : x));
}
function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, j) => j !== i);
}

/** Seletor "reaproveitar vídeo já enviado" — só copia a URL, sem subir arquivo. */
function ReuseVideoSelect({
  options,
  onPick,
}: {
  options: ReusableVideo[];
  onPick: (v: ReusableVideo) => void;
}) {
  return (
    <select
      className="mt-1.5 max-w-full rounded-full border border-line bg-bg px-2.5 py-1 text-[12px] text-soft"
      value=""
      onChange={(e) => {
        const found = options.find((o) => o.key === e.target.value);
        if (found) onPick(found);
      }}
    >
      <option value="">Reaproveitar vídeo já enviado…</option>
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.source}
        </option>
      ))}
    </select>
  );
}

/** Miniatura + botão de upload — usado em todo campo de foto/vídeo dos editores abaixo. */
export function MediaField({
  value,
  onChange,
  reuseOptions,
  onReuse,
  videoOnly,
}: {
  value: string;
  onChange: (url: string) => void;
  /** Campo só de vídeo (ex.: tour de A Casa): não oferece foto. */
  videoOnly?: boolean;
  /** Vídeos já enviados (do modelo do prédio ou de outro apartamento) que dá pra reaproveitar sem duplicar espaço. */
  reuseOptions?: ReusableVideo[];
  /** Reaproveitar copia mais do que a URL (ex.: a legenda do botão) — sem isso cai no `onChange(url)` padrão. */
  onReuse?: (v: ReusableVideo) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const video = value && isVideoUrl(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      onChange(await uploadMedia(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-bg">
        {value ? (
          video ? (
            <span className="flex h-full w-full items-center justify-center text-[22px]">🎬</span>
          ) : (
            <Image src={value} alt="" fill sizes="56px" className="object-cover" />
          )
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[18px]">🖼️</span>
        )}
      </div>
      <div className="min-w-0">
        <label className="inline-block cursor-pointer rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-semibold text-soft">
          {pending
            ? "Enviando…"
            : videoOnly
              ? value
                ? "Trocar vídeo"
                : "Enviar vídeo"
              : value
                ? "Trocar foto/vídeo"
                : "Enviar foto ou vídeo"}
          <input
            ref={inputRef}
            type="file"
            accept={videoOnly ? "video/*" : "image/*,video/*"}
            className="hidden"
            disabled={pending}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {error && <p className="mt-1 text-[12px] text-terra">{error}</p>}
        {reuseOptions && reuseOptions.length > 0 && (
          <div>
            <ReuseVideoSelect
              options={reuseOptions}
              onPick={(v) => (onReuse ? onReuse(v) : onChange(v.src))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Marcadores trocados pelos dados da unidade — mostrado perto de check-in/check-out. */
export function TokenHint() {
  return (
    <p className="mt-1 text-[12.5px] text-soft">
      Use <code className="text-ink">{"{{TORRE}}"}</code>,{" "}
      <code className="text-ink">{"{{ANDAR}}"}</code>,{" "}
      <code className="text-ink">{"{{UNIDADE}}"}</code>,{" "}
      <code className="text-ink">{"{{VAGA}}"}</code> e{" "}
      <code className="text-ink">{"{{CHECKOUT_HORA}}"}</code> no texto — são trocados
      automaticamente pelos dados de cada apartamento. Aceita <code className="text-ink">&lt;strong&gt;</code>.
    </p>
  );
}

function StepListEditor({
  steps,
  onChange,
}: {
  steps: StepInput[];
  onChange: (steps: StepInput[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:col-span-2">
      <span className="text-[12.5px] font-semibold text-soft">Passos</span>
      {steps.map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            className={`${field} w-14 shrink-0 text-center`}
            value={s.n}
            onChange={(e) => onChange(updateAt(steps, i, { n: e.target.value }))}
          />
          <textarea
            rows={2}
            className={`${field} flex-1`}
            value={s.body}
            onChange={(e) => onChange(updateAt(steps, i, { body: e.target.value }))}
          />
          <button
            type="button"
            className={removeCls}
            onClick={() => onChange(removeAt(steps, i))}
          >
            Remover
          </button>
        </div>
      ))}
      <button
        type="button"
        className={addCls}
        onClick={() => onChange([...steps, emptyStep()])}
      >
        + Passo
      </button>
    </div>
  );
}

export function RulesListEditor({
  lockShared,
  value,
  onChange,
}: {
  /** Apartamento seguindo o modelo do prédio: texto de apoio e vídeo de A Casa vêm do prédio. */
  lockShared?: boolean;
  value: RulesValue;
  onChange: (v: RulesValue) => void;
}) {
  return (
    <div>
      {!lockShared && (
        <label className={labelCls}>
        Texto de apoio
        <input
          className={field}
          value={value.sub}
          placeholder="ex.: Combinações simples para a boa convivência no prédio."
          onChange={(e) => onChange({ ...value, sub: e.target.value })}
        />
      </label>
      )}
      <div className="mt-3 grid gap-2">
        {value.items.map((r, i) => (
          <div key={i} className={rowCls}>
            <label className={labelCls}>
              Emoji
              <input
                className={field}
                value={r.icon}
                placeholder="🤫"
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { icon: e.target.value }) })
                }
              />
            </label>
            <label className={labelCls}>
              Título
              <input
                className={field}
                value={r.title}
                placeholder="ex.: Lei do silêncio · 22h às 08h"
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { title: e.target.value }) })
                }
              />
            </label>
            <label className={`${labelCls} sm:col-span-2`}>
              Texto
              <input
                className={field}
                value={r.text}
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { text: e.target.value }) })
                }
              />
            </label>
            <div className="flex items-center justify-between sm:col-span-2">
              <label className="flex items-center gap-2 text-[13px] text-soft">
                <input
                  type="checkbox"
                  checked={r.hot}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      items: updateAt(value.items, i, { hot: e.target.checked }),
                    })
                  }
                />
                Destaque (vermelho)
              </label>
              <button
                type="button"
                className={removeCls}
                onClick={() => onChange({ ...value, items: removeAt(value.items, i) })}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className={addCls}
          onClick={() => onChange({ ...value, items: [...value.items, emptyRule()] })}
        >
          + Regra
        </button>
      </div>
    </div>
  );
}

export function AmenityListEditor({
  lockShared,
  value,
  onChange,
}: {
  /** Apartamento seguindo o modelo do prédio: texto de apoio e vídeo de A Casa vêm do prédio. */
  lockShared?: boolean;
  value: AmenitiesValue;
  onChange: (v: AmenitiesValue) => void;
}) {
  return (
    <div>
      {!lockShared && (
        <label className={labelCls}>
        Texto de apoio
        <input
          className={field}
          value={value.sub}
          placeholder="ex.: Tudo no Andar M (Mezanino), é só descer de elevador."
          onChange={(e) => onChange({ ...value, sub: e.target.value })}
        />
      </label>
      )}
      <div className="mt-3 grid gap-2">
        {value.items.map((a, i) => (
          <div key={i} className={rowCls}>
            <div className="sm:col-span-2">
              <MediaField
                value={a.img}
                onChange={(img) => onChange({ ...value, items: updateAt(value.items, i, { img }) })}
              />
            </div>
            <label className={labelCls}>
              Título
              <input
                className={field}
                value={a.title}
                placeholder="ex.: Piscina infinita · 25 m"
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { title: e.target.value }) })
                }
              />
            </label>
            <label className={labelCls}>
              Texto
              <input
                className={field}
                value={a.text}
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { text: e.target.value }) })
                }
              />
            </label>
            <div className="flex items-center justify-between sm:col-span-2">
              <label className="flex items-center gap-2 text-[13px] text-soft">
                <input
                  type="checkbox"
                  checked={a.wide}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      items: updateAt(value.items, i, { wide: e.target.checked }),
                    })
                  }
                />
                Card largo (destaque)
              </label>
              <button
                type="button"
                className={removeCls}
                onClick={() => onChange({ ...value, items: removeAt(value.items, i) })}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className={addCls}
          onClick={() => onChange({ ...value, items: [...value.items, emptyAmenity()] })}
        >
          + Item de lazer
        </button>
      </div>
    </div>
  );
}

export function PlaceListEditor({
  lockShared,
  value,
  onChange,
}: {
  /** Apartamento seguindo o modelo do prédio: texto de apoio e vídeo de A Casa vêm do prédio. */
  lockShared?: boolean;
  value: PlacesValue;
  onChange: (v: PlacesValue) => void;
}) {
  return (
    <div>
      {!lockShared && (
        <label className={labelCls}>
        Texto de apoio
        <input className={field} value={value.sub} onChange={(e) => onChange({ ...value, sub: e.target.value })} />
      </label>
      )}
      <div className="mt-3 grid gap-2">
        {value.items.map((p, i) => (
          <div key={i} className={rowCls}>
            <div className="sm:col-span-2">
              <MediaField
                value={p.img}
                onChange={(img) => onChange({ ...value, items: updateAt(value.items, i, { img }) })}
              />
            </div>
            <label className={labelCls}>
              Nome
              <input
                className={field}
                value={p.title}
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { title: e.target.value }) })
                }
              />
            </label>
            <label className={labelCls}>
              Categoria
              <input
                className={field}
                value={p.meta}
                placeholder="ex.: Arquitetura"
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { meta: e.target.value }) })
                }
              />
            </label>
            <label className={`${labelCls} sm:col-span-2`}>
              Texto
              <input
                className={field}
                value={p.text}
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { text: e.target.value }) })
                }
              />
            </label>
            <label className={labelCls}>
              Site (opcional)
              <input
                className={field}
                value={p.site}
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { site: e.target.value }) })
                }
              />
            </label>
            <label className={labelCls}>
              Endereço p/ mapa (opcional)
              <input
                className={field}
                value={p.maps}
                onChange={(e) =>
                  onChange({ ...value, items: updateAt(value.items, i, { maps: e.target.value }) })
                }
              />
            </label>
            <button
              type="button"
              className={`${removeCls} justify-self-start sm:col-span-2`}
              onClick={() => onChange({ ...value, items: removeAt(value.items, i) })}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addCls}
          onClick={() => onChange({ ...value, items: [...value.items, emptyPlace()] })}
        >
          + Item
        </button>
      </div>
    </div>
  );
}

export function HomeEditor({
  lockShared,
  value,
  onChange,
}: {
  /** Apartamento seguindo o modelo do prédio: texto de apoio e vídeo de A Casa vêm do prédio. */
  lockShared?: boolean;
  value: HomeValue;
  onChange: (v: HomeValue) => void;
}) {
  return (
    <div>
      {!lockShared && (
        <label className={labelCls}>
        Texto de apoio
        <input className={field} value={value.sub} onChange={(e) => onChange({ ...value, sub: e.target.value })} />
      </label>
      )}

      {!lockShared && (
        <>
      <p className="mt-4 text-[13px] font-semibold text-soft">
        Vídeo de apresentação (opcional)
      </p>
      <p className="mt-0.5 text-[12.5px] text-soft">
        Aparece sempre como a primeira coisa de A Casa, antes dos destaques — ideal pra um tour
        mostrando o apartamento inteiro.
      </p>
      <div className="mt-2">
        <MediaField
          videoOnly
          value={value.video ?? ""}
          onChange={(video) => onChange({ ...value, video })}
        />
        {value.video && (
          <button
            type="button"
            className={`${removeCls} mt-1.5`}
            onClick={() => onChange({ ...value, video: "" })}
          >
            Remover vídeo
          </button>
        )}
      </div>

        </>
      )}

      <p className="mt-4 text-[13px] font-semibold text-soft">Destaques (fotos)</p>
      <div className="mt-2 grid gap-2">
        {value.slides.map((s, i) => (
          <div key={i} className={rowCls}>
            <div className="sm:col-span-2">
              <MediaField
                value={s.img}
                onChange={(img) => onChange({ ...value, slides: updateAt(value.slides, i, { img }) })}
              />
            </div>
            <label className={labelCls}>
              Título
              <input
                className={field}
                value={s.title}
                placeholder="ex.: Quarto premium"
                onChange={(e) =>
                  onChange({ ...value, slides: updateAt(value.slides, i, { title: e.target.value }) })
                }
              />
            </label>
            <label className={labelCls}>
              Texto
              <input
                className={field}
                value={s.text}
                onChange={(e) =>
                  onChange({ ...value, slides: updateAt(value.slides, i, { text: e.target.value }) })
                }
              />
            </label>
            <button
              type="button"
              className={`${removeCls} justify-self-start sm:col-span-2`}
              onClick={() => onChange({ ...value, slides: removeAt(value.slides, i) })}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addCls}
          onClick={() => onChange({ ...value, slides: [...value.slides, emptySlide()] })}
        >
          + Destaque
        </button>
      </div>

      <p className="mt-4 text-[13px] font-semibold text-soft">
        Equipamentos com instruções de uso
      </p>
      <div className="mt-2 grid gap-2">
        {value.accordions.map((a, i) => (
          <div key={i} className={`${rowCls} bg-card`}>
            <label className={labelCls}>
              Emoji
              <input
                className={field}
                value={a.icon}
                placeholder="☕"
                onChange={(e) =>
                  onChange({
                    ...value,
                    accordions: updateAt(value.accordions, i, { icon: e.target.value }),
                  })
                }
              />
            </label>
            <label className={labelCls}>
              Título
              <input
                className={field}
                value={a.title}
                placeholder="ex.: Cafeteira elétrica"
                onChange={(e) =>
                  onChange({
                    ...value,
                    accordions: updateAt(value.accordions, i, { title: e.target.value }),
                  })
                }
              />
            </label>
            <div className="sm:col-span-2">
              <span className="text-[12.5px] font-semibold text-soft">
                Foto ou vídeo do equipamento (opcional)
              </span>
              <p className="mt-0.5 text-[12px] text-soft">
                Aparece dentro do equipamento, antes dos passos — ex.: um vídeo mostrando como usar.
              </p>
              <div className="mt-1">
                <MediaField
                  value={a.media ?? ""}
                  onChange={(media) =>
                    onChange({ ...value, accordions: updateAt(value.accordions, i, { media }) })
                  }
                />
                {a.media && (
                  <button
                    type="button"
                    className={`${removeCls} mt-1.5`}
                    onClick={() =>
                      onChange({ ...value, accordions: updateAt(value.accordions, i, { media: "" }) })
                    }
                  >
                    Remover foto/vídeo
                  </button>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <StepListEditor
                steps={a.steps}
                onChange={(steps) =>
                  onChange({ ...value, accordions: updateAt(value.accordions, i, { steps }) })
                }
              />
            </div>
            {a.diagram && (
              <div className="sm:col-span-2">
                <span className="text-[12.5px] font-semibold text-soft">Foto do diagrama</span>
                <div className="mt-1">
                  <MediaField
                    value={a.diagram.img}
                    onChange={(img) =>
                      onChange({
                        ...value,
                        accordions: updateAt(value.accordions, i, {
                          diagram: { ...a.diagram!, img },
                        }),
                      })
                    }
                  />
                </div>
                <p className="mt-3 text-[12.5px] font-semibold text-soft">
                  Itens numerados ao lado da foto
                </p>
                <p className="mt-0.5 text-[12px] text-soft">
                  O número é o que aparece na foto; edite, remova ou acrescente itens à vontade.
                </p>
                <div className="mt-1.5 grid gap-1.5">
                  {a.diagram.legend.map((it, li) => (
                    <div key={li} className="flex items-center gap-2">
                      <input
                        className={`${field} w-14 shrink-0 text-center`}
                        value={it.n}
                        aria-label="Número do item"
                        onChange={(e) =>
                          onChange({
                            ...value,
                            accordions: updateAt(value.accordions, i, {
                              diagram: {
                                ...a.diagram!,
                                legend: updateAt(a.diagram!.legend, li, { n: e.target.value }),
                              },
                            }),
                          })
                        }
                      />
                      <input
                        className={`${field} min-w-0 flex-1`}
                        value={it.label.pt}
                        aria-label="Nome do item"
                        placeholder="ex.: Tampa do reservatório"
                        onChange={(e) =>
                          onChange({
                            ...value,
                            accordions: updateAt(value.accordions, i, {
                              diagram: {
                                ...a.diagram!,
                                // Texto novo vale nos três idiomas (a tradução antiga não serve mais).
                                legend: updateAt(a.diagram!.legend, li, {
                                  label: { pt: e.target.value, en: e.target.value },
                                }),
                              },
                            }),
                          })
                        }
                      />
                      <button
                        type="button"
                        className={removeCls}
                        onClick={() =>
                          onChange({
                            ...value,
                            accordions: updateAt(value.accordions, i, {
                              diagram: {
                                ...a.diagram!,
                                legend: removeAt(a.diagram!.legend, li),
                              },
                            }),
                          })
                        }
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={addCls}
                    onClick={() =>
                      onChange({
                        ...value,
                        accordions: updateAt(value.accordions, i, {
                          diagram: {
                            ...a.diagram!,
                            legend: [
                              ...a.diagram!.legend,
                              {
                                // Próximo número livre (removendo o 2, o novo item não repete o 10).
                                n: String(
                                  Math.max(0, ...a.diagram!.legend.map((it) => parseInt(it.n, 10) || 0)) + 1,
                                ),
                                label: { pt: "", en: "" },
                              },
                            ],
                          },
                        }),
                      })
                    }
                  >
                    + Item numerado
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              className={`${removeCls} justify-self-start sm:col-span-2`}
              onClick={() => onChange({ ...value, accordions: removeAt(value.accordions, i) })}
            >
              Remover equipamento
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addCls}
          onClick={() =>
            onChange({ ...value, accordions: [...value.accordions, emptyAccordion()] })
          }
        >
          + Equipamento
        </button>
      </div>
    </div>
  );
}

function AlertListEditor({
  alerts,
  onChange,
}: {
  alerts: AlertInput[];
  onChange: (alerts: AlertInput[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:col-span-2">
      <span className="text-[12.5px] font-semibold text-soft">Alertas (opcional)</span>
      {alerts.map((a, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            className={`${field} w-14 shrink-0 text-center`}
            value={a.icon}
            onChange={(e) => onChange(updateAt(alerts, i, { icon: e.target.value }))}
          />
          <textarea
            rows={2}
            className={`${field} flex-1`}
            value={a.body}
            onChange={(e) => onChange(updateAt(alerts, i, { body: e.target.value }))}
          />
          <button type="button" className={removeCls} onClick={() => onChange(removeAt(alerts, i))}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" className={addCls} onClick={() => onChange([...alerts, emptyAlert()])}>
        + Alerta
      </button>
    </div>
  );
}

function CheckinCardEditor({
  card,
  onChange,
  reuseOptions,
}: {
  card: CheckinCardInput;
  onChange: (card: CheckinCardInput) => void;
  reuseOptions?: ReusableVideo[];
}) {
  return (
    <div className={`${nestedRowCls} sm:grid-cols-2`}>
      <label className={labelCls}>
        Título do cartão
        <input
          className={field}
          value={card.title}
          placeholder="ex.: Entrando no prédio"
          onChange={(e) => onChange({ ...card, title: e.target.value })}
        />
      </label>
      <label className={labelCls}>
        Etiqueta (opcional)
        <input
          className={field}
          value={card.tag}
          placeholder="ex.: {{VAGA}}"
          onChange={(e) => onChange({ ...card, tag: e.target.value })}
        />
      </label>
      <div className="sm:col-span-2">
        <span className="text-[12.5px] font-semibold text-soft">Foto de banner (opcional)</span>
        <div className="mt-1">
          <MediaField value={card.banner} onChange={(banner) => onChange({ ...card, banner })} />
        </div>
      </div>
      <StepListEditor steps={card.steps} onChange={(steps) => onChange({ ...card, steps })} />
      <AlertListEditor alerts={card.alerts} onChange={(alerts) => onChange({ ...card, alerts })} />
      <div className="sm:col-span-2">
        <span className="text-[12.5px] font-semibold text-soft">
          Vídeo (opcional — ex.: tutorial de como estacionar)
        </span>
        <div className="mt-1">
          <MediaField
            value={card.video?.src ?? ""}
            onChange={(src) =>
              onChange({ ...card, video: src ? { src, label: card.video?.label ?? "" } : undefined })
            }
            reuseOptions={reuseOptions}
            onReuse={(v) => onChange({ ...card, video: { src: v.src, label: v.buttonLabel.pt } })}
          />
        </div>
        {card.video?.src && (
          <label className={`${labelCls} mt-2`}>
            Legenda do botão de vídeo
            <input
              className={field}
              value={card.video.label}
              placeholder="ex.: ▶ Tutorial em vídeo · como chegar e estacionar"
              onChange={(e) =>
                onChange({ ...card, video: { ...card.video!, label: e.target.value } })
              }
            />
          </label>
        )}
      </div>
    </div>
  );
}

export function CheckinCardsEditor({
  lockShared,
  value,
  onChange,
  reuseOptions,
}: {
  /** Apartamento seguindo o modelo do prédio: texto de apoio e vídeo de A Casa vêm do prédio. */
  lockShared?: boolean;
  value: CheckinValue;
  onChange: (v: CheckinValue) => void;
  /** Vídeos já enviados por outros apartamentos do mesmo anfitrião/prédio — ver `listHostCheckinVideos`. */
  reuseOptions?: ReusableVideo[];
}) {
  return (
    <div>
      {!lockShared && (
        <label className={labelCls}>
        Texto de apoio
        <input className={field} value={value.sub} onChange={(e) => onChange({ ...value, sub: e.target.value })} />
      </label>
      )}
      <TokenHint />
      <div className="mt-3 grid gap-3">
        {value.cards.map((c, i) => (
          <div key={i}>
            <CheckinCardEditor
              card={c}
              onChange={(card) => onChange({ ...value, cards: updateAt(value.cards, i, card) })}
              reuseOptions={reuseOptions}
            />
            <button
              type="button"
              className={`${removeCls} mt-1.5`}
              onClick={() => onChange({ ...value, cards: removeAt(value.cards, i) })}
            >
              Remover cartão
            </button>
          </div>
        ))}
        <button
          type="button"
          className={addCls}
          onClick={() => onChange({ ...value, cards: [...value.cards, emptyCard()] })}
        >
          + Cartão de check-in
        </button>
      </div>
    </div>
  );
}

export function CheckoutStepsEditor({
  lockShared,
  value,
  onChange,
}: {
  /** Apartamento seguindo o modelo do prédio: texto de apoio e vídeo de A Casa vêm do prédio. */
  lockShared?: boolean;
  value: CheckoutValue;
  onChange: (v: CheckoutValue) => void;
}) {
  return (
    <div>
      {!lockShared && (
        <label className={labelCls}>
        Texto de apoio
        <input className={field} value={value.sub} onChange={(e) => onChange({ ...value, sub: e.target.value })} />
      </label>
      )}
      <TokenHint />
      <div className="mt-3">
        <StepListEditor steps={value.steps} onChange={(steps) => onChange({ ...value, steps })} />
      </div>
    </div>
  );
}
