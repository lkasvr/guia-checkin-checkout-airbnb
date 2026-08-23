"use client";

import { useActionState } from "react";
import { resetHostPassword, type ResetPasswordState } from "@/app/admin/actions";

export function ResetPasswordForm({
  hostId,
  hostEmail,
  hostNome,
  inputClassName,
}: {
  hostId: string;
  hostEmail: string;
  hostNome: string;
  inputClassName: string;
}) {
  const [estado, enviar, enviando] = useActionState<ResetPasswordState, FormData>(
    resetHostPassword.bind(null, hostId),
    null,
  );

  return (
    <>
      <form action={enviar} className="mt-3 flex flex-col gap-2 sm:flex-row">
        {/* Diz ao gerenciador de senhas de quem é a credencial. Sem um campo de
            usuário, ele lê um campo de senha solitário nesta origem — a mesma
            onde o superadmin faz login — como troca da senha dele próprio. */}
        <input
          type="text"
          name="host_email"
          value={hostEmail}
          readOnly
          hidden
          autoComplete="username"
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-label={`Nova senha de ${hostNome}`}
          placeholder="Nova senha (mín. 8 caracteres)"
          className={`${inputClassName} flex-1`}
        />
        <button
          disabled={enviando}
          className="rounded-full bg-ink px-5 py-2 text-[14px] font-bold text-bg disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar"}
        </button>
      </form>

      {estado && "erro" in estado && (
        <p className="mt-2 text-[13.5px] font-semibold text-terra">{estado.erro}</p>
      )}
      {estado && "ok" in estado && (
        <p className="mt-2 text-[13.5px] font-semibold text-coffee">
          Senha atualizada — vale a partir do próximo login.
        </p>
      )}

      <p className="mt-2 text-[13px] text-soft">
        Quem já estiver com sessão aberta continua logado até o token expirar.
      </p>
    </>
  );
}
