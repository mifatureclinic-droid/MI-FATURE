import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { queryClientDefaults } from "./lib/queryClientDefaults";
import { consultaDaAgendaDeveIgnorarLote } from '@shared/operacoesCriticasAgenda';
import { prepararRequisicaoDoPortal } from '@shared/requisicaoPortal';

const queryClient = new QueryClient({ defaultOptions: queryClientDefaults });

// O App.tsx trata o estado não autenticado mostrando a tela de login interna.
// Não redirecionar para OAuth externo — apenas logar erros.
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
      // Sessão expirada — o App.tsx detecta via auth.me e mostra o login
      return;
    }
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
      return;
    }
    console.error("[API Mutation Error]", error);
  }
});

// Retry com back-off para quando o sandbox hiberna e retorna HTML em vez de JSON
async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await globalThis.fetch(input, prepararRequisicaoDoPortal(init));
    // Se o endpoint tRPC retornou HTML (servidor acordando ou fallback do Vite),
    // aguardar e tentar novamente antes que o parser JSON produza "Unexpected token <".
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html") && attempt < retries - 1) {
      await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (contentType.includes("text/html")) {
      throw new Error("O servidor de agendamento respondeu HTML em vez de JSON. Atualize a página e tente novamente.");
    }
    return res;
  }
  return globalThis.fetch(input, prepararRequisicaoDoPortal(init));
}

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (operation) => consultaDaAgendaDeveIgnorarLote(operation.path),
      true: httpLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch: fetchWithRetry,
      }),
      false: httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch: fetchWithRetry,
      }),
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
