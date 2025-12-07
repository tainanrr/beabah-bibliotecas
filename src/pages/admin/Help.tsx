import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Video, Mail, Users, ArrowLeftRight, RotateCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Help() {
  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-title">Central de Ajuda</h1>
        <p className="text-muted-foreground">
          Encontre respostas para suas dúvidas e aprenda a usar o sistema
        </p>
      </div>

      {/* Perguntas Frequentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Perguntas Frequentes
          </CardTitle>
          <CardDescription>
            Dúvidas comuns sobre o uso do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Como cadastrar um novo leitor?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-muted-foreground pl-6">
                  <p>
                    Para cadastrar um novo leitor, siga estes passos:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Acesse a página "Leitores" no menu lateral</li>
                    <li>Clique no botão "Novo Leitor" no topo da página</li>
                    <li>Preencha os campos obrigatórios: Nome, Email e Documento</li>
                    <li>Selecione a biblioteca (se você for administrador da rede)</li>
                    <li>Marque a opção de consentimento LGPD</li>
                    <li>Clique em "Salvar" para finalizar o cadastro</li>
                  </ol>
                  <p className="mt-3">
                    <strong className="text-foreground">Dica:</strong> Você pode definir uma data de cadastro diferente da atual para registrar leitores retroativos.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                  Como realizar um empréstimo?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-muted-foreground pl-6">
                  <p>
                    Para realizar um empréstimo de livro:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Acesse a página "Circulação" no menu lateral</li>
                    <li>Na seção "Novo Empréstimo", selecione o leitor usando a busca</li>
                    <li>Verifique se o leitor está apto (sem empréstimos em atraso ou bloqueios)</li>
                    <li>Selecione o exemplar desejado na lista de disponíveis</li>
                    <li>Revise o resumo do empréstimo</li>
                    <li>Clique em "Confirmar Empréstimo"</li>
                  </ol>
                  <p className="mt-3">
                    <strong className="text-foreground">Importante:</strong> O sistema calcula automaticamente a data de devolução baseada nas regras da biblioteca. O prazo padrão é de 14 dias, mas pode variar conforme a configuração.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-muted-foreground" />
                  Como renovar um empréstimo?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-muted-foreground pl-6">
                  <p>
                    Para renovar um empréstimo:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Acesse a página "Circulação"</li>
                    <li>Na seção "Empréstimos Ativos" ou "Histórico de Movimentações", localize o empréstimo</li>
                    <li>Clique no botão de renovação (ícone de seta circular)</li>
                    <li>O sistema adiciona automaticamente mais dias ao prazo de devolução</li>
                  </ol>
                  <p className="mt-3">
                    <strong className="text-foreground">Limite:</strong> Cada empréstimo pode ser renovado até 2 vezes. O contador de renovações aparece na tabela (ex: "1 / 2").
                  </p>
                  <p>
                    <strong className="text-foreground">Dica:</strong> Você também pode renovar rapidamente digitando o código do exemplar na seção "Devolução Rápida" e clicando em "Renovar".
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Como registrar uma devolução?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-muted-foreground pl-6">
                  <p>
                    Existem duas formas de registrar uma devolução:
                  </p>
                  <div className="space-y-3 mt-3">
                    <div>
                      <p className="font-medium text-foreground mb-1">Método 1: Devolução Rápida (Recomendado)</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Na página "Circulação", vá até a seção "Devolução Rápida"</li>
                        <li>Digite ou escaneie o código do exemplar (ex: 1-0001-1)</li>
                        <li>Clique em "Devolver"</li>
                        <li>O sistema identifica automaticamente o empréstimo e registra a devolução</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-1">Método 2: Pela Lista de Empréstimos</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Localize o empréstimo na lista "Empréstimos Ativos" ou "Histórico"</li>
                        <li>Clique no botão de devolução (ícone de check verde)</li>
                        <li>A devolução será registrada imediatamente</li>
                      </ol>
                    </div>
                  </div>
                  <p className="mt-3">
                    <strong className="text-foreground">Nota:</strong> Após a devolução, o exemplar fica automaticamente disponível para novos empréstimos.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Como funciona o sistema de multas e atrasos?
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-muted-foreground pl-6">
                  <p>
                    O sistema identifica automaticamente empréstimos em atraso:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Empréstimos com data de devolução vencida aparecem destacados em vermelho</li>
                    <li>O Dashboard mostra a quantidade de empréstimos em atraso</li>
                    <li>Você pode enviar notificações via WhatsApp para leitores com atraso</li>
                    <li>O sistema calcula automaticamente os dias de atraso</li>
                  </ul>
                  <p className="mt-3">
                    <strong className="text-foreground">Notificações:</strong> Use o botão de WhatsApp na lista de empréstimos ativos para enviar lembretes. O sistema limita a 1 notificação por dia por empréstimo.
                  </p>
                  <p>
                    <strong className="text-foreground">Importante:</strong> O cálculo de multas e a aplicação de penalidades devem ser feitos manualmente conforme as políticas da sua biblioteca. O sistema apenas identifica e registra os atrasos.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Tutoriais em Vídeo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Tutoriais em Vídeo
          </CardTitle>
          <CardDescription>
            Aprenda a usar o sistema com nossos tutoriais passo a passo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Tutorial 1 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-muted rounded-t-lg flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 rounded-t-lg" />
                <Video className="h-12 w-12 text-muted-foreground/50 z-10" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  10:30
                </div>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-1">Como Cadastrar Livros</h4>
                <p className="text-sm text-muted-foreground">
                  Aprenda a adicionar novos títulos ao catálogo da biblioteca
                </p>
              </CardContent>
            </Card>

            {/* Tutorial 2 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-muted rounded-t-lg flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 rounded-t-lg" />
                <Video className="h-12 w-12 text-muted-foreground/50 z-10" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  8:15
                </div>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-1">Como Fazer Empréstimo</h4>
                <p className="text-sm text-muted-foreground">
                  Tutorial completo sobre o processo de empréstimo de livros
                </p>
              </CardContent>
            </Card>

            {/* Tutorial 3 */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="relative h-40 bg-muted rounded-t-lg flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 rounded-t-lg" />
                <Video className="h-12 w-12 text-muted-foreground/50 z-10" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  6:45
                </div>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-1">Gestão de Leitores</h4>
                <p className="text-sm text-muted-foreground">
                  Como cadastrar, editar e gerenciar leitores no sistema
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Suporte Técnico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Suporte Técnico
          </CardTitle>
          <CardDescription>
            Precisa de ajuda adicional? Entre em contato conosco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">
                Dúvidas técnicas?
              </p>
              <p className="text-sm text-muted-foreground">
                Contate o suporte:{' '}
                <a 
                  href="mailto:suporte@bibliorede.gov.br" 
                  className="text-primary hover:underline font-medium"
                >
                  suporte@bibliorede.gov.br
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

