import React from "react";

export function ConteudoSomenteLeitura({
  ativo,
  children,
}: {
  ativo: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      disabled={ativo}
      aria-label={ativo ? "Conteúdo bloqueado para alterações" : undefined}
      className={ativo ? "contents [&_button]:cursor-not-allowed" : "contents"}
    >
      {children}
    </fieldset>
  );
}
