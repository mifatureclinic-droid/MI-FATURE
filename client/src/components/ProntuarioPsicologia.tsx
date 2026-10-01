import { getHojeBrasilia } from '../lib/utils';
import { useState } from 'react';
import { Save, FileText, Brain, AlertCircle, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface ProntuarioPsicologiaProps {
  tipoRegistro?: 'anamnese' | 'continuidade';
  onSave?: (dados: { queixa: string; diagnostico: string; tratamento: string; observacoes: string }) => Promise<void>;
  isSaving?: boolean;
}

export function validarCamposObrigatoriosContinuidade(dados: {
  modalidadeAtendimento: string;
  tipoSessao: string;
  queixaPrincipal: string;
  intervencoes: string;
}): string | null {
  const faltantes = [
    !dados.modalidadeAtendimento && 'Modalidade',
    !dados.tipoSessao && 'Sessão',
    !dados.queixaPrincipal?.trim() && 'Queixa principal/Demanda',
  ].filter(Boolean);

  return faltantes.length > 0 ? `Preencha: ${faltantes.join(', ')}.` : null;
}

export function ProntuarioPsicologia({ tipoRegistro = 'continuidade', onSave, isSaving }: ProntuarioPsicologiaProps) {
  const [prontuario, setProntuario] = useState({
    // Identificação - Conforme Resolução CFP 01/2009 e 11/2018
    dataAtendimento: getHojeBrasilia(),
    horaAtendimento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    numeroSessao: 1,
    modalidadeAtendimento: '',
    tipoSessao: '',
    modalidadeGrupo: 'individual',
    
    // Dados da Demanda
    queixaPrincipal: '',
    motivoEncaminhamento: '',
    encaminhadoPor: '',
    historicoQueixa: '',
    expectativasTratamento: '',
    
    // Anamnese Psicológica
    historiaVida: '',
    desenvolvimentoPsicomotor: '',
    historiaFamiliar: '',
    relacionamentosInterpessoais: '',
    vidaProfissional: '',
    vidaEscolar: '',
    
    // Histórico de Saúde Mental
    tratamentosAnteriores: '',
    hospitalizacoesPsiquiatricas: '',
    medicamentosUso: '',
    usoSubstancias: '',
    
    // Avaliação Psicológica
    aparenciaComportamento: '',
    estadoConsciencia: 'alerta',
    orientacao: 'orientado',
    atencaoConcentracao: '',
    memoria: '',
    linguagem: '',
    pensamento: '',
    humor: '',
    afeto: '',
    sensopercecao: '',
    juizoCritico: 'preservado',
    
    // Instrumentos Utilizados (se aplicável)
    testesAplicados: '',
    resultadosAvaliacoes: '',
    
    // Hipótese Diagnóstica
    hipoteseDiagnostica: '',
    cid10: '',
    
    // Plano Terapêutico
    abordagemTeorica: '',
    objetivosGerais: '',
    objetivosEspecificos: '',
    estrategiasIntervencao: '',
    frequenciaSessoes: '',
    duracaoEstimada: '',
    
    // Evolução da Sessão
    conteudoSessao: '',
    intervencoes: '',
    respostaCliente: '',
    observacoesRelevantes: '',
    historiaProgressiva: '',
    aspectosClinicosObservados: '',
    validacaoRisco: '',
    qualidadeSono: '',
    saudeSocial: '',
    
    // Planejamento
    tarefasCasa: '',
    proximosPassos: '',
    necessidadeEncaminhamento: '',
    
    // Sigilo e Ética
    consentimentoInformado: false,
    autorizacaoCompartilhamento: false,
  });

  const handleChange = (field: string, value: any) => {
    setProntuario(prev => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    const mensagemObrigatoriedade = tipoRegistro === 'continuidade'
      ? validarCamposObrigatoriosContinuidade(prontuario)
      : (!prontuario.queixaPrincipal.trim() ? 'Preencha Queixa principal/Demanda.' : null);

    if (mensagemObrigatoriedade) {
      toast.error(mensagemObrigatoriedade);
      return;
    }
    if (!prontuario.consentimentoInformado) {
      toast.warning('Importante: Registre o consentimento informado do cliente');
      return;
    }
    if (onSave) {
      // Montar campos consolidados para salvar no banco
      const continuidade = tipoRegistro === 'continuidade';
      const queixa = continuidade
        ? [`Queixa principal/Demanda: ${prontuario.queixaPrincipal}`, prontuario.historiaProgressiva && `História progressiva: ${prontuario.historiaProgressiva}`].filter(Boolean).join('\n\n')
        : [prontuario.queixaPrincipal, prontuario.motivoEncaminhamento && `Motivo: ${prontuario.motivoEncaminhamento}`, prontuario.historicoQueixa && `Histórico: ${prontuario.historicoQueixa}`].filter(Boolean).join('\n\n');
      const diagnostico = continuidade
        ? [prontuario.validacaoRisco && `Validação de risco: ${prontuario.validacaoRisco}`].filter(Boolean).join('\n')
        : [prontuario.hipoteseDiagnostica, prontuario.cid10 && `CID-10: ${prontuario.cid10}`].filter(Boolean).join('\n');
      const tratamento = continuidade
        ? [`Modalidade: ${prontuario.modalidadeAtendimento}`, `Sessão: ${prontuario.tipoSessao}`, prontuario.intervencoes && `Técnica aplicada: ${prontuario.intervencoes}`].filter(Boolean).join('\n\n')
        : [prontuario.abordagemTeorica && `Abordagem: ${prontuario.abordagemTeorica}`, prontuario.objetivosGerais && `Objetivos: ${prontuario.objetivosGerais}`, prontuario.estrategiasIntervencao && `Estratégias: ${prontuario.estrategiasIntervencao}`, prontuario.conteudoSessao && `Sessão: ${prontuario.conteudoSessao}`, prontuario.intervencoes && `Intervenções: ${prontuario.intervencoes}`].filter(Boolean).join('\n\n');
      const observacoes = continuidade
        ? [prontuario.aspectosClinicosObservados && `Aspectos clínicos observados: ${prontuario.aspectosClinicosObservados}`, prontuario.qualidadeSono && `Qualidade do sono: ${prontuario.qualidadeSono}`, prontuario.saudeSocial && `Saúde social: ${prontuario.saudeSocial}`].filter(Boolean).join('\n\n')
        : [prontuario.observacoesRelevantes, prontuario.proximosPassos && `Próximos passos: ${prontuario.proximosPassos}`, prontuario.tarefasCasa && `Tarefas: ${prontuario.tarefasCasa}`].filter(Boolean).join('\n\n');
      await onSave({ queixa, diagnostico, tratamento, observacoes });
    } else {
      toast.success('Prontuário de Psicologia salvo com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações do Conselho */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm mb-1">Prontuário Psicológico - Conforme CFP</h3>
            <p className="text-sm text-gray-700">
              Resolução CFP nº 01/2009 - Prontuário | Resolução CFP nº 11/2018 - Atendimento Online | 
              Código de Ética Profissional do Psicólogo
            </p>
          </div>
        </div>
      </div>

      {/* Aviso de Sigilo */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <strong>SIGILO PROFISSIONAL:</strong> Todas as informações contidas neste prontuário são 
            protegidas pelo sigilo profissional (Art. 9º do Código de Ética). O compartilhamento de 
            informações só pode ocorrer com autorização expressa do cliente ou responsável legal.
          </div>
        </div>
      </div>

      {tipoRegistro === 'continuidade' ? (
        <section className="space-y-5 rounded-xl border border-[#a7ad79] bg-[#fbfcf5] p-6 shadow-sm">
          <div className="border-b border-[#d9dfb9] pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6937]">Continuidade de sessão</p>
            <p className="mt-1 text-sm text-slate-600">Os campos com asterisco são obrigatórios para salvar a continuidade.</p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[#d6ddb1] bg-white p-3">
            <input type="checkbox" id="consentimento-continuidade" checked={prontuario.consentimentoInformado} onChange={(event) => handleChange('consentimentoInformado', event.target.checked)} className="h-4 w-4 accent-[#727d42]" />
            <Label htmlFor="consentimento-continuidade" className="cursor-pointer text-sm">Consentimento informado obtido e registrado *</Label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="rounded-lg border border-[#d6ddb1] bg-white p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">Modalidade *</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {['Presencial', 'Online'].map((opcao) => (
                  <label key={opcao} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input type="radio" name="modalidadeAtendimento" value={opcao} checked={prontuario.modalidadeAtendimento === opcao} onChange={(event) => handleChange('modalidadeAtendimento', event.target.value)} className="h-4 w-4 accent-[#727d42]" />
                    {opcao}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="rounded-lg border border-[#d6ddb1] bg-white p-4">
              <legend className="px-1 text-sm font-semibold text-slate-800">Sessão *</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {['Sequência', 'Reposição'].map((opcao) => (
                  <label key={opcao} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input type="radio" name="tipoSessao" value={opcao} checked={prontuario.tipoSessao === opcao} onChange={(event) => handleChange('tipoSessao', event.target.value)} className="h-4 w-4 accent-[#727d42]" />
                    {opcao}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label>Queixa principal/Demanda *</Label>
              <Textarea value={prontuario.queixaPrincipal} onChange={(event) => handleChange('queixaPrincipal', event.target.value)} placeholder="Demanda relatada ou foco da sessão" rows={3} className="mt-2" />
            </div>
            <div>
              <Label>Técnica aplicada</Label>
              <Textarea value={prontuario.intervencoes} onChange={(event) => handleChange('intervencoes', event.target.value)} placeholder="Técnica, intervenção ou recurso aplicado" rows={3} className="mt-2" />
            </div>
            <div>
              <Label>História progressiva</Label>
              <Textarea value={prontuario.historiaProgressiva} onChange={(event) => handleChange('historiaProgressiva', event.target.value)} placeholder="Evolução relatada desde a sessão anterior" rows={3} className="mt-2" />
            </div>
            <div>
              <Label>Aspectos clínicos observados</Label>
              <Textarea value={prontuario.aspectosClinicosObservados} onChange={(event) => handleChange('aspectosClinicosObservados', event.target.value)} placeholder="Sinais, comportamentos e observações clinicamente relevantes" rows={3} className="mt-2" />
            </div>
            <div>
              <Label>Validação de risco</Label>
              <Textarea value={prontuario.validacaoRisco} onChange={(event) => handleChange('validacaoRisco', event.target.value)} placeholder="Avaliação e conduta de risco, quando aplicável" rows={3} className="mt-2" />
            </div>
            <div>
              <Label>Qualidade do sono</Label>
              <Textarea value={prontuario.qualidadeSono} onChange={(event) => handleChange('qualidadeSono', event.target.value)} placeholder="Relato ou observação sobre o sono" rows={3} className="mt-2" />
            </div>
            <div className="lg:col-span-2">
              <Label>Saúde social</Label>
              <Textarea value={prontuario.saudeSocial} onChange={(event) => handleChange('saudeSocial', event.target.value)} placeholder="Rede de apoio, relações, trabalho, escola e participação social" rows={3} className="mt-2" />
            </div>
          </div>

          <div className="sticky bottom-4 flex justify-end border-t border-[#d9dfb9] bg-[#fbfcf5]/95 pt-4 backdrop-blur">
            <Button onClick={handleSalvar} disabled={isSaving} className="gap-2 bg-[#5f6937] hover:bg-[#4c552b]">
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar continuidade'}
            </Button>
          </div>
        </section>
      ) : (
        <>
      {/* Identificação da Sessão */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Identificação da Sessão
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>Data *</Label>
            <Input 
              type="date"
              value={prontuario.dataAtendimento}
              onChange={(e) => handleChange('dataAtendimento', e.target.value)}
            />
          </div>
          <div>
            <Label>Horário *</Label>
            <Input 
              type="time"
              value={prontuario.horaAtendimento}
              onChange={(e) => handleChange('horaAtendimento', e.target.value)}
            />
          </div>
          <div>
            <Label>Sessão Nº</Label>
            <Input 
              type="number"
              value={prontuario.numeroSessao}
              onChange={(e) => handleChange('numeroSessao', e.target.value)}
            />
          </div>
          <div>
            <Label>Modalidade</Label>
            <Select 
              value={prontuario.modalidadeGrupo}
              onValueChange={(value) => handleChange('modalidadeGrupo', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="casal">Casal</SelectItem>
                <SelectItem value="familia">Família</SelectItem>
                <SelectItem value="grupo">Grupo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="consentimento"
              checked={prontuario.consentimentoInformado}
              onChange={(e) => handleChange('consentimentoInformado', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="consentimento" className="cursor-pointer text-sm">
              Consentimento Informado obtido e registrado *
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="autorizacao"
              checked={prontuario.autorizacaoCompartilhamento}
              onChange={(e) => handleChange('autorizacaoCompartilhamento', e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="autorizacao" className="cursor-pointer text-sm">
              Cliente autorizou compartilhamento de informações (quando aplicável)
            </Label>
          </div>
        </div>
      </div>

      {/* Demanda e Queixa */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Demanda e Queixa Principal</h3>
        <div className="space-y-4">
          <div>
            <Label>Queixa Principal *</Label>
            <Textarea 
              value={prontuario.queixaPrincipal}
              onChange={(e) => handleChange('queixaPrincipal', e.target.value)}
              placeholder="Descreva a queixa trazida pelo cliente com suas próprias palavras"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Motivo do Encaminhamento</Label>
              <Input 
                value={prontuario.motivoEncaminhamento}
                onChange={(e) => handleChange('motivoEncaminhamento', e.target.value)}
                placeholder="Se houver encaminhamento"
              />
            </div>
            <div>
              <Label>Encaminhado Por</Label>
              <Input 
                value={prontuario.encaminhadoPor}
                onChange={(e) => handleChange('encaminhadoPor', e.target.value)}
                placeholder="Profissional/instituição"
              />
            </div>
          </div>

          <div>
            <Label>Histórico da Queixa</Label>
            <Textarea 
              value={prontuario.historicoQueixa}
              onChange={(e) => handleChange('historicoQueixa', e.target.value)}
              placeholder="Como e quando a queixa começou, evolução ao longo do tempo"
              rows={3}
            />
          </div>

          <div>
            <Label>Expectativas em Relação ao Tratamento</Label>
            <Textarea 
              value={prontuario.expectativasTratamento}
              onChange={(e) => handleChange('expectativasTratamento', e.target.value)}
              placeholder="O que o cliente espera alcançar com o processo terapêutico"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Anamnese Psicológica */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Anamnese Psicológica</h3>
        <div className="space-y-4">
          <div>
            <Label>História de Vida</Label>
            <Textarea 
              value={prontuario.historiaVida}
              onChange={(e) => handleChange('historiaVida', e.target.value)}
              placeholder="Principais eventos e marcos da história de vida"
              rows={3}
            />
          </div>

          <div>
            <Label>Desenvolvimento Psicomotor (quando aplicável)</Label>
            <Textarea 
              value={prontuario.desenvolvimentoPsicomotor}
              onChange={(e) => handleChange('desenvolvimentoPsicomotor', e.target.value)}
              placeholder="Para casos infantis: desenvolvimento motor, linguagem, social"
              rows={2}
            />
          </div>

          <div>
            <Label>História Familiar</Label>
            <Textarea 
              value={prontuario.historiaFamiliar}
              onChange={(e) => handleChange('historiaFamiliar', e.target.value)}
              placeholder="Composição familiar, dinâmica, relacionamentos"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Relacionamentos Interpessoais</Label>
              <Textarea 
                value={prontuario.relacionamentosInterpessoais}
                onChange={(e) => handleChange('relacionamentosInterpessoais', e.target.value)}
                placeholder="Relações sociais, afetivas, sexuais"
                rows={2}
              />
            </div>
            <div>
              <Label>Vida Profissional</Label>
              <Textarea 
                value={prontuario.vidaProfissional}
                onChange={(e) => handleChange('vidaProfissional', e.target.value)}
                placeholder="Ocupação, satisfação, relações no trabalho"
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label>Vida Escolar/Acadêmica</Label>
            <Textarea 
              value={prontuario.vidaEscolar}
              onChange={(e) => handleChange('vidaEscolar', e.target.value)}
              placeholder="Histórico escolar, dificuldades, adaptação"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Histórico de Saúde Mental */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Histórico de Saúde Mental</h3>
        <div className="space-y-4">
          <div>
            <Label>Tratamentos Psicológicos/Psiquiátricos Anteriores</Label>
            <Textarea 
              value={prontuario.tratamentosAnteriores}
              onChange={(e) => handleChange('tratamentosAnteriores', e.target.value)}
              placeholder="Descreva tratamentos anteriores, período, resultados"
              rows={2}
            />
          </div>

          <div>
            <Label>Hospitalizações Psiquiátricas</Label>
            <Input 
              value={prontuario.hospitalizacoesPsiquiatricas}
              onChange={(e) => handleChange('hospitalizacoesPsiquiatricas', e.target.value)}
              placeholder="Se houver, descrever quando e motivo"
            />
          </div>

          <div>
            <Label>Medicamentos em Uso</Label>
            <Textarea 
              value={prontuario.medicamentosUso}
              onChange={(e) => handleChange('medicamentosUso', e.target.value)}
              placeholder="Medicações psiquiátricas ou outras relevantes, dosagem, prescritor"
              rows={2}
            />
          </div>

          <div>
            <Label>Uso de Substâncias</Label>
            <Textarea 
              value={prontuario.usoSubstancias}
              onChange={(e) => handleChange('usoSubstancias', e.target.value)}
              placeholder="Álcool, tabaco, drogas - frequência e padrão de uso"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Exame do Estado Mental */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Exame do Estado Mental</h3>
        <div className="space-y-4">
          <div>
            <Label>Aparência e Comportamento</Label>
            <Textarea 
              value={prontuario.aparenciaComportamento}
              onChange={(e) => handleChange('aparenciaComportamento', e.target.value)}
              placeholder="Apresentação, higiene, postura, contato visual, agitação/retardo"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Estado de Consciência</Label>
              <Select 
                value={prontuario.estadoConsciencia}
                onValueChange={(value) => handleChange('estadoConsciencia', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alerta">Alerta</SelectItem>
                  <SelectItem value="sonolento">Sonolento</SelectItem>
                  <SelectItem value="confuso">Confuso</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Orientação</Label>
              <Select 
                value={prontuario.orientacao}
                onValueChange={(value) => handleChange('orientacao', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orientado">Orientado (tempo/espaço/pessoa)</SelectItem>
                  <SelectItem value="parcial">Parcialmente orientado</SelectItem>
                  <SelectItem value="desorientado">Desorientado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Juízo Crítico</Label>
              <Select 
                value={prontuario.juizoCritico}
                onValueChange={(value) => handleChange('juizoCritico', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preservado">Preservado</SelectItem>
                  <SelectItem value="parcial">Parcialmente comprometido</SelectItem>
                  <SelectItem value="comprometido">Comprometido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Atenção e Concentração</Label>
              <Input 
                value={prontuario.atencaoConcentracao}
                onChange={(e) => handleChange('atencaoConcentracao', e.target.value)}
                placeholder="Preservada / Comprometida - descrever"
              />
            </div>
            <div>
              <Label>Memória</Label>
              <Input 
                value={prontuario.memoria}
                onChange={(e) => handleChange('memoria', e.target.value)}
                placeholder="Recente e remota"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Linguagem</Label>
              <Input 
                value={prontuario.linguagem}
                onChange={(e) => handleChange('linguagem', e.target.value)}
                placeholder="Fluência, coerência, compreensão"
              />
            </div>
            <div>
              <Label>Pensamento</Label>
              <Input 
                value={prontuario.pensamento}
                onChange={(e) => handleChange('pensamento', e.target.value)}
                placeholder="Curso, forma, conteúdo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Humor</Label>
              <Input 
                value={prontuario.humor}
                onChange={(e) => handleChange('humor', e.target.value)}
                placeholder="Eutímico, deprimido, ansioso, eufórico"
              />
            </div>
            <div>
              <Label>Afeto</Label>
              <Input 
                value={prontuario.afeto}
                onChange={(e) => handleChange('afeto', e.target.value)}
                placeholder="Adequado, embotado, lábil, incongruente"
              />
            </div>
          </div>

          <div>
            <Label>Sensopercepção</Label>
            <Input 
              value={prontuario.sensopercecao}
              onChange={(e) => handleChange('sensopercecao', e.target.value)}
              placeholder="Alucinações, ilusões - se presentes, descrever"
            />
          </div>
        </div>
      </div>

      {/* Avaliação Psicológica */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Avaliação Psicológica</h3>
        <div className="space-y-4">
          <div>
            <Label>Testes e Instrumentos Aplicados</Label>
            <Textarea 
              value={prontuario.testesAplicados}
              onChange={(e) => handleChange('testesAplicados', e.target.value)}
              placeholder="Se aplicável: listar testes psicológicos, escalas, inventários utilizados"
              rows={2}
            />
          </div>

          <div>
            <Label>Resultados das Avaliações</Label>
            <Textarea 
              value={prontuario.resultadosAvaliacoes}
              onChange={(e) => handleChange('resultadosAvaliacoes', e.target.value)}
              placeholder="Síntese dos resultados obtidos nos instrumentos"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Hipótese Diagnóstica */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Hipótese Diagnóstica</h3>
        <div className="space-y-4">
          <div>
            <Label>Hipótese Diagnóstica</Label>
            <Textarea 
              value={prontuario.hipoteseDiagnostica}
              onChange={(e) => handleChange('hipoteseDiagnostica', e.target.value)}
              placeholder="Formulação diagnóstica baseada na avaliação (opcional, conforme abordagem)"
              rows={2}
            />
          </div>

          <div>
            <Label>CID-10 (se aplicável)</Label>
            <Input 
              value={prontuario.cid10}
              onChange={(e) => handleChange('cid10', e.target.value)}
              placeholder="Ex: F41.1 - Ansiedade Generalizada"
            />
          </div>
        </div>
      </div>

      {/* Plano Terapêutico */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Plano Terapêutico</h3>
        <div className="space-y-4">
          <div>
            <Label>Abordagem Teórica</Label>
            <Input 
              value={prontuario.abordagemTeorica}
              onChange={(e) => handleChange('abordagemTeorica', e.target.value)}
              placeholder="Ex: Psicanálise, TCC, Humanista, Sistêmica, Gestalt, etc."
            />
          </div>

          <div>
            <Label>Objetivos Gerais do Tratamento</Label>
            <Textarea 
              value={prontuario.objetivosGerais}
              onChange={(e) => handleChange('objetivosGerais', e.target.value)}
              placeholder="Objetivos amplos a serem alcançados no processo terapêutico"
              rows={2}
            />
          </div>

          <div>
            <Label>Objetivos Específicos</Label>
            <Textarea 
              value={prontuario.objetivosEspecificos}
              onChange={(e) => handleChange('objetivosEspecificos', e.target.value)}
              placeholder="Metas específicas e mensuráveis"
              rows={2}
            />
          </div>

          <div>
            <Label>Estratégias de Intervenção</Label>
            <Textarea 
              value={prontuario.estrategiasIntervencao}
              onChange={(e) => handleChange('estrategiasIntervencao', e.target.value)}
              placeholder="Técnicas e intervenções planejadas"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frequência das Sessões</Label>
              <Select 
                value={prontuario.frequenciaSessoes}
                onValueChange={(value) => handleChange('frequenciaSessoes', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x">1x por semana</SelectItem>
                  <SelectItem value="2x">2x por semana</SelectItem>
                  <SelectItem value="3x">3x por semana</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duração Estimada do Tratamento</Label>
              <Input 
                value={prontuario.duracaoEstimada}
                onChange={(e) => handleChange('duracaoEstimada', e.target.value)}
                placeholder="Ex: 6 meses, 1 ano, processo aberto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Evolução da Sessão */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Evolução da Sessão</h3>
        <div className="space-y-4">
          <div>
            <Label>Conteúdo Trabalhado na Sessão</Label>
            <Textarea 
              value={prontuario.conteudoSessao}
              onChange={(e) => handleChange('conteudoSessao', e.target.value)}
              placeholder="Temas abordados, assuntos trazidos pelo cliente"
              rows={3}
            />
          </div>

          <div>
            <Label>Intervenções Realizadas</Label>
            <Textarea 
              value={prontuario.intervencoes}
              onChange={(e) => handleChange('intervencoes', e.target.value)}
              placeholder="Técnicas utilizadas, interpretações, reflexões propostas"
              rows={2}
            />
          </div>

          <div>
            <Label>Resposta do Cliente</Label>
            <Textarea 
              value={prontuario.respostaCliente}
              onChange={(e) => handleChange('respostaCliente', e.target.value)}
              placeholder="Como o cliente reagiu às intervenções, insights, resistências"
              rows={2}
            />
          </div>

          <div>
            <Label>Observações Relevantes</Label>
            <Textarea 
              value={prontuario.observacoesRelevantes}
              onChange={(e) => handleChange('observacoesRelevantes', e.target.value)}
              placeholder="Qualquer informação clinicamente relevante"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Planejamento */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Planejamento e Encaminhamentos</h3>
        <div className="space-y-4">
          <div>
            <Label>Tarefas para Casa</Label>
            <Textarea 
              value={prontuario.tarefasCasa}
              onChange={(e) => handleChange('tarefasCasa', e.target.value)}
              placeholder="Exercícios, reflexões ou atividades propostas entre sessões"
              rows={2}
            />
          </div>

          <div>
            <Label>Próximos Passos</Label>
            <Textarea 
              value={prontuario.proximosPassos}
              onChange={(e) => handleChange('proximosPassos', e.target.value)}
              placeholder="Planejamento para as próximas sessões"
              rows={2}
            />
          </div>

          <div>
            <Label>Necessidade de Encaminhamento</Label>
            <Textarea 
              value={prontuario.necessidadeEncaminhamento}
              onChange={(e) => handleChange('necessidadeEncaminhamento', e.target.value)}
              placeholder="Se necessário encaminhamento para psiquiatria, neurologia, outros profissionais"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 sticky bottom-4 bg-white border rounded-lg p-4 shadow-lg">
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Pré-visualizar
        </Button>
        <Button onClick={handleSalvar} className="bg-purple-600 hover:bg-purple-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Prontuário
        </Button>
      </div>

      {/* Aviso Legal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="mb-2"><strong>Importante - CFP:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>O prontuário deve conter apenas informações necessárias ao trabalho psicológico</li>
              <li>Deve ser mantido em local que garanta sigilo e privacidade</li>
              <li>Registro do número do CRP do profissional é obrigatório</li>
              <li>Prontuários devem ser guardados por no mínimo 5 anos</li>
              <li>Consentimento informado é obrigatório (Resolução CFP 01/2009)</li>
              <li>O cliente tem direito ao acesso às informações (com possíveis restrições técnicas)</li>
            </ul>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
