import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, Filter, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function Logs() {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroData, setFiltroData] = useState('');

  const logs = [
    {
      id: 1,
      tipo: 'sucesso',
      modulo: 'Integração',
      acao: 'Envio de XML',
      detalhes: 'Guia SADT enviada com sucesso para Unimed',
      protocolo: 'ENV-2026-001234',
      retornoTecnico: 'HTTP 200 - Processado com sucesso. ID_LOTE: 20260324001',
      usuario: 'Sistema',
      data: '24/03/2026 15:45:32'
    },
    {
      id: 2,
      tipo: 'erro',
      modulo: 'Elegibilidade',
      acao: 'Consulta Automática',
      detalhes: 'Falha na consulta de elegibilidade - Timeout',
      protocolo: '-',
      retornoTecnico: 'Error 504 - Gateway Timeout. Servidor da operadora não respondeu em 30s',
      usuario: 'Recepção 1',
      data: '24/03/2026 14:30:15'
    },
    {
      id: 3,
      tipo: 'sucesso',
      modulo: 'Autorização',
      acao: 'Solicitação Online',
      detalhes: 'Autorização obtida automaticamente',
      protocolo: 'AUT-2026-005678',
      retornoTecnico: 'Autorizado. Senha: 987654321. Validade: 30 dias',
      usuario: 'Sistema',
      data: '24/03/2026 13:22:18'
    },
    {
      id: 4,
      tipo: 'alerta',
      modulo: 'Faturamento',
      acao: 'Validação XML',
      detalhes: 'Campo opcional vazio: Observações',
      protocolo: 'VAL-2026-009876',
      retornoTecnico: 'Warning: Campo obs_guia vazio. Não impede envio mas recomenda-se preenchimento',
      usuario: 'Faturamento',
      data: '24/03/2026 11:15:44'
    },
    {
      id: 5,
      tipo: 'erro',
      modulo: 'Integração',
      acao: 'Recebimento Retorno',
      detalhes: 'Erro ao processar retorno da operadora',
      protocolo: 'RET-2026-003456',
      retornoTecnico: 'Error 400 - XML malformado. Tag <loteGuias> fechada incorretamente',
      usuario: 'Sistema',
      data: '24/03/2026 10:05:22'
    },
    {
      id: 6,
      tipo: 'sucesso',
      modulo: 'Elegibilidade',
      acao: 'Consulta Automática',
      detalhes: 'Beneficiário ativo confirmado',
      protocolo: 'ELE-2026-007890',
      retornoTecnico: 'Status: ATIVO. Plano: Premium. Carência: Completa',
      usuario: 'Recepção 2',
      data: '24/03/2026 09:30:55'
    },
    {
      id: 7,
      tipo: 'alerta',
      modulo: 'Autorização',
      acao: 'Vencimento Próximo',
      detalhes: 'Autorização vence em 3 dias',
      protocolo: 'AUT-2026-001122',
      retornoTecnico: 'Alerta automático: Autorização 123456 válida até 27/03/2026',
      usuario: 'Sistema',
      data: '24/03/2026 08:00:00'
    },
    {
      id: 8,
      tipo: 'sucesso',
      modulo: 'Integração',
      acao: 'Atualização Status',
      detalhes: 'Status atualizado: Pago',
      protocolo: 'UPD-2026-004455',
      retornoTecnico: 'Guia 456789 - Status alterado para PAGO. Valor: R$ 1.250,00',
      usuario: 'Sistema',
      data: '23/03/2026 17:45:10'
    },
  ];

  const logsFiltrados = logs.filter(log => {
    if (filtroTipo !== 'todos' && log.tipo !== filtroTipo) return false;
    return true;
  });

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'sucesso':
        return <CheckCircle className="size-5 text-green-600" />;
      case 'erro':
        return <XCircle className="size-5 text-red-600" />;
      case 'alerta':
        return <AlertCircle className="size-5 text-yellow-600" />;
      default:
        return <Clock className="size-5 text-gray-600" />;
    }
  };

  const getCorFundo = (tipo: string) => {
    switch (tipo) {
      case 'sucesso':
        return 'bg-green-50 border-green-200';
      case 'erro':
        return 'bg-red-50 border-red-200';
      case 'alerta':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Logs e Monitoramento</h1>
          <p className="text-gray-600">Registro de erros e histórico de integrações - Seção 3.9 MIFATURE</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download />
          Exportar Logs
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="size-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="tipo">Tipo de Log</Label>
            <select
              id="tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-input-background px-3 py-1 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="sucesso">Sucesso</option>
              <option value="erro">Erro</option>
              <option value="alerta">Alerta</option>
            </select>
          </div>

          <div>
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="modulo">Módulo</Label>
            <select
              id="modulo"
              className="w-full h-9 rounded-md border border-input bg-input-background px-3 py-1 text-sm"
            >
              <option value="">Todos</option>
              <option value="integracao">Integração</option>
              <option value="elegibilidade">Elegibilidade</option>
              <option value="autorizacao">Autorização</option>
              <option value="faturamento">Faturamento</option>
            </select>
          </div>

          <div>
            <Label htmlFor="busca">Buscar</Label>
            <Input
              id="busca"
              placeholder="Protocolo, detalhes..."
            />
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="size-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sucessos</p>
              <p className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.tipo === 'sucesso').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="size-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Erros</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.tipo === 'erro').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="size-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Alertas</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter(l => l.tipo === 'alerta').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="size-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl mb-4">Registros de Log</h2>
        <div className="space-y-3">
          {logsFiltrados.map((log) => (
            <div key={log.id} className={`border rounded-lg p-4 ${getCorFundo(log.tipo)}`}>
              <div className="flex items-start gap-3">
                {getIcone(log.tipo)}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{log.modulo}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{log.acao}</span>
                      </div>
                      <p className="text-sm mb-2">{log.detalhes}</p>
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap ml-4">{log.data}</span>
                  </div>
                  
                  <div className="bg-white/50 rounded p-3 mb-2">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Retorno Técnico:</p>
                    <p className="text-xs text-gray-600 font-mono">{log.retornoTecnico}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>Protocolo: <span className="font-medium">{log.protocolo}</span></span>
                    <span className="text-gray-400">•</span>
                    <span>Usuário: <span className="font-medium">{log.usuario}</span></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
