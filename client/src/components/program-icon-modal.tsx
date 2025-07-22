import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProgramIcon } from "@/lib/program-icons";

interface ProgramIconModalProps {
  program: any;
  open: boolean;
  onClose: () => void;
  onUpdate: (iconUrl: string | null) => void;
}

export default function ProgramIconModal({ program, open, onClose, onUpdate }: ProgramIconModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentIcon = getProgramIcon(program);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setUploading(true);
    try {
      // For now, we'll store the base64 image directly
      // In production, you'd upload to a CDN or storage service
      const response = await fetch(`/api/programs/${program.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iconUrl: previewUrl }),
      });

      if (!response.ok) throw new Error('Failed to update icon');

      toast({
        title: "Ícone atualizado",
        description: "O ícone do programa foi atualizado com sucesso.",
      });

      onUpdate(previewUrl);
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o ícone.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const response = await fetch(`/api/programs/${program.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iconUrl: null }),
      });

      if (!response.ok) throw new Error('Failed to remove icon');

      toast({
        title: "Ícone removido",
        description: "O ícone do programa foi removido.",
      });

      onUpdate(null);
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o ícone.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ícone do Programa: {program.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Icon */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Ícone Atual:</p>
            <div className="flex justify-center">
              {currentIcon.type === 'png' ? (
                <img 
                  src={currentIcon.value} 
                  alt={program.name}
                  className="w-16 h-16 object-contain rounded"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded"
                  style={{ backgroundColor: currentIcon.value }}
                />
              )}
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Nova Imagem:</p>
              <div className="flex justify-center">
                <img 
                  src={previewUrl} 
                  alt="Preview"
                  className="w-16 h-16 object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Selecionar Imagem
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Instructions */}
          <p className="text-xs text-gray-500 text-center">
            Formatos aceitos: PNG, JPG, WebP. Tamanho máximo: 5MB.
          </p>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {program.iconUrl && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="w-4 h-4 mr-1" />
                Remover
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
            >
              Cancelar
            </Button>
            {previewUrl && (
              <Button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-1" />
                {uploading ? "Enviando..." : "Enviar"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}