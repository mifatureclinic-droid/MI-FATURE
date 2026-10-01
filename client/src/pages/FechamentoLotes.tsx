import { getHojeBrasilia } from '../lib/utils';
import { useState } from 'react';
import { FileText, Download, Users, Building2, Calendar, DollarSign, Filter, CheckCircle, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export function FechamentoLotes() {
  const [mesFilter, setMesFilter] = useState('12/2025');
  const [convenioFilter, setConvenioFilter] = useState('todos');
  const [profissionalFilter, setProfissionalFilter] = useState('todos');
  const [modalFechamentoOpen, setModalFechamentoOpen] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<any>(null);

  // Dados mockados de lotes
  const lotes = [
    {
      id: 1,
      profissional: 'Dr. João Silva',
      crmCpf: 'CRM 12345-SP',
      convenio: 'Unimed',
      mes: '12/2025',
      guias: 15,
      procedimentos: 28,
      valorTotal: 4850.00,
      valorRepasse: 3395.00, // 70% do total
      status: 'Em Aberto',
    },
    {
      id: 2,
      profissional: 'Dra. Maria Santos',
      crmCpf: 'CRM 67890-SP',
      convenio: 'Unimed',
      mes: '12/2025',
      guias: 22,
      procedimentos: 35,
      valorTotal: 7200.00,
      valorRepasse: 5040.00,
      status: 'Em Aberto',
    },
    {
      id: 3,
      profissional: 'Dr. Carlos Oliveira',
      crmCpf: 'CRM 11223-SP',
      convenio: 'Bradesco Saúde',
      mes: '12/2025',
      guias: 18,
      procedimentos: 32,
      valorTotal: 6150.00,
      valorRepasse: 4305.00,
      status: 'Em Aberto',
    },
    {
      id: 4,
      profissional: 'Dr. João Silva',
      crmCpf: 'CRM 12345-SP',
      convenio: 'Bradesco Saúde',
      mes: '12/2025',
      guias: 11,
      procedimentos: 19,
      valorTotal: 3290.00,
      valorRepasse: 2303.00,
      status: 'Em Aberto',
    },
    {
      id: 5,
      profissional: 'Dra. Ana Costa',
      crmCpf: 'CRM 44556-SP',
      convenio: 'Amil',
      mes: '12/2025',
      guias: 14,
      procedimentos: 23,
      valorTotal: 5100.00,
      valorRepasse: 3570.00,
      status: 'Fechado',
      dataFechamento: '28/12/2025',
    },
    {
      id: 6,
      profissional: 'Dr. Pedro Alves',
      crmCpf: 'CRM 77889-SP',
      convenio: 'Unimed',
      mes: '11/2025',
      guias: 19,
      procedimentos: 31,
      valorTotal: 6890.00,
      valorRepasse: 4823.00,
      status: 'Enviado',
      dataEnvio: '05/12/2025',
      numeroLote: 'LOTE-112025-UNIMED-PEDRO',
    },
    {
      id: 7,
      profissional: 'Dra. Maria Santos',
      crmCpf: 'CRM 67890-SP',
      convenio: 'Bradesco Saúde',
      mes: '11/2025',
      guias: 20,
      procedimentos: 38,
      valorTotal: 7850.00,
      valorRepasse: 5495.00,
      status: 'Pago',
      dataPagamento: '15/12/2025',
      valorPago: 7850.00,
    },
  ];

  // Filtros
  let lotesFiltrados = lotes;
  if (convenioFilter !== 'todos') {
    lotesFiltrados = lotesFiltrados.filter(l => l.convenio === convenioFilter);
  }
  if (profissionalFilter !== 'todos') {
    lotesFiltrados = lotesFiltrados.filter(l => l.profissional === profissionalFilter);
  }
  if (mesFilter !== 'todos') {
    lotesFiltrados = lotesFiltrados.filter(l => l.mes === mesFilter);
  }

  // Estatísticas
  const totalLotes = lotesFiltrados.length;
  const lotesEmAberto = lotesFiltrados.filter(l => l.status === 'Em Aberto').length;
  const valorTotalGeral = lotesFiltrados.reduce((sum, l) => sum + l.valorTotal, 0);
  const valorRepasseGeral = lotesFiltrados.reduce((sum, l) => sum + l.valorRepasse, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Aberto': return 'bg-yellow-100 text-yellow-700';
      case 'Fechado': return 'bg-blue-100 text-blue-700';
      case 'Enviado': return 'bg-purple-100 text-purple-700';
      case 'Pago': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleFecharLote = (lote: any) => {
    setLoteSelecionado({
      ...lote,
      numeroLote: `LOTE-${lote.mes.replace('/', '')}-${lote.convenio.replace(/\s/g, '')}-${lote.profissional.split(' ')[1].toUpperCase()}`,
      dataFechamento: getHojeBrasilia(),
    });
    setModalFechamentoOpen(true);
  };

  const handleConfirmarFechamento = () => {
    // Gerar XML do lote
    gerarXMLLote(loteSelecionado);
    toast.success(`Lote ${loteSelecionado.numeroLote} fechado com sucesso!`);
    setModalFechamentoOpen(false);
  };

  const gerarXMLLote = (lote: any) => {
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toISOString().split('T')[0];
    const horaFormatada = dataAtual.toTimeString().split(' ')[0];
    
    // XML TISS 3.05.00 completo conforme padrão ANS
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ans.gov.br/padroes/tiss/schemas http://www.ans.gov.br/padroes/tiss/schemas/tissV3_05_00.xsd">
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>${String(lote.id).padStart(12, '0')}</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>${dataFormatada}</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>${horaFormatada}</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:codigoPrestadorNaOperadora>123456</ans:codigoPrestadorNaOperadora>
        <ans:CNPJ>00000000000000</ans:CNPJ>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>${lote.convenio === 'Unimed' ? '123456' : lote.convenio === 'Bradesco Saúde' ? '789012' : '345678'}</ans:registroANS>
    </ans:destino>
    <ans:versaoPadrao>3.05.00</ans:versaoPadrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>${lote.numeroLote}</ans:numeroLote>
      <ans:guiasTISS>
        <!-- Guias SP-SADT Individuais -->
        ${Array.from({ length: lote.guias }, (_, i) => `
        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:registroANS>${lote.convenio === 'Unimed' ? '123456' : lote.convenio === 'Bradesco Saúde' ? '789012' : '345678'}</ans:registroANS>
            <ans:numeroGuiaPrestador>${lote.numeroLote}-${String(i + 1).padStart(3, '0')}</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          <ans:dadosAutorizacao>
            <ans:numeroGuiaOperadora>${String(Math.floor(Math.random() * 1000000)).padStart(10, '0')}</ans:numeroGuiaOperadora>
            <ans:dataAutorizacao>${dataFormatada}</ans:dataAutorizacao>
          </ans:dadosAutorizacao>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>${String(Math.floor(Math.random() * 1000000)).padStart(16, '0')}</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>
            <ans:nomeBeneficiario>PACIENTE EXEMPLO ${i + 1}</ans:nomeBeneficiario>
          </ans:dadosBeneficiario>
          <ans:dadosSolicitante>
            <ans:contratadoSolicitante>
              <ans:cnpjContratado>00000000000000</ans:cnpjContratado>
              <ans:nomeContratado>CLINICA EXEMPLO</ans:nomeContratado>
            </ans:contratadoSolicitante>
            <ans:profissionalSolicitante>
              <ans:nomeProfissional>${lote.profissional}</ans:nomeProfissional>
              <ans:conselhoProfissional>${lote.crmCpf.split(' ')[0]}</ans:conselhoProfissional>
              <ans:numeroConselhoProfissional>${lote.crmCpf.split(' ')[1]?.split('-')[0] || '12345'}</ans:numeroConselhoProfissional>
              <ans:UF>${lote.crmCpf.split('-')[1] || 'SP'}</ans:UF>
              <ans:CBOS>225125</ans:CBOS>
            </ans:profissionalSolicitante>
            <ans:caracterizacaoSolicitacao>U</ans:caracterizacaoSolicitacao>
            <ans:dataSolicitacao>${dataFormatada}</ans:dataSolicitacao>
          </ans:dadosSolicitante>
          <ans:dadosExecutante>
            <ans:contratadoExecutante>
              <ans:codigoPrestadorNaOperadora>123456</ans:codigoPrestadorNaOperadora>
              <ans:nomeContratado>CLINICA EXEMPLO</ans:nomeContratado>
              <ans:CNES>1234567</ans:CNES>
            </ans:contratadoExecutante>
          </ans:dadosExecutante>
          <ans:dadosAtendimento>
            <ans:tipoAtendimento>04</ans:tipoAtendimento>
            <ans:indicacaoAcidente>9</ans:indicacaoAcidente>
            <ans:tipoConsulta>1</ans:tipoConsulta>
          </ans:dadosAtendimento>
          <ans:procedimentosExecutados>
            <ans:procedimentoExecutado>
              <ans:sequencialItem>1</ans:sequencialItem>
              <ans:dataExecucao>${dataFormatada}</ans:dataExecucao>
              <ans:horaInicial>08:00:00</ans:horaInicial>
              <ans:horaFinal>09:00:00</ans:horaFinal>
              <ans:procedimento>
                <ans:codigoTabela>22</ans:codigoTabela>
                <ans:codigoProcedimento>10101012</ans:codigoProcedimento>
                <ans:descricao>CONSULTA MEDICA</ans:descricao>
              </ans:procedimento>
              <ans:quantidadeExecutada>1</ans:quantidadeExecutada>
              <ans:viaAcesso>0</ans:viaAcesso>
              <ans:tecnicaUtilizada>0</ans:tecnicaUtilizada>
              <ans:reducaoAcrescimo>0.00</ans:reducaoAcrescimo>
              <ans:valorUnitario>${(lote.valorTotal / lote.guias).toFixed(2)}</ans:valorUnitario>
              <ans:valorTotal>${(lote.valorTotal / lote.guias).toFixed(2)}</ans:valorTotal>
              <ans:grauPart>00</ans:grauPart>
            </ans:procedimentoExecutado>
          </ans:procedimentosExecutados>
          <ans:observacao>Guia gerada automaticamente pelo sistema MIFATURE</ans:observacao>
          <ans:valorTotal>
            <ans:valorProcedimentos>${(lote.valorTotal / lote.guias).toFixed(2)}</ans:valorProcedimentos>
            <ans:valorDiarias>0.00</ans:valorDiarias>
            <ans:valorTaxasAlugueis>0.00</ans:valorTaxasAlugueis>
            <ans:valorMateriais>0.00</ans:valorMateriais>
            <ans:valorMedicamentos>0.00</ans:valorMedicamentos>
            <ans:valorOPME>0.00</ans:valorOPME>
            <ans:valorGasesMedicinais>0.00</ans:valorGasesMedicinais>
            <ans:valorTotalGeral>${(lote.valorTotal / lote.guias).toFixed(2)}</ans:valorTotalGeral>
          </ans:valorTotal>
        </ans:guiaSP-SADT>`).join('')}
      </ans:guiasTISS>
      <ans:valorTotal>
        <ans:valorProcedimentos>${lote.valorTotal.toFixed(2)}</ans:valorProcedimentos>
        <ans:valorDiarias>0.00</ans:valorDiarias>
        <ans:valorTaxasAlugueis>0.00</ans:valorTaxasAlugueis>
        <ans:valorMateriais>0.00</ans:valorMateriais>
        <ans:valorMedicamentos>0.00</ans:valorMedicamentos>
        <ans:valorOPME>0.00</ans:valorOPME>
        <ans:valorGasesMedicinais>0.00</ans:valorGasesMedicinais>
        <ans:valorTotalGeral>${lote.valorTotal.toFixed(2)}</ans:valorTotalGeral>
      </ans:valorTotal>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:epilogo>
    <ans:hash>MD5-HASH-EXAMPLE-${String(Math.floor(Math.random() * 1000000))}</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lote.numeroLote}_TISS_ANS.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('XML TISS/ANS 3.05.00 gerado com todas as guias do lote!');
  };

  const exportarRelatorioRepasse = () => {
    const csv = [
      ['Profissional', 'CRM/CPF', 'Convênio', 'Mês', 'Guias', 'Procedimentos', 'Valor Total', 'Valor Repasse', 'Status'].join(';'),
      ...lotesFiltrados.map(l => 
        [l.profissional, l.crmCpf, l.convenio, l.mes, l.guias, l.procedimentos, l.valorTotal.toFixed(2), l.valorRepasse.toFixed(2), l.status].join(';')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_Repasse_${mesFilter.replace('/', '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório de repasse exportado com sucesso!');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Fechamento de Lotes</h1>
          <p className="text-gray-600">Fechamento por Profissional e Convênio - Padrão ANS/TISS</p>
        </div>
        <Button onClick={exportarRelatorioRepasse} className="bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4 mr-2" />
          Exportar Repasse
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Lotes</p>
              <p className="text-2xl font-bold mt-1">{totalLotes}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lotes em Aberto</p>
              <p className="text-2xl font-bold mt-1">{lotesEmAberto}</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold mt-1">R$ {valorTotalGeral.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Repasse Profissionais</p>
              <p className="text-2xl font-bold mt-1">R$ {valorRepasseGeral.toFixed(2)}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          
          <Select value={mesFilter} onValueChange={setMesFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              <SelectItem value="12/2025">Dezembro/2025</SelectItem>
              <SelectItem value="11/2025">Novembro/2025</SelectItem>
              <SelectItem value="10/2025">Outubro/2025</SelectItem>
            </SelectContent>
          </Select>

          <Select value={convenioFilter} onValueChange={setConvenioFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Convênio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos convênios</SelectItem>
              <SelectItem value="Unimed">Unimed</SelectItem>
              <SelectItem value="Bradesco Saúde">Bradesco Saúde</SelectItem>
              <SelectItem value="Amil">Amil</SelectItem>
              <SelectItem value="SulAmérica">SulAmérica</SelectItem>
            </SelectContent>
          </Select>

          <Select value={profissionalFilter} onValueChange={setProfissionalFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos profissionais</SelectItem>
              <SelectItem value="Dr. João Silva">Dr. João Silva</SelectItem>
              <SelectItem value="Dra. Maria Santos">Dra. Maria Santos</SelectItem>
              <SelectItem value="Dr. Carlos Oliveira">Dr. Carlos Oliveira</SelectItem>
              <SelectItem value="Dra. Ana Costa">Dra. Ana Costa</SelectItem>
              <SelectItem value="Dr. Pedro Alves">Dr. Pedro Alves</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold mb-1 text-blue-900">
              Fechamento Individualizado por Profissional e Convênio
            </h3>
            <p className="text-sm text-blue-800">
              Cada lote é gerado separadamente por profissional e convênio, facilitando o controle de repasse 
              e o envio aos convênios. O sistema gera XML TISS/ANS 3.05.00 com todas as guias do período, 
              identificando o profissional executante e os valores de repasse calculados automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Lotes */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Lotes por Profissional e Convênio</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Profissional</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">CRM/CPF</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Convênio</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Mês</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Guias</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Valor Total</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Repasse</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lotesFiltrados.map((lote) => (
                <tr key={lote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{lote.profissional}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lote.crmCpf}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{lote.convenio}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lote.mes}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {lote.guias} guias
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    R$ {lote.valorTotal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600">
                    R$ {lote.valorRepasse.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(lote.status)}`}>
                      {lote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {lote.status === 'Em Aberto' && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleFecharLote(lote)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Fechar Lote
                        </Button>
                      )}
                      {lote.status === 'Fechado' && (
                        <>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => gerarXMLLote(lote)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Enviar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => gerarXMLLote(lote)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            XML
                          </Button>
                        </>
                      )}
                      {(lote.status === 'Enviado' || lote.status === 'Pago') && (
                        <div className="text-xs text-gray-600">
                          {lote.status === 'Enviado' && (
                            <div>
                              <div className="font-medium">Lote: {lote.numeroLote}</div>
                              <div>Enviado: {lote.dataEnvio}</div>
                            </div>
                          )}
                          {lote.status === 'Pago' && (
                            <div>
                              <div className="font-medium text-green-600">Pago: {lote.dataPagamento}</div>
                              <div>R$ {lote.valorPago?.toFixed(2)}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lotesFiltrados.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum lote encontrado com os filtros selecionados</p>
          </div>
        )}
      </div>

      {/* Modal de Fechamento */}
      <Dialog open={modalFechamentoOpen} onOpenChange={setModalFechamentoOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              Fechar Lote
            </DialogTitle>
          </DialogHeader>

          {loteSelecionado && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Profissional:</span>
                  <span className="font-semibold">{loteSelecionado.profissional}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">CRM/CPF:</span>
                  <span className="font-semibold">{loteSelecionado.crmCpf}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Convênio:</span>
                  <span className="font-semibold">{loteSelecionado.convenio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Período:</span>
                  <span className="font-semibold">{loteSelecionado.mes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total de Guias:</span>
                  <span className="font-semibold">{loteSelecionado.guias}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm text-gray-600">Valor Total:</span>
                  <span className="font-bold text-lg">R$ {loteSelecionado.valorTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor Repasse (70%):</span>
                  <span className="font-bold text-lg text-green-600">
                    R$ {loteSelecionado.valorRepasse?.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="numeroLote">Número do Lote</Label>
                  <Input
                    id="numeroLote"
                    value={loteSelecionado.numeroLote}
                    onChange={(e) => setLoteSelecionado({ ...loteSelecionado, numeroLote: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dataFechamento">Data de Fechamento</Label>
                  <Input
                    id="dataFechamento"
                    type="date"
                    value={loteSelecionado.dataFechamento}
                    onChange={(e) => setLoteSelecionado({ ...loteSelecionado, dataFechamento: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                <strong>Atenção:</strong> Ao fechar o lote, será gerado automaticamente o arquivo XML TISS/ANS 3.05.00 
                com todas as guias do período. O lote ficará disponível para envio ao convênio.
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setModalFechamentoOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmarFechamento}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Fechamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}