import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertVisitorSchema, insertVisitRequestSchema, updateVisitRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = (await storage.getUser(req.user.claims.sub))?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { role } = req.query;
      const users = role ? await storage.getUsersByRole(role as string) : await storage.getUsersByRole('host');
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = (await storage.getUser(req.user.claims.sub))?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { isActive } = req.body;
      await storage.updateUserStatus(id, isActive);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Location routes
  app.get('/api/locations', async (req, res) => {
    try {
      const locations = await storage.getActiveLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post('/api/locations', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = (await storage.getUser(req.user.claims.sub))?.role;
      if (userRole !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const location = await storage.createLocation(req.body);
      res.json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  // Host routes
  app.get('/api/hosts', async (req, res) => {
    try {
      const hosts = await storage.getUsersByRole('host');
      res.json(hosts);
    } catch (error) {
      console.error("Error fetching hosts:", error);
      res.status(500).json({ message: "Failed to fetch hosts" });
    }
  });

  // Visitor registration route (public)
  app.post('/api/visitors/register', async (req, res) => {
    try {
      const validatedData = insertVisitorSchema.parse(req.body.visitor);
      const visitor = await storage.createVisitor(validatedData);

      const visitData = insertVisitRequestSchema.parse({
        ...req.body.visitRequest,
        visitorId: visitor.id,
      });
      const visitRequest = await storage.createVisitRequest(visitData);

      // Generate QR code data
      const qrCodeData = JSON.stringify({
        visitorId: visitor.id,
        visitRequestId: visitRequest.id,
        badgeNumber: visitor.badgeNumber,
      });

      res.json({
        visitor,
        visitRequest,
        qrCodeData,
        badgeNumber: visitor.badgeNumber,
      });
    } catch (error) {
      console.error("Error registering visitor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register visitor" });
    }
  });

  // Host dashboard routes
  app.get('/api/visit-requests/pending', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'host' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Host or admin access required" });
      }

      const requests = user.role === 'admin' 
        ? await storage.getPendingVisitRequests()
        : await storage.getVisitRequestsByHost(user.id, 'pending');
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  app.get('/api/visit-requests/today', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'host' && user.role !== 'admin' && user.role !== 'reception')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const requests = user.role === 'admin' || user.role === 'reception'
        ? await storage.getTodaysVisitRequests()
        : await storage.getVisitRequestsByHost(user.id);
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching today's requests:", error);
      res.status(500).json({ message: "Failed to fetch today's requests" });
    }
  });

  app.patch('/api/visit-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(req.user.claims.sub);
      
      if (!user) {
        return res.status(403).json({ message: "Access denied" });
      }

      const visitRequest = await storage.getVisitRequestById(parseInt(id));
      if (!visitRequest) {
        return res.status(404).json({ message: "Visit request not found" });
      }

      // Check permissions
      if (user.role === 'host' && visitRequest.hostId !== user.id) {
        return res.status(403).json({ message: "Can only approve your own visitor requests" });
      } else if (user.role !== 'host' && user.role !== 'admin' && user.role !== 'reception') {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = updateVisitRequestSchema.parse(req.body);
      const updated = await storage.updateVisitRequest(parseInt(id), validatedData);

      // Log the action
      await storage.createVisitLog({
        visitRequestId: parseInt(id),
        action: validatedData.status || (validatedData.checkedInAt ? 'check_in' : 'check_out'),
        performedBy: user.id,
        notes: validatedData.rejectionReason,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating visit request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update visit request" });
    }
  });

  // Reception routes
  app.get('/api/visitors/search', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'reception' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Reception or admin access required" });
      }

      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const visitors = await storage.searchVisitors(q);
      res.json(visitors);
    } catch (error) {
      console.error("Error searching visitors:", error);
      res.status(500).json({ message: "Failed to search visitors" });
    }
  });

  app.get('/api/visitors/badge/:badgeNumber', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'reception' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Reception or admin access required" });
      }

      const { badgeNumber } = req.params;
      const visitor = await storage.getVisitorByBadgeNumber(badgeNumber);
      
      if (!visitor) {
        return res.status(404).json({ message: "Visitor not found" });
      }

      res.json(visitor);
    } catch (error) {
      console.error("Error fetching visitor by badge:", error);
      res.status(500).json({ message: "Failed to fetch visitor" });
    }
  });

  app.get('/api/visit-requests/checked-in', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || (user.role !== 'reception' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Reception or admin access required" });
      }

      const checkedInVisitors = await storage.getCurrentlyCheckedInVisitors();
      res.json(checkedInVisitors);
    } catch (error) {
      console.error("Error fetching checked-in visitors:", error);
      res.status(500).json({ message: "Failed to fetch checked-in visitors" });
    }
  });

  // Statistics routes
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getVisitorStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Activity logs
  app.get('/api/activity', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(403).json({ message: "Access denied" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
