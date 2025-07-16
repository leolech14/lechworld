import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ProgramForm from "./program-form";
import { Plus } from "lucide-react";

interface NewProgramModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewProgramModal({ open, onClose }: NewProgramModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="glass-card max-w-2xl"
        aria-describedby="new-program-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-royal rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">Adicionar Novo Programa</div>
              <div className="text-sm text-powder">Vincular programa de fidelidade a um membro</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div id="new-program-description" className="sr-only">
          Modal para adicionar um novo programa de fidelidade a um membro da família
        </div>
        
        <div className="mt-4">
          <ProgramForm 
            onSuccess={onClose}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}