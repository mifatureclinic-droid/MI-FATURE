import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';
import { Camera, User, Save, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MeuPerfil() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const [nome, setNome] = useState<string>('');
  const [nomeIniciado, setNomeIniciado] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingNome, setSavingNome] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar nome com o valor do utilizador (apenas uma vez)
  if (user && !nomeIniciado) {
    setNome((user as any).name || (user as any).nome || '');
    setNomeIniciado(true);
  }

  const updateProfileMutation = trpc.auth.updateMyProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success('Nome atualizado com sucesso!');
      setSavingNome(false);
    },
    onError: (err) => {
      toast.error('Erro ao atualizar nome: ' + err.message);
      setSavingNome(false);
    },
  });

  const uploadAvatarMutation = trpc.auth.uploadAvatar.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success('Foto de perfil atualizada com sucesso!');
      setUploadingAvatar(false);
    },
    onError: (err) => {
      toast.error('Erro ao fazer upload da foto: ' + err.message);
      setUploadingAvatar(false);
      setPreviewUrl(null);
    },
  });

  const handleSaveNome = () => {
    if (!nome.trim()) {
      toast.error('O nome não pode estar vazio.');
      return;
    }
    setSavingNome(true);
    updateProfileMutation.mutate({ nome: nome.trim() });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um ficheiro de imagem válido.');
      return;
    }

    // Validar tamanho (máx. 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem não pode ter mais de 5 MB.');
      return;
    }

    // Mostrar preview imediato
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadingAvatar(true);

    // Converter para base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadAvatarMutation.mutate({
        fileName: file.name,
        mimeType: file.type,
        base64Data: base64,
      });
    };
    reader.readAsDataURL(file);

    // Limpar input para permitir re-upload do mesmo ficheiro
    e.target.value = '';
  };

  const avatarAtual = previewUrl || (user as any)?.avatarUrl || null;
  const nomeAtual = (user as any)?.name || (user as any)?.nome || '';
  const emailAtual = (user as any)?.email || '';
  const perfilAtual = (user as any)?.perfil || 'utilizador';

  const perfilLabel: Record<string, string> = {
    administrador: 'Administrador',
    recepcao: 'Recepção',
    profissional: 'Profissional',
    master: 'Master',
    user: 'Utilizador',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'oklch(0.38 0.07 130)' }} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'oklch(0.22 0.04 130)' }}
        >
          Meu Perfil
        </h1>
        <p className="text-sm mt-1" style={{ color: 'oklch(0.55 0.05 75)' }}>
          Gerencie as suas informações pessoais e fotografia de perfil.
        </p>
      </div>

      {/* Card principal */}
      <Card
        className="border-0 shadow-sm"
        style={{ background: 'oklch(1 0 0)', border: '1px solid oklch(0.92 0.01 90)' }}
      >
        <CardContent className="pt-8 pb-8 px-6 sm:px-8">
          {/* Secção de foto */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              {/* Avatar */}
              <div
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                style={{
                  background: avatarAtual ? 'transparent' : 'oklch(0.38 0.07 130)',
                  border: '3px solid oklch(0.88 0.02 90)',
                  boxShadow: '0 4px 12px oklch(0.22 0.04 130 / 0.12)',
                }}
              >
                {avatarAtual ? (
                  <img
                    src={avatarAtual}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14" style={{ color: 'oklch(0.98 0.01 90)' }} />
                )}
              </div>

              {/* Botão de câmara sobreposto */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: 'oklch(0.38 0.07 130)',
                  border: '2px solid oklch(1 0 0)',
                  boxShadow: '0 2px 6px oklch(0.22 0.04 130 / 0.25)',
                }}
                title="Alterar foto"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'oklch(0.98 0.01 90)' }} />
                ) : (
                  <Camera className="w-4 h-4" style={{ color: 'oklch(0.98 0.01 90)' }} />
                )}
              </button>
            </div>

            {/* Input de ficheiro oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            <p className="text-xs mt-3" style={{ color: 'oklch(0.60 0.04 75)' }}>
              Clique no ícone da câmara para alterar a foto · JPG, PNG ou WebP · máx. 5 MB
            </p>
          </div>

          {/* Separador */}
          <div
            className="w-full h-px mb-6"
            style={{ background: 'oklch(0.92 0.01 90)' }}
          />

          {/* Informações do perfil (só leitura) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: 'oklch(0.55 0.05 75)' }}>
                E-mail
              </Label>
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'oklch(0.96 0.005 90)',
                  color: 'oklch(0.40 0.04 130)',
                  border: '1px solid oklch(0.90 0.01 90)',
                }}
              >
                {emailAtual || '—'}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: 'oklch(0.55 0.05 75)' }}>
                Perfil de acesso
              </Label>
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'oklch(0.96 0.005 90)',
                  color: 'oklch(0.40 0.04 130)',
                  border: '1px solid oklch(0.90 0.01 90)',
                }}
              >
                {perfilLabel[perfilAtual] || perfilAtual}
              </div>
            </div>
          </div>

          {/* Campo de nome editável */}
          <div className="space-y-2">
            <Label
              htmlFor="nome-perfil"
              className="text-sm font-medium"
              style={{ color: 'oklch(0.30 0.05 130)' }}
            >
              Nome de exibição
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="nome-perfil"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNome()}
                  placeholder="O seu nome completo"
                  className="pr-8"
                  style={{
                    borderColor: 'oklch(0.88 0.02 90)',
                    color: 'oklch(0.22 0.04 130)',
                  }}
                />
                <Pencil
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: 'oklch(0.65 0.04 75)' }}
                />
              </div>
              <Button
                onClick={handleSaveNome}
                disabled={savingNome || nome.trim() === nomeAtual}
                className="shrink-0 gap-1.5"
                style={{
                  background: 'oklch(0.38 0.07 130)',
                  color: 'oklch(0.98 0.01 90)',
                }}
              >
                {savingNome ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Guardar</span>
              </Button>
            </div>
            <p className="text-xs" style={{ color: 'oklch(0.60 0.04 75)' }}>
              Este nome é exibido no cabeçalho do sistema e nos registos de auditoria.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
