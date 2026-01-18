import { useSystem } from "@/context/SystemContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, User, Calendar, Clock, CheckCircle2, AlertCircle,
  UserPlus, LogIn, LogOut, Settings, Download, TrendingUp,
  BarChart3, FileText, Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { AttendanceRecord } from "@/context/SystemContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface Student {
  id: string;
  studentId: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  year?: string;
}

export default function StudentPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [streak, setStreak] = useState(0);

  // Registration form state
  const [regForm, setRegForm] = useState({
    studentId: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    password: "",
    confirmPassword: "",
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    studentId: "",
    password: "",
  });

  // Profile edit state
  const [editProfile, setEditProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    year: "",
  });

  // Check if student is logged in
  useEffect(() => {
    const savedStudent = localStorage.getItem("student_data");
    const savedAuth = localStorage.getItem("student_authenticated");
    if (savedStudent && savedAuth === "true") {
      try {
        const studentData = JSON.parse(savedStudent);
        setStudent(studentData);
        setIsAuthenticated(true);
        loadStudentData(studentData.studentId);
      } catch (e) {
        console.error("Error loading student data:", e);
      }
    }
  }, []);

  const loadStudentData = async (studentId: string) => {
    try {
      // Load attendance records
      const recordsRes = await fetch(`/api/students/${studentId}/attendance`);
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        const formattedRecords = data.records.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }));
        setRecords(formattedRecords);
      }

      // Load streak
      const streakRes = await fetch(`/api/students/${studentId}/streak`);
      if (streakRes.ok) {
        const data = await streakRes.json();
        setStreak(data.streak || 0);
      }

    } catch (error) {
      console.error("Error loading student data:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regForm.password !== regForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (regForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: regForm.studentId,
          name: regForm.name,
          email: regForm.email || undefined,
          phone: regForm.phone || undefined,
          department: regForm.department,
          year: regForm.year || undefined,
          password: regForm.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Registration successful! Please login.");
        setRegForm({
          studentId: "",
          name: "",
          email: "",
          phone: "",
          department: "",
          year: "",
          password: "",
          confirmPassword: "",
        });
        setActiveTab("login");
      } else {
        toast.error(data.message || data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/students/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setStudent(data.student);
        localStorage.setItem("student_data", JSON.stringify(data.student));
        localStorage.setItem("student_authenticated", "true");
        toast.success("Login successful!");
        await loadStudentData(data.student.studentId);
        setActiveTab("dashboard");
      } else {
        toast.error(data.message || data.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setStudent(null);
    setRecords([]);
    localStorage.removeItem("student_data");
    localStorage.removeItem("student_authenticated");
    toast.success("Logged out successfully");
    setActiveTab("login");
  };

  const handleUpdateProfile = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${student.studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProfile),
      });

      const data = await res.json();
      if (res.ok) {
        setStudent(data.student);
        localStorage.setItem("student_data", JSON.stringify(data.student));
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportAttendance = () => {
    if (records.length === 0) {
      toast.error("No records to export");
      return;
    }

    const csv = [
      ["Date", "Time", "Name", "Student ID", "Department", "Status"].join(","),
      ...records.map(r => [
        format(r.timestamp, "yyyy-MM-dd"),
        format(r.timestamp, "HH:mm:ss"),
        r.name,
        r.studentId,
        r.department || "N/A",
        r.status,
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${student?.studentId || "records"}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Attendance data exported!");
  };

  // Statistics calculations
  const totalRecords = records.length;
  const presentCount = records.filter(r => r.status === "present").length;
  const lateCount = records.filter(r => r.status === "late").length;
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0";

  // Chart data
  const statusChartData = [
    { name: "Present", value: presentCount, color: "#10b981" },
    { name: "Late", value: lateCount, color: "#f59e0b" },
  ];

  // Monthly attendance data
  const monthlyData = records.reduce((acc, record) => {
    const month = format(record.timestamp, "MMM yyyy");
    if (!acc[month]) {
      acc[month] = { month, present: 0, late: 0 };
    }
    if (record.status === "present") acc[month].present++;
    else acc[month].late++;
    return acc;
  }, {} as Record<string, { month: string; present: number; late: number }>);

  const monthlyChartData = Object.values(monthlyData).slice(-6).reverse();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-8 px-4 md:px-8 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Student Portal</h1>
            <p className="text-muted-foreground">Register or login to access your attendance records</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register">
                <UserPlus className="h-4 w-4 mr-2" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Student Login</CardTitle>
                  <CardDescription>Enter your credentials to access your attendance records</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-student-id">Student ID</Label>
                      <Input
                        id="login-student-id"
                        placeholder="Enter your Student ID"
                        value={loginForm.studentId}
                        onChange={(e) => setLoginForm({ ...loginForm, studentId: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Student Registration</CardTitle>
                  <CardDescription>Create an account to track your attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-student-id">Student ID *</Label>
                        <Input
                          id="reg-student-id"
                          placeholder="Enter your Student ID"
                          value={regForm.studentId}
                          onChange={(e) => setRegForm({ ...regForm, studentId: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-name">Full Name *</Label>
                        <Input
                          id="reg-name"
                          placeholder="Enter your full name"
                          value={regForm.name}
                          onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-department">Department *</Label>
                        <Select
                          value={regForm.department}
                          onValueChange={(value) => setRegForm({ ...regForm, department: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CS">Computer Science</SelectItem>
                            <SelectItem value="IT">Information Technology</SelectItem>
                            <SelectItem value="ECE">Electronics</SelectItem>
                            <SelectItem value="MECH">Mechanical</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-year">Year (Optional)</Label>
                        <Input
                          id="reg-year"
                          placeholder="e.g., 2024, 1st Year"
                          value={regForm.year}
                          onChange={(e) => setRegForm({ ...regForm, year: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email (Optional)</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={regForm.email}
                          onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone">Phone (Optional)</Label>
                        <Input
                          id="reg-phone"
                          placeholder="+1234567890"
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password *</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Minimum 6 characters"
                          value={regForm.password}
                          onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-confirm-password">Confirm Password *</Label>
                        <Input
                          id="reg-confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={regForm.confirmPassword}
                          onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    );
  }

  // Authenticated view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-8 px-4 md:px-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
              Welcome, {student?.name}!
            </h1>
            <p className="text-muted-foreground">Student ID: {student?.studentId}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRecords}</div>
                  <p className="text-xs text-muted-foreground">Attendance entries</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">On Time</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0}% on time
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                    {streak} <span className="text-lg">days</span>
                    {streak >= 3 && <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">🔥 On Fire!</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">Consecutive days attended</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{attendanceRate}%</div>
                  <p className="text-xs text-muted-foreground">Overall attendance</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Attendance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Attendance</CardTitle>
                  <CardDescription>Your last 5 attendance records</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportAttendance}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {records.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.slice(0, 5).map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{format(record.timestamp, "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {format(record.timestamp, "HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{record.department || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                record.status === 'late'
                                  ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              }>
                                {record.status === 'late' ? 'Late' : 'Present'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance records yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Attendance History</CardTitle>
                  <CardDescription>Complete list of your attendance records</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={exportAttendance}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                {records.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{format(record.timestamp, "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {format(record.timestamp, "HH:mm:ss")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{record.department || "N/A"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                record.status === 'late'
                                  ? "bg-orange-500/15 text-orange-700 dark:text-orange-400"
                                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              }>
                                {record.status === 'late' ? 'Late' : 'Present'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Status</CardTitle>
                  <CardDescription>Present vs Late breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Attendance Trend</CardTitle>
                  <CardDescription>Last 6 months attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#10b981" name="Present" />
                      <Bar dataKey="late" fill="#f59e0b" name="Late" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <Input value={student?.studentId || ""} disabled />
                    <p className="text-xs text-muted-foreground">Student ID cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input
                      id="edit-name"
                      value={editProfile.name || student?.name || ""}
                      onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editProfile.email !== undefined ? editProfile.email : (student?.email || "")}
                      onChange={(e) => setEditProfile({ ...editProfile, email: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editProfile.phone !== undefined ? editProfile.phone : (student?.phone || "")}
                      onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Select
                      value={editProfile.department || student?.department || ""}
                      onValueChange={(value) => setEditProfile({ ...editProfile, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CS">Computer Science</SelectItem>
                        <SelectItem value="IT">Information Technology</SelectItem>
                        <SelectItem value="ECE">Electronics</SelectItem>
                        <SelectItem value="MECH">Mechanical</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-year">Year</Label>
                    <Input
                      id="edit-year"
                      value={editProfile.year !== undefined ? editProfile.year : (student?.year || "")}
                      onChange={(e) => setEditProfile({ ...editProfile, year: e.target.value })}
                      placeholder="e.g., 2024, 1st Year"
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateProfile} disabled={loading}>
                  <Settings className="h-4 w-4 mr-2" />
                  {loading ? "Updating..." : "Update Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
