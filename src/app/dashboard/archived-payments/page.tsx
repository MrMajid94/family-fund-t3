import { HydrateClient } from "@/trpc/server";
import { ArchivedPaymentsTable } from "./archived-payments-table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Archive, Info } from "lucide-react";
import { auth } from "@/server/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "أرشيف الدفعات | صندوق العائلة",
  description: "سجل الدفعات المؤرشفة (ما قبل 2026)",
};

export default async function ArchivedPaymentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">أرشيف الدفعات</h2>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>معلومات الأرشيف</AlertTitle>
          <AlertDescription>
            يحتوي هذا السجل على الدفعات القديمة (ما قبل 2026). هذه البيانات محفوظة للأرشفة فقط ولا تؤثر على حسابات المستخدمين الحالية.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              سجل الدفعات المؤرشفة
            </CardTitle>
            <CardDescription>
              عرض وسجل بجميع الدفعات السابقة للنظام الجديد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArchivedPaymentsTable />
          </CardContent>
        </Card>
      </div>
    </HydrateClient>
  );
}
