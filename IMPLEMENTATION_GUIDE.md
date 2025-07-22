# Implementation Guide for Remaining Features

## 1. Data Export Feature

### Backend Implementation (`server/routes.ts`)
```typescript
app.get("/api/export/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Get all user data
    const members = await storage.getFamilyMembers(userId);
    const membersWithPrograms = await storage.getMembersWithPrograms(userId);
    const activities = await storage.getActivityLog(userId, 1000);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      user: { id: userId },
      members,
      membersWithPrograms,
      activities
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="lechworld-backup.json"');
    res.json(exportData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
```

### Frontend Implementation (`quick-actions.tsx`)
```typescript
const handleExportData = async () => {
  try {
    const response = await fetch(`/api/export/${user?.id}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lechworld-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação concluída",
      description: "Seus dados foram exportados com sucesso.",
    });
  } catch (error) {
    toast({
      title: "Erro na exportação",
      description: "Não foi possível exportar os dados.",
      variant: "destructive",
    });
  }
};
```

## 2. View Member Details Modal

### Create Component (`client/src/components/view-member-modal.tsx`)
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { MemberWithPrograms } from "@shared/schema";

interface ViewMemberModalProps {
  member: MemberWithPrograms | null;
  onClose: () => void;
}

export default function ViewMemberModal({ member, onClose }: ViewMemberModalProps) {
  if (!member) return null;

  return (
    <Dialog open={!!member} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Informações do Membro</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{member.email || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p>{member.phone || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold">Programas de Fidelidade</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {member.programs.map((mp) => (
                  <div key={mp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded"
                        style={{ backgroundColor: mp.program.logoColor }}
                      />
                      <div>
                        <p className="font-medium">{mp.program.name}</p>
                        <p className="text-sm text-gray-500">{mp.program.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="points-badge">
                        {mp.pointsBalance?.toLocaleString('pt-BR') || '0'} pontos
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {mp.isActive ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 3. Bulk Points Update

### Backend Endpoint
```typescript
app.post("/api/bulk-update-points", async (req, res) => {
  try {
    const { updates } = req.body; // Array of { memberProgramId, points }
    
    for (const update of updates) {
      await storage.updateMemberProgram(update.memberProgramId, {
        pointsBalance: update.points,
        lastUpdated: new Date()
      });
    }
    
    res.json({ success: true, updated: updates.length });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});
```

## 4. Import Data Feature

### Backend Endpoint
```typescript
app.post("/api/import", async (req, res) => {
  try {
    const { data, userId } = req.body;
    
    // Validate import data structure
    if (!data.version || !data.members) {
      throw new Error("Invalid import file format");
    }
    
    // Import members
    for (const member of data.members) {
      if (member.userId === userId) {
        await storage.createFamilyMember({
          ...member,
          id: undefined // Let DB generate new IDs
        });
      }
    }
    
    res.json({ success: true, message: "Data imported successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});
```

## 5. Security Improvements

### Password Hashing (`server/routes.ts`)
```typescript
import bcrypt from 'bcryptjs';

// In register endpoint
const hashedPassword = await bcrypt.hash(userData.password, 10);
const user = await storage.createUser({
  ...userData,
  password: hashedPassword
});

// In login endpoint
const isValidPassword = await bcrypt.compare(password, user.password);
if (!isValidPassword) {
  return res.status(401).json({ message: "Invalid credentials" });
}
```

## Testing the Fixes

1. **Test New Program Button**
   - Click "Novo Programa" button
   - Verify modal opens
   - Test adding a program to a member

2. **Test Delete Functionality**
   - Click delete button on a member
   - Verify confirmation dialog appears
   - Confirm deletion
   - Verify member is removed and data refreshes

3. **Test Export/Import/Encrypt Buttons**
   - Click each button
   - Verify appropriate toast notifications appear

## Deployment Considerations

1. Add environment variables for:
   - Session secrets
   - Encryption keys
   - Database credentials

2. Implement rate limiting:
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

3. Add proper error logging
4. Implement database backups
5. Add monitoring and alerts