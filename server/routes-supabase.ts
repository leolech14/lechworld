import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-supabase";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  insertUserSchema, insertFamilyMemberSchema, insertLoyaltyProgramSchema, 
  insertMemberProgramSchema, insertActivityLogSchema 
} from "@shared/schema";

// JWT middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Compare with bcrypt
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: "login",
        description: "User logged in",
        metadata: { email },
      });
      
      res.json({ 
        user: { ...user, password: undefined },
        token 
      });
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
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      // Log activity
      await storage.logActivity({
        userId: user.id,
        action: "register",
        description: "New user registered",
        metadata: { email: user.email },
      });
      
      res.status(201).json({ 
        user: { ...user, password: undefined },
        token 
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Protected routes - add authenticateToken middleware
  app.get("/api/dashboard/stats/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Verify user can only access their own data
      if (req.user.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/members-with-programs/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Verify user can only access their own data
      if (req.user.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const membersWithPrograms = await storage.getMembersWithPrograms(userId);
      res.json(membersWithPrograms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Family member routes
  app.get("/api/members/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Verify user can only access their own data
      if (req.user.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const members = await storage.getFamilyMembers(userId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/members", authenticateToken, async (req, res) => {
    try {
      const memberData = insertFamilyMemberSchema.parse(req.body);
      
      // Ensure user can only create members for themselves
      memberData.userId = req.user.userId;
      
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

  app.put("/api/members/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Verify member belongs to user
      const member = await storage.getFamilyMember(id);
      if (!member || member.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedMember = await storage.updateFamilyMember(id, updateData);
      
      // Log activity
      await storage.logActivity({
        userId: updatedMember.userId!,
        action: "update_member",
        description: `Updated family member: ${updatedMember.name}`,
        metadata: { memberId: updatedMember.id, memberName: updatedMember.name },
      });
      
      res.json(updatedMember);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/members/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const member = await storage.getFamilyMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Verify member belongs to user
      if (member.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
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

  // Loyalty program routes (public - no auth needed)
  app.get("/api/programs", async (req, res) => {
    try {
      const programs = await storage.getLoyaltyPrograms();
      res.json(programs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/programs", authenticateToken, async (req, res) => {
    try {
      const programData = insertLoyaltyProgramSchema.parse(req.body);
      const program = await storage.createLoyaltyProgram(programData);
      res.status(201).json(program);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/programs/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const program = await storage.updateLoyaltyProgram(id, updateData);
      res.json(program);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/programs/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLoyaltyProgram(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Member program routes
  app.get("/api/member-programs/:memberId", authenticateToken, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      
      // Verify member belongs to user
      const member = await storage.getFamilyMember(memberId);
      if (!member || member.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const programs = await storage.getMemberPrograms(memberId);
      res.json(programs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/member-programs", authenticateToken, async (req, res) => {
    try {
      const memberProgramData = insertMemberProgramSchema.parse(req.body);
      
      // Verify member belongs to user
      const member = await storage.getFamilyMember(memberProgramData.memberId!);
      if (!member || member.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const memberProgram = await storage.createMemberProgram(memberProgramData);
      
      // Get program for logging
      const program = await storage.getLoyaltyProgram(memberProgram.programId!);
      
      // Log activity
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
      
      res.status(201).json(memberProgram);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/member-programs/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Get member program to verify ownership
      const memberProgram = await storage.getMemberProgram(id);
      if (!memberProgram) {
        return res.status(404).json({ message: "Member program not found" });
      }
      
      // Verify member belongs to user
      const member = await storage.getFamilyMember(memberProgram.memberId!);
      if (!member || member.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedMemberProgram = await storage.updateMemberProgram(id, updateData);
      
      // Get program for logging
      const program = await storage.getLoyaltyProgram(updatedMemberProgram.programId!);
      
      // Log activity
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
      
      res.json(updatedMemberProgram);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/member-programs/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const memberProgram = await storage.getMemberProgram(id);
      
      if (!memberProgram) {
        return res.status(404).json({ message: "Member program not found" });
      }
      
      // Get member and verify ownership
      const member = await storage.getFamilyMember(memberProgram.memberId!);
      if (!member || member.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const program = await storage.getLoyaltyProgram(memberProgram.programId!);
      
      await storage.deleteMemberProgram(id);
      
      // Log activity
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
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Member program field update routes
  app.put("/api/members/:memberId/programs/:companyId", authenticateToken, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const companyId = req.params.companyId;
      const fields = req.body;
      
      // Verify member belongs to user
      const member = await storage.getFamilyMember(memberId);
      if (!member || member.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const result = await storage.updateMemberProgramFields(memberId, companyId, fields);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/members/:memberId/programs/:companyId/fields", authenticateToken, async (req, res) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const companyId = req.params.companyId;
      const customFields = req.body;
      
      // Verify member belongs to user
      const member = await storage.getFamilyMember(memberId);
      if (!member || member.userId !== req.user.userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const result = await storage.updateMemberProgramCustomFields(memberId, companyId, customFields);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Activity log routes
  app.get("/api/activity/:userId", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Verify user can only access their own data
      if (req.user.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getActivityLog(userId, limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}