import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { AttendanceRecord } from "@/context/SystemContext";

interface StatsCardsProps {
  records: AttendanceRecord[];
  sessionActive: boolean;
}

export function StatsCards({ records, sessionActive }: StatsCardsProps) {
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const onTimeRate = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Present</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{total}</div>
          <p className="text-xs text-muted-foreground">Students recorded</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">On Time</CardTitle>
          <Clock className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">{present}</div>
          <p className="text-xs text-muted-foreground">{onTimeRate}% on-time rate</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{late}</div>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? ((late / total) * 100).toFixed(1) : 0}% late rate
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Session Status</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sessionActive ? "Active" : "Stopped"}</div>
          <p className="text-xs text-muted-foreground">
            {sessionActive ? "Accepting attendance" : "Session closed"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


