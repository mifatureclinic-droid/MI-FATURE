import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import React, { Component, ReactNode } from "react";
import {
  criarUrlDeAtualizacaoDeModulo,
  ehErroDeModuloDinamico,
  ehErroTransitórioDeDesmontagem,
} from "@/lib/errosInterface";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  tentativasDeRecuperacao: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, tentativasDeRecuperacao: 0 };
  }

  static getDerivedStateFromError(error: Error): Pick<State, 'hasError' | 'error'> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (!ehErroTransitórioDeDesmontagem(error) || this.state.tentativasDeRecuperacao >= 1) return;

    window.setTimeout(() => {
      this.setState((state) => ({
        hasError: false,
        error: null,
        tentativasDeRecuperacao: state.tentativasDeRecuperacao + 1,
      }));
    }, 0);
  }

  atualizarPagina = () => {
    if (ehErroDeModuloDinamico(this.state.error)) {
      const destino = criarUrlDeAtualizacaoDeModulo(window.location.href, String(Date.now()));
      window.location.assign(destino);
      return;
    }

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const erroDeModulo = ehErroDeModuloDinamico(this.state.error);

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">
              {erroDeModulo ? 'Uma atualização do sistema foi identificada.' : 'Ocorreu um erro inesperado.'}
            </h2>

            {erroDeModulo && (
              <p className="text-center text-muted-foreground mb-4">
                Atualize a página para carregar a versão mais recente do sistema.
              </p>
            )}

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={this.atualizarPagina}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              {erroDeModulo ? 'Atualizar versão' : 'Recarregar página'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
