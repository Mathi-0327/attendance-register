import { db } from "../server/db";
import { users, students, attendanceRecords } from "@shared/schema";

async function viewData() {
    console.log("--- FETCHING DATABASE CONTENTS ---");

    try {
        const allUsers = await db.select().from(users);
        console.log(`\n[Users] (${allUsers.length}):`);
        console.table(allUsers.map(u => ({ ...u, password: '***' }))); // Hide passwords

        const allStudents = await db.select().from(students);
        console.log(`\n[Students] (${allStudents.length}):`);
        console.table(allStudents.map(s => ({
            id: s.id.substring(0, 8) + '...',
            name: s.name,
            studentId: s.studentId,
            dept: s.department
        })));

        const allRecords = await db.select().from(attendanceRecords);
        console.log(`\n[Attendance Records] (${allRecords.length}):`);
        console.table(allRecords.map(r => ({
            name: r.name,
            status: r.status,
            time: r.timestamp,
            device: r.device
        })));

    } catch (error) {
        console.error("Error reading database:", error);
    } finally {
        process.exit(0);
    }
}

viewData();
