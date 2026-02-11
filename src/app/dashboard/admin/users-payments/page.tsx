"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { Check, ChevronsUpDown, Loader2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function UsersPaymentsAnalysisPage() {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users, isLoading: isLoadingUsers } = api.user.list.useQuery();

  const { data: globalStats, isLoading: isLoadingGlobal } =
    api.payment.getGlobalCompliance.useQuery();

  const {
    data: analysis,
    isLoading: isLoadingAnalysis,
    error: analysisError,
  } = api.payment.getUserAnalysis.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId },
  );

  const selectedUser = users?.find((user) => user.id === selectedUserId);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">تحليل المشتركين</h2>
          <p className="text-muted-foreground">
            تتبع ودفعات وتفاصيل اشتراكات الأعضاء
          </p>
        </div>
      </div>

      {/* Global Stats Section */}
      {globalStats && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">نظرة عامة على الصندوق</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  نسبة الالتزام
                </CardTitle>
                <div className="text-muted-foreground h-4 w-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {globalStats.complianceRate.toFixed(1)}%
                </div>
                <p className="text-muted-foreground text-xs">
                  {globalStats.compliantUsers} من {globalStats.totalUsers} عضو
                  ملتزمون تماماً
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  إجمالي المتأخرات
                </CardTitle>
                <div className="text-muted-foreground h-4 w-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-destructive text-2xl font-bold">
                  {globalStats.totalArrears.toFixed(3)}
                </div>
                <p className="text-muted-foreground text-xs">
                  ريال عماني غير محصل
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  إجمالي المحصل
                </CardTitle>
                <div className="text-muted-foreground h-4 w-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {globalStats.totalCollected.toFixed(3)}
                </div>
                <p className="text-muted-foreground text-xs">
                  ريال عماني تم تحصيله
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>يحتاجون لمتابعة (الأكثر تأخراً)</CardTitle>
                <CardDescription>
                  الأعضاء الذين لديهم أكبر عدد من الأشهر المتأخرة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">أشهر متأخرة</TableHead>
                      <TableHead className="text-right">
                        المبلغ المستحق
                      </TableHead>
                      <TableHead className="text-right">عضو منذ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {globalStats.worstPerforming.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {u.overdueMonths} شهر
                          </Badge>
                        </TableCell>
                        <TableCell>{u.amountOwed} ر.ع.</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>أكثر المساهمين</CardTitle>
                <CardDescription>
                  الأعضاء الأكثر التزاماً ومساهمة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {globalStats.topPerforming.map((u, i) => (
                    <div key={u.id} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm leading-none font-medium">
                          {u.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          0 متأخرات
                        </p>
                      </div>
                      <div className="mr-auto font-medium text-green-600">
                        +{u.totalPaid} ر.ع.
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="my-6 border-t" />

      <div className="flex items-center space-x-2 space-x-reverse">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[300px] justify-between"
            >
              {selectedUserId
                ? users?.find((user) => user.id === selectedUserId)?.name
                : "اختر مشترك..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <Command>
              <CommandInput placeholder="بحث عن مشترك..." />
              <CommandList>
                <CommandEmpty>لا يوجد مشتركين.</CommandEmpty>
                <CommandGroup>
                  {users?.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.name}
                      onSelect={() => {
                        setSelectedUserId(user.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedUserId === user.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {user.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {isLoadingAnalysis && (
        <div className="flex h-[200px] w-full items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      )}

      {analysisError && (
        <div className="border-destructive/50 bg-destructive/10 text-destructive flex h-[100px] w-full items-center justify-center rounded-md border">
          <AlertCircle className="mr-2 h-4 w-4" />
          <span>حدث خطأ في تحميل البيانات: {analysisError.message}</span>
        </div>
      )}

      {analysis && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  إجمالي المدفوع
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="text-muted-foreground h-4 w-4"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.summary.totalPaid.toFixed(2)}
                </div>
                <p className="text-muted-foreground text-xs">
                  منذ بداية الاشتراك
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  المطلوب الإجمالي
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="text-muted-foreground h-4 w-4"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.summary.totalRequired.toFixed(2)}
                </div>
                <p className="text-muted-foreground text-xs">
                  المتوقع حتى تاريخه
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الرصيد</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="text-muted-foreground h-4 w-4"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    analysis.summary.balance < 0
                      ? "text-destructive"
                      : "text-green-600",
                  )}
                >
                  {analysis.summary.balance.toFixed(2)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {analysis.summary.balance < 0 ? "مبالغ مستحقة" : "رصيد فائض"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  أشهر متأخرة
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="text-muted-foreground h-4 w-4"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analysis.summary.overdueMonthsCount}
                </div>
                <p className="text-muted-foreground text-xs">
                  عدد الأشهر غير المدفوعة
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>سجل الدفعات الشهري</CardTitle>
              <CardDescription>
                تفاصيل حالة الدفع لكل شهر منذ بداية الاشتراك (
                {format(new Date(analysis.user.paymentStartDate), "dd/MM/yyyy")}
                )
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px] text-right">
                      الشهر
                    </TableHead>
                    <TableHead className="text-right">المبلغ المطلوب</TableHead>
                    <TableHead className="text-right">المبلغ المدفوع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                    <TableHead className="text-right">تاريخ الدفع</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.months.map((month) => (
                    <TableRow key={`${month.year}-${month.month}`}>
                      <TableCell className="font-medium">
                        {month.year}-{month.month}
                      </TableCell>
                      <TableCell>{month.requiredAmount}</TableCell>
                      <TableCell>{month.paidAmount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            month.status === "Paid"
                              ? "secondary"
                              : month.status === "Due"
                                ? "outline"
                                : "destructive"
                          }
                          className={
                            month.status === "Paid"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : month.status === "Due"
                                ? "border-yellow-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : ""
                          }
                        >
                          {month.status === "Paid"
                            ? "مدفوع"
                            : month.status === "Due"
                              ? "مستحق"
                              : "متأخر"}
                        </Badge>
                      </TableCell>
                      <TableCell>{month.note || "-"}</TableCell>
                      <TableCell>
                        {month.paymentDate
                          ? format(new Date(month.paymentDate), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
