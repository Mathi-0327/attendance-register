import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Filter } from "lucide-react";
import { useState } from "react";

interface SearchAndFilterProps {
  onSearch: (search: string) => void;
  onFilter?: (filters: { department?: string; status?: string; dateRange?: string }) => void;
  onSort?: (sortBy: string, sortOrder: string) => void;
  hideFilter?: boolean;
  hideSort?: boolean;
  placeholder?: string;
}

export function SearchAndFilter({ onSearch, onFilter, onSort, hideFilter, hideSort, placeholder }: SearchAndFilterProps) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState("time");
  const [sortOrder, setSortOrder] = useState("desc");

  const handleSearch = (value: string) => {
    setSearch(value);
    onSearch(value);
  };

  const handleFilter = () => {
    if (!onFilter) return;
    const filters: { department?: string; status?: string; dateRange?: string } = {};
    if (department && department !== "all") filters.department = department;
    if (status && status !== "all") filters.status = status;
    if (dateRange && dateRange !== "all") filters.dateRange = dateRange;
    onFilter(filters);
  };

  const handleSort = (by: string, order: string) => {
    if (!onSort) return;
    setSortBy(by);
    setSortOrder(order);
    onSort(by, order);
  };

  const clearFilters = () => {
    setSearch("");
    setDepartment("all");
    setStatus("all");
    setDateRange("all");
    setSortBy("time");
    setSortOrder("desc");
    onSearch("");
    if (onFilter) onFilter({});
    if (onSort) onSort("time", "desc");
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder || "Search by name, ID, or department..."}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {!hideFilter && (
          <>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="CS">Computer Science</SelectItem>
                <SelectItem value="IT">Information Technology</SelectItem>
                <SelectItem value="ECE">Electronics</SelectItem>
                <SelectItem value="MECH">Mechanical</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
        {!hideSort && (
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [by, order] = value.split("-");
            handleSort(by, order);
          }}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time-desc">Time (Newest)</SelectItem>
              <SelectItem value="time-asc">Time (Oldest)</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="department-asc">Department (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        )}
        {(search || (!hideFilter && ((department && department !== "all") || (status && status !== "all") || (dateRange && dateRange !== "all")))) && (
          <Button variant="outline" onClick={clearFilters} size="icon">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {((department && department !== "all") || (status && status !== "all") || (dateRange && dateRange !== "all")) && (
        <Button onClick={handleFilter} variant="outline" className="w-full md:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      )}
    </div>
  );
}


