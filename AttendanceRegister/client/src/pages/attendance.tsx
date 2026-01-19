import { useSystem } from "@/context/SystemContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Wifi, Lock, AlertCircle, WifiOff, UserCheck, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  studentId: z.string().min(3, "ID is required"),
  department: z.string().optional(),
});

export default function Attendance() {
  const { sessionActive, markAttendance } = useSystem();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<{ allowed: boolean; message: string; clientIp?: string; serverIp?: string } | null>(null);
  const [student, setStudent] = useState<any>(null);

  // Check if student is logged in
  useEffect(() => {
    const savedStudent = localStorage.getItem("student_data");
    const savedAuth = localStorage.getItem("student_authenticated");
    if (savedStudent && savedAuth === "true") {
      try {
        const studentData = JSON.parse(savedStudent);
        setStudent(studentData);
      } catch (e) {
        console.error("Error loading student data:", e);
      }
    }
  }, []);

  // Check network status on mount
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const res = await fetch("/api/network/check");
        const data = await res.json();
        setNetworkStatus(data);
      } catch (error) {
        console.error("Failed to check network status:", error);
      }
    };
    checkNetwork();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student?.name || "",
      studentId: student?.studentId || "",
      department: student?.department || "",
    },
  });

  // Update form when student data loads
  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        studentId: student.studentId,
        department: student.department || "",
      });
    }
  }, [student, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    try {
      await markAttendance(values);
      setSubmitted(true);
      form.reset();
    } catch (err: any) {
      // Check if it's a network access error
      const errorMessage = err.message || "Failed to submit attendance. Please try again.";
      if (errorMessage.includes("Network Access Denied") || errorMessage.includes("same network")) {
        setError(
          "Access Denied: You must be connected to the same Wi-Fi network as the server. " +
          "Please connect to the same network and try again."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Network Status Indicator */}
          {networkStatus && (
            <div className={`flex items-center justify-center gap-2 mb-8 text-sm rounded-full py-2 px-4 w-fit mx-auto border shadow-sm ${networkStatus.allowed
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}>
              {networkStatus.allowed ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="font-medium">{networkStatus.message}</span>
                  {networkStatus.serverIp && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs font-mono">Server: {networkStatus.serverIp}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="font-medium">{networkStatus.message}</span>
                </>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {networkStatus && !networkStatus.allowed ? (
              <motion.div
                key="network-error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-destructive/20 shadow-lg">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <WifiOff className="w-6 h-6 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive">Network Access Denied</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-muted-foreground space-y-2">
                    <p>{networkStatus.message}</p>
                    <p className="text-sm">
                      You must be connected to the same Wi-Fi network as the server to mark attendance.
                    </p>
                    {networkStatus.serverIp && (
                      <p className="text-xs font-mono mt-2">
                        Server IP: {networkStatus.serverIp}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : !sessionActive ? (
              <motion.div
                key="inactive"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-destructive/20 shadow-lg">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-destructive/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <CardTitle className="text-destructive">Session Inactive</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-muted-foreground">
                    Attendance is currently closed by the host. Please wait for the session to start.
                  </CardContent>
                </Card>
              </motion.div>
            ) : submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-emerald-500/20 shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                  <CardHeader className="text-center pb-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="mx-auto bg-emerald-100 dark:bg-emerald-900/30 w-20 h-20 rounded-full flex items-center justify-center mb-4"
                    >
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                    <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-400">Attendance Recorded</CardTitle>
                    <CardDescription>Your presence has been logged successfully.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm space-y-2 border">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{form.getValues().name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Session ID:</span>
                        <span className="font-mono text-xs">#SES-2024-8X</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="shadow-xl border-primary/10">
                  <CardHeader>
                    <CardTitle className="text-2xl">Mark Attendance</CardTitle>
                    <CardDescription>
                      {student
                        ? `Logged in as ${student.name} (${student.studentId})`
                        : "Enter your details to clock in for today's session."
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!student && (
                      <Alert className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                        <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertTitle className="text-blue-900 dark:text-blue-100">Register for Better Experience</AlertTitle>
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                          <p className="mb-2">
                            Register your account to automatically fill your details and track your attendance history.
                          </p>
                          <Link href="/student">
                            <Button variant="outline" size="sm" className="mt-2">
                              Register / Login
                            </Button>
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}
                    {student && (
                      <Alert className="mb-6 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                        <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertTitle className="text-emerald-900 dark:text-emerald-100">Registered Student</AlertTitle>
                        <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                          Your details are pre-filled from your registered profile. You can view your attendance history in the{" "}
                          <Link href="/student" className="underline font-medium">Student Portal</Link>.
                        </AlertDescription>
                      </Alert>
                    )}
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John Doe"
                                  {...field}
                                  className="h-11"
                                  disabled={!!student}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="studentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Student / Employee ID</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="ID-12345"
                                  {...field}
                                  className="h-11 font-mono"
                                  disabled={!!student}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select Department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="CS">Computer Science</SelectItem>
                                  <SelectItem value="IT">Information Technology</SelectItem>
                                  <SelectItem value="ECE">Electronics</SelectItem>
                                  <SelectItem value="MECH">Mechanical</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {error && (
                          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                            {error}
                          </div>
                        )}
                        <Button
                          type="submit"
                          className="w-full h-12 text-lg font-medium bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Attendance"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
