import { getHojeBrasilia } from '../lib/utils';
import { useState } from 'react';
import { Save, FileText, Apple, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface ProntuarioNutricaoProps {
  onSave?: (dados: { queixa: string; diagnostico: string; tratamento: string; observacoes: string }) => Promise<void>;
  isSaving?: boolean;
}

export function ProntuarioNutricao({ onSave, isSaving }: ProntuarioNutricaoProps) {
  const [prontuario, setProntuario] = useState({
    // Identificação - Conforme Resolução CFN 380/2005
    dataAtendimento: getHojeBrasilia(),
    horaAtendimento: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    numeroConsulta: 1,
    tipoConsulta: 'primeira', // primeira, retorno, reavaliacao
    
    // Dados Antropométricos
    peso: '',
    altura: '',
    imc: '',
    circunferenciaAbdominal: '',
    circunferenciaCintura: '',
    circunferenciaQuadril: '',
    relacaoCinturaQuadril: '',
    percentualGordura: '',
    massaMagra: '',
    massaGorda: '',
    
    // Anamnese Nutricional
    queixaPrincipal: '',
    historicoNutricional: '',
    dietasAnteriores: '',
    pesoHabitual: '',
    pesoDesejado: '',
    
    // História Clínica
    antecedentesPessoais: '',
    antecedentesFamiliares: '',
    patologias: '',
    medicamentosUso: '',
    alergias: '',
    intolerancias: '',
    cirurgiasPregressas: '',
    
    // História Alimentar
    recordatorio24h: '',
    habitosAlimentares: '',
    frequenciaRefeicoes: '',
    horarioRefeicoes: '',
    localRefeicoes: '',
    restricoesAlimentares: '',
    preferenciasAlimentares: '',
    aversaoAlimentar: '',
    
    // Consumo Hídrico e Outros
    consumoAgua: '',
    consumoBebidas: '',
    consumoAlcool: '',
    tabagismo: '',
    
    // Atividade Física
    atividadeFisica: '',
    frequenciaExercicios: '',
    tipoExercicio: '',
    
    // Aspectos Bioquímicos
    examesSolicitados: '',
    resultadosExames: '',
    glicemia: '',
    colesterolTotal: '',
    hdl: '',
    ldl: '',
    triglicerideos: '',
    hemoglobina: '',
    ferritina: '',
    vitaminaD: '',
    vitaminaB12: '',
    outrosExames: '',
    
    // Aspectos Funcionais/Clínicos
    funcionamentoIntestinal: '',
    diurese: '',
    sono: '',
    estresse: '',
    cicloMenstrual: '',
    gestacaoLactacao: '',
    
    // Diagnóstico Nutricional
    diagnosticoNutricional: '',
    classificacaoEstadoNutricional: '',
    necessidadesEnergeticas: '',
    necessidadesMacronutrientes: '',
    necessidadesMicronutrientes: '',
    
    // Objetivos
    objetivoPrincipal: '',
    objetivosEspecificos: '',
    metaPeso: '',
    metaPrazo: '',
    
    // Plano Alimentar
    valorCalorico: '',
    distribuicaoMacronutrientes: '',
    planoAlimentar: '',
    orientacoesGerais: '',
    estrategiasComportamentais: '',
    
    // Suplementação
    suplementosRecomendados: '',
    posologia: '',
    
    // Evolução
    evolucaoNutricional: '',
    aderenciaPlano: '',
    dificuldadesRelato: '',
    
    // Encaminhamentos
    necessidadeEncaminhamento: '',
    solicitacaoExames: '',
    
    // Próxima Consulta
    prazoRetorno: '',
    orientacoesRetorno: '',
  });

  const handleChange = (field: string, value: any) => {
    setProntuario(prev => ({ ...prev, [field]: value }));
    
    // Calcular IMC automaticamente
    if (field === 'peso' || field === 'altura') {
      const peso = field === 'peso' ? parseFloat(value) : parseFloat(prontuario.peso);
      const altura = field === 'altura' ? parseFloat(value) : parseFloat(prontuario.altura);
      
      if (peso && altura) {
        const imc = (peso / (altura * altura)).toFixed(2);
        setProntuario(prev => ({ ...prev, imc }));
      }
    }
    
    // Calcular Relação Cintura/Quadril
    if (field === 'circunferenciaCintura' || field === 'circunferenciaQuadril') {
      const cintura = field === 'circunferenciaCintura' ? parseFloat(value) : parseFloat(prontuario.circunferenciaCintura);
      const quadril = field === 'circunferenciaQuadril' ? parseFloat(value) : parseFloat(prontuario.circunferenciaQuadril);
      
      if (cintura && quadril) {
        const rcq = (cintura / quadril).toFixed(2);
        setProntuario(prev => ({ ...prev, relacaoCinturaQuadril: rcq }));
      }
    }
  };

  const handleSalvar = async () => {
    if (!prontuario.queixaPrincipal || !prontuario.peso || !prontuario.altura) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    if (onSave) {
      const queixa = [prontuario.queixaPrincipal, prontuario.historicoNutricional && `Histórico: ${prontuario.historicoNutricional}`, prontuario.patologias && `Patologias: ${prontuario.patologias}`].filter(Boolean).join('\n\n');
      const diagnostico = [prontuario.diagnosticoNutricional, prontuario.classificacaoEstadoNutricional && `Classificação: ${prontuario.classificacaoEstadoNutricional}`, prontuario.imc && `IMC: ${prontuario.imc} (${classificarIMC(prontuario.imc)})`].filter(Boolean).join('\n');
      const tratamento = [prontuario.planoAlimentar && `Plano Alimentar: ${prontuario.planoAlimentar}`, prontuario.valorCalorico && `VCT: ${prontuario.valorCalorico}`, prontuario.orientacoesGerais && `Orientações: ${prontuario.orientacoesGerais}`, prontuario.suplementosRecomendados && `Suplementos: ${prontuario.suplementosRecomendados}`].filter(Boolean).join('\n\n');
      const observacoes = [prontuario.evolucaoNutricional && `Evolução: ${prontuario.evolucaoNutricional}`, prontuario.aderenciaPlano && `Aderência: ${prontuario.aderenciaPlano}`, prontuario.necessidadeEncaminhamento && `Encaminhamento: ${prontuario.necessidadeEncaminhamento}`].filter(Boolean).join('\n\n');
      await onSave({ queixa, diagnostico, tratamento, observacoes });
    } else {
      toast.success('Prontuário de Nutrição salvo com sucesso!');
    }
  };

  const classificarIMC = (imc: string) => {
    const imcNum = parseFloat(imc);
    if (!imcNum) return '';
    if (imcNum < 18.5) return 'Baixo peso';
    if (imcNum < 25) return 'Peso adequado';
    if (imcNum < 30) return 'Sobrepeso';
    if (imcNum < 35) return 'Obesidade grau I';
    if (imcNum < 40) return 'Obesidade grau II';
    return 'Obesidade grau III';
  };

  return (
    <div className="space-y-6">
      {/* Informações do Conselho */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Apple className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm mb-1">Prontuário de Nutrição - Conforme CFN</h3>
            <p className="text-sm text-gray-700">
              Resolução CFN nº 380/2005 - Prontuário do Paciente | 
              Resolução CFN nº 600/2018 - Código de Ética do Nutricionista
            </p>
          </div>
        </div>
      </div>

      {/* Identificação da Consulta */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Identificação da Consulta
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
            <Label>Tipo de Consulta</Label>
            <Select 
              value={prontuario.tipoConsulta}
              onValueChange={(value) => handleChange('tipoConsulta', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primeira">Primeira Consulta</SelectItem>
                <SelectItem value="retorno">Consulta de Retorno</SelectItem>
                <SelectItem value="reavaliacao">Reavaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Consulta Nº</Label>
            <Input 
              type="number"
              value={prontuario.numeroConsulta}
              onChange={(e) => handleChange('numeroConsulta', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Avaliação Antropométrica */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Avaliação Antropométrica</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Peso Atual (kg) *</Label>
              <Input 
                type="number"
                step="0.1"
                value={prontuario.peso}
                onChange={(e) => handleChange('peso', e.target.value)}
                placeholder="Ex: 75.5"
              />
            </div>
            <div>
              <Label>Altura (m) *</Label>
              <Input 
                type="number"
                step="0.01"
                value={prontuario.altura}
                onChange={(e) => handleChange('altura', e.target.value)}
                placeholder="Ex: 1.75"
              />
            </div>
            <div>
              <Label>IMC (kg/m²)</Label>
              <div className="relative">
                <Input 
                  value={prontuario.imc}
                  disabled
                  className="bg-gray-50"
                />
                {prontuario.imc && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                    {classificarIMC(prontuario.imc)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Circ. Abdominal (cm)</Label>
              <Input 
                type="number"
                step="0.1"
                value={prontuario.circunferenciaAbdominal}
                onChange={(e) => handleChange('circunferenciaAbdominal', e.target.value)}
              />
            </div>
            <div>
              <Label>Circ. Cintura (cm)</Label>
              <Input 
                type="number"
                step="0.1"
                value={prontuario.circunferenciaCintura}
                onChange={(e) => handleChange('circunferenciaCintura', e.target.value)}
              />
            </div>
            <div>
              <Label>Circ. Quadril (cm)</Label>
              <Input 
                type="number"
                step="0.1"
                value={prontuario.circunferenciaQuadril}
                onChange={(e) => handleChange('circunferenciaQuadril', e.target.value)}
              />
            </div>
            <div>
              <Label>Relação C/Q</Label>
              <Input 
                value={prontuario.relacaoCinturaQuadril}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>% Gordura Corporal</Label>
              <Input 
                type="number"
                step="0.1"
                value={prontuario.percentualGordura}
                onChange={(e) => handleChange('percentualGordura', e.target.value)}
              />
            </div>
            <div>
              <Label>Massa Magra (kg)</Label>
              <Input 
                type="number"
                step="0.1"
                value={prontuario.massaMagra}
                onChange={(e) => handleChange('massaMagra', e.target.value)}
              />
            </div>
            <div>
              <Label>Massa Gorda (kg)</Label>
              <Input 
                type="number"
                step="0.1"
                value={prontuario.massaGorda}
                onChange={(e) => handleChange('massaGorda', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Anamnese Nutricional */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Anamnese Nutricional</h3>
        <div className="space-y-4">
          <div>
            <Label>Queixa Principal / Objetivo *</Label>
            <Textarea 
              value={prontuario.queixaPrincipal}
              onChange={(e) => handleChange('queixaPrincipal', e.target.value)}
              placeholder="Motivo da consulta e objetivo do paciente"
              rows={2}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Peso Habitual (kg)</Label>
              <Input 
                value={prontuario.pesoHabitual}
                onChange={(e) => handleChange('pesoHabitual', e.target.value)}
              />
            </div>
            <div>
              <Label>Peso Desejado (kg)</Label>
              <Input 
                value={prontuario.pesoDesejado}
                onChange={(e) => handleChange('pesoDesejado', e.target.value)}
              />
            </div>
            <div>
              <Label>Meta de Prazo</Label>
              <Input 
                value={prontuario.metaPrazo}
                onChange={(e) => handleChange('metaPrazo', e.target.value)}
                placeholder="Ex: 3 meses"
              />
            </div>
          </div>

          <div>
            <Label>Histórico Nutricional e de Peso</Label>
            <Textarea 
              value={prontuario.historicoNutricional}
              onChange={(e) => handleChange('historicoNutricional', e.target.value)}
              placeholder="Variações de peso, histórico de dietas, cirurgia bariátrica, etc."
              rows={2}
            />
          </div>

          <div>
            <Label>Dietas Realizadas Anteriormente</Label>
            <Textarea 
              value={prontuario.dietasAnteriores}
              onChange={(e) => handleChange('dietasAnteriores', e.target.value)}
              placeholder="Tipo de dietas, duração, resultados"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* História Clínica */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">História Clínica</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Antecedentes Pessoais</Label>
              <Textarea 
                value={prontuario.antecedentesPessoais}
                onChange={(e) => handleChange('antecedentesPessoais', e.target.value)}
                placeholder="Histórico de doenças e condições de saúde"
                rows={2}
              />
            </div>
            <div>
              <Label>Antecedentes Familiares</Label>
              <Textarea 
                value={prontuario.antecedentesFamiliares}
                onChange={(e) => handleChange('antecedentesFamiliares', e.target.value)}
                placeholder="Histórico familiar: DM, HAS, dislipidemia, obesidade, etc."
                rows={2}
              />
            </div>
          </div>

          <div>
            <Label>Patologias e Comorbidades Atuais</Label>
            <Textarea 
              value={prontuario.patologias}
              onChange={(e) => handleChange('patologias', e.target.value)}
              placeholder="Diabetes, hipertensão, dislipidemias, doenças tireoidianas, SOP, etc."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Medicamentos em Uso</Label>
              <Textarea 
                value={prontuario.medicamentosUso}
                onChange={(e) => handleChange('medicamentosUso', e.target.value)}
                placeholder="Medicamentos, dosagem e horários"
                rows={2}
              />
            </div>
            <div>
              <Label>Cirurgias Pregressas</Label>
              <Input 
                value={prontuario.cirurgiasPregressas}
                onChange={(e) => handleChange('cirurgiasPregressas', e.target.value)}
                placeholder="Cirurgias realizadas"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Alergias Alimentares</Label>
              <Input 
                value={prontuario.alergias}
                onChange={(e) => handleChange('alergias', e.target.value)}
                placeholder="Alergias confirmadas"
              />
            </div>
            <div>
              <Label>Intolerâncias Alimentares</Label>
              <Input 
                value={prontuario.intolerancias}
                onChange={(e) => handleChange('intolerancias', e.target.value)}
                placeholder="Lactose, glúten, etc."
              />
            </div>
          </div>
        </div>
      </div>

      {/* História Alimentar */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">História Alimentar</h3>
        <div className="space-y-4">
          <div>
            <Label>Recordatório Alimentar 24h</Label>
            <Textarea 
              value={prontuario.recordatorio24h}
              onChange={(e) => handleChange('recordatorio24h', e.target.value)}
              placeholder="Descreva todos os alimentos e bebidas consumidos nas últimas 24h com horários"
              rows={4}
            />
          </div>

          <div>
            <Label>Hábitos Alimentares Atuais</Label>
            <Textarea 
              value={prontuario.habitosAlimentares}
              onChange={(e) => handleChange('habitosAlimentares', e.target.value)}
              placeholder="Padrão alimentar, alimentos mais consumidos, preparações habituais"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Frequência de Refeições</Label>
              <Input 
                value={prontuario.frequenciaRefeicoes}
                onChange={(e) => handleChange('frequenciaRefeicoes', e.target.value)}
                placeholder="Ex: 5-6 refeições/dia"
              />
            </div>
            <div>
              <Label>Horários das Refeições</Label>
              <Input 
                value={prontuario.horarioRefeicoes}
                onChange={(e) => handleChange('horarioRefeicoes', e.target.value)}
                placeholder="Regularidade dos horários"
              />
            </div>
            <div>
              <Label>Local das Refeições</Label>
              <Input 
                value={prontuario.localRefeicoes}
                onChange={(e) => handleChange('localRefeicoes', e.target.value)}
                placeholder="Casa, trabalho, restaurante"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Restrições Alimentares</Label>
              <Textarea 
                value={prontuario.restricoesAlimentares}
                onChange={(e) => handleChange('restricoesAlimentares', e.target.value)}
                placeholder="Vegetarianismo, vegano, religiosa, etc."
                rows={2}
              />
            </div>
            <div>
              <Label>Preferências e Aversões</Label>
              <Textarea 
                value={prontuario.preferenciasAlimentares}
                onChange={(e) => handleChange('preferenciasAlimentares', e.target.value)}
                placeholder="Alimentos preferidos e não consumidos"
                rows={2}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Consumo Hídrico e Estilo de Vida */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Consumo Hídrico e Estilo de Vida</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Consumo de Água (L/dia)</Label>
              <Input 
                value={prontuario.consumoAgua}
                onChange={(e) => handleChange('consumoAgua', e.target.value)}
                placeholder="Ex: 2 litros"
              />
            </div>
            <div>
              <Label>Outras Bebidas</Label>
              <Input 
                value={prontuario.consumoBebidas}
                onChange={(e) => handleChange('consumoBebidas', e.target.value)}
                placeholder="Café, chá, sucos, refrigerantes"
              />
            </div>
            <div>
              <Label>Consumo de Álcool</Label>
              <Input 
                value={prontuario.consumoAlcool}
                onChange={(e) => handleChange('consumoAlcool', e.target.value)}
                placeholder="Frequência e quantidade"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tabagismo</Label>
              <Select 
                value={prontuario.tabagismo}
                onValueChange={(value) => handleChange('tabagismo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao">Não fumante</SelectItem>
                  <SelectItem value="sim">Fumante ativo</SelectItem>
                  <SelectItem value="ex">Ex-fumante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Atividade Física</Label>
              <Input 
                value={prontuario.atividadeFisica}
                onChange={(e) => handleChange('atividadeFisica', e.target.value)}
                placeholder="Sedentário, leve, moderado, intenso"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Exercício</Label>
              <Input 
                value={prontuario.tipoExercicio}
                onChange={(e) => handleChange('tipoExercicio', e.target.value)}
                placeholder="Musculação, corrida, natação, etc."
              />
            </div>
            <div>
              <Label>Frequência Semanal</Label>
              <Input 
                value={prontuario.frequenciaExercicios}
                onChange={(e) => handleChange('frequenciaExercicios', e.target.value)}
                placeholder="Ex: 3x por semana"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Exames Bioquímicos */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Exames Bioquímicos</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Glicemia (mg/dL)</Label>
              <Input 
                value={prontuario.glicemia}
                onChange={(e) => handleChange('glicemia', e.target.value)}
              />
            </div>
            <div>
              <Label>Colesterol Total (mg/dL)</Label>
              <Input 
                value={prontuario.colesterolTotal}
                onChange={(e) => handleChange('colesterolTotal', e.target.value)}
              />
            </div>
            <div>
              <Label>HDL (mg/dL)</Label>
              <Input 
                value={prontuario.hdl}
                onChange={(e) => handleChange('hdl', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>LDL (mg/dL)</Label>
              <Input 
                value={prontuario.ldl}
                onChange={(e) => handleChange('ldl', e.target.value)}
              />
            </div>
            <div>
              <Label>Triglicerídeos (mg/dL)</Label>
              <Input 
                value={prontuario.triglicerideos}
                onChange={(e) => handleChange('triglicerideos', e.target.value)}
              />
            </div>
            <div>
              <Label>Hemoglobina (g/dL)</Label>
              <Input 
                value={prontuario.hemoglobina}
                onChange={(e) => handleChange('hemoglobina', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Ferritina (ng/mL)</Label>
              <Input 
                value={prontuario.ferritina}
                onChange={(e) => handleChange('ferritina', e.target.value)}
              />
            </div>
            <div>
              <Label>Vitamina D (ng/mL)</Label>
              <Input 
                value={prontuario.vitaminaD}
                onChange={(e) => handleChange('vitaminaD', e.target.value)}
              />
            </div>
            <div>
              <Label>Vitamina B12 (pg/mL)</Label>
              <Input 
                value={prontuario.vitaminaB12}
                onChange={(e) => handleChange('vitaminaB12', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Outros Exames Relevantes</Label>
            <Textarea 
              value={prontuario.outrosExames}
              onChange={(e) => handleChange('outrosExames', e.target.value)}
              placeholder="TSH, T4, insulina, HbA1c, etc."
              rows={2}
            />
          </div>

          <div>
            <Label>Exames Solicitados nesta Consulta</Label>
            <Textarea 
              value={prontuario.solicitacaoExames}
              onChange={(e) => handleChange('solicitacaoExames', e.target.value)}
              placeholder="Exames que serão solicitados"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Aspectos Clínicos/Funcionais */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Aspectos Clínicos e Funcionais</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Funcionamento Intestinal</Label>
              <Input 
                value={prontuario.funcionamentoIntestinal}
                onChange={(e) => handleChange('funcionamentoIntestinal', e.target.value)}
                placeholder="Regularidade, consistência"
              />
            </div>
            <div>
              <Label>Diurese</Label>
              <Input 
                value={prontuario.diurese}
                onChange={(e) => handleChange('diurese', e.target.value)}
                placeholder="Frequência urinária"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Qualidade do Sono</Label>
              <Input 
                value={prontuario.sono}
                onChange={(e) => handleChange('sono', e.target.value)}
                placeholder="Horas de sono, qualidade"
              />
            </div>
            <div>
              <Label>Nível de Estresse</Label>
              <Input 
                value={prontuario.estresse}
                onChange={(e) => handleChange('estresse', e.target.value)}
                placeholder="Baixo, moderado, alto"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Ciclo Menstrual (se aplicável)</Label>
              <Input 
                value={prontuario.cicloMenstrual}
                onChange={(e) => handleChange('cicloMenstrual', e.target.value)}
                placeholder="Regularidade, sintomas"
              />
            </div>
            <div>
              <Label>Gestação/Lactação</Label>
              <Input 
                value={prontuario.gestacaoLactacao}
                onChange={(e) => handleChange('gestacaoLactacao', e.target.value)}
                placeholder="Se gestante ou lactante"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Diagnóstico Nutricional */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Diagnóstico Nutricional</h3>
        <div className="space-y-4">
          <div>
            <Label>Diagnóstico Nutricional</Label>
            <Textarea 
              value={prontuario.diagnosticoNutricional}
              onChange={(e) => handleChange('diagnosticoNutricional', e.target.value)}
              placeholder="Avaliação do estado nutricional e necessidades"
              rows={2}
            />
          </div>

          <div>
            <Label>Classificação do Estado Nutricional</Label>
            <Input 
              value={prontuario.classificacaoEstadoNutricional}
              onChange={(e) => handleChange('classificacaoEstadoNutricional', e.target.value)}
              placeholder="Conforme IMC e outros parâmetros"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Necessidades Energéticas (kcal/dia)</Label>
              <Input 
                value={prontuario.necessidadesEnergeticas}
                onChange={(e) => handleChange('necessidadesEnergeticas', e.target.value)}
                placeholder="Valor calórico calculado"
              />
            </div>
            <div>
              <Label>Valor Calórico Prescrito</Label>
              <Input 
                value={prontuario.valorCalorico}
                onChange={(e) => handleChange('valorCalorico', e.target.value)}
                placeholder="VCT do plano alimentar"
              />
            </div>
          </div>

          <div>
            <Label>Distribuição de Macronutrientes</Label>
            <Input 
              value={prontuario.distribuicaoMacronutrientes}
              onChange={(e) => handleChange('distribuicaoMacronutrientes', e.target.value)}
              placeholder="Ex: 50% CHO, 30% LIP, 20% PTN"
            />
          </div>
        </div>
      </div>

      {/* Objetivos */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Objetivos do Tratamento</h3>
        <div className="space-y-4">
          <div>
            <Label>Objetivo Principal</Label>
            <Textarea 
              value={prontuario.objetivoPrincipal}
              onChange={(e) => handleChange('objetivoPrincipal', e.target.value)}
              placeholder="Objetivo principal do tratamento nutricional"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Meta de Peso (kg)</Label>
              <Input 
                value={prontuario.metaPeso}
                onChange={(e) => handleChange('metaPeso', e.target.value)}
              />
            </div>
            <div>
              <Label>Prazo para Meta</Label>
              <Input 
                value={prontuario.metaPrazo}
                onChange={(e) => handleChange('metaPrazo', e.target.value)}
                placeholder="Ex: 3 meses"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plano Alimentar */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Plano Alimentar e Conduta Nutricional</h3>
        <div className="space-y-4">
          <div>
            <Label>Plano Alimentar Detalhado</Label>
            <Textarea 
              value={prontuario.planoAlimentar}
              onChange={(e) => handleChange('planoAlimentar', e.target.value)}
              placeholder="Descreva o plano alimentar com distribuição das refeições, alimentos, quantidades"
              rows={5}
            />
          </div>

          <div>
            <Label>Orientações Gerais</Label>
            <Textarea 
              value={prontuario.orientacoesGerais}
              onChange={(e) => handleChange('orientacoesGerais', e.target.value)}
              placeholder="Orientações sobre preparo, substituições, leitura de rótulos, etc."
              rows={3}
            />
          </div>

          <div>
            <Label>Estratégias Comportamentais</Label>
            <Textarea 
              value={prontuario.estrategiasComportamentais}
              onChange={(e) => handleChange('estrategiasComportamentais', e.target.value)}
              placeholder="Estratégias para mudança de comportamento alimentar"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Suplementação */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Suplementação Nutricional</h3>
        <div className="space-y-4">
          <div>
            <Label>Suplementos Recomendados</Label>
            <Textarea 
              value={prontuario.suplementosRecomendados}
              onChange={(e) => handleChange('suplementosRecomendados', e.target.value)}
              placeholder="Vitaminas, minerais, proteínas, etc."
              rows={2}
            />
          </div>

          <div>
            <Label>Posologia e Orientações</Label>
            <Textarea 
              value={prontuario.posologia}
              onChange={(e) => handleChange('posologia', e.target.value)}
              placeholder="Dosagem, horários de administração, duração"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Evolução */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Evolução e Adesão</h3>
        <div className="space-y-4">
          <div>
            <Label>Evolução Nutricional</Label>
            <Textarea 
              value={prontuario.evolucaoNutricional}
              onChange={(e) => handleChange('evolucaoNutricional', e.target.value)}
              placeholder="Progresso em relação aos objetivos, mudanças observadas"
              rows={2}
            />
          </div>

          <div>
            <Label>Adesão ao Plano Alimentar</Label>
            <Textarea 
              value={prontuario.aderenciaPlano}
              onChange={(e) => handleChange('aderenciaPlano', e.target.value)}
              placeholder="Grau de adesão, dificuldades encontradas"
              rows={2}
            />
          </div>

          <div>
            <Label>Dificuldades Relatadas</Label>
            <Textarea 
              value={prontuario.dificuldadesRelato}
              onChange={(e) => handleChange('dificuldadesRelato', e.target.value)}
              placeholder="Obstáculos e desafios relatados pelo paciente"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Encaminhamentos */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg mb-4">Encaminhamentos e Retorno</h3>
        <div className="space-y-4">
          <div>
            <Label>Necessidade de Encaminhamento</Label>
            <Textarea 
              value={prontuario.necessidadeEncaminhamento}
              onChange={(e) => handleChange('necessidadeEncaminhamento', e.target.value)}
              placeholder="Encaminhamento para outros profissionais (endocrinologista, psicólogo, etc.)"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prazo para Retorno</Label>
              <Select 
                value={prontuario.prazoRetorno}
                onValueChange={(value) => handleChange('prazoRetorno', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">7 dias</SelectItem>
                  <SelectItem value="15dias">15 dias</SelectItem>
                  <SelectItem value="30dias">30 dias (1 mês)</SelectItem>
                  <SelectItem value="45dias">45 dias</SelectItem>
                  <SelectItem value="60dias">60 dias (2 meses)</SelectItem>
                  <SelectItem value="90dias">90 dias (3 meses)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Orientações para o Retorno</Label>
              <Input 
                value={prontuario.orientacoesRetorno}
                onChange={(e) => handleChange('orientacoesRetorno', e.target.value)}
                placeholder="O que trazer/fazer para próxima consulta"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 sticky bottom-4 bg-white border rounded-lg p-4 shadow-lg">
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Pré-visualizar
        </Button>
        <Button onClick={handleSalvar} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Salvar Prontuário
        </Button>
      </div>

      {/* Aviso Legal */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="mb-2"><strong>Importante - CFN:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>O prontuário deve ser assinado e carimbado pelo nutricionista (CRN)</li>
              <li>Deve conter registro detalhado da avaliação e conduta nutricional</li>
              <li>Prontuários devem ser mantidos por no mínimo 5 anos</li>
              <li>Respeitar sigilo profissional conforme Código de Ética</li>
              <li>Prescrição dietética é ato privativo do nutricionista</li>
              <li>Documentar sempre evolução antropométrica e adesão ao tratamento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
