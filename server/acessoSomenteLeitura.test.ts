import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function criarContextoSomenteLeitura(): TrpcContext {
  return {
    user: {
      id: 244380008,
      openId: "manual-carelli",
      email: "Carelli@carelliassociados.com.br",
      name: "João Carlos Carelli",
      loginMethod: "manual",
      role: "user",
      perfil: "administrador",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("acesso somente leitura de João Carelli", () => {
  it("permite consultar a sessão, mas bloqueia alteração de perfil no servidor", async () => {
    const caller = appRouter.createCaller(criarContextoSomenteLeitura());

    await expect(caller.auth.me()).resolves.toMatchObject({
      email: "Carelli@carelliassociados.com.br",
    });
    await expect(caller.auth.updateMyProfile({ nome: "Tentativa de alteração" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Este login possui acesso somente leitura e não pode realizar alterações.",
    });
  });

  it("bloqueia também mutações públicas quando a sessão é do usuário de leitura", async () => {
    const caller = appRouter.createCaller(criarContextoSomenteLeitura());

    await expect(caller.assinaturas.assinar({ token: "tentativa-de-assinatura" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Este login possui acesso somente leitura e não pode realizar alterações.",
    });
  });
});
