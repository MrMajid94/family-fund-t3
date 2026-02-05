"use client";

import { api } from "@/trpc/react";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Form Schema
const bankBalanceSchema = z.object({
  amount: z.string().min(1, "المبلغ مطلوب"),
  note: z.string().optional(),
});

type BankBalanceFormValues = z.infer<typeof bankBalanceSchema>;

export default function BankBalancePage() {
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Queries
  const { data: history, isLoading } = api.bankBalance.getHistory.useQuery(undefined, {
    enabled: !!session?.user,
  });
  
  const { data: latest } = api.bankBalance.getLatest.useQuery(undefined, {
      enabled: !!session?.user,
  });

  // Mutations
  const createEntry = api.bankBalance.create.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث رصيد البنك بنجاح");
      setOpen(false);
      form.reset();
      utils.bankBalance.getHistory.invalidate();
      utils.bankBalance.getLatest.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteEntry = api.bankBalance.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف السجل بنجاح");
      utils.bankBalance.getHistory.invalidate();
      utils.bankBalance.getLatest.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Form setup
  const form = useForm<BankBalanceFormValues>({
    resolver: zodResolver(bankBalanceSchema),
    defaultValues: {
      amount: "",
      note: "",
    },
  });

  const onSubmit = (values: BankBalanceFormValues) => {
    createEntry.mutate(values);
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if ((session?.user as unknown as { role: string }).role !== "admin") {
      router.push("/dashboard");
      return null;
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">سجل رصيد البنك</h1>
            <p className="text-muted-foreground mt-1">
                الرصيد الحالي المسجل: <span className="font-bold text-primary text-xl">{latest?.amount ?? "---"} ر.ع</span>
            </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
                <Button className="gap-2">
                <Plus size={16} />
                تحديث الرصيد
                </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>
                تسجيل الرصيد الحالي
            </DialogTitle>
            </DialogHeader>
            <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
            >
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>المبلغ الحالي في البنك (ر.ع)</FormLabel>
                    <FormControl>
                        <Input placeholder="1500.500" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                        <Textarea placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button
                type="submit"
                className="w-full"
                disabled={createEntry.isPending}
                >
                {createEntry.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                حفظ
                </Button>
            </form>
            </Form>
        </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">تاريخ التسجيل</TableHead>
              <TableHead className="text-right">الرصيد المسجل</TableHead>
              <TableHead className="text-right">ملاحظات</TableHead>
              <TableHead className="text-right">سجل بواسطة</TableHead>
              <TableHead className="text-left">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  لا توجد سجلات
                </TableCell>
              </TableRow>
            )}
            {history?.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  {format(entry.createdAt, "PPP p", { locale: ar })}
                </TableCell>
                <TableCell className="font-medium text-green-600">
                  {entry.amount} ر.ع
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={entry.note || ""}>{entry.note || "-"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {entry.createdBy.name}
                </TableCell>
                  <TableCell className="text-left">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => {
                          setDeleteId(entry.id);
                        }}
                        disabled={deleteEntry.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
            هذا الإجراء لا يمكن التراجع عنه. يتم حذف سجل الرصيد نهائيًا.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90"
            onClick={() => {
                if (deleteId) {
                deleteEntry.mutate({ id: deleteId });
                setDeleteId(null);
                }
            }}
            >
            حذف
            </AlertDialogAction>
        </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </div>
  );
}
