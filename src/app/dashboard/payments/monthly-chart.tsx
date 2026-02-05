"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface MonthlyData {
  month: string;
  count: number;
  amount: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
  isLoading: boolean;
}

const chartConfig: ChartConfig = {
  amount: {
    label: "المبلغ",
    color: "hsl(var(--chart-1))",
  },
  count: {
    label: "العدد",
    color: "hsl(var(--chart-2))",
  },
};

export function MonthlyPaymentsChart({ data, isLoading }: MonthlyChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المدفوعات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المدفوعات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            لا توجد بيانات للعرض
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format month labels for display
  const formattedData = data.map((item) => ({
    ...item,
    displayMonth: item.month, // Already in YYYY-MM format
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>المدفوعات الشهرية</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={formattedData} accessibilityLayer>
            <XAxis
              dataKey="displayMonth"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="amount"
              fill="var(--color-amount)"
              radius={[4, 4, 0, 0]}
              name="المبلغ (ر.ع.)"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
