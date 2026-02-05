"use client";

import { api } from "@/trpc/react";
import { authClient } from "@/server/better-auth/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInCalendarMonths, addMonths, startOfMonth, differenceInMonths } from "date-fns";
import { arSA } from "date-fns/locale";
import { 
  PlusCircle, 
  AlertCircle, 
  CheckCircle, 
  CalendarX, 
  Wallet,
  TrendingDown,
  Users,
  Calculator,
  Calendar,
  Clock
} from "lucide-react";
import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  // Personal stats
  const { data: session } = authClient.useSession();
  const { data: stats, isLoading: statsLoading } = api.payment.getMyStats.useQuery();
  const { data: userPayments, isLoading: paymentsLoading } = api.payment.getMyPayments.useQuery();
  
  // Fund stats
  const { data: bankBalance, isLoading: balanceLoading } = api.bankBalance.getLatestPublic.useQuery();
  const { data: spendingStats, isLoading: spendingLoading } = api.spending.getStats.useQuery();
  const { data: contributions, isLoading: contributionsLoading } = api.payment.getTotalContributions.useQuery();

  // Calculation Logic
  const monthlyRate = 10;
  
  const { missingMonths, overdueAmount, isOverdue, totalPaid, membershipDuration, complianceRate } = useMemo(() => {
    if (statsLoading || paymentsLoading || !stats) {
        return { missingMonths: [], overdueAmount: 0, isOverdue: false, totalPaid: 0, membershipDuration: 0, complianceRate: 0 };
    }

    const now = new Date();
    const startDate = stats.paymentStartDate ? new Date(stats.paymentStartDate) : new Date();
    
    let currentMonth = startOfMonth(startDate);
    const endMonth = startOfMonth(now);
    
    const missing: Date[] = [];
    
    const paidMonthsSet = new Set(
        userPayments?.map(p => startOfMonth(new Date(p.paymentForMonth)).toISOString()) || []
    );

    while (currentMonth <= endMonth) {
        if (!paidMonthsSet.has(currentMonth.toISOString())) {
            missing.push(currentMonth);
        }
        currentMonth = addMonths(currentMonth, 1);
    }

    missing.sort((a, b) => b.getTime() - a.getTime());

    const paid = stats.totalAmount ?? 0;
    const overdue = missing.length * monthlyRate;

    // Calculate membership duration in months
    const duration = differenceInMonths(now, startDate);
    
    // Calculate compliance rate (paid months / expected months)
    const expectedMonths = differenceInCalendarMonths(addMonths(endMonth, 1), startDate);
    const paidMonthsCount = userPayments?.length ?? 0;
    const compliance = expectedMonths > 0 ? Math.round((paidMonthsCount / expectedMonths) * 100) : 100;

    return {
        missingMonths: missing,
        overdueAmount: overdue,
        isOverdue: overdue > 0,
        totalPaid: paid,
        membershipDuration: duration,
        complianceRate: compliance
    };
  }, [stats, userPayments, statsLoading, paymentsLoading]);

  // Net balance calculation
  const netBalance = useMemo(() => {
    const totalContributions = contributions?.totalAmount ?? 0;
    const totalSpendings = spendingStats?.totalAmount ?? 0;
    return totalContributions - totalSpendings;
  }, [contributions, spendingStats]);

  // Group payments by Year
  const paymentsByYear = useMemo(() => {
      if (!userPayments) return {};
      
      const groups: Record<string, typeof userPayments> = {};
      
      userPayments.forEach(payment => {
          const year = format(new Date(payment.paymentForMonth), "yyyy");
          if (!groups[year]) {
              groups[year] = [];
          }
          groups[year].push(payment);
      });
      
      return Object.fromEntries(
          Object.entries(groups).sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
      );
  }, [userPayments]);

  const fundStatsLoading = balanceLoading || spendingLoading || contributionsLoading;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight"> 
          {session?.user?.name ? `مرحباً، ${session.user.name}` : "الرئيسية"} 
        </h2>
        <Link href="/dashboard/payments/new">
            <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                تسجيل دفعة
            </Button>
        </Link>
      </div>

      {/* Fund Statistics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">إحصائيات الصندوق</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Fund Balance */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رصيد الصندوق</CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {fundStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">
                    {bankBalance?.amount ? `${parseFloat(bankBalance.amount).toLocaleString()} ر.ع.` : "غير متوفر"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bankBalance?.createdAt ? `آخر تحديث: ${format(new Date(bankBalance.createdAt), "d MMM yyyy", { locale: arSA })}` : "لم يتم التسجيل بعد"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Contributions */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-500 to-green-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium"> إجمالي المسهمات المسجلة</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {fundStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {contributions?.totalAmount?.toLocaleString() ?? 0} ر.ع.
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {contributions?.totalPayments ?? 0} عملية دفع
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Spendings */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-orange-500 to-orange-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {fundStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600">
                    {spendingStats?.totalAmount?.toLocaleString() ?? 0} ر.ع.
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {spendingStats?.count ?? 0} عملية صرف
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Net Balance */}
          {/* <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 to-purple-600" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">صافي الرصيد</CardTitle>
              <Calculator className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {fundStatsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-purple-600" : "text-destructive"}`}>
                    {netBalance.toLocaleString()} ر.ع.
                  </div>
                  <p className="text-xs text-muted-foreground">
                    المساهمات - المصروفات
                  </p>
                </>
              )}
            </CardContent>
          </Card> */}
        </div>
      </div>

      <Separator />

      {/* Personal Statistics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">إحصائياتي</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* My Total Contributions */}
          <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي مساهماتي</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {totalPaid.toLocaleString()} ر.ع.
                  </div>
                  <p className="text-xs text-muted-foreground">
                    منذ بداية الاشتراك
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حالة السداد</CardTitle>
              <AlertCircle className={`h-4 w-4 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${isOverdue ? "text-destructive" : "text-green-600"}`}>
                    {isOverdue ? `${overdueAmount.toLocaleString()} ر.ع.` : "لا متأخرات"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isOverdue ? `${missingMonths.length} أشهر غير مدفوعة` : "شكرًا لالتزامك"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Compliance Rate */}
          <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">نسبة الالتزام</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${complianceRate >= 80 ? "text-green-600" : complianceRate >= 50 ? "text-orange-500" : "text-destructive"}`}>
                    {complianceRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    نسبة الأشهر المدفوعة
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Membership Duration */}
          {/* <Card className="bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مدة العضوية</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {membershipDuration} شهر
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.paymentStartDate ? `منذ ${format(new Date(stats.paymentStartDate), "MMM yyyy", { locale: arSA })}` : "منذ البداية"}
                  </p>
                </>
              )}
            </CardContent>
          </Card> */}
        </div>
      </div>

      {/* Unpaid Months Section (If any) */}
      {isOverdue && missingMonths.length > 0 && (
          <div className="rounded-xl border bg-destructive/10 p-6 text-destructive">
               <div className="flex items-center gap-2 mb-4">
                   <CalendarX className="h-5 w-5" />
                   <h3 className="text-lg font-bold">الأشهر المستحقة ({missingMonths.length})</h3>
               </div>
               <div className="flex flex-wrap gap-2">
                   {missingMonths.map((date) => (
                       <Badge key={date.toISOString()} variant="destructive" className="text-sm font-normal bg-destructive hover:bg-destructive/90">
                           {format(date, "MMMM yyyy", { locale: arSA })}
                       </Badge>
                   ))}
               </div>
          </div>
      )}

      <div className="min-h-[50vh] flex-1 rounded-xl bg-muted/50 p-6">
        <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold">سجل المدفوعات</h2>
        </div>
       
        <div className="space-y-8">
            {paymentsLoading ? (
                <div className="text-center text-muted-foreground">جاري التحميل...</div>
            ) : !userPayments || userPayments.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">لا توجد مدفوعات مسجلة بعد.</div>
            ) : (
                Object.entries(paymentsByYear).map(([year, payments]) => (
                    <div key={year}>
                        <div className="flex items-center gap-4 mb-4">
                             <h3 className="text-lg font-bold text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm">
                                {year}
                            </h3>
                            <Separator className="flex-1" />
                        </div>
                        <div className="space-y-4 pr-2">
                            {payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 group hover:bg-background/50 p-2 rounded-lg transition-colors">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-lg group-hover:text-primary transition-colors">
                                            {format(new Date(payment.paymentForMonth), "MMMM", { locale: arSA })}
                                        </div>
                                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                                            <span className="text-xs">تاريخ الدفع: {format(new Date(payment.paymentDate), "d/M/yyyy", { locale: arSA })}</span>
                                            {payment.note && <span>• {payment.note}</span>}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-bold text-base" dir="ltr">
                                            +{payment.amount} OMR
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  )
}
