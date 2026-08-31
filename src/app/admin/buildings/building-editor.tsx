"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateBuilding,
  type BuildingAmenityInput,
  type BuildingEditPayload,
  type BuildingPlaceInput,
} from "@/app/admin/buildings/actions";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";
const rowCls = "grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-2";
const removeCls = "text-[13px] font-semibold text-terra";

const emptyAmenity: BuildingAmenityInput = { title: "", text: "", wide: false };
const emptyPlace: BuildingPlaceInput = { title: "", text: "", meta: "", site: "", maps: "" };

export function BuildingEditor({
  buildingId,
  buildingName,
  initial,
}: {
  buildingId: string;
  buildingName: string;
  initial: BuildingEditPayload;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await updateBuilding(buildingId, form);
        router.push("/admin");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      }
    });
  }

  return (
    <div>
      <h1 className="font-display text-[30px] font-normal">Editar prédio</h1>
      <p className="mt-1 text-[15px] text-soft">
        <b className="text-ink">{buildingName}</b>. Lazer, guia da cidade e onde comer são
        compartilhados — mudar aqui atualiza todos os apartamentos deste prédio.
      </p>

      <h2 className="mt-6 font-display text-[19px] font-normal">Lazer</h2>
      <label className={`${labelCls} mt-3`}>
        Texto de apoio
        <input
          className={field}
          value={form.amenitiesSub}
          placeholder="ex.: Tudo no Andar M (Mezanino), é só descer de elevador."
          onChange={(e) => setForm((f) => ({ ...f, amenitiesSub: e.target.value }))}
        />
      </label>
      <div className="mt-3 grid gap-2">
        {form.amenities.map((a, i) => (
          <div key={i} className={rowCls}>
            <label className={labelCls}>
              Título
              <input
                className={field}
                value={a.title}
                placeholder="ex.: Piscina infinita · 25 m"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amenities: f.amenities.map((x, j) =>
                      j === i ? { ...x, title: e.target.value } : x,
                    ),
                  }))
                }
              />
            </label>
            <label className={labelCls}>
              Texto
              <input
                className={field}
                value={a.text}
                placeholder="ex.: Traje de banho obrigatório."
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amenities: f.amenities.map((x, j) =>
                      j === i ? { ...x, text: e.target.value } : x,
                    ),
                  }))
                }
              />
            </label>
            <div className="flex items-center justify-between sm:col-span-2">
              <label className="flex items-center gap-2 text-[13px] text-soft">
                <input
                  type="checkbox"
                  checked={a.wide}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      amenities: f.amenities.map((x, j) =>
                        j === i ? { ...x, wide: e.target.checked } : x,
                      ),
                    }))
                  }
                />
                Card largo (destaque)
              </label>
              <button
                type="button"
                className={removeCls}
                onClick={() =>
                  setForm((f) => ({ ...f, amenities: f.amenities.filter((_, j) => j !== i) }))
                }
              >
                Remover
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="justify-self-start text-[13.5px] font-semibold text-terra underline underline-offset-2"
          onClick={() =>
            setForm((f) => ({ ...f, amenities: [...f.amenities, { ...emptyAmenity }] }))
          }
        >
          + Item de lazer
        </button>
      </div>

      <PlaceList
        title="Guia da cidade"
        sub={form.tourismSub}
        onSub={(v) => setForm((f) => ({ ...f, tourismSub: v }))}
        items={form.tourism}
        onItems={(items) => setForm((f) => ({ ...f, tourism: items }))}
      />

      <PlaceList
        title="Onde Comer"
        sub={form.diningSub}
        onSub={(v) => setForm((f) => ({ ...f, diningSub: v }))}
        items={form.dining}
        onItems={(items) => setForm((f) => ({ ...f, dining: items }))}
      />

      {error && (
        <p className="mt-4 rounded-xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-3 text-[14px] text-terra">
          {error}
        </p>
      )}

      <button
        onClick={save}
        disabled={pending}
        className="mt-7 w-full rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-bg disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </div>
  );
}

function PlaceList({
  title,
  sub,
  onSub,
  items,
  onItems,
}: {
  title: string;
  sub: string;
  onSub: (v: string) => void;
  items: BuildingPlaceInput[];
  onItems: (items: BuildingPlaceInput[]) => void;
}) {
  return (
    <>
      <h2 className="mt-6 font-display text-[19px] font-normal">{title}</h2>
      <label className={`${labelCls} mt-3`}>
        Texto de apoio
        <input className={field} value={sub} onChange={(e) => onSub(e.target.value)} />
      </label>
      <div className="mt-3 grid gap-2">
        {items.map((p, i) => (
          <div key={i} className={rowCls}>
            <label className={labelCls}>
              Nome
              <input
                className={field}
                value={p.title}
                onChange={(e) =>
                  onItems(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
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
                  onItems(items.map((x, j) => (j === i ? { ...x, meta: e.target.value } : x)))
                }
              />
            </label>
            <label className={`${labelCls} sm:col-span-2`}>
              Texto
              <input
                className={field}
                value={p.text}
                onChange={(e) =>
                  onItems(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                }
              />
            </label>
            <label className={labelCls}>
              Site (opcional)
              <input
                className={field}
                value={p.site}
                onChange={(e) =>
                  onItems(items.map((x, j) => (j === i ? { ...x, site: e.target.value } : x)))
                }
              />
            </label>
            <label className={labelCls}>
              Endereço p/ mapa (opcional)
              <input
                className={field}
                value={p.maps}
                onChange={(e) =>
                  onItems(items.map((x, j) => (j === i ? { ...x, maps: e.target.value } : x)))
                }
              />
            </label>
            <button
              type="button"
              className={`${removeCls} justify-self-start sm:col-span-2`}
              onClick={() => onItems(items.filter((_, j) => j !== i))}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          className="justify-self-start text-[13.5px] font-semibold text-terra underline underline-offset-2"
          onClick={() => onItems([...items, { ...emptyPlace }])}
        >
          + Item
        </button>
      </div>
    </>
  );
}
