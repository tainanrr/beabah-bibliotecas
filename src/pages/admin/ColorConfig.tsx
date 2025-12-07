import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColorConfigProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ColorConfig({ isOpen, onClose }: ColorConfigProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [colors, setColors] = useState<any[]>([]);
  const [newCat, setNewCat] = useState("");
  const [newColor, setNewColor] = useState("#000000");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.library_id) {
      fetchColors();
    }
  }, [isOpen, user]);

  const fetchColors = async () => {
    const { data } = await supabase
      .from("library_colors")
      .select("*")
      .eq("library_id", user?.library_id)
      .order("category_name");
    setColors(data || []);
  };

  const handleAdd = async () => {
    if (!newCat) return;
    setLoading(true);
    const { error } = await supabase.from("library_colors").insert({
      library_id: user?.library_id,
      category_name: newCat,
      color_hex: newColor
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewCat("");
      fetchColors();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("library_colors").delete().eq("id", id);
    fetchColors();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configuração de Cores (Etiquetas)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-md">
            <div className="flex-1 space-y-1">
              <Label>Nome da Categoria Local</Label>
              <Input 
                value={newCat} 
                onChange={e => setNewCat(e.target.value)} 
                placeholder="Ex: Romance"
              />
            </div>
            <div className="w-16 space-y-1">
              <Label>Cor</Label>
              <Input 
                type="color" 
                value={newColor} 
                onChange={e => setNewColor(e.target.value)}
                className="h-10 w-full p-1 cursor-pointer"
              />
            </div>
            <Button onClick={handleAdd} disabled={loading} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="border rounded-md max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colors.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.category_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border" 
                          style={{ backgroundColor: c.color_hex }} 
                        />
                        <span className="text-xs text-muted-foreground">{c.color_hex}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}