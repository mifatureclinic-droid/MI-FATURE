import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Edit2, Save, X } from 'lucide-react';

interface GuiaData {
  id?: number;
  numeroGuia: string;
  pacienteNome: string;
  pacienteCPF: string;
  convenioNome: string;
  profissionalNome: string;
  profissionalCRM: string;
  dataEmissao: string;
  dataAtendimento: string;
  horaAtendimento: string;
  procedimento: string;
  codigoTUSS: string;
  cid: string;
  valor: string;
  desconto: string;
  valorLiquido: string;
  observacoes: string;
  status: 'rascunho' | 'emitida' | 'enviada' | 'processada' | 'paga' | 'glosa';
}

interface GuiaEditavelProps {
  guia: GuiaData;
  onSave: (guia: GuiaData) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function GuiaEditavel({ guia, onSave, onCancel, isLoading = false }: GuiaEditavelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<GuiaData>(guia);

  const handleChange = (field: keyof GuiaData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate valorLiquido
      if (field === 'valor' || field === 'desconto') {
        const valor = parseFloat(field === 'valor' ? value : updated.valor) || 0;
        const desconto = parseFloat(field === 'desconto' ? value : updated.desconto) || 0;
        updated.valorLiquido = (valor - desconto).toFixed(2);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao salvar guia:', error);
    }
  };

  const handleCancel = () => {
    setFormData(guia);
    setIsEditing(false);
    onCancel?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-blue-50 border-blue-200';
      case 'emitida': return 'bg-yellow-50 border-yellow-200';
      case 'enviada': return 'bg-purple-50 border-purple-200';
      case 'processada': return 'bg-cyan-50 border-cyan-200';
      case 'paga': return 'bg-green-50 border-green-200';
      case 'glosa': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-blue-100 text-blue-800';
      case 'emitida': return 'bg-yellow-100 text-yellow-800';
      case 'enviada': return 'bg-purple-100 text-purple-800';
      case 'processada': return 'bg-cyan-100 text-cyan-800';
      case 'paga': return 'bg-green-100 text-green-800';
      case 'glosa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`p-6 border-2 ${getStatusColor(formData.status)}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Guia de Autorização SP/SADT</h2>
          <p className="text-sm text-gray-600 mt-1">Conforme padrão ANS/TISS</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Editar
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(formData.status)}`}>
          {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
        </span>
      </div>

      {/* Número da Guia */}
      <div className="mb-6 pb-6 border-b">
        <Label className="text-sm font-semibold text-gray-700">Número da Guia</Label>
        {isEditing ? (
          <Input
            value={formData.numeroGuia}
            onChange={(e) => handleChange('numeroGuia', e.target.value)}
            className="mt-2"
          />
        ) : (
          <p className="mt-2 text-lg font-mono text-gray-800">{formData.numeroGuia}</p>
        )}
      </div>

      {/* Seção 1: Dados do Paciente */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">1. Dados do Paciente</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold">Nome</Label>
            {isEditing ? (
              <Input
                value={formData.pacienteNome}
                onChange={(e) => handleChange('pacienteNome', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.pacienteNome}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold">CPF</Label>
            {isEditing ? (
              <Input
                value={formData.pacienteCPF}
                onChange={(e) => handleChange('pacienteCPF', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.pacienteCPF}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção 2: Dados do Convênio */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">2. Dados do Convênio</h3>
        <div>
          <Label className="text-sm font-semibold">Convênio</Label>
          {isEditing ? (
            <Input
              value={formData.convenioNome}
              onChange={(e) => handleChange('convenioNome', e.target.value)}
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-gray-700">{formData.convenioNome}</p>
          )}
        </div>
      </div>

      {/* Seção 3: Dados do Profissional */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">3. Dados do Profissional</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold">Nome</Label>
            {isEditing ? (
              <Input
                value={formData.profissionalNome}
                onChange={(e) => handleChange('profissionalNome', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.profissionalNome}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold">CRM</Label>
            {isEditing ? (
              <Input
                value={formData.profissionalCRM}
                onChange={(e) => handleChange('profissionalCRM', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.profissionalCRM}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção 4: Datas e Horários */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">4. Datas e Horários</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold">Data de Emissão</Label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.dataEmissao}
                onChange={(e) => handleChange('dataEmissao', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.dataEmissao}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold">Data do Atendimento</Label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.dataAtendimento}
                onChange={(e) => handleChange('dataAtendimento', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.dataAtendimento}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold">Hora do Atendimento</Label>
            {isEditing ? (
              <Input
                type="time"
                value={formData.horaAtendimento}
                onChange={(e) => handleChange('horaAtendimento', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.horaAtendimento}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção 5: Procedimento */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">5. Procedimento</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label className="text-sm font-semibold">Descrição</Label>
            {isEditing ? (
              <Textarea
                value={formData.procedimento}
                onChange={(e) => handleChange('procedimento', e.target.value)}
                className="mt-1"
                rows={2}
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.procedimento}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold">Código TUSS</Label>
            {isEditing ? (
              <Input
                value={formData.codigoTUSS}
                onChange={(e) => handleChange('codigoTUSS', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">{formData.codigoTUSS}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção 6: Diagnóstico */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">6. Diagnóstico</h3>
        <div>
          <Label className="text-sm font-semibold">CID-10</Label>
          {isEditing ? (
            <Input
              value={formData.cid}
              onChange={(e) => handleChange('cid', e.target.value)}
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-gray-700">{formData.cid}</p>
          )}
        </div>
      </div>

      {/* Seção 7: Valores */}
      <div className="mb-6 pb-6 border-b">
        <h3 className="text-lg font-bold text-gray-800 mb-4">7. Valores</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-semibold">Valor</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">R$ {parseFloat(formData.valor).toFixed(2)}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold">Desconto</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={formData.desconto}
                onChange={(e) => handleChange('desconto', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-700">R$ {parseFloat(formData.desconto).toFixed(2)}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-semibold font-bold">Valor Líquido</Label>
            <p className="mt-1 text-lg font-bold text-green-700">R$ {parseFloat(formData.valorLiquido).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Seção 8: Observações */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">8. Observações</h3>
        {isEditing ? (
          <Textarea
            value={formData.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            className="mt-1"
            rows={3}
          />
        ) : (
          <p className="mt-1 text-gray-700 whitespace-pre-wrap">{formData.observacoes || '(Sem observações)'}</p>
        )}
      </div>
    </Card>
  );
}
