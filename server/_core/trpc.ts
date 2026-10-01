import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { usuarioTemAcessoSomenteLeitura } from "../../shared/acessoSomenteLeitura";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

const bloquearMutacoesNoModoSomenteLeitura = t.middleware(async opts => {
  const email = opts.ctx.user?.email;
  const mutacaoDeAutenticacaoPermitida = ["auth.loginManual", "auth.logout"].includes(opts.path);

  if (opts.type === "mutation" && !mutacaoDeAutenticacaoPermitida && usuarioTemAcessoSomenteLeitura(email)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Este login possui acesso somente leitura e não pode realizar alterações.",
    });
  }

  return opts.next();
});

export const publicProcedure = t.procedure.use(bloquearMutacoesNoModoSomenteLeitura);

export const protectedProcedure = t.procedure
  .use(requireUser)
  .use(bloquearMutacoesNoModoSomenteLeitura);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
).use(bloquearMutacoesNoModoSomenteLeitura);

// Procedure restrita ao perfil 'administrador' (campo perfil na tabela users)
export const adminPerfilProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const perfil = (ctx.user as any)?.perfil;
    if (!ctx.user || perfil !== 'administrador') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito ao administrador.' });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
).use(bloquearMutacoesNoModoSomenteLeitura);

// Procedure restrita aos perfis 'administrador' e 'profissional'
export const profissionalPerfilProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const perfil = (ctx.user as any)?.perfil;
    if (!ctx.user || !['administrador', 'profissional'].includes(perfil)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a profissionais.' });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
).use(bloquearMutacoesNoModoSomenteLeitura);
