import { type User, type InsertUser, type AttendanceRecord, type InsertAttendance } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // Attendance methods
  createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord>;
  getAllAttendanceRecords(): Promise<AttendanceRecord[]>;
  getAttendanceRecordById(id: string): Promise<AttendanceRecord | undefined>;
  deleteAttendanceRecord(id: string): Promise<boolean>;
  clearAllRecords(): Promise<void>;
  // Session management
  isSessionActive(): boolean;
  setSessionActive(active: boolean): void;
  // Per-session device claiming: the device that is allowed to submit during the active session
  getSessionClaimingDevice(): string | null;
  setSessionClaimingDevice(deviceId: string | null): void;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private attendanceRecords: Map<string, AttendanceRecord>;
  private sessionActive: boolean;
  // Which device has claimed the current active session (null = no claim yet)
  private sessionClaimingDevice: string | null;

  constructor() {
    this.users = new Map();
    this.attendanceRecords = new Map();
    this.sessionActive = false; // Start with session inactive
    this.sessionClaimingDevice = null;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord> {
    const id = randomUUID();
    const attendanceRecord: AttendanceRecord = {
      ...record,
      id,
      timestamp: new Date(),
    };
    this.attendanceRecords.set(id, attendanceRecord);
    return attendanceRecord;
  }

  async getAllAttendanceRecords(): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAttendanceRecordById(id: string): Promise<AttendanceRecord | undefined> {
    return this.attendanceRecords.get(id);
  }

  async deleteAttendanceRecord(id: string): Promise<boolean> {
    return this.attendanceRecords.delete(id);
  }

  async clearAllRecords(): Promise<void> {
    this.attendanceRecords.clear();
  }

  isSessionActive(): boolean {
    return this.sessionActive;
  }

  setSessionActive(active: boolean): void {
    this.sessionActive = active;
    // When a new session becomes active, reset the claiming device so first submit can claim it.
    // When session becomes inactive, also clear the claim.
    if (!active) {
      this.sessionClaimingDevice = null;
    } else {
      this.sessionClaimingDevice = null;
    }
  }

  getSessionClaimingDevice(): string | null {
    return this.sessionClaimingDevice;
  }

  setSessionClaimingDevice(deviceId: string | null): void {
    this.sessionClaimingDevice = deviceId;
  }
}

export const storage = new MemStorage();
