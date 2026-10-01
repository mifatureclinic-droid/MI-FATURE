import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Phone, MessageCircle, User, Calendar, CreditCard, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface CadastroPacienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (paciente: any) => void;
  pacienteEditar?: any;
}

export function CadastroPacienteModal({ open, onOpenChange, onSave, pacienteEditar }: CadastroPacienteModalProps) {
  const [formData, setFormData] = useState({
    nome: pacienteEditar?.nome || '',
    cpf: pacienteEditar?.cpf || '',
    rg: pacienteEditar?.rg || '',
    dataNascimento: pacienteEditar?.dataNascimento || '',
    sexo: pacienteEditar?.sexo || '',
    email: pacienteEditar?.email || '',
    telefone: pacienteEditar?.telefone || pacienteEditar?.whatsapp || '',
    cep: pacienteEditar?.cep || '',
    endereco: pacienteEditar?.endereco || '',
    numero: pacienteEditar?.numero || '',
    complemento: pacienteEditar?.complemento || '',
    bairro: pacienteEditar?.bairro || '',
    cidade: pacienteEditar?.cidade || '',
    estado: pacienteEditar?.estado || '',
    convenio: pacienteEditar?.convenio || '',
    numeroCarteirinha: pacienteEditar?.numeroCarteirinha || '',
    validadeCarteirinha: pacienteEditar?.validadeCarteirinha || '',
    nomeTitular: pacienteEditar?.nomeTitular || '',
    cpfTitular: pacienteEditar?.cpfTitular || '',
    confirmacaoAutomatica: pacienteEditar?.confirmacaoAutomatica !== false,
    nomeMedicoSolicitante: pacienteEditar?.nomeMedicoSolicitante || '',
    crmMedicoSolicitante: pacienteEditar?.crmMedicoSolicitante || '',
    ufMedicoSolicitante: pacienteEditar?.ufMedicoSolicitante || '',
    cbosMedicoSolicitante: pacienteEditar?.cbosMedicoSolicitante || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.nome || !formData.cpf || !formData.telefone) {
      toast.error('Preencha os campos obrigatórios: Nome, CPF e Telefone/WhatsApp');
      return;
    }
    // O campo whatsapp é espelhado do telefone no onSave
    (formData as any).whatsapp = formData.telefone;

    onSave?.(formData);
    
    toast.success(
      pacienteEditar 
        ? 'Paciente atualizado com sucesso!' 
        : `Paciente cadastrado! ${formData.confirmacaoAutomatica ? 'Confirmação automática ativada via WhatsApp.' : ''}`
    );
    
    onOpenChange(false);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleWhatsAppTest = () => {
    if (formData.telefone) {
      const whatsappNumber = formData.telefone.replace(/\D/g, '');
      const mensagem = encodeURIComponent(
        `Olá ${formData.nome}! Este é um teste de integração do Sistema MIFATURE. Confirme se este número está correto para receber confirmações de consultas automaticamente.`
      );
      window.open(`https://wa.me/55${whatsappNumber}?text=${mensagem}`, '_blank');
    } else {
      toast.error('Preencha o número de Telefone/WhatsApp primeiro');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="w-6 h-6" />
            {pacienteEditar ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Dados Pessoais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo do paciente"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  placeholder="Número do RG"
                />
              </div>

              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="sexo">Sexo</Label>
                <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="O">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Contato - WhatsApp */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Contato e WhatsApp
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone / WhatsApp *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleWhatsAppTest}
                    className="whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4 mr-1 text-green-600" />
                    Testar WhatsApp
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Este número será usado para chamadas e mensagens de confirmação via WhatsApp</p>
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.confirmacaoAutomatica}
                    onChange={(e) => setFormData({ ...formData, confirmacaoAutomatica: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>Enviar mensagens automáticas de confirmação de consulta via WhatsApp</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  O paciente receberá uma mensagem 24h antes da consulta para confirmação
                </p>
              </div>
            </div>

            {/* Alerta de integração WhatsApp */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-900 mb-1">Integração WhatsApp Ativa</p>
                  <p className="text-green-800">
                    O número de WhatsApp será utilizado para:
                  </p>
                  <ul className="list-disc ml-5 mt-2 space-y-1 text-green-700">
                    <li>Confirmação automática de consultas (24h antes)</li>
                    <li>Lembretes de retorno</li>
                    <li>Notificações de alterações no agendamento</li>
                    <li>Envio de documentos e guias digitais</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, Avenida, etc"
                />
              </div>

              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Nº"
                />
              </div>

              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Apto, Bloco, etc"
                />
              </div>

              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  placeholder="Bairro"
                />
              </div>

              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Cidade"
                />
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    {/* Adicionar outros estados conforme necessário */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dados do Convênio */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Dados do Convênio
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="convenio">Convênio</Label>
                <Select value={formData.convenio} onValueChange={(value) => setFormData({ ...formData, convenio: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o convênio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="Unimed">Unimed</SelectItem>
                    <SelectItem value="Bradesco Saúde">Bradesco Saúde</SelectItem>
                    <SelectItem value="Amil">Amil</SelectItem>
                    <SelectItem value="SulAmérica">SulAmérica</SelectItem>
                    <SelectItem value="NotreDame Intermédica">NotreDame Intermédica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="numeroCarteirinha">Número da Carteirinha</Label>
                <Input
                  id="numeroCarteirinha"
                  value={formData.numeroCarteirinha}
                  onChange={(e) => setFormData({ ...formData, numeroCarteirinha: e.target.value })}
                  placeholder="Número da carteirinha"
                  disabled={formData.convenio === 'particular'}
                />
              </div>

              <div>
                <Label htmlFor="validadeCarteirinha">Validade da Carteirinha</Label>
                <Input
                  id="validadeCarteirinha"
                  type="date"
                  value={formData.validadeCarteirinha}
                  onChange={(e) => setFormData({ ...formData, validadeCarteirinha: e.target.value })}
                  disabled={formData.convenio === 'particular'}
                />
              </div>

              <div>
                <Label htmlFor="nomeTitular">Nome do Titular</Label>
                <Input
                  id="nomeTitular"
                  value={formData.nomeTitular}
                  onChange={(e) => setFormData({ ...formData, nomeTitular: e.target.value })}
                  placeholder="Se for dependente"
                  disabled={formData.convenio === 'particular'}
                />
              </div>

              <div>
                <Label htmlFor="cpfTitular">CPF do Titular</Label>
                <Input
                  id="cpfTitular"
                  value={formData.cpfTitular}
                  onChange={(e) => setFormData({ ...formData, cpfTitular: formatCPF(e.target.value) })}
                  placeholder="Se for dependente"
                  maxLength={14}
                  disabled={formData.convenio === 'particular'}
                />
              </div>
            </div>
          </div>

          {/* Dados do Médico Solicitante para Autorização GEAP */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Médico Solicitante (para Autorização GEAP)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeMedicoSolicitante">Nome do Médico</Label>
                <Input
                  id="nomeMedicoSolicitante"
                  value={formData.nomeMedicoSolicitante}
                  onChange={(e) => setFormData({ ...formData, nomeMedicoSolicitante: e.target.value })}
                  placeholder="ex: Dr. João Silva"
                />
              </div>
              <div>
                <Label htmlFor="crmMedicoSolicitante">CRM</Label>
                <Input
                  id="crmMedicoSolicitante"
                  value={formData.crmMedicoSolicitante}
                  onChange={(e) => setFormData({ ...formData, crmMedicoSolicitante: e.target.value })}
                  placeholder="ex: 123456"
                />
              </div>
              <div>
                <Label htmlFor="ufMedicoSolicitante">UF</Label>
                <Input
                  id="ufMedicoSolicitante"
                  value={formData.ufMedicoSolicitante}
                  onChange={(e) => setFormData({ ...formData, ufMedicoSolicitante: e.target.value.toUpperCase() })}
                  placeholder="ex: SP"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="cbosMedicoSolicitante">CBOS</Label>
                <Input
                  id="cbosMedicoSolicitante"
                  value={formData.cbosMedicoSolicitante}
                  onChange={(e) => setFormData({ ...formData, cbosMedicoSolicitante: e.target.value })}
                  placeholder="ex: 2251-05"
                />
              </div>
            </div>
            <p className="text-xs text-blue-700">Estes dados serão usados para criar automaticamente pedidos de autorização GEAP ao agendar este paciente.</p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <User className="w-4 h-4 mr-2" />
              {pacienteEditar ? 'Atualizar Paciente' : 'Cadastrar Paciente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}