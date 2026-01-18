import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Users, ArrowRight, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl w-full">
          
          {/* Student Access Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/attendance" className="block h-full group">
              <Card className="h-full border-2 border-transparent hover:border-primary/20 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="w-32 h-32" />
                  </div>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Users className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Student Access</CardTitle>
                    <CardDescription>Mark your daily attendance securely.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-primary font-medium mt-4 group-hover:translate-x-1 transition-transform">
                      Go to Attendance Form <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Student Portal Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link href="/student" className="block h-full group">
              <Card className="h-full border-2 border-transparent hover:border-blue-500/20 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden bg-blue-50/50 dark:bg-blue-900/10">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Search className="w-32 h-32" />
                  </div>
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Search className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                    </div>
                    <CardTitle className="text-2xl">Student Portal</CardTitle>
                    <CardDescription>View your attendance history.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                      Check Records <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Host Access Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/admin" className="block h-full group">
              <Card className="h-full border-2 border-transparent hover:border-slate-800/20 dark:hover:border-slate-400/20 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck className="w-32 h-32" />
                  </div>
                  <CardHeader>
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <ShieldCheck className="w-6 h-6 text-slate-700 dark:text-slate-300 group-hover:text-white" />
                    </div>
                    <CardTitle className="text-2xl">Host Dashboard</CardTitle>
                    <CardDescription>Manage sessions and view reports.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-slate-700 dark:text-slate-300 font-medium mt-4 group-hover:translate-x-1 transition-transform">
                      Admin Login <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
              </Card>
            </Link>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
