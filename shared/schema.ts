import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("host"), // admin, host, reception
  department: varchar("department"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Locations table
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  address: varchar("address").notNull(),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Visitors table
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  company: varchar("company"),
  photoUrl: varchar("photo_url"),
  badgeNumber: varchar("badge_number").unique(),
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Visit requests table
export const visitRequests = pgTable("visit_requests", {
  id: serial("id").primaryKey(),
  visitorId: integer("visitor_id").notNull(),
  hostId: varchar("host_id").notNull(),
  locationId: integer("location_id").notNull(),
  purpose: text("purpose").notNull(),
  visitDate: timestamp("visit_date").notNull(),
  duration: varchar("duration").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  checkedInAt: timestamp("checked_in_at"),
  checkedOutAt: timestamp("checked_out_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Visit logs table for tracking
export const visitLogs = pgTable("visit_logs", {
  id: serial("id").primaryKey(),
  visitRequestId: integer("visit_request_id").notNull(),
  action: varchar("action").notNull(), // check_in, check_out, approved, rejected
  performedBy: varchar("performed_by"),
  timestamp: timestamp("timestamp").defaultNow(),
  notes: text("notes"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  hostedVisits: many(visitRequests),
  performedLogs: many(visitLogs),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  visits: many(visitRequests),
}));

export const visitorsRelations = relations(visitors, ({ many }) => ({
  visitRequests: many(visitRequests),
}));

export const visitRequestsRelations = relations(visitRequests, ({ one, many }) => ({
  visitor: one(visitors, {
    fields: [visitRequests.visitorId],
    references: [visitors.id],
  }),
  host: one(users, {
    fields: [visitRequests.hostId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [visitRequests.locationId],
    references: [locations.id],
  }),
  logs: many(visitLogs),
}));

export const visitLogsRelations = relations(visitLogs, ({ one }) => ({
  visitRequest: one(visitRequests, {
    fields: [visitLogs.visitRequestId],
    references: [visitRequests.id],
  }),
  performedByUser: one(users, {
    fields: [visitLogs.performedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertVisitorSchema = createInsertSchema(visitors).omit({
  id: true,
  badgeNumber: true,
  qrCode: true,
  createdAt: true,
});

export const insertVisitRequestSchema = createInsertSchema(visitRequests).omit({
  id: true,
  status: true,
  checkedInAt: true,
  checkedOutAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVisitLogSchema = createInsertSchema(visitLogs).omit({
  id: true,
  timestamp: true,
});

// Update schemas
export const updateVisitRequestSchema = createInsertSchema(visitRequests)
  .pick({
    status: true,
    rejectionReason: true,
    checkedInAt: true,
    checkedOutAt: true,
  })
  .partial();

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = z.infer<typeof insertVisitorSchema>;
export type VisitRequest = typeof visitRequests.$inferSelect;
export type InsertVisitRequest = z.infer<typeof insertVisitRequestSchema>;
export type UpdateVisitRequest = z.infer<typeof updateVisitRequestSchema>;
export type VisitLog = typeof visitLogs.$inferSelect;
export type InsertVisitLog = z.infer<typeof insertVisitLogSchema>;

// Extended types with relations
export type VisitRequestWithDetails = VisitRequest & {
  visitor: Visitor;
  host: User;
  location: Location;
};
