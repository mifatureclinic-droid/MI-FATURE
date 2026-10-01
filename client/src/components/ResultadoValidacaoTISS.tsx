import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export interface ValidacaoErro {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ResultadoValidacao {
  valid: boolean;
  version: string;
  errors: ValidacaoErro[];
  warnings: ValidacaoErro[];
}

export function ResultadoValidacaoTISS({ resultado }: { resultado: ResultadoValidacao }) {
  const { valid, version, errors, warnings } = resultado;

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        valid ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
      }`}
    >
      <div className="flex items-center gap-2">
        {valid ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
        )}
        <div>
          <p className={`font-semibold ${valid ? 'text-emerald-600' : 'text-red-600'}`}>
            {valid
              ? 'XML válido conforme o padrão TISS da ANS'
              : `XML com ${errors.length} erro(s) — provável rejeição pela operadora`}
          </p>
          <p className="text-xs text-muted-foreground">
            Validado contra o esquema oficial ANS {version ? `(versão ${version})` : ''}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="space-y-1.5">
          {errors.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <span>
                <span className="font-mono text-xs text-muted-foreground">{e.path}</span>
                <br />
                <span className="text-foreground">{e.message}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="space-y-1.5 border-t pt-2">
          {warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <span>
                <span className="font-mono text-xs text-muted-foreground">{w.path}</span>
                <br />
                <span className="text-foreground">{w.message}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {valid && warnings.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum problema estrutural encontrado. O arquivo está pronto para envio ao portal da operadora.
        </p>
      )}
    </div>
  );
}
