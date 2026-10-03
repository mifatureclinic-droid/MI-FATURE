import { useEffect, useState } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, Send } from 'lucide-react';

interface PreencherAnamneseProps {
  token: string;
}

const campos = [
  { key: 'queixaPrincipal', label: 'Queixa principal', obrigatorio: true },
  { key: 'historiaDoenca', label: 'História da doença atual' },
  { key: 'historiaFamiliar', label: 'Histórico familiar' },
  { key: 'historiaSocial', label: 'Histórico social' },
  { key: 'antecedentesPatologicos', label: 'Antecedentes patológicos' },
  { key: 'medicamentosEmUso', label: 'Medicamentos em uso' },
  { key: 'alergias', label: 'Alergias' },
  { key: 'cirurgiasAnteriores', label: 'Cirurgias anteriores' },
  { key: 'habitos', label: 'Hábitos de vida' },
  { key: 'observacoes', label: 'Observações' },
] as const;

export default function PreencherAnamnese({ token }: PreencherAnamneseProps) {
  const [concluida, setConcluida] = useState(false);
  const [form, setForm] = useState<Record<(typeof campos)[number]['key'], string>>({
    queixaPrincipal: '', historiaDoenca: '', historiaFamiliar: '', historiaSocial: '', antecedentesPatologicos: '',
    medicamentosEmUso: '', alergias: '', cirurgiasAnteriores: '', habitos: '', observacoes: '',
  });
  const dados = trpc.anamnese.getByToken.useQuery({ token }, { enabled: !!token, retry: false });
  const enviar = trpc.anamnese.preencherPorToken.useMutation({
    onSuccess: () => setConcluida(true),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (dados.isLoading) return <EstadoCarregando />;
  if (!token || dados.error || !dados.data) return <EstadoInvalido mensagem={dados.error?.message} />;
  if (concluida) {
    return <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-5"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg"><CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-600" /><h1 className="text-xl font-bold text-slate-900">Anamnese enviada</h1><p className="mt-2 text-sm text-slate-600">Obrigado. Suas respostas foram registradas com segurança.</p></div></div>;
  }

  const enviarFormulario = () => {
    if (!form.queixaPrincipal.trim()) return;
    enviar.mutate({ token, ...form });
  };

  return <main className="min-h-screen bg-slate-50 py-7 sm:py-10"><div className="mx-auto max-w-2xl px-4"><header className="rounded-t-2xl bg-teal-700 px-6 py-5 text-white shadow"><div className="flex items-center gap-3"><ClipboardList className="h-7 w-7" /><div><p className="text-xs font-semibold tracking-wider text-teal-100">CLÍNICA CLIPSI</p><h1 className="text-xl font-bold">Preenchimento de Anamnese</h1></div></div></header><section className="rounded-b-2xl bg-white p-5 shadow sm:p-7"><p className="mb-6 text-sm text-slate-600">Olá, <strong>{dados.data.pacienteNome}</strong>. Preencha as informações abaixo. Elas serão enviadas diretamente para o seu prontuário.</p><div className="space-y-5">{campos.map((campo) => { const obrigatorio = 'obrigatorio' in campo && campo.obrigatorio; return <div key={campo.key}><Label htmlFor={campo.key}>{campo.label}{obrigatorio ? ' *' : ''}</Label><Textarea id={campo.key} value={form[campo.key]} onChange={(event) => setForm((atual) => ({ ...atual, [campo.key]: event.target.value }))} rows={campo.key === 'queixaPrincipal' ? 3 : 4} className="mt-1" required={obrigatorio} /></div>; })}</div>{enviar.error && <p className="mt-4 text-sm text-red-700">{enviar.error.message}</p>}<Button type="button" className="mt-6 w-full bg-teal-700 hover:bg-teal-800" onClick={enviarFormulario} disabled={enviar.isPending || !form.queixaPrincipal.trim()}>{enviar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Enviar anamnese</Button><p className="mt-4 text-center text-xs text-slate-500">Este link é individual e deixa de funcionar após o envio.</p></section></div></main>;
}

function EstadoCarregando() { return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-teal-700" /></div>; }
function EstadoInvalido({ mensagem }: { mensagem?: string }) { return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg"><AlertTriangle className="mx-auto mb-4 h-14 w-14 text-amber-500" /><h1 className="text-xl font-bold text-slate-900">Link indisponível</h1><p className="mt-2 text-sm text-slate-600">{mensagem || 'Este link é inválido, expirou ou já foi utilizado. Solicite um novo link à clínica.'}</p></div></div>; }
