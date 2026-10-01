import { useState, useEffect } from 'react';
import { Building2, Save, AlertCircle, Loader2, CheckCircle, Upload, ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useRef } from 'react';

const EMPTY_FORM = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  inscricaoEstadual: '',
  inscricaoMunicipal: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  telefone: '',
  celular: '',
  email: '',
  site: '',
  banco: '',
  agencia: '',
  conta: '',
  tipoConta: 'corrente',
  pix: '',
  nomeResponsavel: '',
  cpfResponsavel: '',
  crmResponsavel: '',
  emailResponsavel: '',
  telefoneResponsavel: '',
  cnes: '',
  codigoPrestadorNaOperadora: '',
  registroANS: '',
  logoUrl: '',
};

export function CadastroClinica() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data: prestador, isLoading } = trpc.faturamentoTISS.getPrestador.useQuery();
  const utils = trpc.useUtils();

  const salvarMutation = trpc.faturamentoTISS.salvarPrestador.useMutation({
    onSuccess: () => {
      utils.faturamentoTISS.getPrestador.invalidate();
      setSaved(true);
      toast.success('Dados da clínica salvos com sucesso!');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => {
      toast.error('Erro ao salvar: ' + err.message);
    },
  });

  useEffect(() => {
    if (prestador) {
      setFormData({
        razaoSocial: prestador.razaoSocial ?? '',
        nomeFantasia: prestador.nomeFantasia ?? '',
        cnpj: prestador.cnpj ?? '',
        inscricaoEstadual: (prestador as any).inscricaoEstadual ?? '',
        inscricaoMunicipal: (prestador as any).inscricaoMunicipal ?? '',
        cep: (prestador as any).cep ?? '',
        logradouro: (prestador as any).logradouro ?? '',
        numero: (prestador as any).numero ?? '',
        complemento: (prestador as any).complemento ?? '',
        bairro: (prestador as any).bairro ?? '',
        cidade: (prestador as any).cidade ?? '',
        estado: (prestador as any).estado ?? '',
        telefone: (prestador as any).telefone ?? '',
        celular: (prestador as any).celular ?? '',
        email: (prestador as any).email ?? '',
        site: (prestador as any).site ?? '',
        banco: (prestador as any).banco ?? '',
        agencia: (prestador as any).agencia ?? '',
        conta: (prestador as any).conta ?? '',
        tipoConta: (prestador as any).tipoConta ?? 'corrente',
        pix: (prestador as any).pix ?? '',
        nomeResponsavel: (prestador as any).nomeResponsavel ?? '',
        cpfResponsavel: (prestador as any).cpfResponsavel ?? '',
        crmResponsavel: (prestador as any).crmResponsavel ?? '',
        emailResponsavel: (prestador as any).emailResponsavel ?? '',
        telefoneResponsavel: (prestador as any).telefoneResponsavel ?? '',
        cnes: prestador.cnes ?? '',
        codigoPrestadorNaOperadora: prestador.codigoPrestadorNaOperadora ?? '',
        registroANS: (prestador as any).registroANS ?? '',
        logoUrl: (prestador as any).logoUrl ?? '',
      });
    }
  }, [prestador]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.razaoSocial.trim()) { toast.error('Razão Social é obrigatória.'); return; }
    if (!formData.cnpj.trim()) { toast.error('CNPJ é obrigatório.'); return; }
    salvarMutation.mutate(formData as any);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('A logo deve ter no máximo 5MB.'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Selecione um arquivo de imagem.'); return; }
    setUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload, credentials: 'include' });
      if (!res.ok) throw new Error('Erro no upload');
      const { url } = await res.json();
      setFormData(prev => ({ ...prev, logoUrl: url }));
      toast.success('Logo carregada com sucesso!');
    } catch (err) {
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const set = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData(prev => ({ ...prev, [field]: e.target.value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Cadastro da Clínica</h1>
          <p className="text-gray-600">Dados institucionais e bancários — Seção 3.1 MIFATURE</p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={salvarMutation.isPending}
          className={saved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
        >
          {salvarMutation.isPending ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : saved ? (
            <CheckCircle className="size-4 mr-2" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          {salvarMutation.isPending ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da Clínica */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="size-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Dados da Clínica</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="razaoSocial">Razão Social *</Label>
              <Input id="razaoSocial" value={formData.razaoSocial} onChange={set('razaoSocial')} required />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
              <Input id="nomeFantasia" value={formData.nomeFantasia} onChange={set('nomeFantasia')} />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input id="cnpj" value={formData.cnpj} onChange={set('cnpj')} placeholder="00.000.000/0000-00" required />
            </div>
            <div>
              <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
              <Input id="inscricaoEstadual" value={formData.inscricaoEstadual} onChange={set('inscricaoEstadual')} />
            </div>
            <div>
              <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
              <Input id="inscricaoMunicipal" value={formData.inscricaoMunicipal} onChange={set('inscricaoMunicipal')} />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" value={formData.cep} onChange={set('cep')} placeholder="00000-000" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input id="logradouro" value={formData.logradouro} onChange={set('logradouro')} />
            </div>
            <div>
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" value={formData.numero} onChange={set('numero')} />
            </div>
            <div>
              <Label htmlFor="complemento">Complemento</Label>
              <Input id="complemento" value={formData.complemento} onChange={set('complemento')} />
            </div>
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" value={formData.bairro} onChange={set('bairro')} />
            </div>
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={formData.cidade} onChange={set('cidade')} />
            </div>
            <div>
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input id="estado" value={formData.estado} onChange={set('estado')} maxLength={2} placeholder="SP" />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={formData.telefone} onChange={set('telefone')} placeholder="(00) 0000-0000" />
            </div>
            <div>
              <Label htmlFor="celular">Celular / WhatsApp</Label>
              <Input id="celular" value={formData.celular} onChange={set('celular')} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={formData.email} onChange={set('email')} />
            </div>
            <div>
              <Label htmlFor="site">Site</Label>
              <Input id="site" value={formData.site} onChange={set('site')} placeholder="www.clinica.com.br" />
            </div>
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dados Bancários</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="banco">Banco</Label>
              <Input id="banco" value={formData.banco} onChange={set('banco')} placeholder="001 - Banco do Brasil" />
            </div>
            <div>
              <Label htmlFor="agencia">Agência</Label>
              <Input id="agencia" value={formData.agencia} onChange={set('agencia')} placeholder="0000-0" />
            </div>
            <div>
              <Label htmlFor="conta">Conta</Label>
              <Input id="conta" value={formData.conta} onChange={set('conta')} placeholder="00000-0" />
            </div>
            <div>
              <Label htmlFor="tipoConta">Tipo de Conta</Label>
              <select
                id="tipoConta"
                value={formData.tipoConta}
                onChange={set('tipoConta')}
                className="w-full h-9 rounded-md border border-input bg-input-background px-3 py-1 text-sm"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Conta Poupança</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="pix">Chave PIX</Label>
              <Input id="pix" value={formData.pix} onChange={set('pix')} placeholder="E-mail, CPF, CNPJ ou chave aleatória" />
            </div>
          </div>
        </div>

        {/* Responsável Técnico */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Responsável Técnico</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nomeResponsavel">Nome Completo</Label>
              <Input id="nomeResponsavel" value={formData.nomeResponsavel} onChange={set('nomeResponsavel')} />
            </div>
            <div>
              <Label htmlFor="cpfResponsavel">CPF</Label>
              <Input id="cpfResponsavel" value={formData.cpfResponsavel} onChange={set('cpfResponsavel')} placeholder="000.000.000-00" />
            </div>
            <div>
              <Label htmlFor="crmResponsavel">CRM / Registro Profissional</Label>
              <Input id="crmResponsavel" value={formData.crmResponsavel} onChange={set('crmResponsavel')} />
            </div>
            <div>
              <Label htmlFor="emailResponsavel">E-mail</Label>
              <Input id="emailResponsavel" type="email" value={formData.emailResponsavel} onChange={set('emailResponsavel')} />
            </div>
            <div>
              <Label htmlFor="telefoneResponsavel">Telefone</Label>
              <Input id="telefoneResponsavel" value={formData.telefoneResponsavel} onChange={set('telefoneResponsavel')} />
            </div>
          </div>
        </div>

        {/* Logo da Clínica */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="size-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Logo da Clínica</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Esta logo aparecerá nas páginas de assinatura de guias e confirmação de presença enviadas aos pacientes.</p>
          <div className="flex items-start gap-6">
            {/* Preview da logo */}
            <div className="flex-shrink-0">
              {formData.logoUrl ? (
                <div className="relative">
                  <img src={formData.logoUrl} alt="Logo da clínica" className="w-32 h-32 object-contain border rounded-lg bg-gray-50 p-2" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                  >×</button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                  <ImageIcon className="size-8 mb-1" />
                  <span className="text-xs">Sem logo</span>
                </div>
              )}
            </div>
            {/* Botões de upload */}
            <div className="flex flex-col gap-3">
              <input
                id="logo-upload-clinica"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <label
                htmlFor="logo-upload-clinica"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 transition cursor-pointer select-none ${uploadingLogo ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                onClick={(e) => { if (uploadingLogo) e.preventDefault(); }}
              >
                {uploadingLogo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {uploadingLogo ? 'Enviando...' : formData.logoUrl ? 'Trocar Logo' : 'Selecionar Logo'}
              </label>
              <p className="text-xs text-gray-500">PNG, JPG ou SVG. Máximo 5MB.<br />Recomendado: fundo transparente (PNG).</p>
            </div>
          </div>
        </div>

        {/* Configurações ANS/TISS */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Configurações ANS/TISS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="codigoPrestadorNaOperadora">Código Prestador ANS</Label>
              <Input id="codigoPrestadorNaOperadora" value={formData.codigoPrestadorNaOperadora} onChange={set('codigoPrestadorNaOperadora')} />
            </div>
            <div>
              <Label htmlFor="cnes">CNES</Label>
              <Input id="cnes" value={formData.cnes} onChange={set('cnes')} maxLength={7} />
            </div>
            <div>
              <Label htmlFor="registroANS">Registro ANS</Label>
              <Input id="registroANS" value={formData.registroANS} onChange={set('registroANS')} />
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="size-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Importante</p>
              <p>Estes códigos são essenciais para a geração correcta das guias TISS e integração com as operadoras de saúde. Certifique-se de que todos os dados estejam correctos.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
