import { useState } from 'react';
import { FileText, Download, Mail, Eye, XCircle, Search, Filter, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { StatsCard } from '../components/StatsCard';
import { toast } from 'sonner';

export function NotasFiscais() {
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes-atual');

  // Lista de notas fiscais — dados reais a serem inseridos
  const notasFiscais: any[] = [];

  const handleReenviarEmail = (nf: any) => {
    toast.success(`NF-e ${nf.numero} reenviada para ${nf.email}`);
  };

  const handleBaixarPDF = (nf: any) => {
    toast.success(`Download do PDF da NF-e ${nf.numero} iniciado`);
  };

  const handleBaixarXML = (nf: any) => {
    toast.success(`Download do XML da NF-e ${nf.numero} iniciado`);
  };

  const handleVisualizarDANFE = (nf: any) => {
    toast.info(`Abrindo DANFE da NF-e ${nf.numero}`);
  };

  const handleCancelarNF = (nf: any) => {
    toast.warning(`Solicitação de cancelamento da NF-e ${nf.numero} registrada`);
  };

  // Calcular estatísticas
  const totalEmitidas = notasFiscais.filter(nf => nf.status === 'Emitida').length;
  const valorTotalEmitidas = notasFiscais
    .filter(nf => nf.status === 'Emitida')
    .reduce((acc, nf) => acc + nf.valorLiquido, 0);
  const totalEnviadas = notasFiscais.filter(nf => nf.enviadoEmail).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Notas Fiscais</h1>
          <p className="text-gray-600">Gerenciamento de NF-e para pacientes particulares</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="NF-e Emitidas"
          value={totalEmitidas.toString()}
          icon={FileText}
          subtitle="No mês atual"
        />
        <StatsCard
          title="Valor Total Faturado"
          value={`R$ ${valorTotalEmitidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={FileText}
          subtitle="Pacientes particulares"
        />
        <StatsCard
          title="E-mails Enviados"
          value={totalEnviadas.toString()}
          icon={Mail}
          subtitle="Envio automático ativo"
        />
      </div>

      {/* Informações sobre Emissão */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="text-sm">Sistema de Emissão de NF-e Integrado</h3>
            <p className="text-sm text-gray-700">
              • As notas fiscais são emitidas automaticamente através da página de Atendimentos para pacientes particulares<br />
              • Envio automático por e-mail após confirmação da emissão<br />
              • Arquivos PDF e XML disponíveis para download a qualquer momento<br />
              • Conformidade com a legislação municipal vigente para prestação de serviços médicos
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Buscar por número, paciente ou CPF..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-48">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="emitidas">Emitidas</SelectItem>
                <SelectItem value="canceladas">Canceladas</SelectItem>
                <SelectItem value="enviadas">Enviadas por E-mail</SelectItem>
                <SelectItem value="pendentes">Pendentes de Envio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes-atual">Mês Atual</SelectItem>
                <SelectItem value="mes-anterior">Mês Anterior</SelectItem>
                <SelectItem value="trimestre">Último Trimestre</SelectItem>
                <SelectItem value="ano">Ano Atual</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabela de Notas Fiscais */}
      <div className="bg-white border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-600">NF-e</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Data Emissão</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Paciente</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">CPF</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Descrição</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Valor Líquido</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {notasFiscais.map((nf) => (
                <tr key={nf.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{nf.numero}</div>
                      <div className="text-gray-600">Série {nf.serie}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{nf.data}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{nf.paciente}</div>
                      {nf.enviadoEmail && (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Enviado {nf.dataEnvio}
                        </div>
                      )}
                      {!nf.enviadoEmail && nf.status === 'Emitida' && (
                        <div className="text-xs text-yellow-600">
                          Pendente de envio
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{nf.cpf}</td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate" title={nf.descricao}>
                    {nf.descricao}
                  </td>
                  <td className="px-6 py-4">
                    R$ {nf.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      nf.status === 'Emitida' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {nf.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleVisualizarDANFE(nf)}
                        title="Visualizar DANFE"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleBaixarPDF(nf)}
                        title="Baixar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      {nf.status === 'Emitida' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleReenviarEmail(nf)}
                            title="Reenviar por e-mail"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCancelarNF(nf)}
                            title="Cancelar NF-e"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Informações Legais */}
      <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600">
        <h4 className="mb-2">Informações Importantes:</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li>As notas fiscais são emitidas em conformidade com a legislação municipal vigente</li>
          <li>O prazo para cancelamento de NF-e é de até 24 horas após a emissão</li>
          <li>Mantenha os arquivos XML arquivados por no mínimo 5 anos para fins fiscais</li>
          <li>Em caso de dúvidas sobre tributação, consulte seu contador</li>
          <li>O envio automático por e-mail está sujeito à validação do endereço eletrônico</li>
        </ul>
      </div>
    </div>
  );
}
