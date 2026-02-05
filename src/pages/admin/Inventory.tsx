import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Trash2, Palette, Book as BookIcon, Filter, Settings2, CheckCircle2, XCircle, AlertCircle, Hash, Library, FileText, Tag, ArrowUp, ArrowDown, ArrowUpDown, FileSpreadsheet, Check, ChevronsUpDown, Loader2, Copy, Smartphone, ArrowLeft, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, includesIgnoringAccents, normalizeText } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import * as XLSX from 'xlsx';

type Library = Tables<'libraries'>;

// --- SUB-COMPONENTE: CONFIGURAÇÃO DE CORES (Completo com CRUD) ---
function ColorConfigModal({ isOpen, onClose, libraryId: initialLibraryId }: { isOpen: boolean; onClose: () => void; libraryId?: string }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados principais
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>(initialLibraryId || "");
  const [libraries, setLibraries] = useState<any[]>([]);
  const [libraryColors, setLibraryColors] = useState<any[]>([]);
  const [colorTemplates, setColorTemplates] = useState<any[]>([]);
  const [colorGroups, setColorGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"biblioteca" | "templates">("biblioteca");
  const [loading, setLoading] = useState(false);
  const [importingAll, setImportingAll] = useState(false);
  
  // Estados para edição de grupos
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  
  // Estados para edição de cores/templates
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateColor, setNewTemplateColor] = useState("#000000");
  const [newTemplateCode, setNewTemplateCode] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [newTemplateGroup, setNewTemplateGroup] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialLibraryId) setSelectedLibraryId(initialLibraryId);
      fetchLibraries();
      fetchAll();
    }
  }, [isOpen, initialLibraryId]);

  useEffect(() => {
    if (selectedLibraryId) fetchLibraryColors();
  }, [selectedLibraryId]);

  const fetchLibraries = async () => {
    if (user?.role === 'admin_rede') {
      const { data } = await (supabase as any).from("libraries").select("id, name").order("name");
      setLibraries(data || []);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    
    // Buscar grupos
    const { data: groups } = await (supabase as any)
      .from("color_groups")
      .select("*")
      .order("sort_order");
    setColorGroups(groups || []);
    
    // Definir grupo ativo inicial
    if (groups && groups.length > 0 && !activeGroup) {
      setActiveGroup(groups[0].name);
    }
    
    // Buscar templates globais
    const { data: templates } = await (supabase as any)
      .from("color_templates")
      .select("*")
      .order("group_name, sort_order");
    setColorTemplates(templates || []);
    
    setLoading(false);
  };

  const fetchLibraryColors = async () => {
    if (!selectedLibraryId) return;
    const { data: colors } = await (supabase as any)
      .from("library_colors")
      .select("*")
      .eq("library_id", selectedLibraryId)
      .order("color_group, category_name");
    setLibraryColors(colors || []);
  };

  // ======= CRUD DE GRUPOS =======
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: "Erro", description: "Digite o nome do grupo", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any).from("color_groups").insert({
      name: newGroupName.trim(),
      description: newGroupDesc.trim(),
      sort_order: colorGroups.length + 1
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Grupo criado", description: `"${newGroupName}" foi adicionado.` });
      setNewGroupName("");
      setNewGroupDesc("");
      setShowNewGroupForm(false);
      setActiveGroup(newGroupName.trim());
      fetchAll();
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;
    
    // Atualizar grupo
    const { error } = await (supabase as any)
      .from("color_groups")
      .update({ name: newGroupName.trim(), description: newGroupDesc.trim() })
      .eq("id", editingGroup.id);
    
    if (!error) {
      // Atualizar templates que usam esse grupo
      await (supabase as any)
        .from("color_templates")
        .update({ group_name: newGroupName.trim() })
        .eq("group_name", editingGroup.name);
      
      // Atualizar library_colors que usam esse grupo
      await (supabase as any)
        .from("library_colors")
        .update({ color_group: newGroupName.trim() })
        .eq("color_group", editingGroup.name);
      
      toast({ title: "Grupo atualizado" });
      setEditingGroup(null);
      setNewGroupName("");
      setNewGroupDesc("");
      if (activeGroup === editingGroup.name) setActiveGroup(newGroupName.trim());
      fetchAll();
      fetchLibraryColors();
    } else {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteGroup = async (group: any) => {
    if (!confirm(`Excluir o grupo "${group.name}"? As cores deste grupo também serão removidas.`)) return;
    
    // Excluir templates do grupo
    await (supabase as any).from("color_templates").delete().eq("group_name", group.name);
    
    // Excluir cores de bibliotecas deste grupo
    await (supabase as any).from("library_colors").delete().eq("color_group", group.name);
    
    // Excluir o grupo
    const { error } = await (supabase as any).from("color_groups").delete().eq("id", group.id);
    
    if (!error) {
      toast({ title: "Grupo excluído" });
      if (activeGroup === group.name && colorGroups.length > 1) {
        setActiveGroup(colorGroups.find(g => g.name !== group.name)?.name || "");
      }
      fetchAll();
      fetchLibraryColors();
    }
  };

  // ======= CRUD DE TEMPLATES =======
  const handleAddTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast({ title: "Erro", description: "Digite o nome da categoria", variant: "destructive" });
      return;
    }
    const groupToUse = newTemplateGroup || activeGroup;
    if (!groupToUse) {
      toast({ title: "Erro", description: "Selecione um grupo", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any).from("color_templates").insert({
      group_name: groupToUse,
      category_name: newTemplateName.trim(),
      color_hex: newTemplateColor,
      color_code: newTemplateCode.trim(),
      color_description: newTemplateDesc.trim(),
      sort_order: colorTemplates.filter(t => t.group_name === groupToUse).length + 1
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cor criada", description: `"${newTemplateName}" foi adicionada.` });
      resetTemplateForm();
      setShowNewTemplateForm(false);
      fetchAll();
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !newTemplateName.trim()) return;
    const { error } = await (supabase as any)
      .from("color_templates")
      .update({
        group_name: newTemplateGroup,
        category_name: newTemplateName.trim(),
        color_hex: newTemplateColor,
        color_code: newTemplateCode.trim(),
        color_description: newTemplateDesc.trim()
      })
      .eq("id", editingTemplate.id);
    
    if (!error) {
      toast({ title: "Cor atualizada" });
      resetTemplateForm();
      fetchAll();
    } else {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (template: any) => {
    if (!confirm(`Excluir "${template.category_name}"?`)) return;
    const { error } = await (supabase as any).from("color_templates").delete().eq("id", template.id);
    if (!error) {
      toast({ title: "Cor excluída" });
      fetchAll();
    }
  };

  // ======= CLONAR GRUPO =======
  const handleCloneGroup = async (group: any) => {
    const newName = prompt(`Nome para o novo grupo (cópia de "${group.name}"):`, `${group.name} (Cópia)`);
    if (!newName || !newName.trim()) return;
    
    // Criar o novo grupo
    const { data: newGroup, error: groupError } = await (supabase as any)
      .from("color_groups")
      .insert({
        name: newName.trim(),
        description: group.description ? `${group.description} (Cópia)` : null,
        sort_order: colorGroups.length + 1
      })
      .select()
      .single();
    
    if (groupError) {
      toast({ title: "Erro", description: groupError.message, variant: "destructive" });
      return;
    }
    
    // Copiar todos os templates do grupo original
    const groupTemplates = colorTemplates.filter(t => t.group_name === group.name);
    for (const template of groupTemplates) {
      await (supabase as any).from("color_templates").insert({
        group_name: newName.trim(),
        category_name: template.category_name,
        color_hex: template.color_hex,
        color_code: template.color_code,
        color_description: template.color_description,
        sort_order: template.sort_order
      });
    }
    
    toast({ title: "Grupo clonado", description: `"${newName}" foi criado com ${groupTemplates.length} cores.` });
    setActiveGroup(newName.trim());
    fetchAll();
  };

  // ======= CLONAR TEMPLATE (COR) =======
  const handleCloneTemplate = async (template: any) => {
    const newName = prompt(`Nome para a nova cor (cópia de "${template.category_name}"):`, `${template.category_name} (Cópia)`);
    if (!newName || !newName.trim()) return;
    
    const { error } = await (supabase as any).from("color_templates").insert({
      group_name: template.group_name,
      category_name: newName.trim(),
      color_hex: template.color_hex,
      color_code: template.color_code,
      color_description: template.color_description,
      sort_order: colorTemplates.filter(t => t.group_name === template.group_name).length + 1
    });
    
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cor clonada", description: `"${newName}" foi criada.` });
      fetchAll();
    }
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setNewTemplateName("");
    setNewTemplateColor("#000000");
    setNewTemplateCode("");
    setNewTemplateDesc("");
    setNewTemplateGroup(activeGroup);
  };

  const startEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setNewTemplateName(template.category_name);
    setNewTemplateColor(template.color_hex);
    setNewTemplateCode(template.color_code || "");
    setNewTemplateDesc(template.color_description || "");
    setNewTemplateGroup(template.group_name);
  };

  // ======= ATIVAR/DESATIVAR CORES NA BIBLIOTECA =======
  const isColorActive = (categoryName: string, groupName: string) => {
    return libraryColors.some(c => 
      c.library_id === selectedLibraryId && 
      c.category_name === categoryName && 
      c.color_group === groupName
    );
  };

  const toggleColor = async (template: any) => {
    if (!selectedLibraryId) {
      toast({ title: "Selecione uma biblioteca", variant: "destructive" });
      return;
    }
    
    // Verificar diretamente no banco para evitar duplicatas
    const { data: existingColors } = await (supabase as any)
      .from("library_colors")
      .select("id")
      .eq("library_id", selectedLibraryId)
      .eq("category_name", template.category_name)
      .eq("color_group", template.group_name);
    
    const isActive = existingColors && existingColors.length > 0;
    
    if (isActive) {
      // Remover TODOS os registros duplicados dessa cor (não apenas um)
      await (supabase as any)
        .from("library_colors")
        .delete()
        .eq("library_id", selectedLibraryId)
        .eq("category_name", template.category_name)
        .eq("color_group", template.group_name);
      toast({ title: "Cor desativada", description: `"${template.category_name}" foi removida.` });
    } else {
      const { error } = await (supabase as any).from("library_colors").insert({
        library_id: selectedLibraryId,
        category_name: template.category_name,
        color_hex: template.color_hex,
        color_group: template.group_name,
        color_code: template.color_code,
        color_description: template.color_description
      });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Cor ativada", description: `"${template.category_name}" foi adicionada.` });
      }
    }
    fetchLibraryColors();
  };

  const importGroupColors = async (groupName: string) => {
    if (!selectedLibraryId) return;
    const groupTemplates = colorTemplates.filter(t => t.group_name === groupName);
    let imported = 0;
    
    for (const template of groupTemplates) {
      // Verificar no banco se já existe
      const { data: existing } = await (supabase as any)
        .from("library_colors")
        .select("id")
        .eq("library_id", selectedLibraryId)
        .eq("category_name", template.category_name)
        .eq("color_group", template.group_name)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        await (supabase as any).from("library_colors").insert({
          library_id: selectedLibraryId,
          category_name: template.category_name,
          color_hex: template.color_hex,
          color_group: template.group_name,
          color_code: template.color_code,
          color_description: template.color_description
        });
        imported++;
      }
    }
    toast({ title: "Grupo importado", description: `${imported} cores adicionadas.` });
    fetchLibraryColors();
  };

  const importAllColors = async () => {
    if (!selectedLibraryId) return;
    setImportingAll(true);
    let imported = 0;
    
    for (const template of colorTemplates) {
      // Verificar no banco se já existe
      const { data: existing } = await (supabase as any)
        .from("library_colors")
        .select("id")
        .eq("library_id", selectedLibraryId)
        .eq("category_name", template.category_name)
        .eq("color_group", template.group_name)
        .limit(1);
      
      if (!existing || existing.length === 0) {
        await (supabase as any).from("library_colors").insert({
          library_id: selectedLibraryId,
          category_name: template.category_name,
          color_hex: template.color_hex,
          color_group: template.group_name,
          color_code: template.color_code,
          color_description: template.color_description
        });
        imported++;
      }
    }
    toast({ title: "Importação concluída!", description: `${imported} cores adicionadas.` });
    fetchLibraryColors();
    setImportingAll(false);
  };

  // Cores da biblioteca selecionada
  const colorsForSelectedLibrary = libraryColors.filter(c => c.library_id === selectedLibraryId);
  
  // Cores órfãs (sem grupo válido) - apenas da biblioteca selecionada
  const orphanColors = colorsForSelectedLibrary.filter(c => !c.color_group || !colorGroups.some(g => g.name === c.color_group));
  
  const deleteOrphanColor = async (colorId: string) => {
    await (supabase as any).from("library_colors").delete().eq("id", colorId);
    toast({ title: "Cor removida" });
    fetchLibraryColors();
  };

  // Conta cores ativas por grupo - apenas da biblioteca selecionada
  const countActiveByGroup = (groupName: string) => colorsForSelectedLibrary.filter(c => c.color_group === groupName).length;
  const activeTemplates = colorTemplates.filter(t => t.group_name === activeGroup);
  const selectedLibrary = libraries.find(l => l.id === selectedLibraryId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Palette className="h-6 w-6" />
            Gerenciamento de Cores e Categorias
          </DialogTitle>
          <DialogDescription>
            Gerencie grupos, cores padrão e configure as cores disponíveis para cada biblioteca
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* SIDEBAR - Grupos */}
            <div className="w-64 border-r bg-slate-50 p-4 flex flex-col overflow-hidden">
              <div className="font-semibold text-sm mb-3 flex items-center justify-between">
                <span>Grupos</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2"
                  onClick={() => { 
                    setEditingGroup(null); 
                    setNewGroupName(""); 
                    setNewGroupDesc(""); 
                    setShowNewGroupForm(true); 
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Form novo grupo */}
              {!editingGroup && showNewGroupForm && (
                <div className="mb-3 p-2 bg-white rounded border space-y-2">
                  <Input 
                    placeholder="Nome do grupo" 
                    value={newGroupName} 
                    onChange={e => setNewGroupName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input 
                    placeholder="Descrição (opcional)" 
                    value={newGroupDesc} 
                    onChange={e => setNewGroupDesc(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleAddGroup}>Criar</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowNewGroupForm(false); setNewGroupName(""); setNewGroupDesc(""); }}>×</Button>
                  </div>
                </div>
              )}
              
              {/* Form editar grupo */}
              {editingGroup && (
                <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200 space-y-2">
                  <div className="text-xs font-medium text-blue-600">Editando grupo</div>
                  <Input 
                    placeholder="Nome do grupo" 
                    value={newGroupName} 
                    onChange={e => setNewGroupName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input 
                    placeholder="Descrição" 
                    value={newGroupDesc} 
                    onChange={e => setNewGroupDesc(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleUpdateGroup}>Salvar</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingGroup(null)}>×</Button>
                  </div>
                </div>
              )}
              
              {/* Lista de grupos */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {colorGroups.map(group => {
                  const count = colorTemplates.filter(t => t.group_name === group.name).length;
                  const activeCount = countActiveByGroup(group.name);
                  const isActive = activeGroup === group.name;
                  
                  return (
                    <div
                      key={group.id}
                      className={`p-2 rounded cursor-pointer transition-all group ${
                        isActive ? 'bg-blue-100 border border-blue-300' : 'hover:bg-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between" onClick={() => setActiveGroup(group.name)}>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{group.name}</div>
                          <div className="text-xs text-muted-foreground">{count} cores • {activeCount} ativas</div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setNewGroupName(group.name); setNewGroupDesc(group.description || ""); }}
                            title="Editar"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600"
                            onClick={(e) => { e.stopPropagation(); handleCloneGroup(group); }}
                            title="Clonar grupo"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group); }}
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Cores órfãs */}
              {orphanColors.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs font-semibold text-red-600 mb-2">⚠️ Cores sem grupo ({orphanColors.length})</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {orphanColors.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-1 bg-red-50 rounded text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.color_hex }} />
                          <span className="truncate">{c.category_name}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => deleteOrphanColor(c.id)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 py-3 border-b bg-white">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Seletor de biblioteca */}
                  {user?.role === 'admin_rede' ? (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium whitespace-nowrap">Biblioteca:</Label>
                      <Select value={selectedLibraryId} onValueChange={setSelectedLibraryId}>
                        <SelectTrigger className="w-[220px]">
                          <SelectValue placeholder="Selecione a biblioteca" />
                        </SelectTrigger>
                        <SelectContent>
                          {libraries.map(lib => (
                            <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Biblioteca: </span>
                      <span className="font-medium">{selectedLibrary?.name || "Sua biblioteca"}</span>
                    </div>
                  )}
                  
                  {/* Separador */}
                  <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                  
                  {/* Abas */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveTab("biblioteca")}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${
                        activeTab === "biblioteca" ? "bg-white shadow font-medium" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Cores da Biblioteca
                    </button>
                    <button
                      onClick={() => setActiveTab("templates")}
                      className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${
                        activeTab === "templates" ? "bg-white shadow font-medium" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Gerenciar Templates
                    </button>
                  </div>
                  
                  {/* Ações - empurrado para direita */}
                  {activeTab === "biblioteca" && selectedLibraryId && (
                    <div className="flex gap-2 ml-auto">
                      <Button variant="outline" size="sm" onClick={() => importGroupColors(activeGroup)} className="whitespace-nowrap">
                        <Plus className="h-4 w-4 mr-1" />
                        Importar Grupo
                      </Button>
                      <Button size="sm" onClick={importAllColors} disabled={importingAll} className="whitespace-nowrap">
                        {importingAll ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                        Importar Todas
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === "biblioteca" ? (
                  /* === TAB: CORES DA BIBLIOTECA === */
                  !selectedLibraryId ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Selecione uma biblioteca para configurar suas cores
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{activeGroup}</h3>
                          <p className="text-sm text-muted-foreground">
                            Clique nas cores para ativar/desativar nesta biblioteca
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {countActiveByGroup(activeGroup)}/{activeTemplates.length} ativas
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {activeTemplates.map(template => {
                          const isActive = isColorActive(template.category_name, template.group_name);
                          return (
                            <div
                              key={template.id}
                              onClick={() => toggleColor(template)}
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                isActive 
                                  ? 'border-green-400 bg-green-50 hover:bg-green-100' 
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isActive ? 'bg-green-500 border-green-500' : 'border-gray-300'
                              }`}>
                                {isActive && <Check className="h-4 w-4 text-white" />}
                              </div>
                              <div 
                                className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: template.color_hex }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{template.category_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {template.color_description} • Cód: {template.color_code} • {template.color_hex}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {activeTemplates.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma cor cadastrada neste grupo. Vá para "Gerenciar Templates" para adicionar.
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* === TAB: GERENCIAR TEMPLATES === */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{activeGroup} - Templates Globais</h3>
                        <p className="text-sm text-muted-foreground">
                          Estas cores ficam disponíveis para todas as bibliotecas importarem
                        </p>
                      </div>
                    </div>
                    
                    {/* Botão para mostrar form de adicionar */}
                    {!editingTemplate && !showNewTemplateForm && (
                      <Button 
                        variant="outline" 
                        onClick={() => { 
                          setShowNewTemplateForm(true); 
                          setNewTemplateGroup(activeGroup);
                          setNewTemplateColor("#000000");
                        }}
                        className="mb-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Nova Cor
                      </Button>
                    )}
                    
                    {/* Form adicionar/editar template */}
                    {(editingTemplate || showNewTemplateForm) && (
                      <div className={`p-4 rounded-lg border-2 mb-4 ${editingTemplate ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="text-sm font-medium mb-3">
                          {editingTemplate ? `✏️ Editando: ${editingTemplate.category_name}` : "➕ Adicionar nova cor"}
                        </div>
                        <div className="grid grid-cols-6 gap-3">
                          <div className="col-span-2">
                            <Label className="text-xs">Nome da categoria *</Label>
                            <Input 
                              value={newTemplateName} 
                              onChange={e => setNewTemplateName(e.target.value)}
                              placeholder="Ex: Terror"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Cor *</Label>
                            <div className="flex gap-2">
                              <Input 
                                type="color" 
                                value={newTemplateColor} 
                                onChange={e => setNewTemplateColor(e.target.value)}
                                className="w-12 h-10 p-1 cursor-pointer"
                              />
                              <Input 
                                value={newTemplateColor} 
                                onChange={e => setNewTemplateColor(e.target.value)}
                                placeholder="#000000"
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Código</Label>
                            <Input 
                              value={newTemplateCode} 
                              onChange={e => setNewTemplateCode(e.target.value)}
                              placeholder="Ex: 31"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Descrição da cor</Label>
                            <Input 
                              value={newTemplateDesc} 
                              onChange={e => setNewTemplateDesc(e.target.value)}
                              placeholder="Ex: Roxo"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Grupo *</Label>
                            <Select value={newTemplateGroup || activeGroup} onValueChange={setNewTemplateGroup}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {colorGroups.map(g => (
                                  <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {editingTemplate ? (
                            <>
                              <Button onClick={handleUpdateTemplate}>Salvar Alterações</Button>
                              <Button variant="outline" onClick={() => { resetTemplateForm(); setShowNewTemplateForm(false); }}>Cancelar</Button>
                            </>
                          ) : (
                            <>
                              <Button onClick={handleAddTemplate}>
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar Cor
                              </Button>
                              <Button variant="outline" onClick={() => { resetTemplateForm(); setShowNewTemplateForm(false); }}>Cancelar</Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Lista de templates */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Cor</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead className="w-20">Código</TableHead>
                          <TableHead className="w-24">Hex</TableHead>
                          <TableHead className="w-24 text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeTemplates.map(template => (
                          <TableRow key={template.id}>
                            <TableCell>
                              <div 
                                className="w-8 h-8 rounded-full border-2 border-gray-200"
                                style={{ backgroundColor: template.color_hex }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{template.category_name}</TableCell>
                            <TableCell className="text-muted-foreground">{template.color_description}</TableCell>
                            <TableCell className="font-mono text-sm">{template.color_code}</TableCell>
                            <TableCell className="font-mono text-sm">{template.color_hex}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => startEditTemplate(template)} title="Editar">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleCloneTemplate(template)} className="text-blue-500 hover:text-blue-600" title="Clonar">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template)} className="text-red-500 hover:text-red-600" title="Excluir">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {activeTemplates.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        Nenhuma cor cadastrada neste grupo. Use o formulário acima para adicionar.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- COMPONENTE PRINCIPAL: INVENTORY ---
export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [copies, setCopies] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [libraryColors, setLibraryColors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [processFilter, setProcessFilter] = useState<string>("todos");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'tombo', direction: 'desc' });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isColorConfigOpen, setIsColorConfigOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<any>(null);
  const [selectedLibraryForColors, setSelectedLibraryForColors] = useState<string>("");

  const [formData, setFormData] = useState({
    book_id: "",
    library_id: "",
    status: "disponivel",
    code: "",
    cutter: "",
    tombo_manual: "",
    tombo_mode: "auto" as "auto" | "manual",
    process_stamped: false,
    process_indexed: false,
    process_taped: false,
    local_categories: [] as string[],
    origin: "indefinido" as "comprado" | "doado" | "indefinido"
  });

  // Estados para os Comboboxes
  const [openBookCombobox, setOpenBookCombobox] = useState(false);
  const [openLibraryCombobox, setOpenLibraryCombobox] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState("");
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [loadingCutter, setLoadingCutter] = useState(false);
  
  // Estado para copiar cores de outro livro
  const [openCopyColorsCombobox, setOpenCopyColorsCombobox] = useState(false);
  const [copyColorsSearchTerm, setCopyColorsSearchTerm] = useState("");

  // Estados para Modo Mobile
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [mobileFormData, setMobileFormData] = useState({
    book_id: "",
    status: "disponivel",
    code: "",
    cutter: "",
    tombo_mode: "auto" as "auto" | "manual",
    tombo_manual: "",
    process_stamped: true,
    process_indexed: true,
    process_taped: true,
    local_categories: [] as string[],
    origin: "doado" as "comprado" | "doado" | "indefinido"
  });
  const [mobileBookSearch, setMobileBookSearch] = useState("");
  const [mobileOpenBookPopover, setMobileOpenBookPopover] = useState(false);
  const [mobileSaving, setMobileSaving] = useState(false);
  const [booksForMobileCopyColors, setBooksForMobileCopyColors] = useState<any[]>([]);
  const [mobileCopyColorsSearch, setMobileCopyColorsSearch] = useState("");

  useEffect(() => {
    if (user) {
      fetchCopies();
      fetchBooksList();
      if (user.role === 'admin_rede') {
        fetchLibraries();
        fetchLibraryColors(); // Admin busca todas as cores
      } else {
        fetchLibraryColors();
      }
    }
  }, [user, isColorConfigOpen]);

  // Se for bibliotecário, definir automaticamente a biblioteca
  useEffect(() => {
    if (user?.role === 'bibliotecario' && user.library_id) {
      setFormData(prev => ({ ...prev, library_id: user.library_id || "" }));
      if (!selectedLibraryForColors) {
        setSelectedLibraryForColors(user.library_id);
      }
    }
  }, [user, selectedLibraryForColors]);

  const fetchLibraries = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('libraries')
        .select('id, name')
        .order('name');
      if (!error) setLibraries(data || []);
    } catch (error) {
      console.error('Erro ao carregar bibliotecas:', error);
    }
  };

  const fetchCopies = async () => {
    setLoading(true);
    let query = (supabase as any)
      .from('copies')
      .select('*, books(title, author, cover_url, cutter), libraries(name)')
      .order('tombo', { ascending: false });

    if (user?.role === 'bibliotecario' && user.library_id) {
      query = query.eq('library_id', user.library_id);
    }

    const { data, error } = await query;
    if (!error) setCopies(data || []);
    setLoading(false);
  };

  const fetchBooksList = async () => {
    const { data } = await (supabase as any).from('books').select('id, title, author, cutter, isbn').order('title');
    setBooks(data || []);
  };

  // Função para gerar Código Cutter usando tabela Cutter-Sanborn
  // Referência: https://www.tabelacutter.com/
  // Função para gerar Código Cutter usando tabela Cutter-Sanborn de 3 dígitos
  // Referência: https://www.tabelacutter.com/
  // Formato: [Primeira letra do sobrenome][Número 3 dígitos][Primeira letra do título]
  const generateCutter = (authorName: string, bookTitle?: string): string => {
    if (!authorName) return "";
    
    // Extrair sobrenome do autor (formato: "Nome Sobrenome" ou "Sobrenome, Nome")
    let surname = "";
    const parts = authorName.trim().split(/[\s,]+/).filter(p => p.length > 0);
    
    if (authorName.includes(',')) {
      // Formato "Sobrenome, Nome" - pegar primeiro elemento
      surname = parts[0].toUpperCase();
    } else {
      // Formato "Nome Sobrenome" - pegar último elemento
      surname = parts[parts.length - 1].toUpperCase();
    }
    
    // Se o nome termina com sufixos, pegar o penúltimo
    const suffixes = ['JR', 'JR.', 'FILHO', 'NETO', 'SOBRINHO', 'JUNIOR', 'II', 'III', 'IV'];
    if (suffixes.includes(surname) && parts.length > 1) {
      surname = parts[parts.length - 2].toUpperCase();
    }
    
    // Remover acentos e caracteres especiais
    surname = surname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '');
    
    if (!surname) return "";
    
    // Tabela Cutter-Sanborn oficial de 3 dígitos
    // Fonte: https://www.tabelacutter.com/
    const cutterSanborn: Record<string, [string, number][]> = {
      'A': [
        ['A', 100], ['Ab', 117], ['Ac', 127], ['Ad', 134], ['Ae', 146], ['Af', 148], ['Ag', 154], 
        ['Ah', 159], ['Ai', 161], ['Aj', 165], ['Ak', 168], ['Al', 176], ['Alm', 186], ['Alo', 190],
        ['Als', 195], ['Alt', 198], ['Am', 199], ['An', 227], ['And', 235], ['Ang', 244], ['Ant', 267],
        ['Ap', 275], ['Ar', 287], ['Arm', 312], ['Arn', 318], ['Aro', 323], ['Ars', 329], ['Art', 333],
        ['As', 351], ['Ash', 358], ['At', 373], ['Au', 386], ['Av', 418], ['Aw', 422], ['Ax', 425],
        ['Ay', 428], ['Az', 444]
      ],
      'B': [
        ['B', 100], ['Ba', 111], ['Bai', 125], ['Bal', 139], ['Ban', 155], ['Bar', 177], ['Bas', 199],
        ['Bat', 217], ['Bau', 221], ['Be', 261], ['Bea', 266], ['Bec', 284], ['Bei', 306], ['Bel', 316],
        ['Ben', 333], ['Ber', 362], ['Bi', 432], ['Bl', 474], ['Bo', 533], ['Bol', 559], ['Bon', 571],
        ['Bor', 585], ['Bos', 598], ['Bot', 609], ['Bou', 613], ['Bow', 638], ['Boy', 658], ['Br', 667],
        ['Bra', 679], ['Bre', 697], ['Bri', 715], ['Bro', 741], ['Bru', 782], ['Bu', 822], ['Bur', 863],
        ['Bus', 875], ['But', 882], ['By', 916]
      ],
      'C': [
        ['C', 100], ['Ca', 116], ['Cal', 134], ['Cam', 148], ['Can', 159], ['Cap', 176], ['Car', 197],
        ['Cas', 218], ['Cat', 233], ['Ce', 266], ['Ch', 310], ['Cha', 318], ['Che', 337], ['Chi', 353],
        ['Cho', 367], ['Chr', 379], ['Ci', 393], ['Cl', 425], ['Cla', 434], ['Cle', 449], ['Cli', 459],
        ['Co', 485], ['Coe', 495], ['Col', 518], ['Com', 546], ['Con', 557], ['Coo', 582], ['Cop', 596],
        ['Cor', 616], ['Cos', 651], ['Cot', 663], ['Cou', 672], ['Cow', 689], ['Cox', 697], ['Cr', 712],
        ['Cra', 718], ['Cre', 734], ['Cri', 749], ['Cro', 765], ['Cru', 789], ['Cu', 821], ['Cun', 854],
        ['Cur', 866]
      ],
      'D': [
        ['D', 100], ['Da', 118], ['Dal', 139], ['Dam', 149], ['Dan', 159], ['Dar', 176], ['Das', 189],
        ['Dat', 193], ['Dav', 197], ['De', 223], ['Dea', 226], ['Del', 245], ['Dem', 258], ['Den', 265],
        ['Der', 275], ['Des', 289], ['Dev', 298], ['Di', 331], ['Dia', 333], ['Dic', 343], ['Die', 356],
        ['Dim', 368], ['Do', 423], ['Dob', 427], ['Doc', 431], ['Dod', 435], ['Dol', 458], ['Dom', 469],
        ['Don', 481], ['Doo', 499], ['Dor', 511], ['Dos', 523], ['Dou', 529], ['Dow', 545], ['Dr', 573],
        ['Du', 618], ['Dub', 622], ['Duc', 633], ['Dud', 642], ['Duf', 657], ['Dun', 692], ['Dup', 716],
        ['Dur', 726], ['Dut', 741], ['Dy', 787]
      ],
      'E': [
        ['E', 100], ['Ea', 117], ['Eb', 137], ['Ed', 184], ['Edw', 215], ['Ef', 257], ['Eg', 266],
        ['Ei', 278], ['El', 296], ['Eli', 314], ['Ell', 328], ['Em', 376], ['En', 429], ['Ep', 464],
        ['Er', 492], ['Es', 545], ['Est', 556], ['Et', 568], ['Eu', 582], ['Ev', 617], ['Ew', 637],
        ['Ex', 652], ['Ey', 656]
      ],
      'F': [
        ['F', 100], ['Fa', 118], ['Fai', 132], ['Fal', 146], ['Fan', 159], ['Far', 173], ['Fas', 187],
        ['Fat', 192], ['Fau', 197], ['Fe', 235], ['Fei', 271], ['Fel', 284], ['Fen', 295], ['Fer', 312],
        ['Fes', 333], ['Fi', 374], ['Fie', 381], ['Fil', 397], ['Fin', 415], ['Fis', 438], ['Fit', 449],
        ['Fl', 487], ['Fle', 513], ['Fli', 521], ['Flo', 537], ['Fo', 573], ['Fon', 587], ['For', 619],
        ['Fos', 649], ['Fou', 658], ['Fox', 664], ['Fr', 688], ['Fra', 698], ['Fre', 729], ['Fri', 757],
        ['Fro', 775], ['Fu', 828], ['Ful', 853], ['Fun', 866], ['Fur', 876]
      ],
      'G': [
        ['G', 100], ['Ga', 118], ['Gal', 144], ['Gam', 159], ['Gar', 191], ['Gas', 214], ['Gat', 224],
        ['Ge', 255], ['Gel', 273], ['Geo', 285], ['Ger', 298], ['Gi', 338], ['Gib', 347], ['Gil', 369],
        ['Gir', 398], ['Gl', 433], ['Go', 488], ['God', 497], ['Gol', 518], ['Gom', 528], ['Gon', 537],
        ['Goo', 552], ['Gor', 571], ['Gos', 585], ['Got', 591], ['Gou', 596], ['Gr', 638], ['Gra', 656],
        ['Gre', 693], ['Gri', 729], ['Gro', 759], ['Gru', 783], ['Gu', 824], ['Gue', 844], ['Gui', 859],
        ['Gun', 877], ['Gur', 891], ['Gut', 897]
      ],
      'H': [
        ['H', 100], ['Ha', 118], ['Hag', 127], ['Hai', 141], ['Hal', 158], ['Ham', 183], ['Han', 213],
        ['Har', 248], ['Has', 287], ['Hat', 299], ['Hau', 316], ['Haw', 326], ['Hay', 347], ['He', 386],
        ['Hea', 393], ['Hec', 406], ['Hef', 417], ['Hei', 425], ['Hel', 445], ['Hem', 464], ['Hen', 478],
        ['Her', 515], ['Hes', 542], ['Hi', 584], ['Hig', 596], ['Hil', 625], ['Hin', 658], ['Ho', 694],
        ['Hob', 699], ['Hod', 711], ['Hof', 728], ['Hog', 739], ['Hol', 756], ['Hom', 779], ['Hon', 784],
        ['Hoo', 796], ['Hop', 812], ['Hor', 831], ['Hos', 848], ['Hot', 859], ['Hou', 863], ['How', 879],
        ['Hu', 924], ['Hub', 927], ['Hud', 935], ['Hue', 941], ['Hug', 953], ['Hum', 977], ['Hun', 985],
        ['Hur', 991], ['Hut', 994], ['Hy', 997]
      ],
      'I': [
        ['I', 100], ['Ia', 125], ['Ib', 137], ['Id', 182], ['If', 249], ['Ig', 274], ['Il', 348],
        ['Im', 397], ['In', 448], ['Io', 577], ['Ir', 648], ['Is', 742], ['It', 786], ['Iv', 879],
        ['Iw', 914], ['Ix', 949], ['Iy', 974], ['Iz', 987]
      ],
      'J': [
        ['J', 100], ['Ja', 118], ['Jac', 125], ['Jaf', 146], ['Jam', 176], ['Jan', 195], ['Jar', 227],
        ['Je', 286], ['Jef', 294], ['Jen', 325], ['Jer', 358], ['Ji', 417], ['Jo', 486], ['Job', 492],
        ['Joh', 536], ['Jon', 618], ['Jor', 658], ['Jos', 682], ['Joy', 747], ['Ju', 788], ['Jun', 845],
        ['Jur', 866]
      ],
      'K': [
        ['K', 100], ['Ka', 118], ['Kaf', 126], ['Kam', 148], ['Kan', 157], ['Kap', 175], ['Kar', 196],
        ['Kat', 224], ['Kau', 234], ['Ke', 268], ['Kea', 272], ['Kee', 289], ['Kel', 318], ['Kem', 338],
        ['Ken', 349], ['Ker', 375], ['Ki', 424], ['Kie', 435], ['Kil', 455], ['Kim', 476], ['Kin', 489],
        ['Kir', 523], ['Kit', 546], ['Kl', 575], ['Kn', 637], ['Ko', 687], ['Kob', 695], ['Koc', 712],
        ['Koe', 725], ['Koh', 748], ['Kol', 768], ['Kom', 777], ['Kon', 786], ['Koo', 793], ['Kor', 816],
        ['Kos', 839], ['Kr', 867], ['Kra', 879], ['Kre', 893], ['Kri', 908], ['Kro', 922], ['Kru', 944],
        ['Ku', 958], ['Kun', 972], ['Kur', 982], ['Kus', 986]
      ],
      'L': [
        ['L', 100], ['La', 116], ['Lab', 122], ['Lac', 128], ['Laf', 155], ['Lag', 165], ['Lai', 175],
        ['Lam', 196], ['Lan', 224], ['Lar', 264], ['Las', 277], ['Lat', 285], ['Lau', 294], ['Lav', 316],
        ['Law', 327], ['Le', 362], ['Lea', 367], ['Leb', 378], ['Lee', 396], ['Leg', 414], ['Lei', 423],
        ['Lem', 448], ['Leo', 473], ['Les', 486], ['Lev', 516], ['Lew', 535], ['Li', 568], ['Lib', 576],
        ['Lie', 592], ['Lim', 618], ['Lin', 637], ['Lip', 672], ['Lis', 686], ['Lit', 693], ['Liu', 717],
        ['Lo', 738], ['Lob', 744], ['Loc', 755], ['Lof', 768], ['Log', 778], ['Lom', 797], ['Lon', 817],
        ['Loo', 827], ['Lop', 852], ['Lor', 864], ['Lou', 877], ['Lov', 888], ['Low', 894], ['Lu', 912],
        ['Lub', 916], ['Luc', 922], ['Lud', 934], ['Lui', 948], ['Lun', 962], ['Lut', 976], ['Ly', 991]
      ],
      'M': [
        ['M', 100], ['Ma', 114], ['Mac', 127], ['Mad', 145], ['Mag', 162], ['Mah', 173], ['Mai', 184],
        ['Mal', 212], ['Man', 235], ['Map', 265], ['Mar', 276], ['Marq', 357], ['Mas', 389], ['Mat', 414],
        ['Mau', 434], ['Max', 447], ['May', 456], ['Mc', 485], ['Me', 531], ['Mea', 536], ['Med', 554],
        ['Mei', 568], ['Mel', 588], ['Men', 612], ['Mer', 638], ['Mes', 661], ['Met', 674], ['Mey', 686],
        ['Mi', 713], ['Mic', 724], ['Mil', 755], ['Min', 789], ['Mir', 814], ['Mit', 838], ['Mo', 868],
        ['Moe', 876], ['Mol', 896], ['Mon', 916], ['Moo', 934], ['Mor', 948], ['Mos', 963], ['Mot', 975],
        ['Mou', 979], ['Moy', 986], ['Mu', 988], ['Mue', 929], ['Muh', 937], ['Mul', 952], ['Mun', 967],
        ['Mur', 977], ['Mus', 986], ['My', 994]
      ],
      'N': [
        ['N', 100], ['Na', 117], ['Nag', 124], ['Nak', 145], ['Nan', 159], ['Nap', 176], ['Nas', 196],
        ['Nat', 218], ['Ne', 282], ['Nea', 286], ['Nee', 313], ['Nel', 337], ['Ner', 357], ['Neu', 382],
        ['New', 418], ['Ni', 468], ['Nic', 487], ['Nie', 522], ['Nil', 566], ['Nis', 618], ['Nit', 641],
        ['No', 673], ['Nob', 682], ['Noe', 692], ['Nol', 717], ['Nor', 755], ['Not', 778], ['Nov', 789],
        ['Nu', 849], ['Nun', 878], ['Nut', 916], ['Ny', 954]
      ],
      'O': [
        ['O', 100], ['Oa', 125], ['Ob', 142], ['Oc', 159], ['Od', 178], ['Of', 219], ['Og', 263],
        ['Oh', 284], ['Ok', 326], ['Ol', 382], ['Oli', 418], ['Olm', 439], ['Ols', 467], ['Om', 498],
        ['On', 545], ['Op', 584], ['Or', 635], ['Ori', 668], ['Orn', 698], ['Ort', 724], ['Os', 765],
        ['Osb', 778], ['Osg', 789], ['Ost', 815], ['Ot', 848], ['Ou', 872], ['Ov', 894], ['Ow', 924],
        ['Ox', 964], ['Oy', 978]
      ],
      'P': [
        ['P', 100], ['Pa', 116], ['Pac', 124], ['Pad', 132], ['Pag', 145], ['Pai', 157], ['Pal', 178],
        ['Pan', 197], ['Pap', 217], ['Par', 237], ['Pas', 287], ['Pat', 312], ['Pau', 332], ['Pav', 354],
        ['Pay', 367], ['Pe', 396], ['Pea', 399], ['Pec', 413], ['Ped', 426], ['Pee', 434], ['Pel', 464],
        ['Pen', 489], ['Per', 523], ['Pes', 558], ['Pet', 577], ['Ph', 614], ['Phi', 634], ['Pi', 684],
        ['Pic', 698], ['Pie', 723], ['Pil', 746], ['Pin', 768], ['Pir', 798], ['Pit', 813], ['Pl', 842],
        ['Po', 868], ['Pod', 876], ['Poe', 885], ['Poh', 892], ['Poi', 896], ['Pol', 925], ['Pom', 937],
        ['Pon', 946], ['Poo', 953], ['Pop', 959], ['Por', 967], ['Pos', 978], ['Pot', 982], ['Pou', 986],
        ['Pow', 989], ['Pr', 992], ['Pre', 994], ['Pri', 996], ['Pro', 997], ['Pru', 998], ['Pu', 999]
      ],
      'Q': [
        ['Q', 100], ['Qa', 117], ['Qu', 254], ['Que', 378], ['Qui', 515]
      ],
      'R': [
        ['R', 100], ['Ra', 117], ['Rab', 124], ['Rad', 137], ['Raf', 156], ['Rag', 168], ['Rai', 182],
        ['Ram', 198], ['Ran', 224], ['Rap', 247], ['Ras', 256], ['Rat', 268], ['Rau', 279], ['Raw', 292],
        ['Ray', 318], ['Re', 349], ['Rea', 352], ['Rec', 367], ['Red', 386], ['Ree', 395], ['Reg', 417],
        ['Rei', 434], ['Rem', 468], ['Ren', 489], ['Rep', 516], ['Rev', 534], ['Rey', 556], ['Rh', 575],
        ['Ri', 613], ['Rib', 627], ['Ric', 648], ['Rid', 675], ['Rie', 698], ['Rig', 723], ['Ril', 749],
        ['Rin', 768], ['Rio', 785], ['Ris', 798], ['Rit', 815], ['Riv', 828], ['Ro', 858], ['Rob', 865],
        ['Roc', 878], ['Rod', 892], ['Roe', 896], ['Rog', 917], ['Roh', 928], ['Rol', 938], ['Rom', 956],
        ['Ron', 968], ['Roo', 975], ['Ros', 984], ['Rot', 988], ['Rou', 991], ['Row', 994], ['Roy', 996],
        ['Ru', 997], ['Rub', 998], ['Rud', 999]
      ],
      'S': [
        ['S', 100], ['Sa', 114], ['Sab', 118], ['Sac', 124], ['Sad', 132], ['Sae', 138], ['Saf', 145],
        ['Sag', 155], ['Sai', 165], ['Sal', 184], ['Sam', 215], ['San', 224], ['Sao', 256], ['Sap', 268],
        ['Sar', 284], ['Sas', 296], ['Sat', 318], ['Sau', 332], ['Sav', 347], ['Saw', 368], ['Say', 376],
        ['Sc', 395], ['Sch', 418], ['Sci', 474], ['Sco', 486], ['Se', 518], ['Sea', 522], ['Seb', 532],
        ['Sec', 545], ['See', 554], ['Seg', 568], ['Sei', 582], ['Sel', 598], ['Sem', 618], ['Sen', 637],
        ['Ser', 658], ['Set', 678], ['Sev', 695], ['Sew', 717], ['Sh', 728], ['Sha', 736], ['She', 768],
        ['Shi', 798], ['Sho', 824], ['Shu', 847], ['Si', 868], ['Sib', 874], ['Sid', 885], ['Sie', 898],
        ['Sig', 917], ['Sil', 928], ['Sim', 948], ['Sin', 965], ['Sip', 972], ['Sir', 978], ['Sis', 982],
        ['Sk', 985], ['Sl', 987], ['Sm', 989], ['Smi', 991], ['Sn', 993], ['So', 994], ['Sob', 9941],
        ['Soc', 9943], ['Sod', 9946], ['Sol', 9948], ['Som', 9951], ['Son', 9953], ['Soo', 9955],
        ['Sor', 9958], ['Sot', 9962], ['Sou', 9965], ['Sov', 9967], ['Sp', 9968], ['Spa', 9972],
        ['Spe', 9976], ['Spi', 9979], ['Spo', 9982], ['Spr', 9985], ['Sq', 9988], ['St', 9989],
        ['Sta', 9991], ['Ste', 9993], ['Sti', 9995], ['Sto', 9996], ['Str', 9997], ['Stu', 9998],
        ['Su', 9999]
      ],
      'T': [
        ['T', 100], ['Ta', 117], ['Tab', 122], ['Tac', 128], ['Taf', 145], ['Tag', 158], ['Tai', 168],
        ['Tak', 178], ['Tal', 192], ['Tam', 218], ['Tan', 234], ['Tap', 256], ['Tar', 278], ['Tas', 296],
        ['Tat', 312], ['Tau', 326], ['Tav', 345], ['Tay', 368], ['Te', 395], ['Tea', 398], ['Tec', 418],
        ['Tei', 438], ['Tel', 456], ['Tem', 478], ['Ten', 498], ['Ter', 528], ['Tes', 556], ['Th', 585],
        ['Tha', 598], ['The', 624], ['Thi', 658], ['Tho', 686], ['Thu', 728], ['Ti', 768], ['Tie', 778],
        ['Til', 798], ['Tim', 818], ['Tin', 838], ['Tit', 858], ['To', 875], ['Tob', 878], ['Tod', 886],
        ['Tol', 914], ['Tom', 928], ['Ton', 945], ['Too', 956], ['Top', 968], ['Tor', 978], ['Tos', 986],
        ['Tot', 989], ['Tou', 991], ['Tow', 993], ['Tr', 995], ['Tra', 996], ['Tre', 997], ['Tri', 998],
        ['Tro', 998], ['Tru', 999], ['Ts', 999], ['Tu', 999], ['Tub', 999], ['Tuc', 999], ['Tul', 999],
        ['Tun', 999], ['Tur', 999], ['Tut', 999], ['Tw', 999], ['Ty', 999]
      ],
      'U': [
        ['U', 100], ['Ua', 125], ['Ub', 145], ['Ud', 178], ['Ue', 215], ['Ug', 268], ['Uh', 316],
        ['Ul', 434], ['Ulm', 454], ['Uls', 476], ['Um', 518], ['Un', 576], ['Und', 595], ['Ung', 618],
        ['Uni', 648], ['Up', 698], ['Ur', 768], ['Urb', 785], ['Uri', 815], ['Us', 868], ['Ut', 925],
        ['Uz', 978]
      ],
      'V': [
        ['V', 100], ['Va', 117], ['Vac', 126], ['Vad', 138], ['Vag', 156], ['Vai', 168], ['Val', 186],
        ['Van', 228], ['Var', 276], ['Vas', 298], ['Vau', 324], ['Ve', 378], ['Vea', 386], ['Vec', 418],
        ['Vel', 438], ['Ven', 468], ['Ver', 496], ['Ves', 528], ['Vi', 568], ['Vic', 585], ['Vid', 618],
        ['Vie', 648], ['Vil', 686], ['Vin', 718], ['Vio', 748], ['Vir', 782], ['Vis', 815], ['Vit', 848],
        ['Viv', 878], ['Vo', 914], ['Vog', 928], ['Vol', 948], ['Von', 968], ['Vor', 982], ['Vos', 989],
        ['Vu', 994]
      ],
      'W': [
        ['W', 100], ['Wa', 117], ['Wab', 124], ['Wac', 134], ['Wad', 145], ['Wag', 168], ['Wah', 178],
        ['Wai', 186], ['Wal', 218], ['Wam', 248], ['Wan', 268], ['War', 298], ['Was', 334], ['Wat', 358],
        ['Wau', 376], ['Way', 398], ['We', 436], ['Wea', 445], ['Web', 468], ['Wed', 486], ['Wee', 498],
        ['Wei', 528], ['Wel', 558], ['Wen', 578], ['Wer', 598], ['Wes', 628], ['Wet', 656], ['Wh', 686],
        ['Wha', 698], ['Whe', 718], ['Whi', 748], ['Who', 778], ['Wi', 818], ['Wic', 828], ['Wid', 848],
        ['Wie', 868], ['Wig', 886], ['Wil', 908], ['Win', 948], ['Wis', 968], ['Wit', 982], ['Wo', 992],
        ['Wob', 993], ['Woe', 994], ['Wol', 995], ['Won', 996], ['Woo', 997], ['Wor', 998], ['Wot', 998],
        ['Wr', 999], ['Wri', 999], ['Wu', 999], ['Wy', 999]
      ],
      'X': [
        ['X', 100], ['Xa', 178], ['Xe', 298], ['Xi', 468], ['Xo', 678], ['Xu', 878]
      ],
      'Y': [
        ['Y', 100], ['Ya', 125], ['Yam', 148], ['Yan', 178], ['Yar', 218], ['Ye', 298], ['Yea', 318],
        ['Yel', 368], ['Yen', 418], ['Yo', 578], ['Yok', 598], ['Yon', 648], ['Yor', 698], ['You', 748],
        ['Yu', 878], ['Yun', 948]
      ],
      'Z': [
        ['Z', 100], ['Za', 125], ['Zab', 138], ['Zac', 158], ['Zah', 198], ['Zam', 248], ['Zan', 288],
        ['Zap', 328], ['Zar', 378], ['Ze', 448], ['Zea', 468], ['Zeb', 498], ['Zei', 548], ['Zel', 598],
        ['Zem', 648], ['Zen', 698], ['Zer', 748], ['Zi', 818], ['Zid', 838], ['Zie', 858], ['Zim', 898],
        ['Zin', 938], ['Zir', 968], ['Zo', 985], ['Zob', 987], ['Zol', 989], ['Zon', 991], ['Zoo', 993],
        ['Zor', 995], ['Zu', 997], ['Zuc', 998], ['Zum', 998], ['Zun', 999], ['Zur', 999], ['Zw', 999],
        ['Zy', 999]
      ]
    };
    
    const firstLetter = surname.charAt(0);
    
    // Buscar número na tabela
    let number = 100; // Valor padrão
    const table = cutterSanborn[firstLetter];
    
    if (table) {
      for (let i = table.length - 1; i >= 0; i--) {
        const [prefix, num] = table[i];
        if (surname.toUpperCase() >= prefix.toUpperCase()) {
          number = num;
          break;
        }
      }
    }
    
    // Pegar primeira letra do título (complemento) - desconsiderar artigos
    let titleLetter = '';
    if (bookTitle) {
      // Remover artigos iniciais
      const cleanTitle = bookTitle
        .replace(/^(o|a|os|as|um|uma|uns|umas|the|an|a)\s+/i, '')
        .trim();
      titleLetter = cleanTitle.charAt(0).toLowerCase();
    }
    
    return `${firstLetter}${number}${titleLetter}`;
  };

  // Função para buscar/gerar Cutter ao selecionar um livro
  const handleBookSelect = async (bookId: string) => {
    const selectedBook = books.find(b => b.id === bookId);
    if (!selectedBook) return;
    
    setLoadingCutter(true);
    
    // Se o livro já tem Cutter, usar ele
    let cutter = selectedBook.cutter || "";
    
    // Se não tem, gerar automaticamente usando título
    if (!cutter && selectedBook.author) {
      cutter = generateCutter(selectedBook.author, selectedBook.title);
    }
    
    // Determinar a biblioteca atual
    const currentLibraryId = user?.role === 'bibliotecario' 
      ? user.library_id 
      : formData.library_id;
    
    // Verificar se já existe um exemplar deste livro na mesma biblioteca
    let colorsFromExisting: string[] = [];
    if (currentLibraryId) {
      const existingCopy = copies.find(
        c => c.book_id === bookId && c.library_id === currentLibraryId
      );
      if (existingCopy && existingCopy.local_categories && existingCopy.local_categories.length > 0) {
        colorsFromExisting = existingCopy.local_categories;
        toast({ 
          title: "Cores copiadas", 
          description: `Cores copiadas de exemplar existente: ${colorsFromExisting.join(", ")}`,
          duration: 3000
        });
      }
    }
    
    setFormData(prev => ({
      ...prev,
      book_id: bookId,
      cutter: cutter,
      // Preencher código de barras automaticamente com ISBN
      code: selectedBook.isbn || prev.code,
      // Preencher cores de exemplar existente (se houver)
      local_categories: colorsFromExisting.length > 0 ? colorsFromExisting : prev.local_categories
    }));
    
    setOpenBookCombobox(false);
    setLoadingCutter(false);
  };

  const fetchLibraryColors = async () => {
    if (user?.role === 'admin_rede') {
      // Admin busca TODAS as cores de todas as bibliotecas
      const { data } = await (supabase as any)
        .from('library_colors')
        .select('*')
        .order('library_id, category_name');
      setLibraryColors(data || []);
    } else if (user?.library_id) {
      // Bibliotecário busca apenas as cores da sua biblioteca
      const { data } = await (supabase as any)
        .from('library_colors')
        .select('*')
        .eq('library_id', user.library_id);
      setLibraryColors(data || []);
    }
  };

  const handleSave = async () => {
    if (!formData.book_id) {
      return toast({ title: "Erro", description: "Selecione a Obra", variant: "destructive" });
    }

    // CORREÇÃO CRÍTICA: Validar library_id
    let libraryId: string | null = null;
    
    if (user?.role === 'bibliotecario' && user.library_id) {
      libraryId = user.library_id;
    } else if (user?.role === 'admin_rede') {
      libraryId = formData.library_id || null;
      if (!libraryId) {
        return toast({ 
          title: "Erro", 
          description: "Selecione a Biblioteca de Destino", 
          variant: "destructive" 
        });
      }
    } else {
      libraryId = editingCopy?.library_id || null;
    }

    if (!libraryId) {
      return toast({ 
        title: "Erro", 
        description: "Biblioteca não identificada", 
        variant: "destructive" 
      });
    }

    // Preparar payload base
    const payload: any = {
      book_id: formData.book_id,
      library_id: libraryId,
      status: formData.status,
      code: formData.code || null, // Código de barras opcional
      process_stamped: formData.process_stamped,
      process_indexed: formData.process_indexed,
      process_taped: formData.process_taped,
      local_categories: formData.local_categories,
      origin: formData.origin || 'doado'
    };
    
    // Tratamento do tombo
    if (editingCopy) {
      // Ao editar: incluir o tombo alterado (se foi modificado)
      if (formData.tombo_manual && formData.tombo_manual.trim()) {
        payload.tombo = formData.tombo_manual.trim().toUpperCase();
      }
    } else if (formData.tombo_mode === 'manual' && formData.tombo_manual) {
      // Novo item com tombo manual: usar exatamente o que foi digitado (sem adicionar prefixo B)
      payload.tombo = formData.tombo_manual.trim().toUpperCase();
    } else if (formData.tombo_mode === 'auto') {
      // Novo item com tombo automático: gerar B1, B2, B3...
      // Busca apenas tombos que começam com B (ignora tombos do sistema antigo)
      try {
        const { data: copiesWithB } = await (supabase as any)
          .from('copies')
          .select('tombo')
          .like('tombo', 'B%')
          .order('tombo', { ascending: false });
        
        let nextNumber = 1;
        if (copiesWithB && copiesWithB.length > 0) {
          // Encontrar o maior número entre os tombos B
          for (const copy of copiesWithB) {
            if (copy.tombo && copy.tombo.startsWith('B')) {
              const numStr = copy.tombo.replace('B', '');
              const num = parseInt(numStr) || 0;
              if (num >= nextNumber) {
                nextNumber = num + 1;
              }
            }
          }
        }
        
        payload.tombo = `B${nextNumber}`;
      } catch (e) {
        // Se não encontrar nenhum com B, começar do 1
        payload.tombo = 'B1';
      }
    }

    let error;
    if (editingCopy) {
      const { error: err } = await (supabase as any)
        .from('copies')
        .update(payload)
        .eq('id', editingCopy.id);
      error = err;
    } else {
      const { error: err } = await (supabase as any)
        .from('copies')
        .insert(payload);
      error = err;
    }

    // Atualizar Cutter na tabela books se foi alterado
    if (!error && formData.cutter.trim() && formData.book_id) {
      const currentBook = books.find(b => b.id === formData.book_id);
      const currentCutter = (currentBook as any)?.cutter || '';
      
      // Só atualiza se o cutter foi alterado
      if (formData.cutter.trim() !== currentCutter) {
        const { error: cutterError } = await (supabase as any)
          .from('books')
          .update({ cutter: formData.cutter.trim() })
          .eq('id', formData.book_id);
        
        if (cutterError) {
          console.error('Erro ao atualizar cutter:', cutterError);
          // Não bloqueia o salvamento se o cutter falhar
        }
      }
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      // Atualizar cores em TODOS os exemplares do mesmo livro na mesma biblioteca
      if (formData.local_categories && formData.local_categories.length > 0) {
        // Contar quantos outros exemplares existem ANTES de atualizar
        const otherCopiesCount = copies.filter(
          c => c.book_id === formData.book_id && 
               c.library_id === libraryId && 
               c.id !== editingCopy?.id
        ).length;
        
        // Atualizar TODOS os exemplares do mesmo livro na mesma biblioteca (incluindo o recém-criado)
        const { error: colorSyncError } = await (supabase as any)
          .from('copies')
          .update({ local_categories: formData.local_categories })
          .eq('book_id', formData.book_id)
          .eq('library_id', libraryId);
        
        if (!colorSyncError && otherCopiesCount > 0) {
          toast({ 
            title: "Cores sincronizadas", 
            description: `As cores foram atualizadas em ${otherCopiesCount} outro(s) exemplar(es) do mesmo livro.`,
            duration: 4000
          });
        }
      }
      
      toast({ title: "Salvo", description: editingCopy ? "Item atualizado." : "Item cadastrado." });
      setIsEditOpen(false);
      fetchCopies();
      fetchBooksList(); // Recarregar lista de livros para atualizar cutter
    }
  };

  const toggleProcess = async (copyId: string, field: string, currentValue: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('copies')
        .update({ [field]: !currentValue })
        .eq('id', copyId);

      if (error) throw error;

      toast({ 
        title: "Atualizado", 
        description: "Status de processamento alterado.",
        duration: 2000
      });
      
      fetchCopies();
    } catch (error: any) {
      console.error('Erro ao atualizar processamento:', error);
      toast({ 
        title: "Erro", 
        description: error?.message || "Não foi possível atualizar.", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Esta ação remove o item do tombo.")) return;
    const { error } = await (supabase as any).from('copies').delete().eq('id', id);
    if (!error) {
      toast({ title: "Excluído", description: "Item removido." });
      fetchCopies();
    } else {
      toast({ title: "Erro ao excluir", description: "Verifique se há empréstimos vinculados.", variant: "destructive" });
    }
  };

  // Função para marcar/desmarcar todos os itens do checklist
  const toggleAllProcessing = (markAll: boolean) => {
    setFormData(prev => ({
      ...prev,
      process_stamped: markAll,
      process_indexed: markAll,
      process_taped: markAll
    }));
  };

  // Função para copiar cores de outro exemplar
  const copyColorsFromCopy = (copyId: string) => {
    const sourceCopy = copies.find(c => c.id === copyId);
    if (sourceCopy && sourceCopy.local_categories) {
      setFormData(prev => ({
        ...prev,
        local_categories: [...sourceCopy.local_categories]
      }));
      toast({ title: "Cores copiadas", description: `Categorias copiadas de "${sourceCopy.books?.title || 'exemplar'}"` });
    }
    setOpenCopyColorsCombobox(false);
    setCopyColorsSearchTerm("");
  };

  const openEdit = (copy: any) => {
    setEditingCopy(copy);
    setFormData({
      book_id: copy.book_id || "",
      library_id: copy.library_id || "",
      status: copy.status || "disponivel",
      code: copy.code || "",
      cutter: copy.books?.cutter || "",
      tombo_manual: copy.tombo || "",
      tombo_mode: "manual", // Ao editar, sempre modo manual para permitir alteração
      process_stamped: copy.process_stamped || false,
      process_indexed: copy.process_indexed || false,
      process_taped: copy.process_taped || false,
      local_categories: copy.local_categories || [],
      origin: copy.origin || "doado"
    });
    setBookSearchTerm("");
    setLibrarySearchTerm("");
    setIsEditOpen(true);
    
    // Para admin_rede, as cores já estão carregadas (todas)
    // Para bibliotecário, carregar cores se necessário
    if (user?.role === 'bibliotecario' && copy.library_id) {
      setSelectedLibraryForColors(copy.library_id);
      setTimeout(() => {
        fetchLibraryColors();
      }, 100);
    } else if (user?.role === 'admin_rede' && copy.library_id) {
      // Admin já tem todas as cores, apenas definir a biblioteca selecionada para o modal de cores
      setSelectedLibraryForColors(copy.library_id);
    }
  };

  const openNew = () => {
    setEditingCopy(null);
    setFormData({
      book_id: "",
      library_id: user?.role === 'bibliotecario' ? (user.library_id || "") : "",
      status: "disponivel",
      code: "",
      cutter: "",
      tombo_manual: "",
      tombo_mode: "auto",
      process_stamped: false,
      process_indexed: false,
      process_taped: false,
      local_categories: [],
      origin: "indefinido"
    });
    setBookSearchTerm("");
    setLibrarySearchTerm("");
    setIsEditOpen(true);
  };

  const toggleCategory = (catName: string) => {
    const current = formData.local_categories || [];
    if (current.includes(catName)) {
      setFormData({ ...formData, local_categories: current.filter(c => c !== catName) });
    } else {
      if (current.length >= 3) {
        toast({ title: "Limite", description: "Máximo de 3 cores.", variant: "destructive" });
        return;
      }
      setFormData({ ...formData, local_categories: [...current, catName] });
    }
  };

  // ============ FUNÇÕES DO MODO MOBILE ============
  const resetMobileForm = () => {
    setMobileFormData({
      book_id: "",
      status: "disponivel",
      code: "",
      cutter: "",
      tombo_mode: "auto",
      tombo_manual: "",
      process_stamped: true,
      process_indexed: true,
      process_taped: true,
      local_categories: [],
      origin: "doado"
    });
    setMobileBookSearch("");
  };

  const closeMobileMode = () => {
    setIsMobileMode(false);
    resetMobileForm();
  };

  const toggleMobileCategory = (catName: string) => {
    const current = mobileFormData.local_categories || [];
    if (current.includes(catName)) {
      setMobileFormData({ ...mobileFormData, local_categories: current.filter(c => c !== catName) });
    } else {
      if (current.length >= 3) {
        toast({ title: "Limite", description: "Máximo de 3 cores.", variant: "destructive" });
        return;
      }
      setMobileFormData({ ...mobileFormData, local_categories: [...current, catName] });
    }
  };

  const handleMobileBookSelect = async (bookId: string) => {
    const selectedBook = books.find(b => b.id === bookId);
    if (!selectedBook) return;
    
    // Se o livro já tem Cutter, usar ele
    let cutter = selectedBook.cutter || "";
    
    // Se não tem, gerar automaticamente usando título
    if (!cutter && selectedBook.author) {
      cutter = generateCutter(selectedBook.author, selectedBook.title);
    }
    
    // Verificar se já existe um exemplar deste livro na biblioteca do usuário
    let colorsFromExisting: string[] = [];
    if (user?.library_id) {
      const existingCopy = copies.find(
        c => c.book_id === bookId && c.library_id === user.library_id
      );
      if (existingCopy && existingCopy.local_categories && existingCopy.local_categories.length > 0) {
        colorsFromExisting = existingCopy.local_categories;
        toast({ 
          title: "Cores copiadas", 
          description: `Cores copiadas de exemplar existente: ${colorsFromExisting.join(", ")}`,
          duration: 3000
        });
      }
    }

    setMobileFormData(prev => ({
      ...prev,
      book_id: bookId,
      cutter: cutter,
      code: selectedBook.isbn || prev.code,
      local_categories: colorsFromExisting.length > 0 ? colorsFromExisting : prev.local_categories
    }));
    
    setMobileOpenBookPopover(false);
  };

  const handleMobileSave = async () => {
    if (!mobileFormData.book_id) {
      return toast({ title: "Erro", description: "Selecione a Obra", variant: "destructive" });
    }

    // Bibliotecário só pode salvar na sua biblioteca
    const libraryId = user?.library_id;
    if (!libraryId) {
      return toast({ title: "Erro", description: "Biblioteca não identificada", variant: "destructive" });
    }

    setMobileSaving(true);

    try {
      // Preparar payload
      const payload: any = {
        book_id: mobileFormData.book_id,
        library_id: libraryId,
        status: mobileFormData.status,
        code: mobileFormData.code || null,
        process_stamped: mobileFormData.process_stamped,
        process_indexed: mobileFormData.process_indexed,
        process_taped: mobileFormData.process_taped,
        local_categories: mobileFormData.local_categories,
        origin: mobileFormData.origin || 'doado'
      };
      
      // Gerar tombo automático ou usar manual
      if (mobileFormData.tombo_mode === 'auto') {
        const { data: maxTombo } = await (supabase as any)
          .from('copies')
          .select('tombo')
          .eq('library_id', libraryId)
          .order('tombo', { ascending: false })
          .limit(1)
          .single();
        
        payload.tombo = (maxTombo?.tombo || 0) + 1;
      } else if (mobileFormData.tombo_manual) {
        payload.tombo = parseInt(mobileFormData.tombo_manual);
      }

      const { error } = await (supabase as any)
        .from('copies')
        .insert(payload);

      if (error) throw error;

      // Atualizar Cutter na tabela books se foi alterado
      if (mobileFormData.cutter.trim() && mobileFormData.book_id) {
        const currentBook = books.find(b => b.id === mobileFormData.book_id);
        const currentCutter = (currentBook as any)?.cutter || '';
        
        if (mobileFormData.cutter.trim() !== currentCutter) {
          await (supabase as any)
            .from('books')
            .update({ cutter: mobileFormData.cutter.trim() })
            .eq('id', mobileFormData.book_id);
        }
      }

      // Sincronizar cores com outros exemplares do mesmo livro na mesma biblioteca
      if (mobileFormData.local_categories.length > 0) {
        await (supabase as any)
          .from('copies')
          .update({ local_categories: mobileFormData.local_categories })
          .eq('book_id', mobileFormData.book_id)
          .eq('library_id', libraryId);
      }

      toast({ title: "Sucesso! ✨", description: `Exemplar cadastrado com tombo ${payload.tombo}` });
      
      // Resetar formulário para próximo cadastro
      resetMobileForm();
      fetchCopies();
      fetchBooksList();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({ title: "Erro", description: error.message || "Não foi possível salvar", variant: "destructive" });
    } finally {
      setMobileSaving(false);
    }
  };

  const handleLibraryChangeForColors = (libraryId: string) => {
    setSelectedLibraryForColors(libraryId);
    setTimeout(() => {
      fetchLibraryColors();
    }, 100);
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const statusValue = status || 'disponivel';
    
    switch (statusValue) {
      case 'disponivel':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
            Disponível
          </Badge>
        );
      case 'emprestado':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
            Emprestado
          </Badge>
        );
      case 'manutencao':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
            Manutenção
          </Badge>
        );
      case 'extraviado':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300">
            Extraviado
          </Badge>
        );
      default:
        // Capitalizar primeira letra para status desconhecidos
        const capitalized = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {capitalized}
          </Badge>
        );
    }
  };

  // Função auxiliar para contar itens por filtro de processamento
  const getProcessCount = (filterType: string) => {
    switch (filterType) {
      case 'pendente_geral':
        return copies.filter(c => 
          !c.process_stamped || !c.process_indexed || !c.process_taped
        ).length;
      case 'falta_carimbo':
        return copies.filter(c => !c.process_stamped).length;
      case 'falta_index':
        return copies.filter(c => !c.process_indexed).length;
      case 'falta_fita':
        return copies.filter(c => !c.process_taped).length;
      case 'prontos':
        return copies.filter(c => 
          c.process_stamped && c.process_indexed && c.process_taped
        ).length;
      default:
        return 0;
    }
  };

  // Função auxiliar para contar itens por filtro de status
  const getStatusCount = (filterType: string) => {
    switch (filterType) {
      case 'disponivel':
        return copies.filter(c => c.status === 'disponivel').length;
      case 'emprestado':
        return copies.filter(c => c.status === 'emprestado').length;
      case 'problemas':
        return copies.filter(c => 
          c.status === 'manutencao' || c.status === 'extraviado'
        ).length;
      default:
        return 0;
    }
  };

  const filteredCopies = copies.filter(c => {
    // Filtro de busca (título, tombo ou código) - ignorando acentos
    const matchesSearch = 
      includesIgnoringAccents(c.books?.title, searchTerm) ||
      c.tombo?.toString().includes(searchTerm) ||
      includesIgnoringAccents(c.code, searchTerm);

    if (!matchesSearch) return false;

    // Filtro de status
    if (statusFilter !== 'todos') {
      if (statusFilter === 'problemas') {
        if (c.status !== 'manutencao' && c.status !== 'extraviado') {
          return false;
        }
      } else {
        if (c.status !== statusFilter) {
          return false;
        }
      }
    }

    // Filtro de processamento
    if (processFilter !== 'todos') {
      switch (processFilter) {
        case 'pendente_geral':
          if (c.process_stamped && c.process_indexed && c.process_taped) {
            return false;
          }
          break;
        case 'falta_carimbo':
          if (c.process_stamped) {
            return false;
          }
          break;
        case 'falta_index':
          if (c.process_indexed) {
            return false;
          }
          break;
        case 'falta_fita':
          if (c.process_taped) {
            return false;
          }
          break;
        case 'prontos':
          if (!c.process_stamped || !c.process_indexed || !c.process_taped) {
            return false;
          }
          break;
      }
    }

    return true;
  });

  // Função para obter valor aninhado (ex: 'books.title', 'libraries.name')
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  };

  // Função de ordenação
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Aplicar ordenação aos dados filtrados
  const sortedAndFilteredCopies = [...filteredCopies].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue = getNestedValue(a, sortConfig.key);
    let bValue = getNestedValue(b, sortConfig.key);

    // CORREÇÃO: Ordenação numérica para tombo
    if (sortConfig.key === 'tombo') {
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      if (sortConfig.direction === 'asc') {
        return aNum - bNum;
      } else {
        return bNum - aNum;
      }
    }

    // Tratamento para valores nulos/undefined
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // Converter para string para comparação (outros campos)
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (sortConfig.direction === 'asc') {
      return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
    } else {
      return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
    }
  });

  // Componente para ícone de ordenação
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-muted-foreground opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
  };

  const handleExportExcel = () => {
    try {
      const exportData = sortedAndFilteredCopies.map((copy) => ({
        'Nr. Tombo': copy.tombo || '-',
        'Biblioteca': copy.libraries?.name || '-',
        'Obra': copy.books?.title || '-',
        'Autor': copy.books?.author || '-',
        'Cutter': copy.books?.cutter || '-',
        'Carimbado': copy.process_stamped ? 'Sim' : 'Não',
        'Indexado': copy.process_indexed ? 'Sim' : 'Não',
        'Lombada': copy.process_taped ? 'Sim' : 'Não',
        'Categorias Locais': (copy.local_categories || []).join(', ') || '-',
        'Status': copy.status || '-',
        'Código': copy.code || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Acervo Local');

      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const fileName = `acervo_local_${day}${month}${year}.xlsx`;

      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Exportação realizada',
        description: `Arquivo ${fileName} gerado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o arquivo Excel.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-8 fade-in">
      {/* Header Responsivo */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Acervo Local</h1>
          <p className="text-sm text-muted-foreground">Gestão de exemplares físicos (Tombos).</p>
        </div>
        
        {/* Botões - empilham em mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          {user?.role === 'bibliotecario' && (
            <Button 
              onClick={async () => {
                setIsMobileMode(true);
                resetMobileForm();
                // Carregar livros com cores para copiar
                if (user?.library_id) {
                  const { data: copiesData } = await (supabase as any)
                    .from('copies')
                    .select('id, local_categories, books(id, title, author, isbn)')
                    .eq('library_id', user.library_id)
                    .not('local_categories', 'is', null);
                  
                  const booksMap = new Map();
                  (copiesData || []).forEach((c: any) => {
                    if (c.books && c.local_categories?.length > 0 && !booksMap.has(c.books.id)) {
                      booksMap.set(c.books.id, {
                        id: c.books.id,
                        title: c.books.title,
                        author: c.books.author,
                        isbn: c.books.isbn,
                        local_categories: c.local_categories
                      });
                    }
                  });
                  setBooksForMobileCopyColors(Array.from(booksMap.values()));
                }
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
            >
              <Smartphone className="mr-2 h-4 w-4" /> Modo Mobile 📱
            </Button>
          )}
          
          <Button onClick={openNew} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Novo Item
          </Button>
          
          {user?.role === 'admin_rede' && (
            <Select value={selectedLibraryForColors} onValueChange={handleLibraryChangeForColors}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Biblioteca para cores" />
              </SelectTrigger>
              <SelectContent>
                {libraries.map(lib => (
                  <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button 
            variant="secondary" 
            onClick={() => {
              if (user?.role === 'admin_rede' && !selectedLibraryForColors) {
                toast({ title: "Atenção", description: "Selecione uma biblioteca primeiro", variant: "destructive" });
                return;
              }
              setIsColorConfigOpen(true);
            }}
            disabled={user?.role === 'admin_rede' && !selectedLibraryForColors}
            className="w-full sm:w-auto"
          >
            <Palette className="mr-2 h-4 w-4" /> Cores
          </Button>
          
          <Button variant="outline" onClick={handleExportExcel} className="w-full sm:w-auto">
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {/* Barra de Ferramentas */}
      <Card className="bg-muted/40 border-0 shadow-sm">
        <CardContent className="p-3 md:p-5 space-y-3 md:space-y-4">
          {/* Busca */}
          <div className="flex items-center gap-2 bg-white p-2 md:p-3 rounded-lg border shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input 
              placeholder="Buscar por Título, Tombo..." 
              className="border-none focus-visible:ring-0 bg-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtros Rápidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t">
            {/* Grupo 1: Processamento Técnico */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Processamento Técnico</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={processFilter === 'todos' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('todos')}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'pendente_geral' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('pendente_geral')}
              >
                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                Pendentes ({getProcessCount('pendente_geral')})
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'falta_carimbo' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('falta_carimbo')}
              >
                Falta Carimbo ({getProcessCount('falta_carimbo')})
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'falta_index' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('falta_index')}
              >
                Falta Index ({getProcessCount('falta_index')})
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'falta_fita' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('falta_fita')}
              >
                Falta Lombada ({getProcessCount('falta_fita')})
              </Button>
              <Button
                size="sm"
                variant={processFilter === 'prontos' ? 'default' : 'outline'}
                onClick={() => setProcessFilter('prontos')}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Prontos ({getProcessCount('prontos')})
              </Button>
              </div>
            </div>

            {/* Grupo 2: Situação no Acervo */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Situação no Acervo</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'todos' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('todos')}
              >
                Todas Situações
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'disponivel' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('disponivel')}
              >
                Disponíveis ({getStatusCount('disponivel')})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'emprestado' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('emprestado')}
              >
                Emprestados ({getStatusCount('emprestado')})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'problemas' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('problemas')}
              >
                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                Problemas ({getStatusCount('problemas')})
              </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Itens - Cards em mobile, Tabela em desktop */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
        </div>
      ) : filteredCopies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookIcon className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm font-medium mt-2">Nenhum item encontrado</p>
          <p className="text-xs">Tente ajustar os filtros ou a busca</p>
        </div>
      ) : (
        <>
          {/* MOBILE: Cards */}
          <div className="md:hidden space-y-3">
            {sortedAndFilteredCopies.map((copy) => (
              <div key={copy.id} className="bg-white border rounded-lg p-3 shadow-sm">
                {/* Ações e Status no topo */}
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={copy.status === 'disponivel' ? 'success' : copy.status === 'emprestado' ? 'destructive' : 'secondary'}>
                    {copy.status === 'disponivel' ? 'Disponível' : copy.status === 'emprestado' ? 'Emprestado' : copy.status}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(copy)} className="h-8 px-2">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(copy.id)} className="h-8 px-2 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Conteúdo */}
                <div className="flex gap-3">
                  {/* Capa */}
                  <div className="shrink-0">
                    {copy.books?.cover_url ? (
                      <img src={copy.books.cover_url} className="h-16 w-12 object-cover rounded border" />
                    ) : (
                      <div className="h-16 w-12 bg-slate-100 rounded border flex items-center justify-center">
                        <BookIcon className="h-5 w-5 text-slate-300"/>
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-blue-600 text-sm">#{copy.tombo || "N/A"}</span>
                      {copy.books?.cutter && <span className="font-mono text-[10px] text-muted-foreground">{copy.books.cutter}</span>}
                    </div>
                    <h3 className="font-medium text-sm line-clamp-1">{copy.books?.title || "Sem título"}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{copy.books?.author}</p>
                    
                    {user?.role === 'admin_rede' && copy.libraries?.name && (
                      <p className="text-[10px] text-muted-foreground mt-1">📍 {copy.libraries.name}</p>
                    )}
                    
                    {/* Processamento */}
                    <div className="flex gap-1 mt-2">
                      <Badge
                        variant={copy.process_stamped ? "default" : "outline"}
                        className={cn("text-[10px] px-1.5", copy.process_stamped && "bg-green-600")}
                        onClick={() => toggleProcess(copy.id, 'process_stamped', copy.process_stamped || false)}
                      >C</Badge>
                      <Badge
                        variant={copy.process_indexed ? "default" : "outline"}
                        className={cn("text-[10px] px-1.5", copy.process_indexed && "bg-green-600")}
                        onClick={() => toggleProcess(copy.id, 'process_indexed', copy.process_indexed || false)}
                      >I</Badge>
                      <Badge
                        variant={copy.process_taped ? "default" : "outline"}
                        className={cn("text-[10px] px-1.5", copy.process_taped && "bg-green-600")}
                        onClick={() => toggleProcess(copy.id, 'process_taped', copy.process_taped || false)}
                      >L</Badge>
                      
                      {/* Cores */}
                      {(copy.local_categories || []).slice(0, 2).map((cat: string, idx: number) => {
                        const colorDef = libraryColors.find(lc => lc.category_name === cat && lc.library_id === copy.library_id);
                        return (
                          <div key={idx} className="w-4 h-4 rounded-full border" style={{ backgroundColor: colorDef?.color_hex || '#ccc' }} title={cat} />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* DESKTOP: Tabela */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Capa</TableHead>
                      <TableHead className="font-semibold cursor-pointer hover:bg-muted/50" onClick={() => handleSort('tombo')}>
                        <div className="flex items-center">Nr. Tombo<SortIcon columnKey="tombo" /></div>
                      </TableHead>
                      {user?.role === 'admin_rede' && (
                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('libraries.name')}>
                          <div className="flex items-center">Biblioteca<SortIcon columnKey="libraries.name" /></div>
                        </TableHead>
                      )}
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('books.title')}>
                        <div className="flex items-center">Obra<SortIcon columnKey="books.title" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('books.cutter')}>
                        <div className="flex items-center">Cutter<SortIcon columnKey="books.cutter" /></div>
                      </TableHead>
                      <TableHead>Processamento</TableHead>
                      <TableHead>Cores</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                        <div className="flex items-center">Status<SortIcon columnKey="status" /></div>
                      </TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredCopies.map((copy) => (
                      <TableRow key={copy.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          {copy.books?.cover_url ? (
                            <img src={copy.books.cover_url} className="h-10 w-8 object-cover rounded" alt={copy.books.title} />
                          ) : (
                            <BookIcon className="h-10 w-8 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold text-blue-600">#{copy.tombo || "N/A"}</span>
                        </TableCell>
                        {user?.role === 'admin_rede' && (
                          <TableCell><span className="text-sm">{copy.libraries?.name || "N/A"}</span></TableCell>
                        )}
                        <TableCell>
                          <div className="font-medium line-clamp-1">{copy.books?.title || "Sem título"}</div>
                          <div className="text-xs text-muted-foreground">{copy.books?.author || ""}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">{copy.books?.cutter || "-"}</span>
                        </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={copy.process_stamped ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    copy.process_stamped
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "hover:bg-muted"
                                  )}
                                  onClick={() => toggleProcess(copy.id, 'process_stamped', copy.process_stamped || false)}
                                >
                                  C
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clique para {copy.process_stamped ? 'desmarcar' : 'marcar'} como Carimbado</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={copy.process_indexed ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    copy.process_indexed
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "hover:bg-muted"
                                  )}
                                  onClick={() => toggleProcess(copy.id, 'process_indexed', copy.process_indexed || false)}
                                >
                                  I
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clique para {copy.process_indexed ? 'desmarcar' : 'marcar'} como Indexado/Validado</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={copy.process_taped ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    copy.process_taped
                                      ? "bg-green-600 hover:bg-green-700"
                                      : "hover:bg-muted"
                                  )}
                                  onClick={() => toggleProcess(copy.id, 'process_taped', copy.process_taped || false)}
                                >
                                  L
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Clique para {copy.process_taped ? 'desmarcar' : 'marcar'} como Lombada Colada</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(copy.local_categories || []).map((cat: string) => {
                        // CORREÇÃO: Filtrar por nome da categoria E library_id do exemplar
                        const colorDef = libraryColors.find(
                          lc => lc.category_name === cat && lc.library_id === copy.library_id
                        );
                        return (
                          <div 
                            key={cat} 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: colorDef?.color_hex || '#ccc' }} 
                            title={`${cat}${colorDef ? '' : ' (cor não configurada)'}`} 
                          />
                        );
                      })}
                      {(!copy.local_categories || copy.local_categories.length === 0) && (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(copy.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(copy)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(copy.id)} className="hover:text-red-600" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ============ MODO MOBILE - INTERFACE OTIMIZADA PARA CELULAR ============ */}
      {isMobileMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header compacto */}
          <div className="bg-white border-b px-3 py-2 flex items-center gap-2 shrink-0 safe-area-top">
            <button onClick={closeMobileMode} className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <span className="text-base font-medium text-gray-800">Cadastro Rápido de Exemplar</span>
          </div>
          
          {/* Loading overlay */}
          {mobileSaving && (
            <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center">
              <div className="w-20 h-20 mb-6">
                <svg className="animate-spin" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeDasharray="80" strokeDashoffset="60" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">Salvando exemplar...</p>
            </div>
          )}
          
          {/* Conteúdo principal scrollável */}
          <div className="flex-1 overflow-auto bg-gray-50">
            <div className="p-3 space-y-3 pb-28">
              
              {/* Card Seleção de Obra */}
              <div className="bg-white rounded-xl shadow-sm p-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Obra *</Label>
                <Popover open={mobileOpenBookPopover} onOpenChange={setMobileOpenBookPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-12 text-left font-normal"
                    >
                      {mobileFormData.book_id ? (
                        <div className="flex flex-col items-start truncate">
                          <span className="font-medium truncate w-full">{books.find(b => b.id === mobileFormData.book_id)?.title || "Selecione..."}</span>
                          <span className="text-xs text-muted-foreground truncate w-full">{books.find(b => b.id === mobileFormData.book_id)?.author}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Pesquisar obra por título ou autor...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-1.5rem)] p-0" align="start">
                    <Command
                      filter={(value, search) => {
                        if (!search) return 1;
                        const searchNormalized = normalizeText(search.trim());
                        const valueNormalized = normalizeText(value);
                        const searchWords = searchNormalized.split(/\s+/);
                        const matchesAll = searchWords.every(word => valueNormalized.includes(word));
                        return matchesAll ? 1 : 0;
                      }}
                    >
                      <CommandInput 
                        placeholder="Pesquisar por título ou autor..." 
                        value={mobileBookSearch}
                        onValueChange={setMobileBookSearch}
                      />
                      <CommandList className="max-h-[50vh]">
                        <CommandEmpty>Nenhuma obra encontrada.</CommandEmpty>
                        <CommandGroup heading="Obras do Catálogo">
                          {books
                            .filter(b => 
                              includesIgnoringAccents(b.title, mobileBookSearch) ||
                              includesIgnoringAccents(b.author, mobileBookSearch)
                            )
                            .slice(0, 30)
                            .map((b) => (
                              <CommandItem
                                key={b.id}
                                value={`${b.title || ''} ${b.author || ''}`}
                                onSelect={() => handleMobileBookSelect(b.id)}
                                className="py-2"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    mobileFormData.book_id === b.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{b.title}</span>
                                  <span className="text-xs text-muted-foreground">{b.author}</span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Card Código Cutter */}
              <div className="bg-white rounded-xl shadow-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Código Cutter</Label>
                </div>
                <Input 
                  value={mobileFormData.cutter} 
                  onChange={(e) => setMobileFormData({...mobileFormData, cutter: e.target.value.toUpperCase()})}
                  placeholder="Ex: K45d"
                  className="font-mono text-center text-lg h-12 bg-indigo-50 border-indigo-200 focus:border-indigo-500"
                />
              </div>

              {/* Card Processamento Técnico */}
              <div className="bg-white rounded-xl shadow-sm p-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Processamento Técnico</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileFormData({...mobileFormData, process_stamped: !mobileFormData.process_stamped})}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95",
                      mobileFormData.process_stamped 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    )}
                  >
                    {mobileFormData.process_stamped ? <CheckCircle2 className="h-6 w-6 mb-1" /> : <XCircle className="h-6 w-6 mb-1" />}
                    <span className="text-xs font-medium">Carimbado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFormData({...mobileFormData, process_indexed: !mobileFormData.process_indexed})}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95",
                      mobileFormData.process_indexed 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    )}
                  >
                    {mobileFormData.process_indexed ? <CheckCircle2 className="h-6 w-6 mb-1" /> : <XCircle className="h-6 w-6 mb-1" />}
                    <span className="text-xs font-medium">Indexado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFormData({...mobileFormData, process_taped: !mobileFormData.process_taped})}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95",
                      mobileFormData.process_taped 
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    )}
                  >
                    {mobileFormData.process_taped ? <CheckCircle2 className="h-6 w-6 mb-1" /> : <XCircle className="h-6 w-6 mb-1" />}
                    <span className="text-xs font-medium">Lombada</span>
                  </button>
                </div>
              </div>

              {/* Card Cores/Categorias */}
              <div className="bg-white rounded-xl shadow-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">Cores / Categorias</p>
                  {/* Botão copiar de outro livro */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                        Copiar de outro
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2" align="end">
                      <Command className="border rounded-lg overflow-hidden">
                        <CommandInput 
                          placeholder="Buscar livro..." 
                          className="h-9 text-sm" 
                          value={mobileCopyColorsSearch}
                          onValueChange={setMobileCopyColorsSearch}
                        />
                        <CommandList className="max-h-40">
                          <CommandEmpty>Nenhum livro</CommandEmpty>
                          <CommandGroup>
                            {booksForMobileCopyColors
                              .filter((book: any) => {
                                if (!mobileCopyColorsSearch) return true;
                                return includesIgnoringAccents(book.title, mobileCopyColorsSearch) ||
                                       includesIgnoringAccents(book.author, mobileCopyColorsSearch);
                              })
                              .map((book: any) => (
                              <CommandItem 
                                key={book.id}
                                onSelect={() => {
                                  if (book.local_categories?.length > 0) {
                                    setMobileFormData({...mobileFormData, local_categories: book.local_categories});
                                    toast({ title: "Cores copiadas!" });
                                  }
                                }}
                                className="py-2 cursor-pointer text-xs"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="truncate font-medium">{book.title}</p>
                                </div>
                                {book.local_categories?.length > 0 && (
                                  <Badge variant="secondary" className="text-[10px] ml-1">{book.local_categories.length}</Badge>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Cores selecionadas */}
                <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
                  {mobileFormData.local_categories.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">Nenhuma cor selecionada (máx. 3)</span>
                  ) : (
                    mobileFormData.local_categories.map((cat, idx) => {
                      const colorInfo = libraryColors.find(c => c.category_name === cat);
                      const hexColor = colorInfo?.hex_color || '#6b7280';
                      const isLight = (() => {
                        const c = hexColor.replace('#', '');
                        const r = parseInt(c.substr(0, 2), 16);
                        const g = parseInt(c.substr(2, 2), 16);
                        const b = parseInt(c.substr(4, 2), 16);
                        return (r * 299 + g * 587 + b * 114) / 1000 > 180;
                      })();
                      return (
                        <button 
                          key={idx}
                          onClick={() => toggleMobileCategory(cat)}
                          className="px-2 py-1 rounded text-[11px] font-medium border-2 transition-all flex items-center gap-1 ring-2 ring-offset-1 ring-gray-900 shadow-md"
                          style={{ 
                            backgroundColor: hexColor, 
                            borderColor: isLight ? '#333' : hexColor,
                            color: isLight ? '#000' : '#fff'
                          }}
                        >
                          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", isLight && "border border-gray-400")} style={{ backgroundColor: hexColor }} />
                          <span className="truncate max-w-[100px]">{cat}</span>
                          <Check className="h-3 w-3 shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
                
                {/* Lista de cores disponíveis agrupadas */}
                {libraryColors.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      const colorsByGroup: Record<string, any[]> = {};
                      libraryColors.forEach((c: any) => {
                        const group = c.color_group || 'Geral';
                        if (!colorsByGroup[group]) colorsByGroup[group] = [];
                        colorsByGroup[group].push(c);
                      });
                      
                      // Ordenar grupos: Tipo de Leitor > Gênero Literário > Literaturas Afirmativas > outros
                      const groupOrder = ['Tipo de Leitor', 'TIPO DE LEITOR', 'Gênero Literário', 'GÊNERO LITERÁRIO', 'Literaturas Afirmativas', 'LITERATURAS AFIRMATIVAS'];
                      const sortedGroups = Object.entries(colorsByGroup).sort(([a], [b]) => {
                        const aIdx = groupOrder.findIndex(g => g.toLowerCase() === a.toLowerCase());
                        const bIdx = groupOrder.findIndex(g => g.toLowerCase() === b.toLowerCase());
                        if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
                        if (aIdx === -1) return 1;
                        if (bIdx === -1) return -1;
                        return aIdx - bIdx;
                      });
                      
                      // Função para verificar se a cor é clara
                      const isLightColor = (hex: string) => {
                        const c = hex.replace('#', '');
                        const r = parseInt(c.substr(0, 2), 16);
                        const g = parseInt(c.substr(2, 2), 16);
                        const b = parseInt(c.substr(4, 2), 16);
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                        return brightness > 180;
                      };
                      
                      return sortedGroups.map(([group, colors]) => (
                        <div key={group}>
                          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{group}</p>
                          <div className="flex flex-wrap gap-1">
                            {colors.map((lc: any) => {
                              const isSelected = mobileFormData.local_categories.includes(lc.category_name);
                              const hexColor = lc.hex_color || '#888888';
                              const isLight = isLightColor(hexColor);
                              const maxColors = 3;
                              const canSelect = isSelected || mobileFormData.local_categories.length < maxColors;
                              
                              if (isSelected) return null; // Já exibido acima
                              
                              return (
                                <button
                                  key={lc.id}
                                  onClick={() => {
                                    if (!canSelect) {
                                      toast({ title: "Limite atingido", description: `Máximo de ${maxColors} cores por exemplar`, variant: "destructive" });
                                      return;
                                    }
                                    toggleMobileCategory(lc.category_name);
                                  }}
                                  className={cn(
                                    "px-2 py-1 rounded text-[11px] font-medium border-2 transition-all flex items-center gap-1",
                                    canSelect ? "bg-white hover:shadow-sm" : "bg-gray-100 opacity-50 cursor-not-allowed"
                                  )}
                                  style={{ 
                                    backgroundColor: canSelect ? 'white' : '#f3f4f6',
                                    borderColor: isLight ? '#d1d5db' : hexColor,
                                    color: '#333'
                                  }}
                                >
                                  <span 
                                    className={cn("w-2.5 h-2.5 rounded-full shrink-0", isLight && "border border-gray-400")}
                                    style={{ backgroundColor: hexColor }}
                                  />
                                  <span className="truncate max-w-[100px]">{lc.category_name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">Nenhuma cor cadastrada para esta biblioteca</p>
                )}
              </div>

              {/* Card Status e Origem */}
              <div className="bg-white rounded-xl shadow-sm p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Status</Label>
                    <Select value={mobileFormData.status} onValueChange={(v) => setMobileFormData({...mobileFormData, status: v})}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="emprestado">Emprestado</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="extraviado">Extraviado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Origem</Label>
                    <Select value={mobileFormData.origin} onValueChange={(v: any) => setMobileFormData({...mobileFormData, origin: v})}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doado">Doado</SelectItem>
                        <SelectItem value="comprado">Comprado</SelectItem>
                        <SelectItem value="indefinido">Indefinido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Card Tombo */}
              <div className="bg-white rounded-xl shadow-sm p-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Número de Tombo</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileFormData({...mobileFormData, tombo_mode: 'auto', tombo_manual: ''})}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      mobileFormData.tombo_mode === 'auto' 
                        ? "bg-indigo-500 text-white" 
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    Automático
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFormData({...mobileFormData, tombo_mode: 'manual'})}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                      mobileFormData.tombo_mode === 'manual' 
                        ? "bg-indigo-500 text-white" 
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    Manual
                  </button>
                </div>
                {mobileFormData.tombo_mode === 'manual' && (
                  <Input 
                    type="number"
                    value={mobileFormData.tombo_manual}
                    onChange={(e) => setMobileFormData({...mobileFormData, tombo_manual: e.target.value})}
                    placeholder="Digite o número do tombo"
                    className="mt-2 h-10"
                  />
                )}
              </div>

              {/* Card Código de Barras (opcional) */}
              <div className="bg-white rounded-xl shadow-sm p-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Código de Barras (opcional)</Label>
                <Input 
                  value={mobileFormData.code}
                  onChange={(e) => setMobileFormData({...mobileFormData, code: e.target.value})}
                  placeholder="ISBN ou código do exemplar"
                  className="h-10 font-mono"
                />
              </div>

            </div>
          </div>
          
          {/* Footer fixo com botões de ação */}
          <div className="shrink-0 bg-white border-t p-3 safe-area-bottom">
            <div className="flex gap-2">
              <button 
                onClick={resetMobileForm}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm hover:bg-gray-200 active:scale-95 transition-all"
              >
                <RotateCcw className="h-4 w-4" /> Limpar
              </button>
              <button 
                onClick={handleMobileSave}
                disabled={!mobileFormData.book_id || mobileSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm hover:from-purple-600 hover:to-pink-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {mobileSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Cadastrar Exemplar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Processamento Técnico</DialogTitle>
            <DialogDescription>
              {editingCopy ? "Editar item do acervo" : "Cadastrar novo item no acervo"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              {/* OBRA - Combobox Pesquisável */}
              <div className="space-y-2">
                <Label>Obra *</Label>
                <Popover open={openBookCombobox} onOpenChange={setOpenBookCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBookCombobox}
                      className="w-full justify-between font-normal"
                      disabled={!!editingCopy}
                    >
                      {formData.book_id
                        ? books.find((b) => b.id === formData.book_id)?.title || "Selecione..."
                        : "Pesquisar obra..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command
                      filter={(value, search) => {
                        if (!search) return 1;
                        const searchNormalized = normalizeText(search.trim());
                        const valueNormalized = normalizeText(value);
                        const searchWords = searchNormalized.split(/\s+/);
                        const matchesAll = searchWords.every(word => valueNormalized.includes(word));
                        return matchesAll ? 1 : 0;
                      }}
                    >
                      <CommandInput 
                        placeholder="Pesquisar por título ou autor..." 
                        value={bookSearchTerm}
                        onValueChange={setBookSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhuma obra encontrada.</CommandEmpty>
                        <CommandGroup heading="Obras do Catálogo">
                          {books
                            .filter(b => 
                              includesIgnoringAccents(b.title, bookSearchTerm) ||
                              includesIgnoringAccents(b.author, bookSearchTerm)
                            )
                            .slice(0, 50)
                            .map((b) => (
                              <CommandItem
                                key={b.id}
                                value={`${b.title || ''} ${b.author || ''}`}
                                onSelect={() => handleBookSelect(b.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.book_id === b.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{b.title}</span>
                                  <span className="text-xs text-muted-foreground">{b.author}</span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* CÓDIGO CUTTER - Gerado automaticamente */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Código Cutter
                  {loadingCutter && <Loader2 className="h-3 w-3 animate-spin" />}
                </Label>
                <Input 
                  value={formData.cutter} 
                  onChange={(e) => setFormData({...formData, cutter: e.target.value.toUpperCase()})}
                  placeholder="Ex: K45d"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Gerado automaticamente ao selecionar a obra. Pode ser editado.
                </p>
              </div>

              {/* BIBLIOTECA - Combobox Pesquisável (apenas para Admin) */}
              {user?.role === 'admin_rede' && (
                <div className="space-y-2">
                  <Label>Biblioteca de Destino *</Label>
                  <Popover open={openLibraryCombobox} onOpenChange={setOpenLibraryCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openLibraryCombobox}
                        className="w-full justify-between font-normal"
                      >
                        {formData.library_id
                          ? libraries.find((lib) => lib.id === formData.library_id)?.name || "Selecione..."
                          : "Pesquisar biblioteca..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Digite para pesquisar..." 
                          value={librarySearchTerm}
                          onValueChange={setLibrarySearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhuma biblioteca encontrada.</CommandEmpty>
                          <CommandGroup heading="Bibliotecas">
                            {libraries
                              .filter(lib => 
                                includesIgnoringAccents(lib.name, librarySearchTerm)
                              )
                              .map((lib) => (
                                <CommandItem
                                  key={lib.id}
                                  value={lib.name}
                                  onSelect={() => {
                                    // Verificar se já existe exemplar do livro na nova biblioteca
                                    let colorsFromExisting: string[] = [];
                                    if (formData.book_id) {
                                      const existingCopy = copies.find(
                                        c => c.book_id === formData.book_id && c.library_id === lib.id
                                      );
                                      if (existingCopy?.local_categories?.length > 0) {
                                        colorsFromExisting = existingCopy.local_categories;
                                        toast({ 
                                          title: "Cores copiadas", 
                                          description: `Cores de exemplar existente: ${colorsFromExisting.join(", ")}`,
                                          duration: 3000
                                        });
                                      }
                                    }
                                    
                                    setFormData({
                                      ...formData,
                                      library_id: lib.id,
                                      local_categories: colorsFromExisting
                                    });
                                    setSelectedLibraryForColors(lib.id);
                                    setOpenLibraryCombobox(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.library_id === lib.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {lib.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* NR. TOMBO - Manual ou Automático */}
              <div className="space-y-3 p-4 border rounded-lg bg-slate-50">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Nr. Tombo
                </Label>
                
                {editingCopy ? (
                  // Modo edição: apenas campo de texto
                  <div>
                    <Input 
                      value={formData.tombo_manual} 
                      onChange={(e) => setFormData({...formData, tombo_manual: e.target.value.toUpperCase()})}
                      placeholder="Nr. Tombo"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tombo atual do exemplar (pode ser alterado)
                    </p>
                  </div>
                ) : (
                  // Modo cadastro: opção auto ou manual
                  <>
                    <RadioGroup 
                      value={formData.tombo_mode} 
                      onValueChange={(val: "auto" | "manual") => setFormData({...formData, tombo_mode: val})}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto" id="tombo-auto" />
                        <Label htmlFor="tombo-auto" className="font-normal cursor-pointer">
                          Gerar automaticamente (B1, B2, B3...)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="tombo-manual" />
                        <Label htmlFor="tombo-manual" className="font-normal cursor-pointer">
                          Informar manualmente (para migração)
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {formData.tombo_mode === 'manual' && (
                      <div className="pt-2">
                        <Input 
                          value={formData.tombo_manual} 
                          onChange={(e) => setFormData({...formData, tombo_manual: e.target.value.toUpperCase()})}
                          placeholder="Ex: 12345 ou ABC123"
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Digite exatamente como deseja (sem adicionar prefixo)
                        </p>
                      </div>
                    )}
                    
                    {formData.tombo_mode === 'auto' && (
                      <p className="text-xs text-muted-foreground">
                        Ex: B1, B2, B3... Novos tombos iniciam com "B" para identificar registros do novo sistema.
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="extraviado">Extraviado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Origem</Label>
                <Select value={formData.origin} onValueChange={(val: "comprado" | "doado" | "indefinido") => setFormData({...formData, origin: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indefinido">Indefinido</SelectItem>
                    <SelectItem value="doado">Doado</SelectItem>
                    <SelectItem value="comprado">Comprado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Código de Barras (Opcional)</Label>
                <Input 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="Código de barras do exemplar"
                />
              </div>

              <div className="p-4 border rounded bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Checklist de Processamento Físico</Label>
                  <div className="flex gap-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleAllProcessing(true)}
                      className="text-xs h-7"
                    >
                      Marcar Todos
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleAllProcessing(false)}
                      className="text-xs h-7 text-muted-foreground"
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.process_stamped} 
                    onCheckedChange={(c) => setFormData({...formData, process_stamped: !!c})} 
                  />
                  <span className="text-sm">1. Carimbado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.process_indexed} 
                    onCheckedChange={(c) => setFormData({...formData, process_indexed: !!c})} 
                  />
                  <span className="text-sm">2. Indexado/Validado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={formData.process_taped} 
                    onCheckedChange={(c) => setFormData({...formData, process_taped: !!c})} 
                  />
                  <span className="text-sm">3. Lombada Colada</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cores / Categorias Locais</Label>
                <Popover open={openCopyColorsCombobox} onOpenChange={setOpenCopyColorsCombobox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar de Outro
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="end">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar exemplar..." 
                        value={copyColorsSearchTerm}
                        onValueChange={setCopyColorsSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum exemplar encontrado.</CommandEmpty>
                        <CommandGroup heading="Exemplares com Cores">
                          {copies
                            .filter(c => 
                              c.local_categories && 
                              c.local_categories.length > 0 &&
                              c.id !== editingCopy?.id &&
                              (copyColorsSearchTerm === "" || 
                                includesIgnoringAccents(c.books?.title, copyColorsSearchTerm) ||
                                includesIgnoringAccents(c.books?.author, copyColorsSearchTerm) ||
                                c.tombo?.toString().includes(copyColorsSearchTerm)
                              )
                            )
                            .slice(0, 20)
                            .map(c => (
                              <CommandItem 
                                key={c.id} 
                                value={c.id}
                                onSelect={() => copyColorsFromCopy(c.id)}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col flex-1">
                                  <span className="text-sm font-medium truncate">{c.books?.title || "Sem título"}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {c.tombo} • {c.local_categories?.join(", ")}
                                  </span>
                                </div>
                                <div className="flex gap-0.5 ml-2">
                                  {c.local_categories?.slice(0, 3).map((cat: string, idx: number) => {
                                    const colorInfo = libraryColors.find(lc => lc.category_name === cat && lc.library_id === c.library_id);
                                    return (
                                      <div 
                                        key={idx}
                                        className="w-4 h-4 rounded-full border"
                                        style={{ backgroundColor: colorInfo?.color_hex || '#gray' }}
                                        title={cat}
                                      />
                                    );
                                  })}
                                </div>
                              </CommandItem>
                            ))
                          }
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Selecione até 3 categorias para organização local do acervo
              </p>
              <div className="border rounded p-2 h-[300px] overflow-y-auto">
                {(() => {
                  // Determinar library_id para filtrar cores
                  const libraryIdToFilter = user?.role === 'admin_rede' 
                    ? formData.library_id 
                    : user?.library_id;
                  
                  // Se for admin_rede e não tiver biblioteca selecionada
                  if (user?.role === 'admin_rede' && !formData.library_id) {
                    return (
                      <p className="text-xs text-muted-foreground p-2 text-center">
                        Selecione a biblioteca acima para ver as categorias.
                      </p>
                    );
                  }
                  
                  // Filtrar cores pela biblioteca selecionada
                  const filteredColors = libraryColors.filter(
                    lc => lc.library_id === libraryIdToFilter
                  );
                  
                  if (filteredColors.length === 0) {
                    return (
                      <p className="text-xs text-muted-foreground p-2">
                        Nenhuma cor configurada para esta biblioteca. Use o botão 'Configurar Cores' para criar categorias.
                      </p>
                    );
                  }
                  
                  // Agrupar cores por grupo
                  const colorsByGroup: Record<string, any[]> = {};
                  filteredColors.forEach(lc => {
                    const group = lc.color_group || 'Geral';
                    if (!colorsByGroup[group]) colorsByGroup[group] = [];
                    colorsByGroup[group].push(lc);
                  });
                  
                  // Ordenar grupos
                  const groupOrder = ['Tipo de Leitor', 'Gênero Literário', 'Literaturas Afirmativas', 'Geral'];
                  const sortedGroups = Object.keys(colorsByGroup).sort((a, b) => {
                    const aIdx = groupOrder.indexOf(a);
                    const bIdx = groupOrder.indexOf(b);
                    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
                    if (aIdx === -1) return 1;
                    if (bIdx === -1) return -1;
                    return aIdx - bIdx;
                  });
                  
                  return sortedGroups.map(groupName => (
                    <div key={groupName} className="mb-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">
                        {groupName}
                      </div>
                      <div className="space-y-1">
                        {colorsByGroup[groupName].map(lc => {
                          const isSel = formData.local_categories?.includes(lc.category_name);
                          return (
                            <div 
                              key={lc.id} 
                              onClick={() => toggleCategory(lc.category_name)} 
                              className={`flex justify-between items-center p-2 rounded cursor-pointer border transition-colors ${
                                isSel ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" style={{backgroundColor: lc.color_hex}}/>
                                <span className="text-sm font-medium">{lc.category_name}</span>
                              </div>
                              {isSel && <Check className="h-4 w-4 text-blue-500" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              
              {/* Mostrar cores órfãs (que não existem mais nos templates) */}
              {(() => {
                const libraryIdToFilter = user?.role === 'admin_rede' 
                  ? formData.library_id 
                  : user?.library_id;
                
                const availableColorNames = libraryColors
                  .filter(lc => lc.library_id === libraryIdToFilter)
                  .map(lc => lc.category_name);
                
                const orphanCategories = formData.local_categories.filter(
                  cat => !availableColorNames.includes(cat)
                );
                
                if (orphanCategories.length === 0) return null;
                
                return (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="text-xs font-semibold text-red-700 mb-2">
                      ⚠️ Cores que não existem mais (clique para remover):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {orphanCategories.map(cat => (
                        <Badge 
                          key={cat}
                          variant="destructive"
                          className="cursor-pointer hover:bg-red-700"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              local_categories: prev.local_categories.filter(c => c !== cat)
                            }));
                            toast({ title: "Cor removida", description: `"${cat}" foi removida.` });
                          }}
                        >
                          {cat} ✕
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}
              
              {formData.local_categories.length > 0 && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <strong>Selecionadas ({formData.local_categories.length}/3):</strong> {formData.local_categories.join(", ")}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ColorConfigModal 
        isOpen={isColorConfigOpen} 
        onClose={() => { 
          setIsColorConfigOpen(false); 
          fetchLibraryColors(); 
        }} 
        libraryId={user?.role === 'admin_rede' ? selectedLibraryForColors : user?.library_id} 
      />
    </div>
  );
}
