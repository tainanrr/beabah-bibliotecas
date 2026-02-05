import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  HelpCircle, 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Calendar,
  BookMarked,
  FileText,
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  Mail,
  Library
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Help() {
  return (
    <div className="space-y-6 p-8 fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Central de Ajuda</h1>
        <p className="text-muted-foreground mt-2">
          Encontre respostas para suas dúvidas e aprenda a usar o sistema Beabah!
        </p>
      </div>

      {/* Manuais em Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Manuais Detalhados
          </CardTitle>
          <CardDescription>
            Expanda os tópicos abaixo para ver instruções passo a passo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Manual: Cadastro de Livros */}
            <AccordionItem value="cadastro-livros">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Cadastro de Livros</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Aprenda a cadastrar novos livros no catálogo da rede
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Como Cadastrar um Novo Livro
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Acesse a página <strong className="text-foreground">"Catálogo"</strong> no menu lateral</li>
                      <li>Clique no botão <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Nova Obra</Badge> no topo da página</li>
                      <li>Preencha os campos do formulário:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li><strong className="text-foreground">ISBN:</strong> Digite o ISBN e clique em "Buscar" para preencher automaticamente os dados do Google Books</li>
                          <li><strong className="text-foreground">Título:</strong> Nome completo do livro (obrigatório)</li>
                          <li><strong className="text-foreground">Subtítulo:</strong> Subtítulo do livro (opcional)</li>
                          <li><strong className="text-foreground">Autor(a):</strong> Nome do(a) autor(a) principal (obrigatório)</li>
                          <li><strong className="text-foreground">Editora:</strong> Nome da editora</li>
                          <li><strong className="text-foreground">Data de Publicação:</strong> Ano de publicação</li>
                          <li><strong className="text-foreground">Número de Páginas:</strong> Quantidade de páginas</li>
                          <li><strong className="text-foreground">Idioma:</strong> Idioma do livro (padrão: pt-BR)</li>
                          <li><strong className="text-foreground">Descrição:</strong> Sinopse ou descrição do livro</li>
                          <li><strong className="text-foreground">Categoria:</strong> Assunto ou categoria do livro</li>
                          <li><strong className="text-foreground">Outros campos:</strong> Série, Volume, Edição, Tradutor(a), Local de Publicação, Cutter, Classificação por País</li>
                        </ul>
                      </li>
                      <li>Clique em <Badge variant="default" className="mx-1">Salvar</Badge> para finalizar o cadastro</li>
                    </ol>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>💡 Dica:</strong> Use a busca por ISBN para preencher automaticamente a maioria dos campos. Isso economiza tempo e reduz erros!
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Como Editar um Livro Existente
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Na página "Catálogo", localize o livro que deseja editar usando a barra de pesquisa</li>
                      <li>Clique no ícone <Badge variant="outline" className="mx-1"><Pencil className="h-3 w-3" /></Badge> na linha do livro</li>
                      <li>Edite os campos desejados no formulário que será aberto</li>
                      <li>Clique em <Badge variant="default" className="mx-1">Salvar Alterações</Badge></li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Como Pesquisar Livros
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      Use a barra de pesquisa no topo da página "Catálogo" para buscar por:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                      <li>Título do livro</li>
                      <li>Nome do autor</li>
                      <li>ISBN</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manual: Cadastro de Leitores(as) */}
            <AccordionItem value="cadastro-leitores">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Cadastro de Leitores(as)</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Aprenda a cadastrar e gerenciar leitores(as) no sistema
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Como Cadastrar um(a) Novo(a) Leitor(a)
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Acesse a página <strong className="text-foreground">"Leitores(as)"</strong> no menu lateral</li>
                      <li>Clique no botão <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Novo(a) Leitor(a)</Badge></li>
                      <li>Preencha os campos obrigatórios:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li><strong className="text-foreground">Nome:</strong> Nome completo do(a) leitor(a)</li>
                          <li><strong className="text-foreground">Email:</strong> Email válido do(a) leitor(a)</li>
                          <li><strong className="text-foreground">Biblioteca Principal:</strong> Biblioteca à qual o(a) leitor(a) está vinculado(a)</li>
                        </ul>
                      </li>
                      <li>Marque a opção de <strong className="text-foreground">consentimento LGPD</strong> (obrigatório)</li>
                      <li>Clique em <Badge variant="default" className="mx-1">Salvar</Badge> para finalizar</li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      Como Editar um(a) Leitor(a)
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Na página "Leitores(as)", localize o(a) leitor(a) desejado(a)</li>
                      <li>Clique no ícone <Badge variant="outline" className="mx-1"><Pencil className="h-3 w-3" /></Badge> na linha do(a) leitor(a)</li>
                      <li>Edite os campos desejados, incluindo a <strong className="text-foreground">Biblioteca Principal</strong> se necessário</li>
                      <li>Clique em <Badge variant="default" className="mx-1">Salvar Alterações</Badge></li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Como Bloquear/Desbloquear um(a) Leitor(a)
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Na página "Leitores(as)", localize o(a) leitor(a) desejado(a)</li>
                      <li>Clique no botão <Badge variant="destructive" className="mx-1">Bloquear</Badge> ou <Badge variant="default" className="mx-1">Desbloquear</Badge></li>
                      <li>Confirme a ação quando solicitado</li>
                    </ol>
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        <strong>⚠️ Atenção:</strong> Leitores(as) bloqueados(as) não podem realizar novos empréstimos até serem desbloqueados(as).
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Como Excluir um(a) Leitor(a)
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Na página "Leitores(as)", localize o(a) leitor(a) desejado(a)</li>
                      <li>Clique no botão <Badge variant="destructive" className="mx-1"><Trash2 className="h-3 w-3 mr-1" />Excluir</Badge></li>
                      <li>Confirme a exclusão quando solicitado</li>
                    </ol>
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-900 dark:text-red-100">
                        <strong>🗑️ Importante:</strong> Leitores(as) com empréstimos ativos não podem ser excluídos(as). É necessário devolver todos os livros primeiro.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manual: Empréstimos */}
            <AccordionItem value="emprestimos">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Empréstimos de Livros</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Aprenda a realizar empréstimos de livros para leitores(as)
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Como Realizar um Empréstimo
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Acesse a página <strong className="text-foreground">"Circulação"</strong> no menu lateral</li>
                      <li>Na seção <strong className="text-foreground">"Novo Empréstimo"</strong>, selecione o(a) leitor(a):
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Digite o nome ou email do(a) leitor(a) na busca</li>
                          <li>Selecione o(a) leitor(a) da lista de resultados</li>
                        </ul>
                      </li>
                      <li>Verifique se o(a) leitor(a) está apto(a):
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Sem empréstimos em atraso</li>
                          <li>Sem bloqueios ativos</li>
                          <li>Dentro do limite de empréstimos simultâneos</li>
                        </ul>
                      </li>
                      <li>Selecione o exemplar desejado na lista de <strong className="text-foreground">"Exemplares Disponíveis"</strong></li>
                      <li>Revise o resumo do empréstimo (leitor(a), livro, data de devolução prevista)</li>
                      <li>Clique em <Badge variant="default" className="mx-1">Confirmar Empréstimo</Badge></li>
                    </ol>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>📅 Importante:</strong> O sistema calcula automaticamente a data de devolução baseada nas regras da biblioteca. O prazo padrão é de 14 dias.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <RotateCw className="h-4 w-4" />
                      Como Renovar um Empréstimo
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Na página "Circulação", vá até a seção <strong className="text-foreground">"Empréstimos Ativos"</strong></li>
                      <li>Localize o empréstimo que deseja renovar</li>
                      <li>Clique no botão de renovação <Badge variant="outline" className="mx-1"><RotateCw className="h-3 w-3" /></Badge></li>
                      <li>O sistema adiciona automaticamente mais dias ao prazo de devolução</li>
                    </ol>
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        <strong>🔄 Limite:</strong> Cada empréstimo pode ser renovado até 2 vezes. O contador de renovações aparece na tabela.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manual: Devoluções */}
            <AccordionItem value="devolucoes">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Devoluções de Livros</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Aprenda a registrar devoluções de livros
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Método 1: Devolução Rápida (Recomendado)
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Na página "Circulação", vá até a seção <strong className="text-foreground">"Devolução Rápida"</strong></li>
                      <li>Digite ou escaneie o código do exemplar (ex: 1-0001-1) no campo de busca</li>
                      <li>Clique em <Badge variant="default" className="mx-1">Devolver</Badge></li>
                      <li>O sistema identifica automaticamente o empréstimo e registra a devolução</li>
                    </ol>
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-900 dark:text-green-100">
                        <strong>✅ Vantagem:</strong> Este método é mais rápido e ideal para devoluções em grande volume.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Método 2: Pela Lista de Empréstimos
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Na página "Circulação", localize o empréstimo na lista <strong className="text-foreground">"Empréstimos Ativos"</strong></li>
                      <li>Clique no botão de devolução <Badge variant="default" className="mx-1"><CheckCircle2 className="h-3 w-3 mr-1" />Devolver</Badge></li>
                      <li>A devolução será registrada imediatamente</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manual: Gerenciar Exemplares */}
            <AccordionItem value="exemplares">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <BookMarked className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Gerenciar Exemplares</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Aprenda a adicionar e gerenciar exemplares de livros
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Como Adicionar Exemplares a um Livro
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Acesse a página <strong className="text-foreground">"Acervo Local"</strong> no menu lateral</li>
                      <li>Clique no botão <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Novo Exemplar</Badge></li>
                      <li>Preencha os campos:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li><strong className="text-foreground">Livro:</strong> Selecione o livro do catálogo</li>
                          <li><strong className="text-foreground">Código:</strong> Código único do exemplar (ex: 1-0001-1)</li>
                          <li><strong className="text-foreground">Status:</strong> Disponível, Emprestado, Em Manutenção, etc.</li>
                          <li><strong className="text-foreground">Biblioteca:</strong> Biblioteca à qual o exemplar pertence</li>
                        </ul>
                      </li>
                      <li>Clique em <Badge variant="default" className="mx-1">Salvar</Badge></li>
                    </ol>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Status dos Exemplares</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div className="p-3 rounded-lg border">
                        <Badge variant="default" className="mb-2">Disponível</Badge>
                        <p className="text-sm text-muted-foreground">Exemplar disponível para empréstimo</p>
                      </div>
                      <div className="p-3 rounded-lg border">
                        <Badge variant="secondary" className="mb-2">Emprestado</Badge>
                        <p className="text-sm text-muted-foreground">Exemplar atualmente emprestado</p>
                      </div>
                      <div className="p-3 rounded-lg border">
                        <Badge variant="outline" className="mb-2">Em Manutenção</Badge>
                        <p className="text-sm text-muted-foreground">Exemplar temporariamente indisponível</p>
                      </div>
                      <div className="p-3 rounded-lg border">
                        <Badge variant="destructive" className="mb-2">Danificado</Badge>
                        <p className="text-sm text-muted-foreground">Exemplar danificado e não disponível</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manual: Cadastro de Bibliotecas */}
            <AccordionItem value="bibliotecas">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Cadastro de Bibliotecas</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Aprenda a cadastrar e gerenciar bibliotecas na rede (Apenas Administradores)
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      <strong>🔒 Acesso Restrito:</strong> Esta funcionalidade está disponível apenas para usuários com perfil de Administrador da Rede.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Como Cadastrar uma Nova Biblioteca
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Acesse a página <strong className="text-foreground">"Bibliotecas"</strong> no menu lateral</li>
                      <li>Clique no botão <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Nova Biblioteca</Badge></li>
                      <li>Preencha os campos:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li><strong className="text-foreground">Nome:</strong> Nome da biblioteca</li>
                          <li><strong className="text-foreground">Cidade:</strong> Cidade onde está localizada</li>
                          <li><strong className="text-foreground">Endereço:</strong> Endereço completo</li>
                          <li><strong className="text-foreground">Telefone:</strong> Telefone de contato</li>
                          <li><strong className="text-foreground">Descrição:</strong> Informações adicionais sobre a biblioteca</li>
                          <li><strong className="text-foreground">Coordenadas:</strong> Latitude e longitude (opcional, para mapas)</li>
                          <li><strong className="text-foreground">Imagem:</strong> Foto da biblioteca (opcional)</li>
                          <li><strong className="text-foreground">Instagram:</strong> Perfil no Instagram (opcional)</li>
                        </ul>
                      </li>
                      <li>Clique em <Badge variant="default" className="mx-1">Salvar</Badge></li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manual: Cadastro de Eventos */}
            <AccordionItem value="eventos">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Cadastro de Eventos</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Aprenda a cadastrar e gerenciar eventos culturais
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Como Cadastrar um Novo Evento
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Acesse a página <strong className="text-foreground">"Eventos"</strong> no menu lateral</li>
                      <li>Clique no botão <Badge variant="outline" className="mx-1"><Plus className="h-3 w-3 mr-1" />Novo Evento</Badge></li>
                      <li>Preencha os campos:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li><strong className="text-foreground">Título:</strong> Nome do evento</li>
                          <li><strong className="text-foreground">Data:</strong> Data e hora do evento</li>
                          <li><strong className="text-foreground">Categoria:</strong> Tipo de evento (Contação de Histórias, Oficina, etc.)</li>
                          <li><strong className="text-foreground">Bibliotecas Vinculadas:</strong> Selecione uma ou mais bibliotecas relacionadas ao evento</li>
                          <li><strong className="text-foreground">Descrição:</strong> Detalhes sobre o evento</li>
                          <li><strong className="text-foreground">Público Alvo:</strong> Faixa etária ou público específico</li>
                          <li><strong className="text-foreground">Público Real:</strong> Quantidade de pessoas que participaram (preencher após o evento)</li>
                        </ul>
                      </li>
                      <li>Clique em <Badge variant="default" className="mx-1">Salvar</Badge></li>
                    </ol>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>📌 Importante:</strong> Você pode vincular um evento a múltiplas bibliotecas. Isso é útil para eventos em parceria ou eventos da rede.
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manual: Catálogo da Rede */}
            <AccordionItem value="catalogo">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Library className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Catálogo da Rede</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Entenda como funciona o catálogo unificado da rede
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-semibold mb-2">O que é o Catálogo da Rede?</h3>
                    <p className="text-muted-foreground mb-2 ml-2">
                      O Catálogo da Rede é uma visão unificada de todos os livros cadastrados em todas as bibliotecas da rede. 
                      Ele permite que você veja quais livros existem na rede e em quais bibliotecas estão disponíveis.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Diferença entre Catálogo e Acervo Local</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Library className="h-4 w-4" />
                          Catálogo da Rede
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Mostra todos os livros da rede</li>
                          <li>Bibliotecários veem apenas livros com exemplares em sua biblioteca</li>
                          <li>Focado em informações do livro (título, autor, etc.)</li>
                          <li>Permite cadastrar novos livros</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <BookMarked className="h-4 w-4" />
                          Acervo Local
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          <li>Mostra os exemplares físicos da sua biblioteca</li>
                          <li>Focado em gerenciar cópias físicas</li>
                          <li>Permite adicionar/editar/excluir exemplares</li>
                          <li>Mostra status de cada exemplar</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Exportar Catálogo
                    </h3>
                    <p className="text-muted-foreground mb-2 ml-2">
                      Na página "Catálogo", você pode exportar o catálogo completo em formato Excel:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Clique no botão <Badge variant="outline" className="mx-1"><Download className="h-3 w-3 mr-1" />Excel</Badge></li>
                      <li>O arquivo será baixado automaticamente com todas as informações do catálogo</li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Manual: Auditoria */}
            <AccordionItem value="auditoria">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Auditoria</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Entenda como funciona o sistema de auditoria (Apenas Administradores)
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      <strong>🔒 Acesso Restrito:</strong> Esta funcionalidade está disponível apenas para usuários com perfil de Administrador da Rede.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">O que é a Auditoria?</h3>
                    <p className="text-muted-foreground mb-2 ml-2">
                      O sistema de auditoria registra automaticamente todas as ações importantes realizadas no sistema, incluindo:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                      <li>Cadastros de livros, leitores(as), bibliotecas e eventos</li>
                      <li>Edições de registros</li>
                      <li>Exclusões de registros</li>
                      <li>Empréstimos e devoluções</li>
                      <li>Renovações de empréstimos</li>
                      <li>Alterações de status</li>
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Como Visualizar os Logs de Auditoria</h3>
                    <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                      <li>Acesse a página <strong className="text-foreground">"Auditoria"</strong> no menu lateral</li>
                      <li>Os logs são exibidos em ordem cronológica (mais recentes primeiro)</li>
                      <li>Cada log mostra:
                        <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                          <li>Data e hora da ação</li>
                          <li>Usuário que realizou a ação</li>
                          <li>Tipo de ação (criação, edição, exclusão, etc.)</li>
                          <li>Entidade afetada (livro, leitor(a), etc.)</li>
                          <li>Detalhes da ação</li>
                          <li>Biblioteca relacionada</li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Perguntas Frequentes */}
            <AccordionItem value="faq">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">Perguntas Frequentes</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      Dúvidas comuns sobre o uso do sistema
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="faq-1">
                      <AccordionTrigger className="text-left text-sm">
                        Posso emprestar livros para leitores(as) de outras bibliotecas?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground text-sm">
                          Sim! O sistema permite que bibliotecários(as) emprestem livros para qualquer leitor(a) cadastrado(a) na rede, 
                          independentemente da biblioteca principal do(a) leitor(a). Isso facilita o compartilhamento de acervos entre bibliotecas.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-2">
                      <AccordionTrigger className="text-left text-sm">
                        Como altero a biblioteca principal de um(a) leitor(a)?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground text-sm">
                          Para alterar a biblioteca principal de um(a) leitor(a), edite o(a) leitor(a) na página "Leitores(as)" e altere o campo 
                          "Biblioteca Principal" no formulário de edição. Isso é útil quando um(a) leitor(a) muda de biblioteca.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-3">
                      <AccordionTrigger className="text-left text-sm">
                        Por que não consigo ver alguns livros no catálogo?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground text-sm">
                          Se você é bibliotecário, o sistema mostra apenas livros que possuem pelo menos um exemplar na sua biblioteca. 
                          Isso evita confusão e mantém o foco nos livros disponíveis para empréstimo na sua biblioteca.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-4">
                      <AccordionTrigger className="text-left text-sm">
                        Como funciona o sistema de renovações?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground text-sm">
                          Cada empréstimo pode ser renovado até 2 vezes. O sistema adiciona automaticamente o prazo padrão de empréstimo 
                          (geralmente 14 dias) a cada renovação. O contador de renovações aparece na lista de empréstimos ativos.
                        </p>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="faq-5">
                      <AccordionTrigger className="text-left text-sm">
                        Posso excluir um(a) leitor(a) que tem empréstimos ativos?
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground text-sm">
                          Não. O sistema impede a exclusão de leitores(as) que possuem empréstimos em aberto. 
                          É necessário devolver todos os livros antes de excluir o(a) leitor(a). Isso garante a integridade dos dados.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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
                  href="mailto:bicocircular@gmail.com" 
                  className="text-primary hover:underline font-medium"
                >
                  bicocircular@gmail.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
