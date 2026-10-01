import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Printer, Download, X } from 'lucide-react';

// Formata uma data (string YYYY-MM-DD, ISO ou Date) para DD/MM/AAAA sem desvio de fuso
function fmtDate(val: any): string {
  if (!val) return 'N/A';
  const s = typeof val === 'string' ? val : (val instanceof Date ? val.toISOString() : String(val));
  // Extrair YYYY-MM-DD sem conversão de fuso
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return 'N/A';
}

interface GuiaVisualizacaoProps {
  isOpen: boolean;
  onClose: () => void;
  guia: any;
}

export function GuiaVisualizacao({ isOpen, onClose, guia }: GuiaVisualizacaoProps) {
  if (!guia) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implementar download de PDF
    console.log('Download PDF');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 max-w-full w-full max-h-full h-full m-0 rounded-none p-0 flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-white">
          <DialogTitle>Visualizar Guia SP/SADT</DialogTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          <div className="print-area bg-white p-4 print:p-2 print:m-0 print:bg-white">
            {/* Cabeçalho da Guia */}
            <div className="border-b-2 border-black pb-2 mb-2">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <h1 className="text-lg font-bold print:text-sm">GUIA DE SERVIÇO PROFISSIONAL</h1>
                  <p className="text-xs print:text-xs">SERVIÇO AUXILIAR DE DIAGNÓSTICO E TERAPIA - SADT</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold print:text-xs">TISS 3.05.00</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold print:text-xs">Nº: {guia.numeroGuia}</p>
                </div>
              </div>
            </div>

            {/* Dados da Operadora */}
            <div className="grid grid-cols-2 gap-2 mb-2 border-b pb-2 print:gap-1 print:mb-1 print:pb-1">
              <div>
                <p className="text-xs font-bold print:text-xs">OPERADORA</p>
                <p className="text-sm print:text-xs">{guia.convenio?.nome || 'N/A'}</p>
                <p className="text-xs print:text-xs">CNPJ: {guia.convenio?.cnpj || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">CÓDIGO DA OPERADORA</p>
                <p className="text-sm print:text-xs">{guia.convenio?.codigoOperadora || 'N/A'}</p>
              </div>
            </div>

            {/* Dados do Paciente */}
            <div className="grid grid-cols-2 gap-2 mb-2 border-b pb-2 print:gap-1 print:mb-1 print:pb-1">
              <div>
                <p className="text-xs font-bold print:text-xs">PACIENTE</p>
                <p className="text-sm print:text-xs">{guia.paciente?.nome || 'N/A'}</p>
                <p className="text-xs print:text-xs">CPF: {guia.paciente?.cpf || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">CARTEIRA</p>
                <p className="text-sm print:text-xs">{guia.numeroCarteira || 'N/A'}</p>
              </div>
            </div>

            {/* Dados do Profissional */}
            <div className="grid grid-cols-2 gap-2 mb-2 border-b pb-2 print:gap-1 print:mb-1 print:pb-1">
              <div>
                <p className="text-xs font-bold print:text-xs">PROFISSIONAL SOLICITANTE</p>
                <p className="text-sm print:text-xs">{guia.profissional?.nome || 'N/A'}</p>
                <p className="text-xs print:text-xs">CRM/COREN: {guia.profissional?.crm || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">PROFISSIONAL EXECUTOR</p>
                <p className="text-sm print:text-xs">{guia.profissionalExecutor?.nome || 'N/A'}</p>
              </div>
            </div>

            {/* Dados da Autorização */}
            <div className="grid grid-cols-3 gap-2 mb-2 border-b pb-2 print:gap-1 print:mb-1 print:pb-1">
              <div>
                <p className="text-xs font-bold print:text-xs">NÚMERO AUTORIZAÇÃO</p>
                <p className="text-sm print:text-xs">{guia.numeroAutorizacao || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">DATA AUTORIZAÇÃO</p>
                <p className="text-sm print:text-xs">{fmtDate(guia.dataAutorizacao)}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">VALIDADE</p>
                <p className="text-sm print:text-xs">{fmtDate(guia.dataValidadeAutorizacao)}</p>
              </div>
            </div>

            {/* Dados do Atendimento */}
            <div className="grid grid-cols-3 gap-2 mb-2 border-b pb-2 print:gap-1 print:mb-1 print:pb-1">
              <div>
                <p className="text-xs font-bold print:text-xs">DATA ATENDIMENTO</p>
                <p className="text-sm print:text-xs">{fmtDate(guia.dataAtendimento)}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">HORA INÍCIO</p>
                <p className="text-sm print:text-xs">{guia.horaInicio || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">HORA FIM</p>
                <p className="text-sm print:text-xs">{guia.horaFim || 'N/A'}</p>
              </div>
            </div>

            {/* Procedimentos */}
            <div className="mb-2 border-b pb-2 print:mb-1 print:pb-1">
              <p className="text-xs font-bold mb-1 print:mb-0.5">PROCEDIMENTOS</p>
              <table className="w-full text-xs border print:text-xs">
                <thead className="bg-gray-100 print:bg-gray-100">
                  <tr>
                    <th className="border p-1 text-left print:p-0.5">Código TUSS</th>
                    <th className="border p-1 text-left print:p-0.5">Descrição</th>
                    <th className="border p-1 text-center print:p-0.5">Qtd</th>
                    <th className="border p-1 text-right print:p-0.5">Valor Unit.</th>
                    <th className="border p-1 text-right print:p-0.5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {guia.procedimentos && guia.procedimentos.length > 0 ? (
                    guia.procedimentos.map((proc: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border p-1 print:p-0.5">{proc.codigoTUSS || 'N/A'}</td>
                        <td className="border p-1 print:p-0.5">{proc.descricao || proc.procedimento || 'N/A'}</td>
                        <td className="border p-1 text-center print:p-0.5">{proc.quantidade || 1}</td>
                        <td className="border p-1 text-right print:p-0.5">R$ {parseFloat(proc.valor || 0).toFixed(2)}</td>
                        <td className="border p-1 text-right print:p-0.5">R$ {(parseFloat(proc.valor || 0) * (proc.quantidade || 1)).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border p-1 text-center print:p-0.5">Nenhum procedimento cadastrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totalizadores */}
            <div className="grid grid-cols-4 gap-2 mb-2 border-b pb-2 print:gap-1 print:mb-1 print:pb-1">
              <div>
                <p className="text-xs font-bold print:text-xs">VALOR TOTAL</p>
                <p className="text-sm font-bold print:text-xs">R$ {guia.valorTotal ? parseFloat(guia.valorTotal).toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">DESCONTO</p>
                <p className="text-sm font-bold print:text-xs">R$ {guia.desconto ? parseFloat(guia.desconto).toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">VALOR LÍQUIDO</p>
                <p className="text-sm font-bold print:text-xs">R$ {guia.valorLiquido ? parseFloat(guia.valorLiquido).toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <p className="text-xs font-bold print:text-xs">STATUS</p>
                <p className="text-sm font-bold print:text-xs">{guia.status?.toUpperCase() || 'RASCUNHO'}</p>
              </div>
            </div>

            {/* Observações */}
            {guia.observacoes && (
              <div className="mb-2 border-b pb-2 print:mb-1 print:pb-1">
                <p className="text-xs font-bold print:text-xs">OBSERVAÇÕES</p>
                <p className="text-sm print:text-xs">{guia.observacoes}</p>
              </div>
            )}

            {/* Rodapé */}
            <div className="text-center text-xs text-gray-600 mt-2 print:mt-1">
              <p className="print:text-xs">Emitido em: {fmtDate(guia.dataEmissao || new Date().toISOString())}</p>
              <p className="print:text-xs">Guia nº {guia.numeroGuia}</p>
            </div>
          </div>
        </div>
      </DialogContent>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .print-area {
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          .print:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Dialog>
  );
}
