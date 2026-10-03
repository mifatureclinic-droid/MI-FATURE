import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { Download, Send, CheckCircle, Loader2, Trash2 } from 'lucide-react';

interface ContratoA4Props {
  contrato: {
    id: number;
    pacienteId: number;
    conteudo: string;
    assinado: number | boolean;
    dataAssinatura?: string | Date | null;
    assinaturaPacienteUrl?: string | null;
    createdAt: string | Date;
  };
  paciente: {
    nome: string;
    cpf: string;
    telefone?: string | null;
    whatsapp?: string | null;
    dataNascimento?: string | Date | null;
    endereco?: string | null;
    cidade?: string | null;
    estado?: string | null;
  };
  onAssinado?: () => void;
}

export function ContratoA4({ contrato, paciente, onAssinado }: ContratoA4Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [assinadoCanvas, setAssinadoCanvas] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const jaAssinado = !!contrato.assinado;

  // Restaurar assinatura existente
  useEffect(() => {
    if (jaAssinado && contrato.assinaturaPacienteUrl && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };
      img.src = contrato.assinaturaPacienteUrl;
    }
  }, [jaAssinado, contrato.assinaturaPacienteUrl]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (jaAssinado) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setLastPos(getPos(e, canvas));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || jaAssinado) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPos) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setLastPos(pos);
    setAssinadoCanvas(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const limparAssinatura = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setAssinadoCanvas(false);
    setLastPos(null);
  };

  const updateContratoMutation = trpc.contratos.update.useMutation({
    onSuccess: () => {
      toast.success('Contrato assinado com sucesso!');
      onAssinado?.();
    },
    onError: (e) => toast.error('Erro ao assinar: ' + e.message),
  });

  const confirmarAssinatura = () => {
    if (!canvasRef.current || !assinadoCanvas) {
      toast.error('Por favor, assine no campo abaixo antes de confirmar');
      return;
    }
    const assinaturaBase64 = canvasRef.current.toDataURL('image/png');
    updateContratoMutation.mutate({
      id: contrato.id,
      assinado: 1,
      dataAssinatura: new Date(),
      assinaturaPacienteUrl: assinaturaBase64,
    });
  };

  const exportarPDFMutation = trpc.contratos.exportarPDF.useMutation({
    onSuccess: (data) => {
      const bytes = Uint8Array.from(atob(data.base64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exportado com sucesso');
    },
    onError: (e) => toast.error('Erro ao exportar PDF: ' + e.message),
  });

  const gerarLinkMutation = trpc.contratos.gerarLink.useMutation({
    onSuccess: (data) => {
      const numero = (paciente.whatsapp || paciente.telefone || '').replace(/\D/g, '');
      if (!numero) {
        toast.error('Paciente não tem número de WhatsApp cadastrado');
        return;
      }
      const linkAssinatura = `${window.location.origin}/assinar-contrato/${data.token}`;
      const msg = encodeURIComponent(
        `Olá ${paciente.nome}!\n\nSeu Contrato Terapêutico está pronto para assinatura digital.\n\nClique no link abaixo para ler e assinar:\n${linkAssinatura}\n\nO link é válido por 7 dias.\n\nClínica MIFATURE`
      );
      window.open(`https://wa.me/55${numero}?text=${msg}`, '_blank');
      toast.success('Link de assinatura gerado e WhatsApp aberto!');
    },
    onError: (e) => toast.error('Erro ao gerar link: ' + e.message),
  });

  const enviarWhatsApp = () => {
    const numero = (paciente.whatsapp || paciente.telefone || '').replace(/\D/g, '');
    if (!numero) {
      toast.error('Paciente não tem número de WhatsApp cadastrado');
      return;
    }
    gerarLinkMutation.mutate({ contratoId: contrato.id });
  };

  const hoje = new Date(contrato.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const cidade = paciente.cidade || 'Manaus';
  const estado = paciente.estado || 'AM';

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de acções */}
      <div className="flex items-center justify-between flex-wrap gap-2 print:hidden">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-green-700 border-green-300 hover:bg-green-50"
            onClick={enviarWhatsApp}
            disabled={gerarLinkMutation.isPending}
          >
            {gerarLinkMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
              : <Send className="w-4 h-4 mr-1" />}
            {gerarLinkMutation.isPending ? 'A gerar link...' : 'Enviar por WhatsApp'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-blue-700 border-blue-300 hover:bg-blue-50"
            onClick={() => exportarPDFMutation.mutate({ contratoId: contrato.id })}
            disabled={exportarPDFMutation.isPending}
          >
            {exportarPDFMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
              : <Download className="w-4 h-4 mr-1" />}
            Exportar PDF
          </Button>
        </div>
        {jaAssinado && (
          <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium bg-green-50 border border-green-200 rounded px-3 py-1.5">
            <CheckCircle className="w-4 h-4" />
            Assinado em {contrato.dataAssinatura
              ? new Date(contrato.dataAssinatura).toLocaleDateString('pt-BR')
              : '—'}
          </div>
        )}
      </div>

      {/* Folha A4 */}
      <div
        className="bg-white shadow-2xl mx-auto w-full"
        style={{
          maxWidth: '794px',
          minHeight: '1123px',
          padding: '72px 80px',
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: '12pt',
          lineHeight: '1.6',
          color: '#1a1a1a',
          border: '1px solid #e0e0e0',
        }}
      >
        {/* Banner de estado de assinatura */}
        {jaAssinado ? (
          <div style={{
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            border: '2px solid #059669',
            borderRadius: '8px',
            padding: '12px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <div>
              <div style={{ fontWeight: 'bold', color: '#065f46', fontSize: '13pt' }}>CONTRATO ASSINADO DIGITALMENTE</div>
              <div style={{ color: '#047857', fontSize: '9pt', marginTop: '2px' }}>
                Assinado por <strong>{paciente.nome}</strong> em{' '}
                {contrato.dataAssinatura
                  ? new Date(contrato.dataAssinatura).toLocaleString('pt-BR')
                  : '—'}
              </div>
              {(contrato as any).hashAssinatura && (
                <div style={{ color: '#065f46', fontSize: '7pt', marginTop: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  Hash: {(contrato as any).hashAssinatura}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: '#fff7ed',
            border: '2px solid #f97316',
            borderRadius: '8px',
            padding: '10px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <span style={{ fontSize: '20px' }}>⏳</span>
            <div style={{ color: '#c2410c', fontSize: '10pt', fontWeight: 'bold' }}>
              Aguardando assinatura do paciente
            </div>
          </div>
        )}

        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '2px solid #1a1a2e', paddingBottom: '16px' }}>
          <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1a1a2e', letterSpacing: '2px', textTransform: 'uppercase' }}>
            CONTRATO TERAPÊUTICO
          </div>
          <div style={{ fontSize: '10pt', color: '#555', marginTop: '4px' }}>
            Documento de Prestação de Serviços de Saúde
          </div>
        </div>

        {/* Identificação das partes */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
            IDENTIFICAÇÃO DAS PARTES
          </p>
          <p style={{ marginBottom: '6px' }}>
            <strong>CONTRATANTE (PACIENTE):</strong> {paciente.nome}
          </p>
          <p style={{ marginBottom: '6px' }}>
            <strong>CPF:</strong> {paciente.cpf || 'Não informado'}
          </p>
          {paciente.dataNascimento && (
            <p style={{ marginBottom: '6px' }}>
              <strong>Data de Nascimento:</strong> {new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')}
            </p>
          )}
          {paciente.telefone && (
            <p style={{ marginBottom: '6px' }}>
              <strong>Telefone:</strong> {paciente.telefone}
            </p>
          )}
          {paciente.endereco && (
            <p style={{ marginBottom: '6px' }}>
              <strong>Endereço:</strong> {paciente.endereco}{paciente.cidade ? `, ${paciente.cidade}` : ''}{paciente.estado ? `/${paciente.estado}` : ''}
            </p>
          )}
        </div>

        {/* Cláusulas */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
            CLÁUSULAS E CONDIÇÕES
          </p>

          {[
            {
              num: '1',
              titulo: 'DO OBJETO',
              texto: 'O presente contrato tem por objeto a prestação de serviços de saúde, compreendendo consultas, avaliações, procedimentos terapêuticos e demais atendimentos clínicos necessários ao tratamento do CONTRATANTE, a serem realizados pelo CONTRATADO ou por profissionais por ele designados, em conformidade com as normas do Conselho Federal de Medicina (CFM), Conselho Federal de Fisioterapia e Terapia Ocupacional (COFFITO), Conselho Federal de Psicologia (CFP) e demais conselhos profissionais competentes.',
            },
            {
              num: '2',
              titulo: 'DAS OBRIGAÇÕES DO CONTRATADO',
              texto: 'O CONTRATADO obriga-se a: (a) prestar os serviços com zelo, competência e dentro dos padrões éticos e técnicos exigidos pelos conselhos profissionais; (b) manter sigilo sobre todas as informações relativas ao estado de saúde do CONTRATANTE, nos termos do art. 5º, inciso X, da Constituição Federal e do Código de Ética Profissional; (c) fornecer ao CONTRATANTE todas as informações necessárias sobre o tratamento, diagnóstico e prognóstico; (d) registrar e guardar prontuário clínico pelo prazo mínimo de 20 (vinte) anos, conforme Resolução CFM nº 1.821/2007.',
            },
            {
              num: '3',
              titulo: 'DAS OBRIGAÇÕES DO CONTRATANTE',
              texto: 'O CONTRATANTE obriga-se a: (a) comparecer pontualmente às sessões agendadas, comunicando com antecedência mínima de 24 (vinte e quatro) horas qualquer impossibilidade; (b) fornecer informações verídicas e completas sobre seu estado de saúde, histórico médico, medicamentos em uso e demais dados relevantes; (c) seguir as orientações terapêuticas prescritas; (d) efectuar o pagamento dos serviços prestados nas condições acordadas.',
            },
            {
              num: '4',
              titulo: 'DO CANCELAMENTO E FALTAS',
              texto: 'O cancelamento de consultas ou sessões deverá ser comunicado com antecedência mínima de 24 (vinte e quatro) horas. Faltas não justificadas ou cancelamentos com prazo inferior ao estipulado poderão ser cobrados integralmente, a critério do CONTRATADO. Três faltas consecutivas sem justificativa poderão ensejar a rescisão unilateral deste contrato pelo CONTRATADO.',
            },
            {
              num: '5',
              titulo: 'DO SIGILO E PRIVACIDADE',
              texto: 'Todas as informações obtidas durante o tratamento são estritamente confidenciais e protegidas pelo sigilo profissional, nos termos da Lei nº 13.709/2018 (Lei Geral de Protecção de Dados — LGPD). Os dados do CONTRATANTE serão utilizados exclusivamente para fins terapêuticos e administrativos, não sendo compartilhados com terceiros sem consentimento expresso, salvo nas hipóteses legais previstas em lei.',
            },
            {
              num: '6',
              titulo: 'DO CONSENTIMENTO INFORMADO',
              texto: 'O CONTRATANTE declara ter sido devidamente informado sobre os procedimentos, técnicas, possíveis riscos e benefícios do tratamento proposto, bem como sobre as alternativas terapêuticas disponíveis, manifestando seu consentimento livre e esclarecido para a realização dos serviços contratados, em conformidade com a Resolução CFM nº 1.995/2012 e demais normas aplicáveis.',
            },
            {
              num: '7',
              titulo: 'DA RESCISÃO',
              texto: 'Este contrato poderá ser rescindido por qualquer das partes, mediante comunicação prévia de 15 (quinze) dias, sem prejuízo do pagamento dos serviços já prestados. A rescisão imediata poderá ocorrer em caso de descumprimento das obrigações contratuais por qualquer das partes.',
            },
            {
              num: '8',
              titulo: 'DO FORO',
              texto: `As partes elegem o foro da Comarca de ${cidade}/${estado} para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`,
            },
          ].map((clausula) => (
            <div key={clausula.num} style={{ marginBottom: '16px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Cláusula {clausula.num}ª — {clausula.titulo}
              </p>
              <p style={{ textAlign: 'justify', textIndent: '2em' }}>
                {clausula.texto}
              </p>
            </div>
          ))}
        </div>

        {/* Data e local */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <p>{cidade}/{estado}, {hoje}</p>
        </div>

        {/* Assinaturas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '24px' }}>
          {/* Assinatura do profissional */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
              <p style={{ fontSize: '10pt', fontWeight: 'bold' }}>CONTRATADO</p>
              <p style={{ fontSize: '9pt', color: '#555' }}>Profissional Responsável</p>
            </div>
          </div>

          {/* Assinatura do paciente */}
          <div style={{ textAlign: 'center' }}>
            {jaAssinado && contrato.assinaturaPacienteUrl ? (
              <div>
                <img
                  src={contrato.assinaturaPacienteUrl}
                  alt="Assinatura do paciente"
                  style={{ maxHeight: '60px', maxWidth: '200px', margin: '0 auto 4px' }}
                />
                <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
                  <p style={{ fontSize: '10pt', fontWeight: 'bold' }}>CONTRATANTE</p>
                  <p style={{ fontSize: '9pt', color: '#555' }}>{paciente.nome}</p>
                  <p style={{ fontSize: '9pt', color: '#555' }}>CPF: {paciente.cpf}</p>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  border: '1px dashed #999',
                  borderRadius: '4px',
                  background: '#fafafa',
                  marginBottom: '8px',
                  overflow: 'hidden',
                }}>
                  <canvas
                    ref={canvasRef}
                    width={300}
                    height={80}
                    style={{ display: 'block', width: '100%', cursor: jaAssinado ? 'default' : 'crosshair', touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <p style={{ fontSize: '9pt', color: '#888', marginBottom: '4px' }}>
                  {jaAssinado ? '' : '↑ Assine acima com o rato ou dedo'}
                </p>
                <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
                  <p style={{ fontSize: '10pt', fontWeight: 'bold' }}>CONTRATANTE</p>
                  <p style={{ fontSize: '9pt', color: '#555' }}>{paciente.nome}</p>
                  <p style={{ fontSize: '9pt', color: '#555' }}>CPF: {paciente.cpf}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ borderTop: '1px solid #ccc', paddingTop: '12px', textAlign: 'center', fontSize: '9pt', color: '#888' }}>
          <p>Documento gerado electronicamente pelo Sistema MIFATURE — {new Date().toLocaleDateString('pt-BR')}</p>
          <p>Este documento tem validade jurídica nos termos da Lei nº 14.063/2020 (Assinaturas Electrónicas)</p>
        </div>
      </div>

      {/* Botões de assinatura (fora da folha) */}
      {!jaAssinado && (
        <div className="flex items-center gap-3 justify-center print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={limparAssinatura}
            disabled={!assinadoCanvas}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar Assinatura
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={confirmarAssinatura}
            disabled={!assinadoCanvas || updateContratoMutation.isPending}
          >
            {updateContratoMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
              : <CheckCircle className="w-4 h-4 mr-1" />}
            Confirmar Assinatura do Paciente
          </Button>
        </div>
      )}
    </div>
  );
}
