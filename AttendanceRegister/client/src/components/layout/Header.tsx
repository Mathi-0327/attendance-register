import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ClipboardCheck, LayoutDashboard, UserCircle } from "lucide-react";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-primary hover:opacity-90 transition-opacity">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <span>Attend<span className="text-foreground">Reg</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link 
            href="/attendance"
            className={cn(
              "transition-colors hover:text-primary",
              location === "/attendance" ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            Student Access
          </Link>
          <Link 
            href="/admin"
            className={cn(
              "transition-colors hover:text-primary",
              location === "/admin" ? "text-primary font-semibold" : "text-muted-foreground"
            )}
          >
            Admin Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link 
            href="/admin"
            className="flex items-center gap-2 text-sm font-medium bg-secondary/50 hover:bg-secondary px-3 py-2 rounded-md transition-colors"
          >
            <UserCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Host Login</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
