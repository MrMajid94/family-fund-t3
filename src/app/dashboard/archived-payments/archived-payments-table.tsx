"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { api } from "@/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { useState } from "react";

export function ArchivedPaymentsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: payments, isLoading } = api.payment.getArchivedPayments.useQuery();

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    if (!searchQuery.trim()) return payments;

    const query = searchQuery.toLowerCase();
    return payments.filter((payment) => 
      payment.userName.toLowerCase().includes(query) ||
      payment.note?.toLowerCase().includes(query)
    );
  }, [payments, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الملاحظات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          العدد: {filteredPayments.length}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">تاريخ الدفع</TableHead>
              <TableHead className="text-right">عن شهر</TableHead>
              <TableHead className="text-right">ملاحظات</TableHead>
              <TableHead className="text-right">الإثبات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  لا توجد دفعات مؤرشفة
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.userName}</TableCell>
                  <TableCell>{payment.amount} ر.ع</TableCell>
                  <TableCell>
                    {format(new Date(payment.paymentDate), "dd MMMM yyyy", {
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.paymentForMonth), "MMMM yyyy", {
                      locale: ar,
                    })}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={payment.note || ""}>
                    {payment.note || "-"}
                  </TableCell>
                  <TableCell>
                    {payment.proof && (
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={payment.proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="عرض الإيصال"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
