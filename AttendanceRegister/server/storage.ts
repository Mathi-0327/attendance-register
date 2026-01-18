import { users, sessions, attendanceRecords, students, type User, type InsertUser, type AttendanceRecord, type InsertAttendance, type Session, type InsertSession, type Student, type InsertStudent } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { dbPool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Student methods
  getStudent(id: number): Promise<Student | undefined>;
  getStudentById(studentId: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  getAllStudents(): Promise<Student[]>;

  // Attendance methods
  createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord>;
  getAllAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceRecordById(id: number): Promise<AttendanceRecord | undefined>;
  deleteAttendanceRecord(id: number): Promise<boolean>;
  clearAllRecords(): Promise<void>;

  // Session management
  getSession(id: number): Promise<Session | undefined>;
  getActiveSession(): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, active: boolean, endTime?: Date): Promise<Session>;
  getAllSessions(): Promise<Session[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: dbPool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentById(studentId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
    return student;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(insertStudent).returning();
    return student;
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(desc(students.createdAt));
  }

  async createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord> {
    const [attendanceRecord] = await db.insert(attendanceRecords).values(record).returning();
    return attendanceRecord;
  }

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return await db.select().from(attendanceRecords).orderBy(desc(attendanceRecords.timestamp));
  }

  async getAttendanceRecordById(id: number): Promise<AttendanceRecord | undefined> {
    const [record] = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id));
    return record;
  }

  async deleteAttendanceRecord(id: number): Promise<boolean> {
    const result = await db.delete(attendanceRecords).where(eq(attendanceRecords.id, id)).returning();
    return result.length > 0;
  }

  async clearAllRecords(): Promise<void> {
    await db.delete(attendanceRecords);
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async getActiveSession(): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.isActive, true));
    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async updateSession(id: number, active: boolean, endTime?: Date): Promise<Session> {
    const [updatedSession] = await db
      .update(sessions)
      .set({ isActive: active, endTime: endTime })
      .where(eq(sessions.id, id))
      .returning();
    return updatedSession;
  }

  async getAllSessions(): Promise<Session[]> {
    return await db.select().from(sessions).orderBy(desc(sessions.startTime));
  }
}

export const storage = new DatabaseStorage();
