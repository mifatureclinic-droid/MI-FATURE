import { useState } from 'react';
import { X, FileText, Mail, Printer, Download, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface NotaFiscalModalProps {
  isOpen: boolean;
  onClose: () => void;
  atendimento?: {
    id: number;
    paciente: string;
    cpf?: string;
    email?: string;
    procedimento: string;
    valor: number;
    data: string;
  };
}

export function NotaFiscalModal({ isOpen, onClose, atendimento }: NotaFiscalModalProps) {
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');
  const [formData, setFormData] = useState({
    numeroNF: `${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    serie: '001',
    tomador: atendimento?.paciente || '',
    cpfCnpj: atendimento?.cpf || '',
    email: atendimento?.email || '',
    endereco: '',
    cidade: '',
    uf: 'SP',
    cep: '',
    descricao: atendimento?.procedimento || '',
    valorServico: atendimento?.valor || 0,
    aliquotaISS: 5,
    valorISS: 0,
    valorLiquido: 0,
    retencaoISS: false,
    observacoes: '',
    envioAutomatico: true,
    codigoMunicipio: '3550308', // São Paulo
    codigoServico: '01.01', // Serviços médicos
  });

  // Configurações de ISS por município (principais capitais)
  const configISS: Record<string, { aliquota: number; retencao: boolean; descricao: string }> = {
    'SP': { aliquota: 5.0, retencao: true, descricao: 'São Paulo - Alíquota 5% (com retenção)' },
    'RJ': { aliquota: 5.0, retencao: true, descricao: 'Rio de Janeiro - Alíquota 5% (com retenção)' },
    'MG': { aliquota: 5.0, retencao: false, descricao: 'Belo Horizonte - Alíquota 5%' },
    'RS': { aliquota: 5.0, retencao: true, descricao: 'Porto Alegre - Alíquota 5% (com retenção)' },
    'PR': { aliquota: 5.0, retencao: false, descricao: 'Curitiba - Alíquota 5%' },
    'SC': { aliquota: 5.0, retencao: false, descricao: 'Florianópolis - Alíquota 5%' },
    'BA': { aliquota: 5.0, retencao: true, descricao: 'Salvador - Alíquota 5% (com retenção)' },
    'PE': { aliquota: 5.0, retencao: true, descricao: 'Recife - Alíquota 5% (com retenção)' },
    'CE': { aliquota: 5.0, retencao: false, descricao: 'Fortaleza - Alíquota 5%' },
    'DF': { aliquota: 5.0, retencao: true, descricao: 'Brasília - Alíquota 5% (com retenção)' },
    'GO': { aliquota: 5.0, retencao: false, descricao: 'Goiânia - Alíquota 5%' },
    'AM': { aliquota: 5.0, retencao: true, descricao: 'Manaus - Alíquota 5% (com retenção)' },
    'PA': { aliquota: 5.0, retencao: false, descricao: 'Belém - Alíquota 5%' },
  };

  const ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Atualizar configurações ao mudar UF
  const handleUFChange = (uf: string) => {
    const config = configISS[uf] || { aliquota: 5.0, retencao: false, descricao: `${uf} - Alíquota 5%` };
    setFormData(prev => ({
      ...prev,
      uf,
      aliquotaISS: config.aliquota,
      retencaoISS: config.retencao,
    }));
    setTimeout(calcularValores, 0);
  };

  // Calcular valores automaticamente
  const calcularValores = () => {
    const valorServico = Number(formData.valorServico);
    const aliquota = Number(formData.aliquotaISS);
    const valorISS = (valorServico * aliquota) / 100;
    const valorLiquido = formData.retencaoISS ? valorServico - valorISS : valorServico;
    
    setFormData(prev => ({
      ...prev,
      valorISS,
      valorLiquido,
    }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'valorServico' || field === 'aliquotaISS' || field === 'retencaoISS') {
      setTimeout(calcularValores, 0);
    }
  };

  const handleEmitir = () => {
    // Validações básicas
    if (!formData.tomador || !formData.cpfCnpj || !formData.descricao || !formData.valorServico) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setStep('preview');
  };

  const handleConfirmarEmissao = () => {
    // Simular emissão de NF
    toast.success('Nota Fiscal emitida com sucesso!');
    
    if (formData.envioAutomatico && formData.email) {
      setTimeout(() => {
        toast.success(`NF-e enviada automaticamente para ${formData.email}`);
      }, 1000);
    }

    setStep('success');
  };

  const handleFechar = () => {
    setStep('form');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl">Emissão de Nota Fiscal</h2>
              <p className="text-sm text-gray-600">NF-e de Serviços - Paciente Particular</p>
            </div>
          </div>
          <button onClick={handleFechar} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'form' && (
            <div className="space-y-6">
              {/* Dados da NF */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg mb-4">Dados da Nota Fiscal</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Número NF-e *</Label>
                    <Input 
                      value={formData.numeroNF}
                      onChange={(e) => handleChange('numeroNF', e.target.value)}
                      placeholder="Número"
                    />
                  </div>
                  <div>
                    <Label>Série *</Label>
                    <Input 
                      value={formData.serie}
                      onChange={(e) => handleChange('serie', e.target.value)}
                      placeholder="001"
                    />
                  </div>
                  <div>
                    <Label>Data de Emissão</Label>
                    <Input 
                      type="text"
                      value={new Date().toLocaleDateString('pt-BR')}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Tomador */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="text-lg mb-4">Dados do Tomador (Paciente)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome Completo *</Label>
                    <Input 
                      value={formData.tomador}
                      onChange={(e) => handleChange('tomador', e.target.value)}
                      placeholder="Nome do paciente"
                    />
                  </div>
                  <div>
                    <Label>CPF/CNPJ *</Label>
                    <Input 
                      value={formData.cpfCnpj}
                      onChange={(e) => handleChange('cpfCnpj', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>E-mail para envio *</Label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Endereço</Label>
                    <Input 
                      value={formData.endereco}
                      onChange={(e) => handleChange('endereco', e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input 
                      value={formData.cidade}
                      onChange={(e) => handleChange('cidade', e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Select value={formData.uf} onValueChange={handleUFChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input 
                      value={formData.cep}
                      onChange={(e) => handleChange('cep', e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Serviço */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="text-lg mb-4">Dados do Serviço</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Descrição do Serviço *</Label>
                    <Textarea 
                      value={formData.descricao}
                      onChange={(e) => handleChange('descricao', e.target.value)}
                      placeholder="Descrição detalhada do serviço prestado"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Valor do Serviço (R$) *</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.valorServico}
                        onChange={(e) => handleChange('valorServico', parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label>Alíquota ISS (%)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={formData.aliquotaISS}
                        onChange={(e) => handleChange('aliquotaISS', parseFloat(e.target.value) || 0)}
                        placeholder="5.00"
                      />
                    </div>
                    <div>
                      <Label>Valor ISS (R$)</Label>
                      <Input 
                        type="text"
                        value={formData.valorISS.toFixed(2)}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="retencaoISS"
                      checked={formData.retencaoISS}
                      onChange={(e) => handleChange('retencaoISS', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="retencaoISS" className="cursor-pointer">
                      ISS Retido na Fonte
                    </Label>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex justify-between items-center">
                      <span>Valor Líquido:</span>
                      <span className="text-xl">R$ {formData.valorLiquido.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações e Envio */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="text-lg mb-4">Informações Adicionais</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Observações</Label>
                    <Textarea 
                      value={formData.observacoes}
                      onChange={(e) => handleChange('observacoes', e.target.value)}
                      placeholder="Observações adicionais (opcional)"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded p-3">
                    <input 
                      type="checkbox"
                      id="envioAutomatico"
                      checked={formData.envioAutomatico}
                      onChange={(e) => handleChange('envioAutomatico', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="envioAutomatico" className="cursor-pointer flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-600" />
                      Enviar NF-e automaticamente por e-mail para o paciente
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Atenção:</strong> Revise todos os dados antes de confirmar a emissão. 
                  Uma vez emitida, a nota fiscal não poderá ser alterada, apenas cancelada.
                </p>
              </div>

              <div className="border rounded-lg p-6 space-y-4">
                <div className="text-center border-b pb-4">
                  <h3 className="text-xl">NOTA FISCAL ELETRÔNICA DE SERVIÇOS</h3>
                  <p className="text-sm text-gray-600">NF-e Nº {formData.numeroNF} - Série {formData.serie}</p>
                  <p className="text-sm text-gray-600">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Prestador de Serviço</p>
                    <p>CLÍNICA MÉDICA EXEMPLO LTDA</p>
                    <p className="text-sm">CNPJ: 00.000.000/0001-00</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tomador do Serviço</p>
                    <p>{formData.tomador}</p>
                    <p className="text-sm">CPF/CNPJ: {formData.cpfCnpj}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Descrição dos Serviços</p>
                  <p>{formData.descricao}</p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Valor dos Serviços:</span>
                    <span>R$ {formData.valorServico.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>ISS ({formData.aliquotaISS}%):</span>
                    <span>R$ {formData.valorISS.toFixed(2)}</span>
                  </div>
                  {formData.retencaoISS && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>ISS Retido:</span>
                      <span>Sim</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span>Valor Líquido:</span>
                    <span>R$ {formData.valorLiquido.toFixed(2)}</span>
                  </div>
                </div>

                {formData.observacoes && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Observações</p>
                    <p className="text-sm">{formData.observacoes}</p>
                  </div>
                )}
              </div>

              {formData.envioAutomatico && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p>A NF-e será enviada automaticamente para:</p>
                    <p><strong>{formData.email}</strong></p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <CheckCircle className="w-20 h-20 text-green-600" />
              <div className="text-center">
                <h3 className="text-2xl mb-2">Nota Fiscal Emitida com Sucesso!</h3>
                <p className="text-gray-600 mb-1">NF-e Nº {formData.numeroNF} - Série {formData.serie}</p>
                {formData.envioAutomatico && (
                  <p className="text-green-600 text-sm">✓ Enviada para {formData.email}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Baixar XML
                </Button>
                <Button variant="outline" className="gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimir DANFE
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-md">
                <p className="text-sm text-center">
                  A nota fiscal foi registrada no sistema e está disponível 
                  na página de Notas Fiscais para consulta futura.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          {step === 'form' && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleFechar}>
                Cancelar
              </Button>
              <Button onClick={handleEmitir} className="bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Pré-visualizar NF-e
              </Button>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('form')}>
                Voltar e Editar
              </Button>
              <Button onClick={handleConfirmarEmissao} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar e Emitir NF-e
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="flex justify-end">
              <Button onClick={handleFechar} className="bg-blue-600 hover:bg-blue-700">
                Concluir
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}