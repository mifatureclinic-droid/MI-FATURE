import { getHojeBrasilia } from '../lib/utils';
import { useState } from 'react';
import { Save, FileText, Activity, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface ProntuarioFisioterapiaProps {
  onSave?: (dados: { queixa: string; diagnostico: string; tratamento: string; observacoes: string }) => Promise<void>;
  isSaving?: boolean;
}

export function ProntuarioFisioterapia({ onSave, isSaving }: ProntuarioFisioterapiaProps) {
  const [prontuario, setProntuario] = useState({
    // Identificação - Conforme Resolução COFFITO 415/2012
    dataAtendimento: getHojeBrasilia(),
    horaAtendimento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    numeroSessao: 1,
    totalSessoes: 10,
    
    // Avaliação Fisioterapêutica Inicial
    diagnosticoClinico: '',
    cid10: '',
    queixaPrincipal: '',
    historiaClinica: '',
    cirurgiaPreviaRelacionada: '',
    
    // Avaliação Física
    inspecaoPostural: '',
    amplitudeMovimento: '',
    forcaMuscular: '',
    sensibilidade: '',
    coordenacaoMotora: '',
    equilibrio: '',
    marcha: '',
    
    // Escalas de Avaliação
    escalaVisualAnalogicaDor: '0', // 0-10
    escalaFuncionalidade: '',
    testesEspecificos: '',
    
    // Diagnóstico Fisioterapêutico (CIF)
    diagnosticoFisioterapeutico: '',
    classificacaoFuncional: '',
    
    // Objetivos Terapêuticos
    objetivoCurtoPrazo: '',
    objetivoMedioPrazo: '',
    objetivoLongoPrazo: '',
    
    // Plano de Tratamento
    recursos: '',
    tecnicas: '',
    frequenciaSemanal: '',
    duracaoSessao: '50',
    
    // Evolução da Sessão
    procedimentosRealizados: '',
    respostaPaciente: '',
    intercorrencias: '',
    
    // Reavaliação
    evolucaoQuadro: '',
    alteracoesConduta: '',
    orientacoesGerais: '',
    orientacoesDomiciliares: '',
  });

  const handleChange = (field: string, value: any) => {
    setProntuario(prev => ({ ...prev, [field]: value }));
  };

  const handleSalvar = async () => {
    if (!prontuario.diagnosticoClinico || !prontuario.queixaPrincipal) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (onSave) {
      const queixa = [prontuario.queixaPrincipal, prontuario.historiaClinica && `História Clínica: ${prontuario.historiaClinica}`].filter(Boolean).join('\n\n');
      const diagnostico = [prontuario.diagnosticoClinico, prontuario.cid10 && `CID-10: ${prontuario.cid10}`, prontuario.diagnosticoFisioterapeutico && `Diagnóstico Fisioter.: ${prontuario.diagnosticoFisioterapeutico}`].filter(Boolean).join('\n');
      const tratamento = [prontuario.recursos && `Recursos: ${prontuario.recursos}`, prontuario.tecnicas && `Técnicas: ${prontuario.tecnicas}`, prontuario.procedimentosRealizados && `Procedimentos: ${prontuario.procedimentosRealizados}`, prontuario.objetivoCurtoPrazo && `Objetivo CP: ${prontuario.objetivoCurtoPrazo}`].filter(Boolean).join('\n\n');
      const observacoes = [prontuario.respostaPaciente && `Resposta: ${prontuario.respostaPaciente}`, prontuario.orientacoesGerais && `Orientações: ${prontuario.orientacoesGerais}`, prontuario.intercorrencias && `Intercorrências: ${prontuario.intercorrencias}`].filter(Boolean).join('\n\n');
      await onSave({ queixa, diagnostico, tratamento, observacoes });
    } else {
      toast.success('Prontuário de Fisioterapia salvo com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações do Conselho */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm mb-1">Prontuário de Fisioterapia - Conforme COFFITO</h3>
            <p className="text-sm text-gray-700">
              Resolução COFFITO nº 415/2012 - Código de Ética Profissional | 
              Resolução COFFITO nº 424/2013 - Prontuário Fisioterapêutico
            </p>
          </div>
        </div>
      </div>

      {/* Identificação da Sessão */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
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
            <Label>Total de Sessões</Label>
            <Input 
              type="number"
              value={prontuario.totalSessoes}
              onChange={(e) => handleChange('totalSessoes', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Avaliação Fisioterapêutica */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Avaliação Fisioterapêutica</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Diagnóstico Clínico/Médico *</Label>
              <Input 
                value={prontuario.diagnosticoClinico}
                onChange={(e) => handleChange('diagnosticoClinico', e.target.value)}
                placeholder="Ex: Lombalgia crônica"
              />
            </div>
            <div>
              <Label>CID-10</Label>
              <Input 
                value={prontuario.cid10}
                onChange={(e) => handleChange('cid10', e.target.value)}
                placeholder="Ex: M54.5"
              />
            </div>
          </div>
          
          <div>
            <Label>Queixa Principal *</Label>
            <Textarea 
              value={prontuario.queixaPrincipal}
              onChange={(e) => handleChange('queixaPrincipal', e.target.value)}
              placeholder="Descreva a queixa principal relatada pelo paciente"
              rows={2}
            />
          </div>

          <div>
            <Label>História Clínica (HDA - HDP)</Label>
            <Textarea 
              value={prontuario.historiaClinica}
              onChange={(e) => handleChange('historiaClinica', e.target.value)}
              placeholder="História da doença atual e pregressa relacionada ao quadro"
              rows={3}
            />
          </div>

          <div>
            <Label>Cirurgia Prévia Relacionada</Label>
            <Input 
              value={prontuario.cirurgiaPreviaRelacionada}
              onChange={(e) => handleChange('cirurgiaPreviaRelacionada', e.target.value)}
              placeholder="Se houver cirurgia relacionada ao quadro"
            />
          </div>
        </div>
      </div>

      {/* Avaliação Física */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Exame Físico Funcional</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inspeção Postural</Label>
              <Textarea 
                value={prontuario.inspecaoPostural}
                onChange={(e) => handleChange('inspecaoPostural', e.target.value)}
                placeholder="Descreva as alterações posturais observadas"
                rows={2}
              />
            </div>
            <div>
              <Label>Amplitude de Movimento (ADM)</Label>
              <Textarea 
                value={prontuario.amplitudeMovimento}
                onChange={(e) => handleChange('amplitudeMovimento', e.target.value)}
                placeholder="Avaliação da ADM (goniometria)"
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Força Muscular</Label>
              <Textarea 
                value={prontuario.forcaMuscular}
                onChange={(e) => handleChange('forcaMuscular', e.target.value)}
                placeholder="Grau de força muscular (0-5) por grupos musculares"
                rows={2}
              />
            </div>
            <div>
              <Label>Sensibilidade</Label>
              <Textarea 
                value={prontuario.sensibilidade}
                onChange={(e) => handleChange('sensibilidade', e.target.value)}
                placeholder="Avaliação sensorial (tátil, dolorosa, térmica)"
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Coordenação Motora</Label>
              <Input 
                value={prontuario.coordenacaoMotora}
                onChange={(e) => handleChange('coordenacaoMotora', e.target.value)}
                placeholder="Normal / Alterada - descrever"
              />
            </div>
            <div>
              <Label>Equilíbrio</Label>
              <Input 
                value={prontuario.equilibrio}
                onChange={(e) => handleChange('equilibrio', e.target.value)}
                placeholder="Estático e dinâmico"
              />
            </div>
          </div>

          <div>
            <Label>Marcha/Deambulação</Label>
            <Input 
              value={prontuario.marcha}
              onChange={(e) => handleChange('marcha', e.target.value)}
              placeholder="Características da marcha, uso de dispositivos auxiliares"
            />
          </div>
        </div>
      </div>

      {/* Escalas de Avaliação */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Escalas e Testes</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Escala Visual Analógica de Dor (EVA)</Label>
              <Select 
                value={prontuario.escalaVisualAnalogicaDor}
                onValueChange={(value) => handleChange('escalaVisualAnalogicaDor', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0,1,2,3,4,5,6,7,8,9,10].map(num => (
                    <SelectItem key={num} value={String(num)}>
                      {num} - {num === 0 ? 'Sem dor' : num <= 3 ? 'Leve' : num <= 7 ? 'Moderada' : 'Intensa'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Escala de Funcionalidade</Label>
              <Input 
                value={prontuario.escalaFuncionalidade}
                onChange={(e) => handleChange('escalaFuncionalidade', e.target.value)}
                placeholder="Ex: Índice de Barthel, FIM"
              />
            </div>
            <div>
              <Label>Duração da Sessão (min)</Label>
              <Input 
                type="number"
                value={prontuario.duracaoSessao}
                onChange={(e) => handleChange('duracaoSessao', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Testes Específicos</Label>
            <Textarea 
              value={prontuario.testesEspecificos}
              onChange={(e) => handleChange('testesEspecificos', e.target.value)}
              placeholder="Ex: Teste de Thomas, Teste de Lasègue, etc."
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Diagnóstico Fisioterapêutico */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Diagnóstico Fisioterapêutico (CIF)</h3>
        <div className="space-y-4">
          <div>
            <Label>Diagnóstico Cinético Funcional</Label>
            <Textarea 
              value={prontuario.diagnosticoFisioterapeutico}
              onChange={(e) => handleChange('diagnosticoFisioterapeutico', e.target.value)}
              placeholder="Diagnóstico funcional baseado na CIF (Classificação Internacional de Funcionalidade)"
              rows={2}
            />
          </div>
          <div>
            <Label>Classificação Funcional</Label>
            <Input 
              value={prontuario.classificacaoFuncional}
              onChange={(e) => handleChange('classificacaoFuncional', e.target.value)}
              placeholder="Grau de comprometimento funcional"
            />
          </div>
        </div>
      </div>

      {/* Objetivos Terapêuticos */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Objetivos Terapêuticos</h3>
        <div className="space-y-4">
          <div>
            <Label>Objetivos de Curto Prazo (1-2 semanas)</Label>
            <Textarea 
              value={prontuario.objetivoCurtoPrazo}
              onChange={(e) => handleChange('objetivoCurtoPrazo', e.target.value)}
              placeholder="Ex: Redução da dor, melhora da ADM"
              rows={2}
            />
          </div>
          <div>
            <Label>Objetivos de Médio Prazo (1-2 meses)</Label>
            <Textarea 
              value={prontuario.objetivoMedioPrazo}
              onChange={(e) => handleChange('objetivoMedioPrazo', e.target.value)}
              placeholder="Ex: Fortalecimento muscular, recuperação da funcionalidade"
              rows={2}
            />
          </div>
          <div>
            <Label>Objetivos de Longo Prazo (3-6 meses)</Label>
            <Textarea 
              value={prontuario.objetivoLongoPrazo}
              onChange={(e) => handleChange('objetivoLongoPrazo', e.target.value)}
              placeholder="Ex: Retorno às atividades laborais, independência funcional completa"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Plano de Tratamento */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Plano de Tratamento</h3>
        <div className="space-y-4">
          <div>
            <Label>Recursos Fisioterapêuticos</Label>
            <Textarea 
              value={prontuario.recursos}
              onChange={(e) => handleChange('recursos', e.target.value)}
              placeholder="Ex: Eletroterapia (TENS), Termoterapia, Ultrassom, Laser"
              rows={2}
            />
          </div>
          <div>
            <Label>Técnicas e Procedimentos</Label>
            <Textarea 
              value={prontuario.tecnicas}
              onChange={(e) => handleChange('tecnicas', e.target.value)}
              placeholder="Ex: Cinesioterapia, Terapia Manual, RPG, Pilates, Hidroterapia"
              rows={2}
            />
          </div>
          <div>
            <Label>Frequência Semanal Recomendada</Label>
            <Select 
              value={prontuario.frequenciaSemanal}
              onValueChange={(value) => handleChange('frequenciaSemanal', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a frequência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1x">1x por semana</SelectItem>
                <SelectItem value="2x">2x por semana</SelectItem>
                <SelectItem value="3x">3x por semana</SelectItem>
                <SelectItem value="4x">4x por semana</SelectItem>
                <SelectItem value="5x">5x por semana</SelectItem>
                <SelectItem value="diaria">Diária</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Evolução da Sessão */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Evolução da Sessão</h3>
        <div className="space-y-4">
          <div>
            <Label>Procedimentos Realizados na Sessão</Label>
            <Textarea 
              value={prontuario.procedimentosRealizados}
              onChange={(e) => handleChange('procedimentosRealizados', e.target.value)}
              placeholder="Descreva detalhadamente os procedimentos realizados nesta sessão"
              rows={3}
            />
          </div>
          <div>
            <Label>Resposta do Paciente ao Tratamento</Label>
            <Textarea 
              value={prontuario.respostaPaciente}
              onChange={(e) => handleChange('respostaPaciente', e.target.value)}
              placeholder="Como o paciente respondeu aos procedimentos"
              rows={2}
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

      {/* Reavaliação e Orientações */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Reavaliação e Orientações</h3>
        <div className="space-y-4">
          <div>
            <Label>Evolução do Quadro</Label>
            <Textarea 
              value={prontuario.evolucaoQuadro}
              onChange={(e) => handleChange('evolucaoQuadro', e.target.value)}
              placeholder="Descreva a evolução do quadro desde a última sessão/avaliação"
              rows={2}
            />
          </div>
          <div>
            <Label>Alterações na Conduta</Label>
            <Textarea 
              value={prontuario.alteracoesConduta}
              onChange={(e) => handleChange('alteracoesConduta', e.target.value)}
              placeholder="Se houver necessidade de alterar o plano de tratamento"
              rows={2}
            />
          </div>
          <div>
            <Label>Orientações Gerais</Label>
            <Textarea 
              value={prontuario.orientacoesGerais}
              onChange={(e) => handleChange('orientacoesGerais', e.target.value)}
              placeholder="Orientações sobre postura, ergonomia, atividades diárias"
              rows={2}
            />
          </div>
          <div>
            <Label>Orientações para Exercícios Domiciliares</Label>
            <Textarea 
              value={prontuario.orientacoesDomiciliares}
              onChange={(e) => handleChange('orientacoesDomiciliares', e.target.value)}
              placeholder="Exercícios e cuidados a serem realizados em casa"
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
        <Button onClick={handleSalvar} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Prontuário
        </Button>
      </div>

      {/* Aviso Legal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="mb-2"><strong>Importante - COFFITO:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Todos os prontuários devem ser assinados digitalmente ou manualmente pelo fisioterapeuta</li>
              <li>É obrigatório o registro do número CREFITO do profissional</li>
              <li>Prontuários devem ser arquivados por no mínimo 5 anos</li>
              <li>O paciente tem direito ao acesso às informações de seu prontuário</li>
              <li>Respeitar o sigilo profissional conforme Código de Ética</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
