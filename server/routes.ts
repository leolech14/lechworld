/**
 * @purpose API route definitions for user authentication, members, programs, and activities
 * @connects-to server/storage.ts
 * @connects-to shared/schema.ts
 * @handles-routes POST /api/auth/login, POST /api/auth/register
 * @handles-routes GET /api/dashboard/stats/:userId, GET /api/dashboard/members-with-programs/:userId
 * @handles-routes GET /api/members/:userId, POST /api/members, PUT /api/members/:id, DELETE /api/members/:id
 * @handles-routes GET /api/programs, POST /api/programs, PUT /api/programs/:id, DELETE /api/programs/:id
 * @handles-routes GET /api/member-programs/:memberId, POST /api/member-programs, PUT /api/member-programs/:id, DELETE /api/member-programs/:id
 * @handles-routes PUT /api/members/:memberId/programs/:companyId, PUT /api/members/:memberId/programs/:companyId/fields
 * @handles-routes GET /api/activity/:userId
 */
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertFamilyMemberSchema, insertLoyaltyProgramSchema, 
  insertMemberProgramSchema, insertActivityLogSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: "login",
        description: "User logged in",
        metadata: { email },
      });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: "register",
        description: "New user registered",
        metadata: { email: user.email },
      });
      
      res.status(201).json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/members-with-programs/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const membersWithPrograms = await storage.getMembersWithPrograms(userId);
      res.json(membersWithPrograms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Family member routes
  app.get("/api/members/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const members = await storage.getFamilyMembers(userId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/members", async (req, res) => {
    try {
      const memberData = insertFamilyMemberSchema.parse(req.body);
      const member = await storage.createFamilyMember(memberData);
      
      // Log activity
      await storage.logActivity({
        userId: memberData.userId!,
        action: "create_member",
        description: `Created new family member: ${member.name}`,
        metadata: { memberId: member.id, memberName: member.name },
      });
      
      res.status(201).json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const member = await storage.updateFamilyMember(id, updateData);
      
      // Log activity
      await storage.logActivity({
        userId: member.userId!,
        action: "update_member",
        description: `Updated family member: ${member.name}`,
        metadata: { memberId: member.id, memberName: member.name },
      });
      
      res.json(member);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/members/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getFamilyMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      await storage.deleteFamilyMember(id);
      
      // Log activity
      await storage.logActivity({
        userId: member.userId!,
        action: "delete_member",
        description: `Deleted family member: ${member.name}`,
        metadata: { memberId: member.id, memberName: member.name },
      });
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Loyalty program routes
  app.get("/api/programs", async (req, res) => {
    try {
      const programs = await storage.getLoyaltyPrograms();
      res.json(programs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/programs", async (req, res) => {
    try {
      const programData = insertLoyaltyProgramSchema.parse(req.body);
      const program = await storage.createLoyaltyProgram(programData);
      res.status(201).json(program);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const program = await storage.updateLoyaltyProgram(id, updateData);
      res.json(program);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLoyaltyProgram(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Member program routes
  app.get("/api/member-programs/:memberId", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const programs = await storage.getMemberPrograms(memberId);
      res.json(programs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/member-programs", async (req, res) => {
    try {
      const memberProgramData = insertMemberProgramSchema.parse(req.body);
      const memberProgram = await storage.createMemberProgram(memberProgramData);
      
      // Get member for logging
      const member = await storage.getFamilyMember(memberProgram.memberId!);
      const program = await storage.getLoyaltyProgram(memberProgram.programId!);
      
      // Log activity
      if (member) {
        await storage.logActivity({
          userId: member.userId!,
          action: "create_member_program",
          description: `Added ${program?.name} program to ${member.name}`,
          metadata: { 
            memberId: member.id, 
            memberName: member.name,
            programId: program?.id,
            programName: program?.name 
          },
        });
      }
      
      res.status(201).json(memberProgram);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/member-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const memberProgram = await storage.updateMemberProgram(id, updateData);
      
      // Get member for logging
      const member = await storage.getFamilyMember(memberProgram.memberId!);
      const program = await storage.getLoyaltyProgram(memberProgram.programId!);
      
      // Log activity
      if (member) {
        await storage.logActivity({
          userId: member.userId!,
          action: "update_member_program",
          description: `Updated ${program?.name} program for ${member.name}`,
          metadata: { 
            memberId: member.id, 
            memberName: member.name,
            programId: program?.id,
            programName: program?.name 
          },
        });
      }
      
      res.json(memberProgram);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/member-programs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const memberProgram = await storage.getMemberProgram(id);
      
      if (!memberProgram) {
        return res.status(404).json({ message: "Member program not found" });
      }
      
      // Get member and program for logging
      const member = await storage.getFamilyMember(memberProgram.memberId!);
      const program = await storage.getLoyaltyProgram(memberProgram.programId!);
      
      await storage.deleteMemberProgram(id);
      
      // Log activity
      if (member) {
        await storage.logActivity({
          userId: member.userId!,
          action: "delete_member_program",
          description: `Removed ${program?.name} program from ${member.name}`,
          metadata: { 
            memberId: member.id, 
            memberName: member.name,
            programId: program?.id,
            programName: program?.name 
          },
        });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Member program field update routes
  app.put("/api/members/:memberId/programs/:companyId", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const companyId = req.params.companyId;
      const fields = req.body;
      
      const result = await storage.updateMemberProgramFields(memberId, companyId, fields);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/members/:memberId/programs/:companyId/fields", async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const companyId = req.params.companyId;
      const customFields = req.body;
      
      const result = await storage.updateMemberProgramCustomFields(memberId, companyId, customFields);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Activity log routes
  app.get("/api/activity/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getActivityLog(userId, limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update all points endpoint
  app.post("/api/dashboard/update-all-points", async (req, res) => {
    try {
      // Get all member programs
      const memberPrograms = await storage.getMemberPrograms();
      let updated = 0;
      
      // Simulate updating points (in real implementation, this would fetch from external APIs)
      for (const mp of memberPrograms) {
        // Add random points for demo purposes
        const randomPoints = Math.floor(Math.random() * 1000) + 100;
        await storage.updateMemberProgramFields(mp.memberId, mp.program.company, {
          pointsBalance: mp.pointsBalance + randomPoints,
          lastUpdated: new Date().toISOString()
        });
        updated++;
      }
      
      res.json({ updated });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Export data endpoint
  app.get("/api/dashboard/export", async (req, res) => {
    try {
      const members = await storage.getMembers();
      const programs = await storage.getPrograms();
      const memberPrograms = await storage.getMemberPrograms();
      
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        data: {
          members,
          programs,
          memberPrograms
        }
      };
      
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Import data endpoint
  app.post("/api/dashboard/import", async (req, res) => {
    try {
      const importData = req.body;
      let imported = 0;
      
      // Validate import data structure
      if (!importData.data || !importData.version) {
        throw new Error("Invalid import file format");
      }
      
      // Import members
      if (importData.data.members) {
        for (const member of importData.data.members) {
          try {
            await storage.createMember(member);
            imported++;
          } catch (e) {
            // Skip duplicates
          }
        }
      }
      
      // Import programs
      if (importData.data.programs) {
        for (const program of importData.data.programs) {
          try {
            await storage.createProgram(program);
            imported++;
          } catch (e) {
            // Skip duplicates
          }
        }
      }
      
      res.json({ imported });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
