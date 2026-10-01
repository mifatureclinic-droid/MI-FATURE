import { Building2, Settings, Users, Bell, Shield, Palette } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';

export function Configuracoes() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Configurações</h1>
        <p className="text-gray-600">Personalize o sistema de acordo com sua clínica</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white border rounded-lg p-4 space-y-2">
            {[
              { id: 'clinica', icon: Building2, label: 'Dados da Clínica' },
              { id: 'usuarios', icon: Users, label: 'Usuários e Permissões' },
              { id: 'notificacoes', icon: Bell, label: 'Notificações' },
              { id: 'seguranca', icon: Shield, label: 'Segurança' },
              { id: 'aparencia', icon: Palette, label: 'Aparência (White-Label)' },
              { id: 'sistema', icon: Settings, label: 'Sistema' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl mb-4">Dados da Clínica</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome-clinica">Nome da Clínica</Label>
                  <Input id="nome-clinica" defaultValue="Clínica Médica" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnes">CNES</Label>
                    <Input id="cnes" defaultValue="1234567" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" defaultValue="Av. Paulista, 1000 - São Paulo/SP" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" defaultValue="(11) 3000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" defaultValue="contato@clinica.com.br" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="mb-4">White-Label</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo da Clínica</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <Button variant="outline">Alterar Logo</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cor-primaria">Cor Primária</Label>
                  <div className="flex items-center gap-4">
                    <Input id="cor-primaria" type="color" defaultValue="#2563eb" className="w-20 h-10" />
                    <span className="text-sm text-gray-600">#2563eb</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="mb-4">Notificações</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p>Autorizações a vencer</p>
                    <p className="text-sm text-gray-600">Alertar sobre autorizações próximas do vencimento</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p>Guias pendentes</p>
                    <p className="text-sm text-gray-600">Notificar sobre guias aguardando envio</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p>Fechamento mensal</p>
                    <p className="text-sm text-gray-600">Lembrete de fechamento de cada convênio</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex justify-end gap-3">
              <Button variant="outline">Cancelar</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
