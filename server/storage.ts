import {
  users,
  locations,
  visitors,
  visitRequests,
  visitLogs,
  type User,
  type UpsertUser,
  type Location,
  type InsertLocation,
  type Visitor,
  type InsertVisitor,
  type VisitRequest,
  type InsertVisitRequest,
  type UpdateVisitRequest,
  type VisitLog,
  type InsertVisitLog,
  type VisitRequestWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, isNull, isNotNull, count } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUserStatus(id: string, isActive: boolean): Promise<void>;

  // Location operations
  getLocations(): Promise<Location[]>;
  getActiveLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;

  // Visitor operations
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  getVisitorById(id: number): Promise<Visitor | undefined>;
  getVisitorByBadgeNumber(badgeNumber: string): Promise<Visitor | undefined>;
  searchVisitors(query: string): Promise<Visitor[]>;

  // Visit request operations
  createVisitRequest(request: InsertVisitRequest): Promise<VisitRequest>;
  getVisitRequestById(id: number): Promise<VisitRequestWithDetails | undefined>;
  getVisitRequestsByHost(hostId: string, status?: string): Promise<VisitRequestWithDetails[]>;
  getVisitRequestsByDate(date: Date): Promise<VisitRequestWithDetails[]>;
  getTodaysVisitRequests(): Promise<VisitRequestWithDetails[]>;
  getPendingVisitRequests(): Promise<VisitRequestWithDetails[]>;
  getCurrentlyCheckedInVisitors(): Promise<VisitRequestWithDetails[]>;
  updateVisitRequest(id: number, updates: UpdateVisitRequest): Promise<VisitRequest>;
  
  // Visit log operations
  createVisitLog(log: InsertVisitLog): Promise<VisitLog>;
  getVisitLogsByRequest(visitRequestId: number): Promise<VisitLog[]>;
  getRecentActivity(limit?: number): Promise<VisitLog[]>;

  // Statistics
  getVisitorStats(): Promise<{
    totalVisitors: number;
    todaysVisitors: number;
    currentlyCheckedIn: number;
    thisWeekTotal: number;
    pendingApprovals: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(and(eq(users.role, role), eq(users.isActive, true)));
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<void> {
    await db.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, id));
  }

  // Location operations
  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(locations.name);
  }

  async getActiveLocations(): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.isActive, true)).orderBy(locations.name);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  // Visitor operations
  async createVisitor(visitor: InsertVisitor): Promise<Visitor> {
    const badgeNumber = `VIS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const [newVisitor] = await db
      .insert(visitors)
      .values({ ...visitor, badgeNumber })
      .returning();
    return newVisitor;
  }

  async getVisitorById(id: number): Promise<Visitor | undefined> {
    const [visitor] = await db.select().from(visitors).where(eq(visitors.id, id));
    return visitor;
  }

  async getVisitorByBadgeNumber(badgeNumber: string): Promise<Visitor | undefined> {
    const [visitor] = await db.select().from(visitors).where(eq(visitors.badgeNumber, badgeNumber));
    return visitor;
  }

  async searchVisitors(query: string): Promise<Visitor[]> {
    return await db
      .select()
      .from(visitors)
      .where(
        and(
          // Simple text search - in production, consider using full-text search
          eq(visitors.firstName, query)
        )
      )
      .limit(10);
  }

  // Visit request operations
  async createVisitRequest(request: InsertVisitRequest): Promise<VisitRequest> {
    const [newRequest] = await db.insert(visitRequests).values(request).returning();
    return newRequest;
  }

  async getVisitRequestById(id: number): Promise<VisitRequestWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(visitRequests)
      .leftJoin(visitors, eq(visitRequests.visitorId, visitors.id))
      .leftJoin(users, eq(visitRequests.hostId, users.id))
      .leftJoin(locations, eq(visitRequests.locationId, locations.id))
      .where(eq(visitRequests.id, id));

    if (!result || !result.visitors || !result.users || !result.locations) {
      return undefined;
    }

    return {
      ...result.visit_requests,
      visitor: result.visitors,
      host: result.users,
      location: result.locations,
    };
  }

  async getVisitRequestsByHost(hostId: string, status?: string): Promise<VisitRequestWithDetails[]> {
    const conditions = [eq(visitRequests.hostId, hostId)];
    if (status) {
      conditions.push(eq(visitRequests.status, status));
    }

    const results = await db
      .select()
      .from(visitRequests)
      .leftJoin(visitors, eq(visitRequests.visitorId, visitors.id))
      .leftJoin(users, eq(visitRequests.hostId, users.id))
      .leftJoin(locations, eq(visitRequests.locationId, locations.id))
      .where(and(...conditions))
      .orderBy(desc(visitRequests.createdAt));

    return results
      .filter(result => result.visitors && result.users && result.locations)
      .map(result => ({
        ...result.visit_requests,
        visitor: result.visitors!,
        host: result.users!,
        location: result.locations!,
      }));
  }

  async getVisitRequestsByDate(date: Date): Promise<VisitRequestWithDetails[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await db
      .select()
      .from(visitRequests)
      .leftJoin(visitors, eq(visitRequests.visitorId, visitors.id))
      .leftJoin(users, eq(visitRequests.hostId, users.id))
      .leftJoin(locations, eq(visitRequests.locationId, locations.id))
      .where(and(gte(visitRequests.visitDate, startOfDay), lte(visitRequests.visitDate, endOfDay)))
      .orderBy(visitRequests.visitDate);

    return results
      .filter(result => result.visitors && result.users && result.locations)
      .map(result => ({
        ...result.visit_requests,
        visitor: result.visitors!,
        host: result.users!,
        location: result.locations!,
      }));
  }

  async getTodaysVisitRequests(): Promise<VisitRequestWithDetails[]> {
    return this.getVisitRequestsByDate(new Date());
  }

  async getPendingVisitRequests(): Promise<VisitRequestWithDetails[]> {
    const results = await db
      .select()
      .from(visitRequests)
      .leftJoin(visitors, eq(visitRequests.visitorId, visitors.id))
      .leftJoin(users, eq(visitRequests.hostId, users.id))
      .leftJoin(locations, eq(visitRequests.locationId, locations.id))
      .where(eq(visitRequests.status, "pending"))
      .orderBy(desc(visitRequests.createdAt));

    return results
      .filter(result => result.visitors && result.users && result.locations)
      .map(result => ({
        ...result.visit_requests,
        visitor: result.visitors!,
        host: result.users!,
        location: result.locations!,
      }));
  }

  async getCurrentlyCheckedInVisitors(): Promise<VisitRequestWithDetails[]> {
    const results = await db
      .select()
      .from(visitRequests)
      .leftJoin(visitors, eq(visitRequests.visitorId, visitors.id))
      .leftJoin(users, eq(visitRequests.hostId, users.id))
      .leftJoin(locations, eq(visitRequests.locationId, locations.id))
      .where(and(isNotNull(visitRequests.checkedInAt), isNull(visitRequests.checkedOutAt)))
      .orderBy(visitRequests.checkedInAt);

    return results
      .filter(result => result.visitors && result.users && result.locations)
      .map(result => ({
        ...result.visit_requests,
        visitor: result.visitors!,
        host: result.users!,
        location: result.locations!,
      }));
  }

  async updateVisitRequest(id: number, updates: UpdateVisitRequest): Promise<VisitRequest> {
    const [updated] = await db
      .update(visitRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(visitRequests.id, id))
      .returning();
    return updated;
  }

  // Visit log operations
  async createVisitLog(log: InsertVisitLog): Promise<VisitLog> {
    const [newLog] = await db.insert(visitLogs).values(log).returning();
    return newLog;
  }

  async getVisitLogsByRequest(visitRequestId: number): Promise<VisitLog[]> {
    return await db
      .select()
      .from(visitLogs)
      .where(eq(visitLogs.visitRequestId, visitRequestId))
      .orderBy(desc(visitLogs.timestamp));
  }

  async getRecentActivity(limit = 10): Promise<VisitLog[]> {
    return await db
      .select()
      .from(visitLogs)
      .orderBy(desc(visitLogs.timestamp))
      .limit(limit);
  }

  // Statistics
  async getVisitorStats(): Promise<{
    totalVisitors: number;
    todaysVisitors: number;
    currentlyCheckedIn: number;
    thisWeekTotal: number;
    pendingApprovals: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalVisitors] = await db.select({ count: count() }).from(visitors);
    
    const [todaysVisitors] = await db
      .select({ count: count() })
      .from(visitRequests)
      .where(and(gte(visitRequests.visitDate, startOfDay), lte(visitRequests.visitDate, endOfDay)));

    const [currentlyCheckedIn] = await db
      .select({ count: count() })
      .from(visitRequests)
      .where(and(isNotNull(visitRequests.checkedInAt), isNull(visitRequests.checkedOutAt)));

    const [thisWeekTotal] = await db
      .select({ count: count() })
      .from(visitRequests)
      .where(gte(visitRequests.visitDate, startOfWeek));

    const [pendingApprovals] = await db
      .select({ count: count() })
      .from(visitRequests)
      .where(eq(visitRequests.status, "pending"));

    return {
      totalVisitors: totalVisitors.count,
      todaysVisitors: todaysVisitors.count,
      currentlyCheckedIn: currentlyCheckedIn.count,
      thisWeekTotal: thisWeekTotal.count,
      pendingApprovals: pendingApprovals.count,
    };
  }
}

export const storage = new DatabaseStorage();
