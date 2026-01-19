import { useSystem } from "@/context/SystemContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchAndFilter } from "@/components/admin/SearchAndFilter";
import { StatsCards } from "@/components/admin/StatsCards";
import { QRCodeDisplay } from "@/components/admin/QRCodeDisplay";
import {
  Users,
  Clock,
  FileSpreadsheet,
  Presentation,
  Trash2,
  RefreshCw,
  UserCheck,
  Laptop,
  Lock,
  LogOut,
  Bell,
  BellOff,
  Settings,
  UserCog,
  Mail,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AttendanceRecord } from "@/context/SystemContext";

export default function AdminDashboard() {
  const {
    isAuthenticated,
    login,
    logout,
    sessionActive,
    activeSession,
    toggleSession,
    records,
    resetSession,
    exportData,
    searchRecords,
    getStats,
    bulkDelete,
    enableNotifications,
    setEnableNotifications
  } = useSystem();

  // Dashboard records (only current session)
  const dashboardRecords = activeSession
    ? records.filter(r => r.sessionId === activeSession.id)
    : [];

  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>(dashboardRecords);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [lateThreshold, setLateThreshold] = useState(15);
  const [stats, setStats] = useState<any>(null);
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [activeView, setActiveView] = useState<"attendance" | "students" | "sessions">("attendance");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<any>(null);

  // Load sessions
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const [sessionSearch, setSessionSearch] = useState("");

  const filteredSessions = sessions.filter(session => {
    const searchLower = sessionSearch.toLowerCase();
    const nameMatch = (session.name || "Untitled Session").toLowerCase().includes(searchLower);
    const dateMatch = format(new Date(session.startTime), "MMM dd, yyyy").toLowerCase().includes(searchLower);
    return nameMatch || dateMatch;
  });

  const exportSessionHistory = async (type: 'excel' | 'pdf') => {
    try {
      const dataToExport = filteredSessions.length > 0 ? filteredSessions : sessions;

      if (type === 'excel') {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(s => ({
          'Session Name': s.name || "Untitled Session",
          'Date': format(new Date(s.startTime), "MMM dd, yyyy"),
          'Start Time': format(new Date(s.startTime), "HH:mm:ss"),
          'End Time': s.endTime ? format(new Date(s.endTime), "HH:mm:ss") : "Active",
          'Status': s.isActive ? "Active" : "Closed"
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Session History");
        XLSX.writeFile(workbook, `Session_History_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
        toast.success("Current session history view exported to Excel");
      } else if (type === 'pdf') {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text("Session History Report", 14, 22);

        doc.setFontSize(11);
        doc.text(`Generated on: ${format(new Date(), "MMM dd, yyyy HH:mm:ss")}`, 14, 30);

        const tableColumn = ["Session Name", "Date", "Start Time", "End Time", "Status"];
        const tableRows = dataToExport.map(s => [
          s.name || "Untitled Session",
          format(new Date(s.startTime), "MMM dd, yyyy"),
          format(new Date(s.startTime), "HH:mm:ss"),
          s.endTime ? format(new Date(s.endTime), "HH:mm:ss") : "Active",
          s.isActive ? "Active" : "Closed"
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 40,
        });

        doc.save(`Session_History_${format(new Date(), "yyyy-MM-dd")}.pdf`);
        toast.success("Current session history view exported to PDF");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export history");
    }
  };

  const exportSpecificSession = async (session: any, type: 'excel' | 'pdf') => {
    if (!session || !session.records || session.records.length === 0) {
      toast.error("No records to export for this session");
      return;
    }

    try {
      if (type === 'excel') {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(session.records.map((r: any) => ({
          'Name': r.name,
          'Student ID': r.studentId,
          'Department': r.department || 'N/A',
          'Time': format(new Date(r.timestamp), "HH:mm:ss"),
          'Date': format(new Date(r.timestamp), "yyyy-MM-dd"),
          'Status': r.status
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
        XLSX.writeFile(workbook, `Attendance_${session.name || 'Session'}_${format(new Date(session.startTime), "yyyy-MM-dd")}.xlsx`);
        toast.success("Session attendance exported to Excel");
      } else if (type === 'pdf') {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Attendance: ${session.name || 'Untitled Session'}`, 14, 22);

        doc.setFontSize(11);
        doc.text(`Date: ${format(new Date(session.startTime), "MMMM dd, yyyy")}`, 14, 30);
        doc.text(`Total Present: ${session.records.length}`, 14, 37);

        const tableColumn = ["Name", "ID", "Department", "Time", "Status"];
        const tableRows = session.records.map((r: any) => [
          r.name,
          r.studentId,
          r.department || 'N/A',
          format(new Date(r.timestamp), "HH:mm:ss"),
          r.status
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 45,
        });

        doc.save(`Attendance_${session.name || 'Session'}_${format(new Date(session.startTime), "yyyy-MM-dd")}.pdf`);
        toast.success("Session attendance exported to PDF");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export session data");
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeView === "sessions") {
      loadSessions();
    }
  }, [isAuthenticated, activeView]);

  // Update filtered records when records or activeSession change
  useEffect(() => {
    setFilteredRecords(dashboardRecords);
  }, [records, activeSession, sessionActive]);

  // Load stats
  useEffect(() => {
    if (isAuthenticated) {
      getStats().then(setStats);
      const interval = setInterval(() => {
        getStats().then(setStats);
      }, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, getStats]);

  // Load registered students
  const loadRegisteredStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/admin/students");
      if (res.ok) {
        const data = await res.json();
        setRegisteredStudents(data.students || []);
      } else {
        toast.error("Failed to load registered students");
      }
    } catch (error) {
      console.error("Error loading students:", error);
      toast.error("Failed to load registered students");
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeView === "students") {
      loadRegisteredStudents();
    }
  }, [isAuthenticated, activeView]);

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm(`Are you sure you want to delete student ${studentId}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Student deleted successfully");
        loadRegisteredStudents();
      } else {
        toast.error("Failed to delete student");
      }
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isToggling, setIsToggling] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | undefined>();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);

    try {
      const result = await login(password);
      if (result.success) {
        toast.success("Login successful!");
        setPassword("");
        setRemainingAttempts(undefined);
      } else {
        setError(result.error || "Incorrect password. Please try again.");
        setRemainingAttempts(result.remainingAttempts);
        if (result.remainingAttempts !== undefined) {
          toast.error(`Incorrect password. ${result.remainingAttempts} attempt${result.remainingAttempts !== 1 ? 's' : ''} remaining.`);
        } else {
          toast.error(result.error || "Login failed");
        }
        setPassword("");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-xl border-primary/20">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Host Dashboard</CardTitle>
                  <CardDescription>Enter password to access admin panel</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11"
                      autoFocus
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-destructive"
                      >
                        {error}
                        {remainingAttempts !== undefined && (
                          <span className="block mt-1">
                            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                          </span>
                        )}
                      </motion.p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoggingIn}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  const handleExport = async (type: 'slides' | 'csv' | 'pdf' | 'excel') => {
    const promise = exportData(type);
    toast.promise(promise, {
      loading: `Generating ${type === 'slides' ? 'Google Slides' : type.toUpperCase()} report...`,
      success: `${type === 'slides' ? 'Google Slides' : type.toUpperCase()} exported successfully`,
      error: 'Export failed',
    });
  };

  const handleSearch = async (search: string) => {
    const results = await searchRecords(search);
    setFilteredRecords(results);
  };

  const handleFilter = async (filters: { department?: string; status?: string; dateRange?: string }) => {
    const results = await searchRecords("", filters);
    setFilteredRecords(results);
  };

  const handleSort = async (by: string, order: string) => {
    const results = await searchRecords("", undefined, { by, order });
    setFilteredRecords(results);
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedRecords.size} record(s)?`)) return;

    try {
      await bulkDelete(Array.from(selectedRecords));
      setSelectedRecords(new Set());
      toast.success(`Deleted ${selectedRecords.size} record(s)`);
    } catch (error) {
      toast.error("Failed to delete records");
    }
  };

  const handleToggleSession = async () => {
    if (isToggling) return;

    if (!sessionActive) {
      setShowSessionDialog(true);
      return;
    }

    setIsToggling(true);
    try {
      await toggleSession();
      await new Promise(resolve => setTimeout(resolve, 100));
      toast.success('Session stopped successfully');
    } catch (error: any) {
      toast.error(error?.message || "Failed to toggle session. Please try again.");
    } finally {
      setTimeout(() => setIsToggling(false), 500);
    }
  };

  const handleStartSession = async () => {
    await toggleSession(sessionName || undefined, lateThreshold);
    setShowSessionDialog(false);
    setSessionName("");
  };

  const chartData = stats?.departmentBreakdown
    ? Object.entries(stats.departmentBreakdown).map(([name, count]) => ({ name, count }))
    : [
      { name: 'CS', count: records.filter(r => r.department === 'CS').length },
      { name: 'IT', count: records.filter(r => r.department === 'IT').length },
      { name: 'ECE', count: records.filter(r => r.department === 'ECE').length },
      { name: 'MECH', count: records.filter(r => r.department === 'MECH').length },
    ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-8 px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage sessions, view live data, and export reports.</p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-card p-1 rounded-lg border">
            <Button
              variant={activeView === "attendance" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("attendance")}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Attendance
            </Button>
            <Button
              variant={activeView === "students" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("students")}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Students
            </Button>
            <Button
              variant={activeView === "sessions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView("sessions")}
            >
              <Clock className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>


          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-4 bg-card p-2 rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 px-2">
                <div className={`w-2.5 h-2.5 rounded-full ${sessionActive ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'} ${isToggling ? 'opacity-50' : ''}`} />
                <Label htmlFor="session-mode" className={`font-medium ${isToggling ? 'opacity-50' : ''}`}>
                  {isToggling ? 'Updating...' : (sessionActive ? 'Session Active' : 'Session Stopped')}
                </Label>
              </div>
              <Switch
                id="session-mode"
                checked={!!sessionActive}
                disabled={isToggling}
                onCheckedChange={handleToggleSession}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setEnableNotifications(!enableNotifications)}
              className="gap-2"
              size="sm"
            >
              {enableNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {enableNotifications ? 'Notifications On' : 'Notifications Off'}
            </Button>
            {selectedRecords.size > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete} className="gap-2" size="sm">
                <Trash2 className="h-4 w-4" />
                Delete ({selectedRecords.size})
              </Button>
            )}
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        {activeView === "attendance" && (
          <StatsCards records={dashboardRecords} sessionActive={sessionActive} />
        )}

        {/* Search and Filter - Only for attendance view */}
        {activeView === "attendance" && (
          <div className="mb-6">
            <SearchAndFilter
              onSearch={handleSearch}
              onFilter={handleFilter}
              onSort={handleSort}
            />
          </div>
        )}

        {/* Main Content */}
        {activeView === "students" ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registered Students</CardTitle>
                <CardDescription>View and manage all registered student accounts</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadRegisteredStudents} disabled={loadingStudents}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingStudents ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingStudents ? (
                <div className="text-center py-10 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Loading students...</p>
                </div>
              ) : registeredStudents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No registered students yet</p>
                  <p className="text-sm mt-2">Students will appear here after they register</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Phone</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registeredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono font-medium">{student.studentId}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student.department || "N/A"}</Badge>
                          </TableCell>
                          <TableCell>{student.year || "N/A"}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {student.email ? (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{student.email}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {student.phone ? (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">{student.phone}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {student.createdAt ? format(new Date(student.createdAt), "MMM dd, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student.studentId)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : activeView === "sessions" ? (
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>Session History</CardTitle>
                <CardDescription>View past attendance sessions.</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <SearchAndFilter
                    onSearch={(term) => setSessionSearch(term)}
                    hideFilter
                    hideSort
                    placeholder="Search sessions..."
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => exportSessionHistory('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportSessionHistory('pdf')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={loadSessions} disabled={loadingSessions}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingSessions ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="text-center py-10 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
                  <p>Loading sessions...</p>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recorded sessions found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.name || "Untitled Session"}</TableCell>
                          <TableCell>{format(new Date(session.startTime), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-mono text-sm">{format(new Date(session.startTime), "HH:mm:ss")}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {session.endTime ? format(new Date(session.endTime), "HH:mm:ss") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={session.isActive ? "default" : "secondary"} className={session.isActive ? "bg-emerald-500" : ""}>
                              {session.isActive ? "Active" : "Closed"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{session.records?.length || 0} Present</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSessionForDetails(session)}>
                              View Students
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <Dialog open={!!selectedSessionForDetails} onOpenChange={(open) => !open && setSelectedSessionForDetails(null)}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle>{selectedSessionForDetails?.name || "Session Details"}</DialogTitle>
                        <DialogDescription>
                          Date: {selectedSessionForDetails && format(new Date(selectedSessionForDetails.startTime), "MMM dd, yyyy")} |
                          Total: {selectedSessionForDetails?.records?.length || 0} Students
                        </DialogDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportSpecificSession(selectedSessionForDetails, 'excel')}
                          disabled={!selectedSessionForDetails?.records?.length}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Excel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportSpecificSession(selectedSessionForDetails, 'pdf')}
                          disabled={!selectedSessionForDetails?.records?.length}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSessionForDetails?.records?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">No attendance recorded</TableCell>
                          </TableRow>
                        ) : (
                          selectedSessionForDetails?.records?.map((record: any) => (
                            <TableRow key={record.id}>
                              <TableCell className="font-medium">{record.name}</TableCell>
                              <TableCell>{record.studentId}</TableCell>
                              <TableCell>{record.department || 'N/A'}</TableCell>
                              <TableCell className="text-sm font-mono">{format(new Date(record.timestamp), "HH:mm:ss")}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Live Attendance Feed</CardTitle>
                    <CardDescription>Real-time updates from client devices.</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedRecords(new Set(filteredRecords.map(r => r.id)));
                                } else {
                                  setSelectedRecords(new Set());
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>ID</TableHead>
                          <TableHead>Dept</TableHead>
                          <TableHead className="hidden md:table-cell">Device / IP</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                              No attendance records found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRecords.map((record) => (
                            <TableRow key={record.id} className="group hover:bg-muted/50">
                              <TableCell>
                                <Checkbox
                                  checked={selectedRecords.has(record.id)}
                                  onCheckedChange={(checked) => {
                                    const newSelected = new Set(selectedRecords);
                                    if (checked) {
                                      newSelected.add(record.id);
                                    } else {
                                      newSelected.delete(record.id);
                                    }
                                    setSelectedRecords(newSelected);
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {format(record.timestamp, 'HH:mm:ss')}
                              </TableCell>
                              <TableCell className="font-medium">{record.name}</TableCell>
                              <TableCell className="text-muted-foreground">{record.studentId}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="rounded-md font-normal">
                                  {record.department || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                <div>{record.device}</div>
                                <div className="opacity-50 font-mono">{record.ipAddress}</div>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  record.status === 'late'
                                    ? "bg-orange-500/15 text-orange-700 dark:text-orange-400 hover:bg-orange-500/25 border-0"
                                    : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-0"
                                }>
                                  {record.status === 'late' ? 'Late' : 'Present'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* QR Code */}
              <QRCodeDisplay />

              {/* Export Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions & Reports</CardTitle>
                  <CardDescription>Export data or manage session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => handleExport('slides')}
                    variant="outline"
                  >
                    <Presentation className="h-5 w-5 text-orange-500" />
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">Export to Google Slides</span>
                      <span className="text-xs text-muted-foreground">Generate presentation report</span>
                    </div>
                  </Button>
                  <Button
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => handleExport('csv')}
                    variant="outline"
                  >
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">Export CSV</span>
                      <span className="text-xs text-muted-foreground">Download raw data</span>
                    </div>
                  </Button>
                  <Button
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => handleExport('excel')}
                    variant="outline"
                  >
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">Export Excel</span>
                      <span className="text-xs text-muted-foreground">Formatted .xlsx report</span>
                    </div>
                  </Button>
                  <Button
                    className="w-full justify-start gap-3 h-12"
                    onClick={() => handleExport('pdf')}
                    variant="outline"
                  >
                    <FileSpreadsheet className="h-5 w-5 text-red-600" />
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">Export PDF</span>
                      <span className="text-xs text-muted-foreground">Printable document</span>
                    </div>
                  </Button>

                  <div className="h-px bg-border my-2" />

                  <Button
                    variant="destructive"
                    className="w-full justify-start gap-3"
                    onClick={async () => {
                      if (confirm('Are you sure you want to clear all records?')) {
                        await resetSession();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Reset / Clear Data
                  </Button>
                </CardContent>
              </Card>

              {/* Simple Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${index + 1}))`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Session Start Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Session</DialogTitle>
            <DialogDescription>
              Configure session settings before starting attendance collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Session Name (Optional)</Label>
              <Input
                id="session-name"
                placeholder="e.g., Morning Session, Class 10A"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late-threshold">Late Arrival Threshold (minutes)</Label>
              <Input
                id="late-threshold"
                type="number"
                min="1"
                max="60"
                value={lateThreshold}
                onChange={(e) => setLateThreshold(parseInt(e.target.value) || 15)}
              />
              <p className="text-xs text-muted-foreground">
                Students arriving after this time will be marked as late
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartSession}>
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
