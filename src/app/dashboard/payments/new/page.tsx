"use client";

import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Arabic month names
const MONTH_NAMES = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

interface MonthPayment {
  month: string; // "YYYY-MM" format
  amount: string;
  label: string; // Arabic display name
}

interface AvailableMonth {
  month: string;
  label: string;
  defaultAmount: string;
  year: string;
  isOverdue: boolean;
}

// Check if a month is overdue (payment due by 5th of next month)
function isMonthOverdue(monthStr: string): boolean {
  const [year, month] = monthStr.split("-").map(Number) as [number, number];
  const now = new Date();
  
  // Due date is the 5th of the following month
  const dueDate = new Date(year, month, 5); // month is 0-indexed, so "month" here is already next month
  
  return now > dueDate;
}

export default function NewPaymentPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  // role exists on user now
  const isAdmin = session?.user?.role === "admin";
  const currentUserId = session?.user?.id ?? "";

  // State
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMonths, setSelectedMonths] = useState<MonthPayment[]>([]);
  const [note, setNote] = useState("");

  // Set default user when session loads
  useEffect(() => {
    if (currentUserId && !selectedUserId) {
      setSelectedUserId(currentUserId);
    }
  }, [currentUserId, selectedUserId]);

  // Queries
  const { data: users, isLoading: usersLoading } = api.user.list.useQuery();
  const { data: enabledYears, isLoading: yearsLoading } =
    api.settings.getEnabledYears.useQuery();
  const { data: paidMonths, isLoading: paidMonthsLoading } =
    api.payment.getPaidMonths.useQuery(
      { userId: selectedUserId },
      { enabled: !!selectedUserId }
    );

  // Mutation
  const createPayment = api.payment.create.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدفعة بنجاح");
      router.push("/dashboard/payments");
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تسجيل الدفعة");
    },
  });

  // Generate all available months from enabled years, grouped by year
  const monthsByYear = useMemo(() => {
    if (!enabledYears || !paidMonths) return {};

    const grouped: Record<string, AvailableMonth[]> = {};

    // Sort years in ascending order
    const sortedYears = [...enabledYears].sort((a, b) =>
      a.year.localeCompare(b.year)
    );

    for (const year of sortedYears) {
      const yearMonths: AvailableMonth[] = [];
      
      for (let m = 0; m < 12; m++) {
        const monthStr = `${year.year}-${String(m + 1).padStart(2, "0")}`;
        
        // Skip if already paid
        if (paidMonths.includes(monthStr)) continue;

        yearMonths.push({
          month: monthStr,
          label: MONTH_NAMES[m] ?? "",
          defaultAmount: year.monthlyAmount,
          year: year.year,
          isOverdue: isMonthOverdue(monthStr),
        });
      }

      if (yearMonths.length > 0) {
        grouped[year.year] = yearMonths;
      }
    }

    return grouped;
  }, [enabledYears, paidMonths]);

  // Get sorted years
  const sortedYearKeys = useMemo(() => {
    return Object.keys(monthsByYear).sort();
  }, [monthsByYear]);

  // Check if there are any available months
  const hasAvailableMonths = sortedYearKeys.length > 0;

  // Count overdue months
  const overdueCount = useMemo(() => {
    return Object.values(monthsByYear)
      .flat()
      .filter((m) => m.isOverdue).length;
  }, [monthsByYear]);

  // Toggle month selection
  const toggleMonth = (month: string, label: string, year: string, defaultAmount: string) => {
    const fullLabel = `${label} ${year}`;
    setSelectedMonths((prev) => {
      const exists = prev.find((m) => m.month === month);
      if (exists) {
        return prev.filter((m) => m.month !== month);
      }
      return [...prev, { month, label: fullLabel, amount: defaultAmount }];
    });
  };

  // Update amount for a specific month
  const updateMonthAmount = (month: string, amount: string) => {
    setSelectedMonths((prev) =>
      prev.map((m) => (m.month === month ? { ...m, amount } : m))
    );
  };

  // Calculate total
  const total = useMemo(() => {
    return selectedMonths.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
  }, [selectedMonths]);

  // Handle user change - reset selections
  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedMonths([]);
  };

  // Handle submit
  const handleSubmit = () => {
    if (!selectedUserId) {
      toast.error("يرجى اختيار المستخدم");
      return;
    }
    if (selectedMonths.length === 0) {
      toast.error("يرجى اختيار شهر واحد على الأقل");
      return;
    }

    createPayment.mutate({
      userId: selectedUserId,
      payments: selectedMonths.map((m) => ({
        paymentForMonth: new Date(`${m.month}-01`),
        amount: m.amount,
      })),
      note: note || undefined,
    });
  };

  const isLoading = usersLoading || yearsLoading || paidMonthsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/payments">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">تسجيل دفعة جديدة</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الدفعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection - Only admins can change */}
          <div className="space-y-2">
            <Label>الدفعة لصالح</Label>
            {isAdmin ? (
              <Select value={selectedUserId} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستخدم" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-muted rounded-md">
                {users?.find((u) => u.id === currentUserId)?.name || "—"}
              </div>
            )}
          </div>

          {/* Month Selection - Grouped by Year */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>اختر الأشهر</Label>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueCount} متأخرة
                </Badge>
              )}
            </div>
            
            {!hasAvailableMonths ? (
              <div className="p-4 text-center text-muted-foreground bg-muted rounded-md">
                لا توجد أشهر متاحة للدفع
              </div>
            ) : (
              <div className="space-y-4">
                {sortedYearKeys.map((year) => (
                  <div key={year} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {year}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {monthsByYear[year]?.map((m) => {
                        const isSelected = selectedMonths.some(
                          (sm) => sm.month === m.month
                        );
                        return (
                          <div
                            key={m.month}
                            className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : m.isOverdue
                                ? "bg-destructive/10 border-destructive/50 hover:bg-destructive/20"
                                : "hover:bg-muted"
                            }`}
                            onClick={() =>
                              toggleMonth(m.month, m.label, m.year, m.defaultAmount)
                            }
                          >
                            <Checkbox checked={isSelected} />
                            <span className={`text-sm ${m.isOverdue && !isSelected ? "text-destructive" : ""}`}>
                              {m.label}
                            </span>
                            {m.isOverdue && (
                              <AlertTriangle className="h-3 w-3 text-destructive mr-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Per-Month Amounts */}
          {selectedMonths.length > 0 && (
            <div className="space-y-3">
              <Label>المبلغ لكل شهر (ر.ع)</Label>
              {selectedMonths
                .sort((a, b) => a.month.localeCompare(b.month))
                .map((m) => (
                  <div
                    key={m.month}
                    className="flex items-center gap-4 p-3 bg-muted rounded-md"
                  >
                    <span className="flex-1 text-sm">{m.label}</span>
                    <Input
                      type="number"
                      value={m.amount}
                      onChange={(e) => updateMonthAmount(m.month, e.target.value)}
                      className="w-24 text-center"
                      min="0"
                      step="0.01"
                    />
                  </div>
                ))}
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-md font-semibold">
                <span>الإجمالي</span>
                <span>{total.toFixed(2)} ر.ع</span>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={
              createPayment.isPending || selectedMonths.length === 0
            }
            className="w-full"
            size="lg"
          >
            {createPayment.isPending && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            )}
            تسجيل الدفعة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
