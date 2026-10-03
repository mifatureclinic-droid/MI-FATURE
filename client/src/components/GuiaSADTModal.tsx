import { useState } from 'react';
import { getHojeBrasilia } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { FileText, Plus, Trash2, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  calcularHoraFinalSadt,
  TECNICA_UTILIZADA_PADRAO_SADT,
  VIA_ACESSO_PADRAO_SADT,
} from '@shared/guiaSadtPadroes';

interface GuiaSADTModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (guia: any) => void;
  guiaEditar?: any;
}

export function GuiaSADTModal({ open, onOpenChange, onSave, guiaEditar }: GuiaSADTModalProps) {
  const [formData, setFormData] = useState({
    // Dados da Guia
    numeroGuia: guiaEditar?.numeroGuia || `SADT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
    numeroGuiaPrestador: guiaEditar?.numeroGuiaPrestador || '',
    numeroGuiaOperadora: guiaEditar?.numeroGuiaOperadora || '',
    dataEmissao: guiaEditar?.dataEmissao || getHojeBrasilia(),
    
    // Dados do Beneficiário
    numeroCarteirinha: guiaEditar?.numeroCarteirinha || '',
    validadeCarteirinha: guiaEditar?.validadeCarteirinha || '',
    nomeBeneficiario: guiaEditar?.nomeBeneficiario || '',
    numeroCartaoNacional: guiaEditar?.numeroCartaoNacional || '',
    
    // Dados do Contratado
    nomeContratado: guiaEditar?.nomeContratado || 'Clínica Exemplo',
    codigoPrestador: guiaEditar?.codigoPrestador || '',
    cnesContratado: guiaEditar?.cnesContratado || '',
    
    // Dados do Contratado Executante
    nomeExecutante: guiaEditar?.nomeExecutante || '',
    codigoExecutante: guiaEditar?.codigoExecutante || '',
    cnesExecutante: guiaEditar?.cnesExecutante || '',
    
    // Dados da Solicitação
    numeroGuiaSolicitacao: guiaEditar?.numeroGuiaSolicitacao || '',
    dataSolicitacao: guiaEditar?.dataSolicitacao || getHojeBrasilia(),
    nomeProfissionalSolicitante: guiaEditar?.nomeProfissionalSolicitante || '',
    conselhoSolicitante: guiaEditar?.conselhoSolicitante || 'CRM',
    numeroConselhoSolicitante: guiaEditar?.numeroConselhoSolicitante || '',
    ufConselhoSolicitante: guiaEditar?.ufConselhoSolicitante || 'SP',
    codigoCboS: guiaEditar?.codigoCboS || '',
    
    // Dados da Autorização
    numeroAutorizacao: guiaEditar?.numeroAutorizacao || '',
    dataAutorizacao: guiaEditar?.dataAutorizacao || '',
    
    // Dados do Atendimento
    tipoAtendimento: guiaEditar?.tipoAtendimento || '04', // 04 - Consulta
    indicacaoAcidente: guiaEditar?.indicacaoAcidente || '9', // 9 - Não se aplica
    tipoSaida: guiaEditar?.tipoSaida || '',
    
    // Dados da Execução
    nomeProfissionalExecutante: guiaEditar?.nomeProfissionalExecutante || '',
    conselhoExecutante: guiaEditar?.conselhoExecutante || 'CRM',
    numeroConselhoExecutante: guiaEditar?.numeroConselhoExecutante || '',
    ufConselhoExecutante: guiaEditar?.ufConselhoExecutante || 'SP',
    codigoCboE: guiaEditar?.codigoCboE || '',
    
    // Diagnóstico
    indicacaoClinica: guiaEditar?.indicacaoClinica || '',
    
    // Procedimentos
    procedimentos: guiaEditar?.procedimentos || [{
      dataRealizacao: getHojeBrasilia(),
      horaInicial: '',
      horaFinal: calcularHoraFinalSadt(guiaEditar?.procedimentos?.[0]?.horaInicial, undefined),
      codigoTabela: '22', // TUSS
      codigoProcedimento: '',
      descricaoProcedimento: '',
      quantidadeExecutada: 1,
      viaAcesso: VIA_ACESSO_PADRAO_SADT,
      tecnicaUtilizada: TECNICA_UTILIZADA_PADRAO_SADT,
      reducaoAcrescimo: 0,
      valorUnitario: 0,
      valorTotal: 0,
    }],
    
    // Observações e OPM
    observacao: guiaEditar?.observacao || '',
    tipoFaturamento: guiaEditar?.tipoFaturamento || '1', // 1 - Em estabelecimento
  });

  const [procedimentos, setProcedimentos] = useState(() => formData.procedimentos.map((procedimento: any) => ({
    ...procedimento,
    horaFinal: calcularHoraFinalSadt(procedimento.horaInicial, undefined),
    viaAcesso: VIA_ACESSO_PADRAO_SADT,
    tecnicaUtilizada: TECNICA_UTILIZADA_PADRAO_SADT,
  })));

  const adicionarProcedimento = () => {
    setProcedimentos([
      ...procedimentos,
      {
        dataRealizacao: getHojeBrasilia(),
        horaInicial: '',
        horaFinal: '',
        codigoTabela: '22',
        codigoProcedimento: '',
        descricaoProcedimento: '',
        quantidadeExecutada: 1,
        viaAcesso: VIA_ACESSO_PADRAO_SADT,
        tecnicaUtilizada: TECNICA_UTILIZADA_PADRAO_SADT,
        reducaoAcrescimo: 0,
        valorUnitario: 0,
        valorTotal: 0,
      },
    ]);
  };

  const removerProcedimento = (index: number) => {
    if (procedimentos.length > 1) {
      setProcedimentos(procedimentos.filter((_: any, i: number) => i !== index));
    } else {
      toast.error('É necessário manter pelo menos um procedimento');
    }
  };

  const atualizarProcedimento = (index: number, campo: string, valor: any) => {
    const novosProcedimentos = [...procedimentos];
    novosProcedimentos[index] = {
      ...novosProcedimentos[index],
      [campo]: valor,
      ...(campo === 'horaInicial' ? { horaFinal: calcularHoraFinalSadt(valor, undefined) } : {}),
    };

    // Recalcula valor total automaticamente
    if (campo === 'quantidadeExecutada' || campo === 'valorUnitario' || campo === 'reducaoAcrescimo') {
      const proc = novosProcedimentos[index];
      const valorBase = proc.quantidadeExecutada * proc.valorUnitario;
      const percentual = proc.reducaoAcrescimo || 0;
      proc.valorTotal = valorBase + (valorBase * percentual / 100);
    }

    setProcedimentos(novosProcedimentos);
  };

  const calcularValorTotal = () => {
    return procedimentos.reduce((total: number, proc: any) => total + (proc.valorTotal || 0), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações obrigatórias ANS
    if (!formData.numeroCarteirinha) {
      toast.error('Número da carteirinha é obrigatório');
      return;
    }

    if (!formData.nomeBeneficiario) {
      toast.error('Nome do beneficiário é obrigatório');
      return;
    }

    if (!formData.nomeProfissionalSolicitante) {
      toast.error('Profissional solicitante é obrigatório');
      return;
    }

    if (!formData.nomeProfissionalExecutante) {
      toast.error('Profissional executante é obrigatório');
      return;
    }

    if (procedimentos.some((p: any) => !p.codigoProcedimento || !p.descricaoProcedimento)) {
      toast.error('Todos os procedimentos devem ter código e descrição');
      return;
    }

    const guiaCompleta = {
      ...formData,
      procedimentos,
      valorTotal: calcularValorTotal(),
      status: 'Pronta',
    };

    onSave?.(guiaCompleta);
    toast.success('Guia SP/SADT gerada conforme padrão ANS/TISS');
    onOpenChange(false);
  };

  const gerarXMLGuia = () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas">
  <ans:guiaSP-SADT>
    <ans:cabecalhoGuia>
      <ans:registroANS>123456</ans:registroANS>
      <ans:numeroGuiaPrestador>${formData.numeroGuiaPrestador}</ans:numeroGuiaPrestador>
      <ans:numeroGuiaOperadora>${formData.numeroGuiaOperadora}</ans:numeroGuiaOperadora>
    </ans:cabecalhoGuia>
    <ans:dadosBeneficiario>
      <ans:numeroCarteira>${formData.numeroCarteirinha}</ans:numeroCarteira>
      <ans:nomeBeneficiario>${formData.nomeBeneficiario}</ans:nomeBeneficiario>
      <ans:numeroCartaoNacional>${formData.numeroCartaoNacional}</ans:numeroCartaoNacional>
    </ans:dadosBeneficiario>
    <ans:dadosSolicitante>
      <ans:nomeProfissional>${formData.nomeProfissionalSolicitante}</ans:nomeProfissional>
      <ans:conselhoProfissional>${formData.conselhoSolicitante}</ans:conselhoProfissional>
      <ans:numeroConselho>${formData.numeroConselhoSolicitante}</ans:numeroConselho>
      <ans:UF>${formData.ufConselhoSolicitante}</ans:UF>
    </ans:dadosSolicitante>
    <ans:procedimentosExecutados>
      ${procedimentos.map((proc: any, idx: number) => `
      <ans:procedimento>
        <ans:sequencialItem>${idx + 1}</ans:sequencialItem>
        <ans:dataExecucao>${proc.dataRealizacao}</ans:dataExecucao>
        <ans:codigoTabela>${proc.codigoTabela}</ans:codigoTabela>
        <ans:codigoProcedimento>${proc.codigoProcedimento}</ans:codigoProcedimento>
        <ans:descricao>${proc.descricaoProcedimento}</ans:descricao>
        <ans:quantidadeExecutada>${proc.quantidadeExecutada}</ans:quantidadeExecutada>
        <ans:valorUnitario>${proc.valorUnitario.toFixed(2)}</ans:valorUnitario>
        <ans:valorTotal>${proc.valorTotal.toFixed(2)}</ans:valorTotal>
      </ans:procedimento>`).join('')}
    </ans:procedimentosExecutados>
    <ans:valorTotal>${calcularValorTotal().toFixed(2)}</ans:valorTotal>
  </ans:guiaSP-SADT>
</ans:mensagemTISS>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Guia_SADT_${formData.numeroGuia}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('XML da guia gerado conforme padrão TISS/ANS');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Guia SP/SADT - Padrão ANS/TISS
          </DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Campos obrigatórios ANS:</strong> Todos os campos marcados com * são obrigatórios conforme 
            Resolução Normativa RN 305/2012 e Padrão TISS 3.05.00. Preencha todos os dados corretamente.
          </div>
        </div>

        {/* Informativo sobre tipos de campos ANS */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-yellow-900 mb-2">📋 Guia de Preenchimento ANS/TISS</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-yellow-800">
            <div>
              <p className="font-semibold mb-1">Campos de Identificação:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Número da Guia do Prestador (único e sequencial)</li>
                <li>Dados completos do beneficiário</li>
                <li>Registro ANS da operadora</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Dados Clínicos:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>CID-10 e indicação clínica</li>
                <li>Profissional solicitante e executante</li>
                <li>Procedimentos com código TUSS/CBHPM</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Informações Obrigatórias:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Tipo de atendimento (consulta, exame, cirurgia)</li>
                <li>Indicação de acidente (trabalho/trânsito)</li>
                <li>Via de acesso e técnica (quando aplicável)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Valores e Quantidades:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Valor unitário e total por procedimento</li>
                <li>Percentual de redução/acréscimo</li>
                <li>Cálculo automático de totais</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identificação da Guia */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">1. Identificação da Guia</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="numeroGuia">Nº Guia (Interno)</Label>
                <Input
                  id="numeroGuia"
                  value={formData.numeroGuia}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="numeroGuiaPrestador">Nº Guia Prestador *</Label>
                <Input
                  id="numeroGuiaPrestador"
                  value={formData.numeroGuiaPrestador}
                  onChange={(e) => setFormData({ ...formData, numeroGuiaPrestador: e.target.value })}
                  placeholder="Número único do prestador"
                  required
                />
              </div>
              <div>
                <Label htmlFor="numeroGuiaOperadora">Nº Guia Operadora</Label>
                <Input
                  id="numeroGuiaOperadora"
                  value={formData.numeroGuiaOperadora}
                  onChange={(e) => setFormData({ ...formData, numeroGuiaOperadora: e.target.value })}
                  placeholder="Após envio/autorização"
                />
              </div>
              <div>
                <Label htmlFor="dataEmissao">Data de Emissão *</Label>
                <Input
                  id="dataEmissao"
                  type="date"
                  value={formData.dataEmissao}
                  onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados do Beneficiário */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">2. Dados do Beneficiário</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="numeroCarteirinha">Nº Carteirinha *</Label>
                <Input
                  id="numeroCarteirinha"
                  value={formData.numeroCarteirinha}
                  onChange={(e) => setFormData({ ...formData, numeroCarteirinha: e.target.value })}
                  placeholder="Número da carteirinha"
                  required
                />
              </div>
              <div>
                <Label htmlFor="validadeCarteirinha">Validade da Carteirinha</Label>
                <Input
                  id="validadeCarteirinha"
                  type="date"
                  value={formData.validadeCarteirinha}
                  onChange={(e) => setFormData({ ...formData, validadeCarteirinha: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <Label htmlFor="nomeBeneficiario">Nome do Beneficiário *</Label>
                <Input
                  id="nomeBeneficiario"
                  value={formData.nomeBeneficiario}
                  onChange={(e) => setFormData({ ...formData, nomeBeneficiario: e.target.value })}
                  placeholder="Nome completo do paciente"
                  required
                />
              </div>
              <div>
                <Label htmlFor="numeroCartaoNacional">CNS - Cartão Nacional de Saúde</Label>
                <Input
                  id="numeroCartaoNacional"
                  value={formData.numeroCartaoNacional}
                  onChange={(e) => setFormData({ ...formData, numeroCartaoNacional: e.target.value })}
                  placeholder="Número CNS"
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          {/* Dados do Contratado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">3. Dados do Contratado</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nomeContratado">Nome do Contratado *</Label>
                <Input
                  id="nomeContratado"
                  value={formData.nomeContratado}
                  onChange={(e) => setFormData({ ...formData, nomeContratado: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="codigoPrestador">Código na Operadora *</Label>
                <Input
                  id="codigoPrestador"
                  value={formData.codigoPrestador}
                  onChange={(e) => setFormData({ ...formData, codigoPrestador: e.target.value })}
                  placeholder="Código do prestador"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cnesContratado">CNES</Label>
                <Input
                  id="cnesContratado"
                  value={formData.cnesContratado}
                  onChange={(e) => setFormData({ ...formData, cnesContratado: e.target.value })}
                  placeholder="Código CNES"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Dados do Profissional Solicitante */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">4. Profissional Solicitante</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nomeProfissionalSolicitante">Nome do Profissional *</Label>
                <Input
                  id="nomeProfissionalSolicitante"
                  value={formData.nomeProfissionalSolicitante}
                  onChange={(e) => setFormData({ ...formData, nomeProfissionalSolicitante: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="conselhoSolicitante">Conselho *</Label>
                <Select 
                  value={formData.conselhoSolicitante} 
                  onValueChange={(value) => setFormData({ ...formData, conselhoSolicitante: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRM">CRM - Medicina</SelectItem>
                    <SelectItem value="CRO">CRO - Odontologia</SelectItem>
                    <SelectItem value="CRF">CRF - Farmácia</SelectItem>
                    <SelectItem value="CREFITO">CREFITO - Fisioterapia</SelectItem>
                    <SelectItem value="CRN">CRN - Nutrição</SelectItem>
                    <SelectItem value="CRP">CRP - Psicologia</SelectItem>
                    <SelectItem value="COREN">COREN - Enfermagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numeroConselhoSolicitante">Nº Conselho *</Label>
                <Input
                  id="numeroConselhoSolicitante"
                  value={formData.numeroConselhoSolicitante}
                  onChange={(e) => setFormData({ ...formData, numeroConselhoSolicitante: e.target.value })}
                  placeholder="Número"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ufConselhoSolicitante">UF *</Label>
                <Select 
                  value={formData.ufConselhoSolicitante} 
                  onValueChange={(value) => setFormData({ ...formData, ufConselhoSolicitante: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="codigoCboS">Código CBO-S</Label>
                <Input
                  id="codigoCboS"
                  value={formData.codigoCboS}
                  onChange={(e) => setFormData({ ...formData, codigoCboS: e.target.value })}
                  placeholder="Ex: 225125"
                  maxLength={6}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="dataSolicitacao">Data da Solicitação *</Label>
                <Input
                  id="dataSolicitacao"
                  type="date"
                  value={formData.dataSolicitacao}
                  onChange={(e) => setFormData({ ...formData, dataSolicitacao: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Indicação Clínica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">5. Indicação Clínica</h3>
            <div>
              <Label htmlFor="indicacaoClinica">Descrição / CID-10</Label>
              <Textarea
                id="indicacaoClinica"
                value={formData.indicacaoClinica}
                onChange={(e) => setFormData({ ...formData, indicacaoClinica: e.target.value })}
                placeholder="Descreva a indicação clínica e CID-10"
                rows={3}
              />
            </div>
          </div>

          {/* Procedimentos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold border-b pb-2 flex-1">6. Procedimentos e Exames Solicitados</h3>
              <Button type="button" onClick={adicionarProcedimento} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Procedimento
              </Button>
            </div>

            {procedimentos.map((proc: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Procedimento {index + 1}</h4>
                  {procedimentos.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removerProcedimento(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Data de Realização *</Label>
                    <Input
                      type="date"
                      value={proc.dataRealizacao}
                      onChange={(e) => atualizarProcedimento(index, 'dataRealizacao', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Hora Inicial</Label>
                    <Input
                      type="time"
                      value={proc.horaInicial}
                      onChange={(e) => atualizarProcedimento(index, 'horaInicial', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hora Final</Label>
                    <Input
                      type="time"
                      value={proc.horaFinal}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label>Tabela *</Label>
                    <Select 
                      value={proc.codigoTabela} 
                      onValueChange={(value) => atualizarProcedimento(index, 'codigoTabela', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="22">22 - TUSS</SelectItem>
                        <SelectItem value="18">18 - CBHPM</SelectItem>
                        <SelectItem value="19">19 - Própria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Código do Procedimento *</Label>
                    <Input
                      value={proc.codigoProcedimento}
                      onChange={(e) => atualizarProcedimento(index, 'codigoProcedimento', e.target.value)}
                      placeholder="Ex: 10101012"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Descrição do Procedimento *</Label>
                    <Input
                      value={proc.descricaoProcedimento}
                      onChange={(e) => atualizarProcedimento(index, 'descricaoProcedimento', e.target.value)}
                      placeholder="Nome do procedimento"
                      required
                    />
                  </div>
                  <div>
                    <Label>Quantidade *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={proc.quantidadeExecutada}
                      onChange={(e) => atualizarProcedimento(index, 'quantidadeExecutada', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Via de Acesso</Label>
                    <Select 
                      value={VIA_ACESSO_PADRAO_SADT}
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Mesma via</SelectItem>
                        <SelectItem value="2">2 - Via diferente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Técnica Utilizada</Label>
                    <Select 
                      value={TECNICA_UTILIZADA_PADRAO_SADT}
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Convencional</SelectItem>
                        <SelectItem value="2">2 - Vídeo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor Unitário *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={proc.valorUnitario}
                      onChange={(e) => atualizarProcedimento(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label>% Red./Acres.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={proc.reducaoAcrescimo}
                      onChange={(e) => atualizarProcedimento(index, 'reducaoAcrescimo', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Valor Total</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={proc.valorTotal.toFixed(2)}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end items-center gap-4 bg-blue-50 p-4 rounded-lg">
              <span className="text-lg font-semibold">Valor Total da Guia:</span>
              <span className="text-2xl font-bold text-blue-600">
                R$ {calcularValorTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Dados do Profissional Executante */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">7. Profissional Executante</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nomeProfissionalExecutante">Nome do Profissional *</Label>
                <Input
                  id="nomeProfissionalExecutante"
                  value={formData.nomeProfissionalExecutante}
                  onChange={(e) => setFormData({ ...formData, nomeProfissionalExecutante: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="conselhoExecutante">Conselho *</Label>
                <Select 
                  value={formData.conselhoExecutante} 
                  onValueChange={(value) => setFormData({ ...formData, conselhoExecutante: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRM">CRM - Medicina</SelectItem>
                    <SelectItem value="CRO">CRO - Odontologia</SelectItem>
                    <SelectItem value="CRF">CRF - Farmácia</SelectItem>
                    <SelectItem value="CREFITO">CREFITO - Fisioterapia</SelectItem>
                    <SelectItem value="CRN">CRN - Nutrição</SelectItem>
                    <SelectItem value="CRP">CRP - Psicologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numeroConselhoExecutante">Nº Conselho *</Label>
                <Input
                  id="numeroConselhoExecutante"
                  value={formData.numeroConselhoExecutante}
                  onChange={(e) => setFormData({ ...formData, numeroConselhoExecutante: e.target.value })}
                  placeholder="Número"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ufConselhoExecutante">UF *</Label>
                <Select 
                  value={formData.ufConselhoExecutante} 
                  onValueChange={(value) => setFormData({ ...formData, ufConselhoExecutante: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="codigoCboE">Código CBO-S</Label>
                <Input
                  id="codigoCboE"
                  value={formData.codigoCboE}
                  onChange={(e) => setFormData({ ...formData, codigoCboE: e.target.value })}
                  placeholder="Ex: 225125"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">8. Observações</h3>
            <div>
              <Label htmlFor="observacao">Observações Adicionais</Label>
              <Textarea
                id="observacao"
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                placeholder="Observações gerais sobre a guia"
                rows={3}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={gerarXMLGuia}>
              <Download className="w-4 h-4 mr-2" />
              Exportar XML TISS
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                {guiaEditar ? 'Atualizar Guia' : 'Gerar Guia SP/SADT'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
