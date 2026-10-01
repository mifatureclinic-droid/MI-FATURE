import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CheckCircle, Download, Signature } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContratoTerapeuticoDigitalProps {
  pacienteNome: string;
  pacienteCPF: string;
  profissionalNome: string;
  profissionalCRM: string;
  profissionalEspecialidade: string;
  dataAssinatura?: Date;
  assinado?: boolean;
  onAssinar?: (assinatura: string) => void;
}

export function ContratoTerapeuticoDigital({
  pacienteNome,
  pacienteCPF,
  profissionalNome,
  profissionalCRM,
  profissionalEspecialidade,
  dataAssinatura,
  assinado = false,
  onAssinar,
}: ContratoTerapeuticoDigitalProps) {
  const [showModal, setShowModal] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const conteudoContrato = `
CONTRATO TERAPÊUTICO

Este Contrato Terapêutico é celebrado entre:

PACIENTE:
Nome: ${pacienteNome}
CPF: ${pacienteCPF}

PROFISSIONAL:
Nome: ${profissionalNome}
CRM/CREF/Registro: ${profissionalCRM}
Especialidade: ${profissionalEspecialidade}

CLÁUSULAS E CONDIÇÕES:

1. OBJETIVO DO TRATAMENTO
O presente contrato estabelece os termos e condições para o atendimento terapêutico entre o paciente e o profissional, conforme legislação vigente e normas dos conselhos profissionais.

2. DIREITOS E DEVERES DO PACIENTE
- Comparecer pontualmente aos atendimentos agendados
- Comunicar com antecedência em caso de impossibilidade de comparecer
- Fornecer informações precisas sobre seu histórico de saúde
- Seguir as orientações do profissional
- Manter sigilo sobre informações compartilhadas

3. DIREITOS E DEVERES DO PROFISSIONAL
- Respeitar o sigilo profissional conforme legislação vigente
- Manter atualização profissional contínua
- Fornecer atendimento de qualidade
- Informar sobre o processo terapêutico
- Manter registros adequados (prontuário)

4. CONFIDENCIALIDADE E SIGILO PROFISSIONAL
Todas as informações compartilhadas durante o atendimento são confidenciais, conforme Lei Geral de Proteção de Dados (LGPD) e normas dos conselhos profissionais.

5. RESPONSABILIDADES
O paciente é responsável por:
- Informar mudanças em seu estado de saúde
- Comunicar desconfortos ou dúvidas
- Seguir as recomendações profissionais

O profissional é responsável por:
- Manter sigilo profissional
- Documentar adequadamente o atendimento
- Respeitar a autonomia do paciente

6. CANCELAMENTO E REMARCAÇÃO
- Cancelamentos devem ser comunicados com 24 horas de antecedência
- Faltas sem aviso prévio podem resultar em cobrança

7. CONSENTIMENTO INFORMADO
O paciente declara estar ciente de:
- Objetivos do tratamento
- Possíveis benefícios e limitações
- Direito de interromper o tratamento a qualquer momento
- Direito de buscar segunda opinião

8. CONFORMIDADE LEGAL
Este contrato segue as normas estabelecidas por:
- Conselho Federal de Psicologia (CFP) - Resolução CFP nº 006/2019
- Conselho Regional de Educação Física (CREF) - Resolução CONFEF nº 229/2012
- Conselho Regional de Medicina (CRM) - Código de Ética Médica
- Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018

9. VIGÊNCIA
Este contrato entra em vigor a partir da data de assinatura e permanece válido enquanto o paciente estiver em atendimento.

10. DISPOSIÇÕES FINAIS
Qualquer alteração neste contrato deve ser acordada por escrito entre as partes.

---

ASSINATURA DO PACIENTE:
_____________________________
Data: ___/___/_____
Hora: ___:___

ASSINATURA DO PROFISSIONAL:
_____________________________
Data: ___/___/_____
Hora: ___:___

Este documento foi gerado digitalmente e possui validade legal conforme legislação vigente.
`;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveSignature = () => {
    if (!canvasRef.current || !onAssinar) return;
    const assinatura = canvasRef.current.toDataURL('image/png');
    onAssinar(assinatura);
    setShowSignature(false);
    setShowModal(false);
  };

  const downloadContrato = () => {
    const element = document.createElement('a');
    const file = new Blob([conteudoContrato], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Contrato_Terapeutico_${pacienteNome}_${format(new Date(), 'dd-MM-yyyy')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4">
      {assinado ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Contrato Assinado</h3>
              <p className="text-sm text-green-800 mt-1">
                Assinado em {dataAssinatura ? format(dataAssinatura, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'data não disponível'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Contrato Terapêutico Digital</h3>
          <p className="text-sm text-blue-800 mb-4">
            Leia e assine o contrato terapêutico para prosseguir com o atendimento.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Signature className="w-4 h-4 mr-2" />
              Visualizar e Assinar
            </Button>
            <Button
              onClick={downloadContrato}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Contrato
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contrato Terapêutico Digital</DialogTitle>
          </DialogHeader>

          {!showSignature ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-6 max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm font-mono">
                {conteudoContrato}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowSignature(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Signature className="w-4 h-4 mr-2" />
                  Assinar Contrato
                </Button>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Assinatura Digital do Paciente
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Assine no espaço abaixo. Sua assinatura será registrada com data e hora.
                </p>
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="border-2 border-gray-300 rounded-lg bg-white cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  className="border-gray-300"
                >
                  Limpar
                </Button>
                <Button
                  onClick={saveSignature}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Assinatura
                </Button>
                <Button
                  onClick={() => setShowSignature(false)}
                  variant="outline"
                >
                  Voltar
                </Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <strong>Aviso Legal:</strong> Ao assinar este contrato, você confirma que leu, compreendeu e concorda com todos os termos e condições estabelecidos. Esta assinatura digital tem validade legal conforme legislação vigente (Lei nº 14.063/2020).
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
