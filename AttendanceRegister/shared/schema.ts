import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Sessions Schema
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  name: text("name"),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  isActive: boolean("is_active").notNull().default(true),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// Attendance Records Schema
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id),
  name: text("name").notNull(),
  studentId: text("student_id").notNull(),
  department: text("department"),
  ipAddress: text("ip_address").notNull(),
  device: text("device").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").default("present").notNull(),
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).pick({
  name: true,
  studentId: true,
  department: true,
  ipAddress: true,
  device: true,
  status: true,
  timestamp: true,
  sessionId: true,
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Student Profile Schema
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  department: text("department"),
  year: text("year"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  studentId: true,
  name: true,
  email: true,
  phone: true,
  department: true,
  year: true,
  password: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Student registration validation schema
export const studentRegistrationSchema = z.object({
  studentId: z.string().min(3, "Student ID must be at least 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  year: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Student login schema
export const studentLoginSchema = z.object({
  studentId: z.string().min(3, "Student ID is required"),
  password: z.string().min(1, "Password is required"),
});

// Zod schema for API validation
export const attendanceFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  studentId: z.string().min(3, "ID is required"),
  department: z.string().optional(),
});

