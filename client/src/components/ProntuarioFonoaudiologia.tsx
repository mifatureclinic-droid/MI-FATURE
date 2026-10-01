import { getHojeBrasilia } from '../lib/utils';
import { useState } from 'react';
import { Save, FileText, Mic, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface ProntuarioFonoaudiologiaProps {
  onSave?: (dados: { queixa: string; diagnostico: string; tratamento: string; observacoes: string }) => Promise<void>;
  isSaving?: boolean;
}

export function ProntuarioFonoaudiologia({ onSave, isSaving }: ProntuarioFonoaudiologiaProps) {
  const [prontuario, setProntuario] = useState({
    // Identificação - Conforme Resolução CFFa 366/2009
    dataAtendimento: getHojeBrasilia(),
    horaAtendimento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    numeroSessao: 1,
    tipoAtendimento: 'avaliacao', // avaliacao, terapia, reavaliacao
    
    // Dados da Queixa
    queixaPrincipal: '',
    informante: '',
    encaminhamento: '',
    profissionalEncaminhador: '',
    
    // História Clínica
    historiaQueixa: '',
    antecedentesPessoais: '',
    antecedentesFamiliares: '',
    desenvolvimentoNeuropsicomotor: '',
    
    // Área de Linguagem
    linguagemOral: '',
    linguagemEscrita: '',
    compreensaoLinguagem: '',
    expressaoLinguagem: '',
    aspectosPragmaticos: '',
    
    // Área de Voz
    qualidadeVocal: '',
    pitch: '',
    loudness: '',
    ressonancia: '',
    ataque: '',
    coordenacaoPneumofonoarticulatoria: '',
    tempoMaximoFonacao: '',
    
    // Área de Motricidade Orofacial
    avaliacaoEstrutural: '',
    postura: '',
    mobilidade: '',
    tonus: '',
    funcaoMastigacao: '',
    funcaoDeglutição: '',
    funcaoRespiracao: '',
    
    // Área de Audição
    avaliacaoAuditiva: '',
    queixaAuditiva: '',
    examesAudiologicos: '',
    comportamentoAuditivo: '',
    processamentoAuditivo: '',
    
    // Área de Fala/Articulação
    articulacao: '',
    fonologia: '',
    fluencia: '',
    prosódia: '',
    
    // Hipótese Diagnóstica
    hipoteseDiagnostica: '',
    cid10: '',
    classificacao: '',
    
    // Objetivos Terapêuticos
    objetivoGeral: '',
    objetivosEspecificos: '',
    
    // Plano Terapêutico
    condutaTerapeutica: '',
    tecnicasUtilizadas: '',
    recursosUtilizados: '',
    frequenciaSemanal: '',
    duracaoSessao: '45',
    duracaoEstimada: '',
    
    // Evolução da Sessão
    atividadesRealizadas: '',
    desempenho: '',
    respostaEstimulos: '',
    comportamento: '',
    intercorrencias: '',
    
    // Orientações
    orientacoesFamilia: '',
    orientacoesEscolares: '',
    tarefasCasa: '',
    
    // Encaminhamentos
    necessidadeEncaminhamento: '',
  });

  const handleChange = (field: string, value: any) => {
    setProntuario(prev => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    if (!prontuario.queixaPrincipal) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (onSave) {
      const queixa = [prontuario.queixaPrincipal, prontuario.historiaQueixa && `História: ${prontuario.historiaQueixa}`, prontuario.encaminhamento && `Encaminhamento: ${prontuario.encaminhamento}`].filter(Boolean).join('\n\n');
      const diagnostico = [prontuario.hipoteseDiagnostica, prontuario.cid10 && `CID-10: ${prontuario.cid10}`, prontuario.classificacao && `Classificação: ${prontuario.classificacao}`].filter(Boolean).join('\n');
      const tratamento = [prontuario.condutaTerapeutica && `Conduta: ${prontuario.condutaTerapeutica}`, prontuario.tecnicasUtilizadas && `Técnicas: ${prontuario.tecnicasUtilizadas}`, prontuario.atividadesRealizadas && `Atividades: ${prontuario.atividadesRealizadas}`, prontuario.objetivoGeral && `Objetivo: ${prontuario.objetivoGeral}`].filter(Boolean).join('\n\n');
      const observacoes = [prontuario.desempenho && `Desempenho: ${prontuario.desempenho}`, prontuario.orientacoesFamilia && `Orientações: ${prontuario.orientacoesFamilia}`, prontuario.intercorrencias && `Intercorrências: ${prontuario.intercorrencias}`].filter(Boolean).join('\n\n');
      await onSave({ queixa, diagnostico, tratamento, observacoes });
    } else {
      toast.success('Prontuário de Fonoaudiologia salvo com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações do Conselho */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Mic className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm mb-1">Prontuário Fonoaudiológico - Conforme CFFa</h3>
            <p className="text-sm text-gray-700">
              Resolução CFFa nº 366/2009 - Prontuário Fonoaudiológico | 
              Código de Ética da Fonoaudiologia
            </p>
          </div>
        </div>
      </div>

      {/* Identificação da Sessão */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          Identificação do Atendimento
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
            <Label>Tipo de Atendimento</Label>
            <Select 
              value={prontuario.tipoAtendimento}
              onValueChange={(value) => handleChange('tipoAtendimento', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avaliacao">Avaliação Inicial</SelectItem>
                <SelectItem value="terapia">Sessão Terapêutica</SelectItem>
                <SelectItem value="reavaliacao">Reavaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sessão Nº</Label>
            <Input 
              type="number"
              value={prontuario.numeroSessao}
              onChange={(e) => handleChange('numeroSessao', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Queixa e Encaminhamento */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Queixa e Encaminhamento</h3>
        <div className="space-y-4">
          <div>
            <Label>Queixa Principal *</Label>
            <Textarea 
              value={prontuario.queixaPrincipal}
              onChange={(e) => handleChange('queixaPrincipal', e.target.value)}
              placeholder="Descreva a queixa conforme relatada"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Informante</Label>
              <Input 
                value={prontuario.informante}
                onChange={(e) => handleChange('informante', e.target.value)}
                placeholder="Quem forneceu as informações"
              />
            </div>
            <div>
              <Label>Motivo do Encaminhamento</Label>
              <Input 
                value={prontuario.encaminhamento}
                onChange={(e) => handleChange('encaminhamento', e.target.value)}
                placeholder="Se houver encaminhamento"
              />
            </div>
          </div>

          <div>
            <Label>Profissional que Encaminhou</Label>
            <Input 
              value={prontuario.profissionalEncaminhador}
              onChange={(e) => handleChange('profissionalEncaminhador', e.target.value)}
              placeholder="Médico, professor, psicólogo, etc."
            />
          </div>
        </div>
      </div>

      {/* História Clínica */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">História Clínica</h3>
        <div className="space-y-4">
          <div>
            <Label>História da Queixa</Label>
            <Textarea 
              value={prontuario.historiaQueixa}
              onChange={(e) => handleChange('historiaQueixa', e.target.value)}
              placeholder="Como e quando iniciou, evolução, tratamentos anteriores"
              rows={3}
            />
          </div>

          <div>
            <Label>Antecedentes Pessoais</Label>
            <Textarea 
              value={prontuario.antecedentesPessoais}
              onChange={(e) => handleChange('antecedentesPessoais', e.target.value)}
              placeholder="Gestação, parto, doenças, cirurgias, uso de medicamentos"
              rows={2}
            />
          </div>

          <div>
            <Label>Antecedentes Familiares</Label>
            <Textarea 
              value={prontuario.antecedentesFamiliares}
              onChange={(e) => handleChange('antecedentesFamiliares', e.target.value)}
              placeholder="Histórico familiar de alterações de fala, linguagem, audição"
              rows={2}
            />
          </div>

          <div>
            <Label>Desenvolvimento Neuropsicomotor</Label>
            <Textarea 
              value={prontuario.desenvolvimentoNeuropsicomotor}
              onChange={(e) => handleChange('desenvolvimentoNeuropsicomotor', e.target.value)}
              placeholder="Marcos do desenvolvimento: sentar, engatinhar, andar, primeiras palavras"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Avaliação de Linguagem */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Avaliação de Linguagem</h3>
        <div className="space-y-4">
          <div>
            <Label>Linguagem Oral</Label>
            <Textarea 
              value={prontuario.linguagemOral}
              onChange={(e) => handleChange('linguagemOral', e.target.value)}
              placeholder="Avaliação da expressão oral: vocabulário, estruturação frasal, narrativa"
              rows={2}
            />
          </div>

          <div>
            <Label>Linguagem Escrita</Label>
            <Textarea 
              value={prontuario.linguagemEscrita}
              onChange={(e) => handleChange('linguagemEscrita', e.target.value)}
              placeholder="Leitura e escrita: nível, dificuldades observadas"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Compreensão da Linguagem</Label>
              <Textarea 
                value={prontuario.compreensaoLinguagem}
                onChange={(e) => handleChange('compreensaoLinguagem', e.target.value)}
                placeholder="Capacidade de compreender ordens, textos, contextos"
                rows={2}
              />
            </div>
            <div>
              <Label>Expressão da Linguagem</Label>
              <Textarea 
                value={prontuario.expressaoLinguagem}
                onChange={(e) => handleChange('expressaoLinguagem', e.target.value)}
                placeholder="Capacidade expressiva, fluência, coerência"
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label>Aspectos Pragmáticos</Label>
            <Textarea 
              value={prontuario.aspectosPragmaticos}
              onChange={(e) => handleChange('aspectosPragmaticos', e.target.value)}
              placeholder="Uso funcional da linguagem, interação comunicativa, contexto social"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Avaliação de Voz */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Avaliação Vocal</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Qualidade Vocal</Label>
              <Input 
                value={prontuario.qualidadeVocal}
                onChange={(e) => handleChange('qualidadeVocal', e.target.value)}
                placeholder="Normal, rouca, áspera, soprosa, tensa"
              />
            </div>
            <div>
              <Label>Pitch (Frequência)</Label>
              <Input 
                value={prontuario.pitch}
                onChange={(e) => handleChange('pitch', e.target.value)}
                placeholder="Adequado, grave, agudo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Loudness (Intensidade)</Label>
              <Input 
                value={prontuario.loudness}
                onChange={(e) => handleChange('loudness', e.target.value)}
                placeholder="Adequada, aumentada, reduzida"
              />
            </div>
            <div>
              <Label>Ressonância</Label>
              <Input 
                value={prontuario.ressonancia}
                onChange={(e) => handleChange('ressonancia', e.target.value)}
                placeholder="Equilibrada, hipernasal, hiponasal"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ataque Vocal</Label>
              <Input 
                value={prontuario.ataque}
                onChange={(e) => handleChange('ataque', e.target.value)}
                placeholder="Isocrônico, brusco, soproso"
              />
            </div>
            <div>
              <Label>Tempo Máximo de Fonação (TMF)</Label>
              <Input 
                value={prontuario.tempoMaximoFonacao}
                onChange={(e) => handleChange('tempoMaximoFonacao', e.target.value)}
                placeholder="Em segundos: /a/, /i/, /s/, /z/"
              />
            </div>
          </div>

          <div>
            <Label>Coordenação Pneumofonoarticulatória</Label>
            <Input 
              value={prontuario.coordenacaoPneumofonoarticulatoria}
              onChange={(e) => handleChange('coordenacaoPneumofonoarticulatoria', e.target.value)}
              placeholder="Adequada ou alterada"
            />
          </div>
        </div>
      </div>

      {/* Motricidade Orofacial */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Motricidade Orofacial</h3>
        <div className="space-y-4">
          <div>
            <Label>Avaliação Estrutural</Label>
            <Textarea 
              value={prontuario.avaliacaoEstrutural}
              onChange={(e) => handleChange('avaliacaoEstrutural', e.target.value)}
              placeholder="Lábios, língua, palato, freios, arcadas dentárias, oclusão"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Postura</Label>
              <Textarea 
                value={prontuario.postura}
                onChange={(e) => handleChange('postura', e.target.value)}
                placeholder="Postura de lábios, língua, mandíbula em repouso"
                rows={2}
              />
            </div>
            <div>
              <Label>Mobilidade</Label>
              <Textarea 
                value={prontuario.mobilidade}
                onChange={(e) => handleChange('mobilidade', e.target.value)}
                placeholder="Mobilidade de lábios, língua, bochechas, véu palatino"
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label>Tônus Muscular</Label>
            <Input 
              value={prontuario.tonus}
              onChange={(e) => handleChange('tonus', e.target.value)}
              placeholder="Normal, aumentado, diminuído"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Mastigação</Label>
              <Input 
                value={prontuario.funcaoMastigacao}
                onChange={(e) => handleChange('funcaoMastigacao', e.target.value)}
                placeholder="Bilateral, unilateral, adequada"
              />
            </div>
            <div>
              <Label>Deglutição</Label>
              <Input 
                value={prontuario.funcaoDeglutição}
                onChange={(e) => handleChange('funcaoDeglutição', e.target.value)}
                placeholder="Normal, atípica, disfágica"
              />
            </div>
            <div>
              <Label>Respiração</Label>
              <Input 
                value={prontuario.funcaoRespiracao}
                onChange={(e) => handleChange('funcaoRespiracao', e.target.value)}
                placeholder="Nasal, oral, mista"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Avaliação Auditiva */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Avaliação Auditiva</h3>
        <div className="space-y-4">
          <div>
            <Label>Queixa Auditiva</Label>
            <Input 
              value={prontuario.queixaAuditiva}
              onChange={(e) => handleChange('queixaAuditiva', e.target.value)}
              placeholder="Se houver queixa relacionada à audição"
            />
          </div>

          <div>
            <Label>Exames Audiológicos Realizados</Label>
            <Textarea 
              value={prontuario.examesAudiologicos}
              onChange={(e) => handleChange('examesAudiologicos', e.target.value)}
              placeholder="Audiometria, imitanciometria, emissões otoacústicas, PEATE, etc."
              rows={2}
            />
          </div>

          <div>
            <Label>Comportamento Auditivo</Label>
            <Input 
              value={prontuario.comportamentoAuditivo}
              onChange={(e) => handleChange('comportamentoAuditivo', e.target.value)}
              placeholder="Respostas a estímulos auditivos"
            />
          </div>

          <div>
            <Label>Processamento Auditivo Central</Label>
            <Textarea 
              value={prontuario.processamentoAuditivo}
              onChange={(e) => handleChange('processamentoAuditivo', e.target.value)}
              placeholder="Se avaliado: memória auditiva, atenção, discriminação, localização sonora"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Fala e Articulação */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Fala e Articulação</h3>
        <div className="space-y-4">
          <div>
            <Label>Articulação dos Fonemas</Label>
            <Textarea 
              value={prontuario.articulacao}
              onChange={(e) => handleChange('articulacao', e.target.value)}
              placeholder="Fonemas alterados, omissões, substituições, distorções"
              rows={2}
            />
          </div>

          <div>
            <Label>Sistema Fonológico</Label>
            <Textarea 
              value={prontuario.fonologia}
              onChange={(e) => handleChange('fonologia', e.target.value)}
              placeholder="Processos fonológicos presentes"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fluência</Label>
              <Input 
                value={prontuario.fluencia}
                onChange={(e) => handleChange('fluencia', e.target.value)}
                placeholder="Presença de gagueira, taquifemia"
              />
            </div>
            <div>
              <Label>Prosódia</Label>
              <Input 
                value={prontuario.prosódia}
                onChange={(e) => handleChange('prosódia', e.target.value)}
                placeholder="Ritmo, entonação, velocidade de fala"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hipótese Diagnóstica */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Hipótese Diagnóstica Fonoaudiológica</h3>
        <div className="space-y-4">
          <div>
            <Label>Hipótese Diagnóstica</Label>
            <Textarea 
              value={prontuario.hipoteseDiagnostica}
              onChange={(e) => handleChange('hipoteseDiagnostica', e.target.value)}
              placeholder="Diagnóstico fonoaudiológico baseado na avaliação"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>CID-10 (se aplicável)</Label>
              <Input 
                value={prontuario.cid10}
                onChange={(e) => handleChange('cid10', e.target.value)}
                placeholder="Ex: R47.0 - Disfasia e afasia"
              />
            </div>
            <div>
              <Label>Classificação/Grau</Label>
              <Input 
                value={prontuario.classificacao}
                onChange={(e) => handleChange('classificacao', e.target.value)}
                placeholder="Leve, moderado, severo"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Objetivos e Plano Terapêutico */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Plano Terapêutico</h3>
        <div className="space-y-4">
          <div>
            <Label>Objetivo Geral</Label>
            <Textarea 
              value={prontuario.objetivoGeral}
              onChange={(e) => handleChange('objetivoGeral', e.target.value)}
              placeholder="Objetivo principal do tratamento"
              rows={2}
            />
          </div>

          <div>
            <Label>Objetivos Específicos</Label>
            <Textarea 
              value={prontuario.objetivosEspecificos}
              onChange={(e) => handleChange('objetivosEspecificos', e.target.value)}
              placeholder="Metas específicas a serem alcançadas"
              rows={2}
            />
          </div>

          <div>
            <Label>Conduta Terapêutica</Label>
            <Textarea 
              value={prontuario.condutaTerapeutica}
              onChange={(e) => handleChange('condutaTerapeutica', e.target.value)}
              placeholder="Abordagem terapêutica proposta"
              rows={2}
            />
          </div>

          <div>
            <Label>Técnicas Utilizadas</Label>
            <Textarea 
              value={prontuario.tecnicasUtilizadas}
              onChange={(e) => handleChange('tecnicasUtilizadas', e.target.value)}
              placeholder="Técnicas e procedimentos fonoaudiológicos"
              rows={2}
            />
          </div>

          <div>
            <Label>Recursos Utilizados</Label>
            <Input 
              value={prontuario.recursosUtilizados}
              onChange={(e) => handleChange('recursosUtilizados', e.target.value)}
              placeholder="Materiais, equipamentos, softwares"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Frequência Semanal</Label>
              <Select 
                value={prontuario.frequenciaSemanal}
                onValueChange={(value) => handleChange('frequenciaSemanal', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1x">1x por semana</SelectItem>
                  <SelectItem value="2x">2x por semana</SelectItem>
                  <SelectItem value="3x">3x por semana</SelectItem>
                  <SelectItem value="4x">4x por semana</SelectItem>
                  <SelectItem value="5x">5x por semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duração da Sessão (min)</Label>
              <Input 
                type="number"
                value={prontuario.duracaoSessao}
                onChange={(e) => handleChange('duracaoSessao', e.target.value)}
              />
            </div>
            <div>
              <Label>Duração Estimada</Label>
              <Input 
                value={prontuario.duracaoEstimada}
                onChange={(e) => handleChange('duracaoEstimada', e.target.value)}
                placeholder="Ex: 6 meses"
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
            <Label>Atividades Realizadas</Label>
            <Textarea 
              value={prontuario.atividadesRealizadas}
              onChange={(e) => handleChange('atividadesRealizadas', e.target.value)}
              placeholder="Descrição das atividades desenvolvidas na sessão"
              rows={3}
            />
          </div>

          <div>
            <Label>Desempenho do Paciente</Label>
            <Textarea 
              value={prontuario.desempenho}
              onChange={(e) => handleChange('desempenho', e.target.value)}
              placeholder="Como o paciente desempenhou as atividades propostas"
              rows={2}
            />
          </div>

          <div>
            <Label>Resposta aos Estímulos</Label>
            <Textarea 
              value={prontuario.respostaEstimulos}
              onChange={(e) => handleChange('respostaEstimulos', e.target.value)}
              placeholder="Reações e respostas aos estímulos terapêuticos"
              rows={2}
            />
          </div>

          <div>
            <Label>Comportamento</Label>
            <Input 
              value={prontuario.comportamento}
              onChange={(e) => handleChange('comportamento', e.target.value)}
              placeholder="Cooperativo, disperso, ansioso, etc."
            />
          </div>

          <div>
            <Label>Intercorrências</Label>
            <Textarea 
              value={prontuario.intercorrencias}
              onChange={(e) => handleChange('intercorrencias', e.target.value)}
              placeholder="Registre qualquer intercorrência durante a sessão"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Orientações */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Orientações e Encaminhamentos</h3>
        <div className="space-y-4">
          <div>
            <Label>Orientações à Família</Label>
            <Textarea 
              value={prontuario.orientacoesFamilia}
              onChange={(e) => handleChange('orientacoesFamilia', e.target.value)}
              placeholder="Orientações e esclarecimentos fornecidos aos familiares"
              rows={2}
            />
          </div>

          <div>
            <Label>Orientações Escolares</Label>
            <Textarea 
              value={prontuario.orientacoesEscolares}
              onChange={(e) => handleChange('orientacoesEscolares', e.target.value)}
              placeholder="Se aplicável: orientações para professores/escola"
              rows={2}
            />
          </div>

          <div>
            <Label>Tarefas de Casa</Label>
            <Textarea 
              value={prontuario.tarefasCasa}
              onChange={(e) => handleChange('tarefasCasa', e.target.value)}
              placeholder="Atividades para serem realizadas em casa"
              rows={2}
            />
          </div>

          <div>
            <Label>Necessidade de Encaminhamento</Label>
            <Textarea 
              value={prontuario.necessidadeEncaminhamento}
              onChange={(e) => handleChange('necessidadeEncaminhamento', e.target.value)}
              placeholder="Se necessário: ORL, neurologista, ortodontista, outros profissionais"
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
        <Button onClick={handleSalvar} className="bg-teal-600 hover:bg-teal-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Prontuário
        </Button>
      </div>

      {/* Aviso Legal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="mb-2"><strong>Importante - CFFa:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Prontuário deve conter identificação completa do paciente e do fonoaudiólogo</li>
              <li>Registro do número CRFa do profissional é obrigatório</li>
              <li>Prontuários devem ser arquivados por no mínimo 5 anos</li>
              <li>Respeitar o sigilo profissional conforme Código de Ética</li>
              <li>O paciente/responsável tem direito ao acesso às informações</li>
              <li>Em casos de menores, é necessária autorização dos responsáveis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
