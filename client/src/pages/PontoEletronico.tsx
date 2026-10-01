import { useMemo, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { CalendarClock, CheckCircle2, Clock3, Download, LockKeyhole, MapPin, Pencil, Play, ScanFace, ShieldCheck, Square, TimerReset, UserRoundCheck, UserRoundX, Users } from 'lucide-react';
import { formatarMinutos, JORNADA_PADRAO_RECEPCAO } from '@shared/pontoEletronico';
import { cameraEstaPronta, mensagemErroGeolocalizacao } from '@shared/pontoDispositivo';

function competenciaAtual() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit' }).format(new Date());
}

function dataHojeManaus() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function formatoDia(data: unknown) {
  if (data instanceof Date) return data.toLocaleDateString('pt-BR', { timeZone: 'America/Manaus' });
  const valor = String(data ?? '');
  const [ano, mes, dia] = valor.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

const etapas = [
  { id: 'entrada', label: 'Entrada', icon: Play, cor: 'bg-emerald-600 hover:bg-emerald-700' },
  { id: 'inicioIntervalo', label: 'Início do intervalo', icon: TimerReset, cor: 'bg-amber-600 hover:bg-amber-700' },
  { id: 'fimIntervalo', label: 'Retorno do intervalo', icon: Play, cor: 'bg-sky-600 hover:bg-sky-700' },
  { id: 'saida', label: 'Saída', icon: Square, cor: 'bg-violet-600 hover:bg-violet-700' },
] as const;

export function PontoEletronico() {
  const { user } = useAuth();
  const perfil = String((user as any)?.perfil ?? '').toLocaleLowerCase('pt-BR');
  const isRecepcao = ['recepcao', 'recepção', 'recepcionista'].includes(perfil);
  const isMaster = !isRecepcao && ((user as any)?.role === 'admin' || ['administrador', 'master'].includes(perfil));
  const [competencia, setCompetencia] = useState(competenciaAtual);
  const [usuarioJornadaId, setUsuarioJornadaId] = useState<string>('');
  const [ajuste, setAjuste] = useState<any>(null);
  const [justificativa, setJustificativa] = useState('');
  const [formJornada, setFormJornada] = useState({ ...JORNADA_PADRAO_RECEPCAO });
  const [tipoVerificacao, setTipoVerificacao] = useState<typeof etapas[number]['id'] | null>(null);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [validandoMarcacao, setValidandoMarcacao] = useState(false);
  const [consentimento, setConsentimento] = useState(false);
  const [raioLocalidade, setRaioLocalidade] = useState(150);
  const [excecaoAberta, setExcecaoAberta] = useState(false);
  const [excecao, setExcecao] = useState({ usuarioId: '', data: dataHojeManaus(), tipo: 'entrada' as typeof etapas[number]['id'], horario: '', justificativa: '' });
  const [ocorrenciaAberta, setOcorrenciaAberta] = useState(false);
  const [ocorrencia, setOcorrencia] = useState({ usuarioId: '', tipo: 'folga' as 'folga' | 'ferias' | 'atestado', dataInicio: dataHojeManaus(), dataFim: dataHojeManaus(), observacao: '' });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const utils = trpc.useUtils();

  const hoje = trpc.ponto.hoje.useQuery(undefined, { enabled: !isMaster, refetchInterval: 30_000, refetchOnMount: 'always', refetchOnWindowFocus: true });
  const recepcionistas = trpc.ponto.listarRecepcionistas.useQuery(undefined, { enabled: isMaster });
  const mensal = trpc.ponto.resumoMensal.useQuery({ competencia }, { enabled: isMaster });

  const marcar = trpc.ponto.marcar.useMutation({
    onSuccess: () => {
      toast.success('Marcação registrada com sucesso');
      utils.ponto.hoje.invalidate();
    },
    onError: (erro) => toast.error(erro.message),
  });
  const salvarJornada = trpc.ponto.salvarJornada.useMutation({
    onSuccess: () => {
      toast.success('Jornada atualizada');
      utils.ponto.resumoMensal.invalidate();
    },
    onError: (erro) => toast.error(erro.message),
  });
  const ajustar = trpc.ponto.ajustar.useMutation({
    onSuccess: () => {
      toast.success('Registro ajustado e auditado');
      setAjuste(null);
      setJustificativa('');
      utils.ponto.resumoMensal.invalidate();
    },
    onError: (erro) => toast.error(erro.message),
  });
  const fechar = trpc.ponto.fecharCompetencia.useMutation({
    onSuccess: () => {
      toast.success('Competência fechada; novas alterações foram bloqueadas');
      utils.ponto.resumoMensal.invalidate();
    },
    onError: (erro) => toast.error(erro.message),
  });
  const cadastrarBiometria = trpc.ponto.cadastrarBiometria.useMutation({
    onSuccess: () => { toast.success('Biometria cadastrada com sucesso'); setCameraAtiva(false); utils.ponto.hoje.invalidate(); },
    onError: (erro) => toast.error(erro.message),
  });
  const marcarValidado = trpc.ponto.marcarValidado.useMutation({
    onSuccess: () => { toast.success('Ponto validado por face e localização'); encerrarCamera(); setTipoVerificacao(null); utils.ponto.hoje.invalidate(); },
    onError: (erro) => toast.error(erro.message),
  });
  const salvarLocalidade = trpc.ponto.salvarLocalidade.useMutation({
    onSuccess: () => { toast.success('Perímetro da clínica atualizado'); utils.ponto.hoje.invalidate(); },
    onError: (erro) => toast.error(erro.message),
  });
  const registrarExcecao = trpc.ponto.registrarExcecao.useMutation({
    onSuccess: () => { toast.success('Exceção registrada com auditoria'); setExcecaoAberta(false); setExcecao((atual) => ({ ...atual, horario: '', justificativa: '' })); utils.ponto.resumoMensal.invalidate(); },
    onError: (erro) => toast.error(erro.message),
  });
  const salvarSituacao = trpc.ponto.salvarSituacaoFuncionario.useMutation({
    onSuccess: () => { toast.success('Situação funcional atualizada'); utils.ponto.listarRecepcionistas.invalidate(); utils.ponto.resumoMensal.invalidate(); },
    onError: (erro) => toast.error(erro.message),
  });
  const registrarOcorrencia = trpc.ponto.registrarOcorrencia.useMutation({
    onSuccess: () => { toast.success('Ocorrência registrada e excluída da apuração de faltas'); setOcorrenciaAberta(false); setOcorrencia((atual) => ({ ...atual, observacao: '' })); utils.ponto.resumoMensal.invalidate(); },
    onError: (erro) => toast.error(erro.message),
  });

  const proximaEtapa = useMemo(() => {
    const registro = hoje.data?.registro as any;
    return etapas.find((etapa) => !registro?.[etapa.id]);
  }, [hoje.data?.registro]);

  const encerrarCamera = () => {
    streamRef.current?.getTracks().forEach((faixa) => faixa.stop());
    streamRef.current = null;
    setCameraPronta(false);
    setCameraAtiva(false);
  };

  const abrirCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Este navegador não disponibiliza acesso à câmara. Abra o portal no Chrome ou Safari atualizado.');
      }
      setCameraPronta(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      setCameraAtiva(true);
      window.setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        const prepararVideo = () => {
          void video.play().catch(() => undefined);
          setCameraPronta(cameraEstaPronta(video.readyState));
        };
        video.onloadeddata = prepararVideo;
        if (cameraEstaPronta(video.readyState)) prepararVideo();
      }, 100);
    } catch (erro: any) {
      toast.error(erro?.message || 'Não foi possível acessar a câmera. Verifique a permissão do navegador.');
    }
  };

  const obterDescriptor = async () => {
    if (!videoRef.current) throw new Error('Câmera indisponível');
    if (!cameraEstaPronta(videoRef.current.readyState)) throw new Error('A imagem da câmera ainda está a preparar. Aguarde a pré-visualização e tente novamente.');
    const faceapi = await import('@vladmandic/face-api');
    const baseModelos = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(baseModelos),
      faceapi.nets.faceLandmark68Net.loadFromUri(baseModelos),
      faceapi.nets.faceRecognitionNet.loadFromUri(baseModelos),
    ]);
    const deteccao = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (!deteccao) throw new Error('Nenhum rosto foi identificado. Centralize seu rosto e tente novamente.');
    return Array.from(deteccao.descriptor);
  };

  const obterLocalizacao = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este navegador não disponibiliza localização. Abra o portal no Chrome ou Safari atualizado.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (erro) => reject(new Error(mensagemErroGeolocalizacao(erro.code))),
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 },
    );
  });

  const concluirCadastro = async () => {
    if (!consentimento) return toast.error('É necessário aceitar o aviso de privacidade para cadastrar a biometria.');
    try { cadastrarBiometria.mutate({ descritor: await obterDescriptor(), consentimento: true }); } catch (erro: any) { toast.error(erro.message || 'Não foi possível cadastrar a biometria.'); }
  };

  const concluirMarcacao = async () => {
    if (!tipoVerificacao) return;
    setValidandoMarcacao(true);
    try {
      const [descritor, posicao] = await Promise.all([obterDescriptor(), obterLocalizacao()]);
      marcarValidado.mutate({ tipo: tipoVerificacao, descritor, latitude: posicao.coords.latitude, longitude: posicao.coords.longitude, precisaoMetros: posicao.coords.accuracy });
    } catch (erro: any) { toast.error(erro.message || 'Não foi possível validar a marcação.'); } finally { setValidandoMarcacao(false); }
  };

  const usuarioJornada = useMemo(() => {
    const id = Number(usuarioJornadaId || recepcionistas.data?.[0]?.id || 0);
    return mensal.data?.linhas.find((linha: any) => linha.usuario.id === id)?.usuario;
  }, [usuarioJornadaId, recepcionistas.data, mensal.data]);

  const selecionarJornada = (id: string) => {
    setUsuarioJornadaId(id);
    const jornadaExistente = mensal.data?.linhas.find((linha: any) => linha.usuario.id === Number(id))?.jornada;
    if (jornadaExistente) setFormJornada(jornadaExistente);
  };

  const configurarLocalizacao = async () => {
    try {
      const posicao = await obterLocalizacao();
      salvarLocalidade.mutate({ nome: 'CLÍNICA CLIPSI', latitude: posicao.coords.latitude, longitude: posicao.coords.longitude, raioMetros: raioLocalidade });
    } catch {
      toast.error('Não foi possível obter a localização. Autorize a localização no navegador e tente novamente.');
    }
  };

  const exportarCsv = () => {
    if (!mensal.data) return;
    const linhas = [['Recepcionista', 'Situação', 'Horas trabalhadas', 'Horas extras', 'Atrasos', 'Faltas', 'Folgas', 'Férias', 'Atestados', 'Valor estimado de extras']];
    mensal.data.linhas.forEach((linha: any) => linhas.push([
      linha.usuario.name || 'Sem nome',
      linha.usuario.ativo ? 'Ativo' : 'Inativo',
      formatarMinutos(linha.totais.minutosTrabalhados),
      formatarMinutos(linha.totais.horasExtrasMinutos),
      formatarMinutos(linha.totais.atrasoMinutos),
      String(linha.totais.faltas),
      String(linha.totais.folgas),
      String(linha.totais.ferias),
      String(linha.totais.atestados),
      `R$ ${linha.totais.valorHorasExtras.toFixed(2).replace('.', ',')}`,
    ]));
    const blob = new Blob([linhas.map((linha) => linha.map((campo) => `"${campo}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `espelho-ponto-${competencia}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isMaster) {
    const dados = hoje.data;
    const registro = dados?.registro as any;
    return (
      <div className="p-5 md:p-7 max-w-4xl mx-auto space-y-5">
        <div>
          <p className="text-sm font-medium text-emerald-700">RECEPÇÃO</p>
          <h1 className="text-2xl font-bold text-slate-900">Meu ponto eletrônico</h1>
          <p className="text-sm text-slate-500">Marque sua jornada em horário de Manaus (UTC−4).</p>
        </div>
        <Card className="border-emerald-100 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2"><Clock3 className="w-5 h-5 text-emerald-700" /> {formatoDia(dados?.data)}</CardTitle>
            <CardDescription>Horário atual: <strong>{dados?.horarioAtual || '—'}</strong> · Tolerância configurada: até {dados?.jornada?.toleranciaMarcacaoMinutos ?? 5} min por marcação e {dados?.jornada?.toleranciaDiariaMinutos ?? 10} min por dia.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {!dados?.biometriaCadastrada && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3"><div className="flex gap-2 text-amber-900"><ScanFace className="w-5 h-5 shrink-0" /><div><p className="font-semibold">Cadastre sua biometria antes da primeira batida</p><p className="text-sm">A face será convertida em descritor de comparação; a imagem não será guardada. O uso é exclusivo para autenticação do ponto.</p></div></div><Button className="bg-amber-700 hover:bg-amber-800" onClick={abrirCamera}>Cadastrar biometria facial</Button></div>}
            {dados?.biometriaCadastrada && !dados?.localidade && <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 flex gap-2 text-sky-900"><MapPin className="w-5 h-5 shrink-0" /><div><p className="font-semibold">Perímetro ainda não configurado</p><p className="text-sm">Solicite ao master que configure a localização da clínica antes de marcar o ponto.</p></div></div>}
            {dados?.funcionarioAtivo === false && <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-800 p-4 flex gap-2"><UserRoundX className="w-5 h-5 shrink-0" /> Seu cadastro de ponto está desativado. Procure o master para reativá-lo.</div>}
            {dados?.fechado ? <div className="rounded-lg bg-slate-100 text-slate-700 p-4 flex gap-2"><LockKeyhole className="w-5 h-5" /> A competência foi fechada pelo master.</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {etapas.map((etapa) => {
                  const Icon = etapa.icon;
                  const registrada = Boolean(registro?.[etapa.id]);
                  const habilitada = proximaEtapa?.id === etapa.id;
                  return <Button key={etapa.id} disabled={!habilitada || !dados?.biometriaCadastrada || !dados?.localidade || dados?.funcionarioAtivo === false || marcarValidado.isPending} onClick={() => { setTipoVerificacao(etapa.id); abrirCamera(); }} className={`${registrada ? 'bg-slate-100 text-slate-500 hover:bg-slate-100' : etapa.cor} h-auto py-4 justify-between`}>
                    <span className="flex items-center gap-2"><Icon className="w-4 h-4" /> {etapa.label}</span>
                    <span className="font-mono">{registro?.[etapa.id] || '—'}</span>
                  </Button>;
                })}
              </div>
            )}
            {dados?.resumo?.completo && <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-sky-50 p-3"><span className="text-slate-500">Horas trabalhadas</span><p className="font-bold text-sky-800">{formatarMinutos(dados.resumo.minutosTrabalhados)}</p></div>
              <div className="rounded-lg bg-violet-50 p-3"><span className="text-slate-500">Saldo do dia</span><p className="font-bold text-violet-800">{dados.resumo.toleranciaAplicada ? 'Dentro da tolerância' : formatarMinutos(dados.resumo.saldoMinutos)}</p></div>
            </div>}
          </CardContent>
        </Card>
        <Dialog open={cameraAtiva} onOpenChange={(aberto) => { if (!aberto) { encerrarCamera(); setTipoVerificacao(null); } }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex gap-2 items-center"><ScanFace className="w-5 h-5 text-violet-700" /> {dados?.biometriaCadastrada ? 'Validar rosto e localização' : 'Cadastrar biometria facial'}</DialogTitle></DialogHeader><div className="space-y-4"><div className="rounded-xl overflow-hidden bg-slate-900 aspect-video"><video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /></div>{!cameraPronta && <p className="rounded-lg bg-sky-50 p-3 text-xs text-sky-900">A preparar a câmara. Aguarde aparecer a sua imagem antes de continuar.</p>}{!dados?.biometriaCadastrada && <label className="flex gap-2 text-sm text-slate-700 items-start"><input type="checkbox" checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} className="mt-1" /><span>Li e concordo com o uso do descritor facial e da localização exclusivamente para autenticar meu ponto. Posso solicitar revisão ao master em caso de falha.</span></label>}<p className="text-xs text-slate-500">Ative a câmara frontal e a localização precisa. A foto bruta não é armazenada.</p></div><DialogFooter><Button variant="outline" onClick={() => { encerrarCamera(); setTipoVerificacao(null); }}>Cancelar</Button><Button className="bg-violet-700 hover:bg-violet-800" disabled={!cameraPronta || cadastrarBiometria.isPending || marcarValidado.isPending || validandoMarcacao} onClick={dados?.biometriaCadastrada ? concluirMarcacao : concluirCadastro}>{dados?.biometriaCadastrada ? <><ShieldCheck className="w-4 h-4 mr-2" /> {validandoMarcacao ? 'A validar…' : 'Validar e bater ponto'}</> : 'Salvar biometria'}</Button></DialogFooter></DialogContent></Dialog>
      </div>
    );
  }

  return <div className="p-5 md:p-7 space-y-6 max-w-7xl mx-auto">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div><p className="text-sm font-medium text-violet-700">MASTER</p><h1 className="text-2xl font-bold text-slate-900">Painel de ponto eletrônico</h1><p className="text-sm text-slate-500">Apuração mensal de horas trabalhadas, faltas, atrasos, extras, folgas, férias e atestados.</p></div>
      <div className="flex items-center gap-2 flex-wrap"><Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} className="w-40" /><Button variant="outline" onClick={exportarCsv}><Download className="w-4 h-4 mr-2" /> Exportar</Button>{!mensal.data?.fechado && <Button variant="outline" onClick={() => setExcecaoAberta(true)}><Pencil className="w-4 h-4 mr-2" /> Exceção</Button>}{!mensal.data?.fechado && <Button variant="outline" onClick={() => setOcorrenciaAberta(true)}><CalendarClock className="w-4 h-4 mr-2" /> Folga / férias / atestado</Button>}{!mensal.data?.fechado && <Button className="bg-violet-700 hover:bg-violet-800" disabled={fechar.isPending} onClick={() => { if (window.confirm(`Fechar a competência ${competencia}? As marcações serão bloqueadas.`)) fechar.mutate({ competencia }); }}><LockKeyhole className="w-4 h-4 mr-2" /> Fechar mês</Button>}</div>
    </div>
    {mensal.data?.fechado && <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900 flex gap-2"><CheckCircle2 className="w-5 h-5" /> Competência fechada. Ajustes e novas marcações estão bloqueados.</div>}
    <Card className="border-sky-100"><CardHeader><CardTitle className="flex gap-2 items-center"><MapPin className="w-5 h-5 text-sky-700" /> Perímetro da clínica</CardTitle><CardDescription>Estando fisicamente na CLÍNICA CLIPSI, use sua localização atual como centro da geocerca. A localização exata não é exibida para a recepção.</CardDescription></CardHeader><CardContent className="flex flex-col sm:flex-row gap-3 sm:items-end"><div><Label>Raio autorizado (metros)</Label><Input type="number" min="30" max="1000" value={raioLocalidade} onChange={(e) => setRaioLocalidade(Number(e.target.value))} className="w-48" /></div><Button className="bg-sky-700 hover:bg-sky-800" disabled={salvarLocalidade.isPending} onClick={configurarLocalizacao}><MapPin className="w-4 h-4 mr-2" /> Usar minha localização</Button></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Jornada da recepção</CardTitle><CardDescription>Configure a jornada contratual individual antes da apuração das horas extras.</CardDescription></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
      <div className="md:col-span-2"><Label>Recepcionista</Label><Select value={usuarioJornadaId || String(recepcionistas.data?.[0]?.id || '')} onValueChange={selecionarJornada}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{recepcionistas.data?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name} {u.ativo ? '· Ativo' : '· Inativo'}</SelectItem>)}</SelectContent></Select></div>
      {(['horaEntrada', 'inicioIntervalo', 'fimIntervalo', 'horaSaida'] as const).map((campo) => <div key={campo}><Label className="capitalize">{campo.replace(/([A-Z])/g, ' $1')}</Label><Input type="time" value={(formJornada as any)[campo]} onChange={(e) => setFormJornada((atual) => ({ ...atual, [campo]: e.target.value }))} /></div>)}
      <div className="md:col-span-5 flex flex-wrap gap-3 items-end"><div><Label>Valor da hora (R$)</Label><Input type="number" min="0" step="0.01" value={formJornada.valorHora} onChange={(e) => setFormJornada((atual) => ({ ...atual, valorHora: Number(e.target.value) }))} /></div><div><Label>Adicional extra (%)</Label><Input type="number" min="0" value={formJornada.adicionalHoraExtra} onChange={(e) => setFormJornada((atual) => ({ ...atual, adicionalHoraExtra: Number(e.target.value) }))} /></div><Button disabled={!usuarioJornada || salvarJornada.isPending} onClick={() => { if (usuarioJornada) salvarJornada.mutate({ usuarioId: usuarioJornada.id, ...formJornada }); }}>Salvar jornada</Button></div>
    </CardContent></Card>
    <Card className="border-violet-100"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-violet-700" /> Funcionários ativos no ponto</CardTitle><CardDescription>Use esta gestão para liberar ou bloquear novas batidas. Funcionários inativos mantêm o histórico, mas não conseguem registrar ponto até serem reativados.</CardDescription></CardHeader><CardContent className="space-y-3">{recepcionistas.data?.map((recepcionista: any) => <div key={recepcionista.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold text-slate-900">{recepcionista.name}</p><p className="text-sm text-slate-500">Perfil: Recepção · {recepcionista.ativo ? 'Pode registrar ponto' : 'Batidas bloqueadas'}</p></div><div className="flex items-center gap-3"><Badge variant={recepcionista.ativo ? 'secondary' : 'destructive'}>{recepcionista.ativo ? 'Ativo' : 'Inativo'}</Badge><Button variant={recepcionista.ativo ? 'outline' : 'default'} className={recepcionista.ativo ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'bg-emerald-700 hover:bg-emerald-800'} disabled={salvarSituacao.isPending} onClick={() => salvarSituacao.mutate({ usuarioId: recepcionista.id, ativo: !recepcionista.ativo })}>{recepcionista.ativo ? <><UserRoundX className="w-4 h-4 mr-2" /> Desativar funcionário</> : <><UserRoundCheck className="w-4 h-4 mr-2" /> Ativar funcionário</>}</Button></div></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5" /> Espelho mensal</CardTitle><CardDescription>Valores de hora extra são estimados a partir do valor-hora configurado; confirme contrato e instrumento coletivo antes do pagamento.</CardDescription></CardHeader><CardContent className="space-y-5">
      {mensal.isLoading ? <p className="text-slate-500">Carregando apuração...</p> : mensal.data?.linhas.map((linha: any) => <div key={linha.usuario.id} className="border rounded-xl overflow-hidden"><div className="p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><h3 className="font-semibold flex items-center gap-2">{linha.usuario.name} <Badge variant={linha.usuario.ativo ? 'secondary' : 'destructive'}>{linha.usuario.ativo ? 'Ativo' : 'Inativo'}</Badge></h3><p className="text-xs text-slate-500">Jornada {linha.jornada.horaEntrada}–{linha.jornada.inicioIntervalo} / {linha.jornada.fimIntervalo}–{linha.jornada.horaSaida}</p></div><div className="flex gap-2 flex-wrap"><Badge variant="secondary">Trabalhadas {formatarMinutos(linha.totais.minutosTrabalhados)}</Badge><Badge className="bg-emerald-600">Extras {formatarMinutos(linha.totais.horasExtrasMinutos)}</Badge><Badge className="bg-amber-600">Atrasos {formatarMinutos(linha.totais.atrasoMinutos)}</Badge><Badge className="bg-rose-600">Faltas {linha.totais.faltas}</Badge><Badge className="bg-sky-600">Folgas {linha.totais.folgas}</Badge><Badge className="bg-violet-600">Férias {linha.totais.ferias}</Badge><Badge className="bg-teal-600">Atestados {linha.totais.atestados}</Badge></div></div>
        {linha.ocorrencias?.length > 0 && <div className="px-4 py-3 border-t bg-sky-50 text-sm text-sky-900">Ocorrências: {linha.ocorrencias.map((ocorrencia: any) => <span key={ocorrencia.id} className="mr-3"><strong className="capitalize">{ocorrencia.tipo}</strong> ({formatoDia(ocorrencia.dataInicio)} a {formatoDia(ocorrencia.dataFim)})</span>)}</div>}
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-slate-500 bg-white"><tr><th className="text-left p-3">Data</th><th>Entrada</th><th>Intervalo</th><th>Retorno</th><th>Saída</th><th>Saldo</th><th className="text-right">Ação</th></tr></thead><tbody>{linha.registros.map((registro: any) => <tr key={registro.id} className="border-t"><td className="p-3">{formatoDia(registro.data)}</td><td className="text-center font-mono">{registro.entrada || '—'}</td><td className="text-center font-mono">{registro.inicioIntervalo || '—'}</td><td className="text-center font-mono">{registro.fimIntervalo || '—'}</td><td className="text-center font-mono">{registro.saida || '—'}</td><td className="text-center">{registro.resumo.completo ? (registro.resumo.toleranciaAplicada ? <span className="text-emerald-700">Tolerância</span> : formatarMinutos(registro.resumo.saldoMinutos)) : 'Pendente'}</td><td className="p-2 text-right">{!mensal.data?.fechado && <Button size="sm" variant="ghost" onClick={() => { setAjuste(registro); setJustificativa(registro.justificativa || ''); }}><Pencil className="w-4 h-4" /></Button>}</td></tr>)}</tbody></table></div>
      </div>)}
    </CardContent></Card>
    <Dialog open={excecaoAberta} onOpenChange={setExcecaoAberta}><DialogContent><DialogHeader><DialogTitle>Registrar exceção auditada</DialogTitle></DialogHeader><p className="text-sm text-slate-500">Use somente quando a validação facial ou de perímetro falhar. A justificativa ficará registrada para o master.</p><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><Label>Recepcionista</Label><Select value={excecao.usuarioId} onValueChange={(usuarioId) => setExcecao((atual) => ({ ...atual, usuarioId }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{recepcionistas.data?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Data</Label><Input type="date" value={excecao.data} onChange={(e) => setExcecao((atual) => ({ ...atual, data: e.target.value }))} /></div><div><Label>Tipo</Label><Select value={excecao.tipo} onValueChange={(tipo: any) => setExcecao((atual) => ({ ...atual, tipo }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{etapas.map((etapa) => <SelectItem key={etapa.id} value={etapa.id}>{etapa.label}</SelectItem>)}</SelectContent></Select></div><div className="col-span-2"><Label>Horário</Label><Input type="time" value={excecao.horario} onChange={(e) => setExcecao((atual) => ({ ...atual, horario: e.target.value }))} /></div></div><div><Label>Justificativa</Label><Textarea value={excecao.justificativa} onChange={(e) => setExcecao((atual) => ({ ...atual, justificativa: e.target.value }))} placeholder="Motivo da exceção" /></div><DialogFooter><Button variant="outline" onClick={() => setExcecaoAberta(false)}>Cancelar</Button><Button disabled={!excecao.usuarioId || !excecao.horario || excecao.justificativa.trim().length < 5 || registrarExcecao.isPending} onClick={() => registrarExcecao.mutate({ ...excecao, usuarioId: Number(excecao.usuarioId) })}>Registrar exceção</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={ocorrenciaAberta} onOpenChange={setOcorrenciaAberta}><DialogContent><DialogHeader><DialogTitle>Registrar folga, férias ou atestado</DialogTitle></DialogHeader><p className="text-sm text-slate-500">O período ficará auditado e não será contabilizado como falta ou atraso no relatório mensal.</p><div className="grid grid-cols-2 gap-3"><div className="col-span-2"><Label>Recepcionista</Label><Select value={ocorrencia.usuarioId} onValueChange={(usuarioId) => setOcorrencia((atual) => ({ ...atual, usuarioId }))}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{recepcionistas.data?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Tipo</Label><Select value={ocorrencia.tipo} onValueChange={(tipo: any) => setOcorrencia((atual) => ({ ...atual, tipo }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="folga">Folga</SelectItem><SelectItem value="ferias">Férias</SelectItem><SelectItem value="atestado">Atestado</SelectItem></SelectContent></Select></div><div><Label>Início</Label><Input type="date" value={ocorrencia.dataInicio} onChange={(e) => setOcorrencia((atual) => ({ ...atual, dataInicio: e.target.value }))} /></div><div><Label>Fim</Label><Input type="date" value={ocorrencia.dataFim} onChange={(e) => setOcorrencia((atual) => ({ ...atual, dataFim: e.target.value }))} /></div></div><div><Label>Observação</Label><Textarea value={ocorrencia.observacao} onChange={(e) => setOcorrencia((atual) => ({ ...atual, observacao: e.target.value }))} placeholder="Ex.: férias programadas, atestado médico ou folga compensatória" /></div><DialogFooter><Button variant="outline" onClick={() => setOcorrenciaAberta(false)}>Cancelar</Button><Button disabled={!ocorrencia.usuarioId || registrarOcorrencia.isPending} onClick={() => registrarOcorrencia.mutate({ ...ocorrencia, usuarioId: Number(ocorrencia.usuarioId), observacao: ocorrencia.observacao.trim() || undefined })}>Registrar ocorrência</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(ajuste)} onOpenChange={(aberto) => !aberto && setAjuste(null)}><DialogContent><DialogHeader><DialogTitle>Ajustar marcações</DialogTitle></DialogHeader><div className="grid grid-cols-2 gap-3">{(['entrada', 'inicioIntervalo', 'fimIntervalo', 'saida'] as const).map((campo) => <div key={campo}><Label className="capitalize">{campo.replace(/([A-Z])/g, ' $1')}</Label><Input type="time" value={ajuste?.[campo] || ''} onChange={(e) => setAjuste((atual: any) => ({ ...atual, [campo]: e.target.value || null }))} /></div>)}</div><div><Label>Justificativa obrigatória</Label><Textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} placeholder="Explique a correção para a auditoria" /></div><DialogFooter><Button variant="outline" onClick={() => setAjuste(null)}>Cancelar</Button><Button disabled={justificativa.trim().length < 5 || ajustar.isPending} onClick={() => ajustar.mutate({ registroId: ajuste.id, entrada: ajuste.entrada || null, inicioIntervalo: ajuste.inicioIntervalo || null, fimIntervalo: ajuste.fimIntervalo || null, saida: ajuste.saida || null, justificativa })}>Salvar ajuste</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
