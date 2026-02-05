"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { PaymentsTable } from "./payments-table";
import { PaymentsStats } from "./payments-stats";
import { MonthlyPaymentsChart } from "./monthly-chart";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export default function PaymentsClientPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch paginated payments
  const { data: paginatedData, isLoading: isLoadingPayments } =
    api.payment.getPaginated.useQuery({ page, pageSize });

  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } =
    api.payment.getStats.useQuery();

  // Fetch all payments for export
  const { data: exportData, refetch: refetchExport } =
    api.payment.exportAll.useQuery(undefined, {
      enabled: false, // Only fetch when triggered
    });

  const handleExport = async () => {
    // Trigger the export query
    const { data } = await refetchExport();
    
    if (!data || data.length === 0) {
      return;
    }

    // Format data for Excel
    const excelData = data.map((payment) => ({
      "الاسم": payment.userName,
      "المبلغ": payment.amount,
      "تاريخ الدفع": format(new Date(payment.paymentDate), "dd/MM/yyyy"),
      "عن شهر": format(new Date(payment.paymentForMonth), "MM/yyyy"),
      "ملاحظة": payment.note,
      "الإيصال": payment.proof,
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set RTL for Arabic
    ws["!rtl"] = true;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "المدفوعات");

    // Generate filename with date
    const filename = `المدفوعات_${format(new Date(), "yyyy-MM-dd")}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المدفوعات</h1>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          تحميل إكسل
        </Button>
      </div>

      {/* Statistics Cards */}
      <PaymentsStats
        totalPayments={stats?.totalPayments ?? 0}
        totalAmount={stats?.totalAmount ?? 0}
        isLoading={isLoadingStats}
      />

      {/* Monthly Chart */}
      <MonthlyPaymentsChart
        data={stats?.monthlyData ?? []}
        isLoading={isLoadingStats}
      />

      {/* Payments Table with Pagination */}
      <PaymentsTable
        payments={paginatedData?.payments ?? []}
        isLoading={isLoadingPayments}
        currentPage={page}
        totalPages={paginatedData?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
