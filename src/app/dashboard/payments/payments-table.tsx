"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { ExternalLink, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

interface Payment {
  id: string;
  amount: string;
  paymentDate: Date;
  paymentForMonth: Date;
  note: string | null;
  proof: string | null;
  user: {
    name: string;
  };
  createdById: string;
}

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
}

export function PaymentsTable({
  payments,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
}: PaymentsTableProps) {
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            isActive={i === currentPage}
            onClick={(e) => {
              e.preventDefault();
              onPageChange(i);
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">تاريخ الدفع</TableHead>
              <TableHead className="text-right">عن شهر</TableHead>
              <TableHead className="text-right">ملاحظة</TableHead>
              <TableHead className="text-right">الإيصال</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  لا توجد مدفوعات
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.user.name}</TableCell>
                  <TableCell>{payment.amount} ر.ع.</TableCell>
                  <TableCell>{format(new Date(payment.paymentDate), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{format(new Date(payment.paymentForMonth), "MM/yyyy")}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={payment.note ?? ""}>
                    {payment.note || "-"}
                  </TableCell>
                  <TableCell>
                    {payment.proof ? (
                      <Link 
                        href={payment.proof} 
                        target="_blank" 
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                      >
                          <span>عرض</span>
                          <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {(isAdmin || payment.createdById === session?.user?.id) && (
                        <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" onClick={() => onEdit(payment)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(payment.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            صفحة {currentPage} من {totalPages}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
