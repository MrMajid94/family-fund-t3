"use client";

import { api } from "@/trpc/react";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useState, useEffect } from "react";
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
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

// Form Schema
const spendingSchema = z.object({
  id: z.string().optional(),
  amount: z.string().min(1, "المبلغ مطلوب"),
  reason: z.string().min(1, "السبب مطلوب"),
  recipient: z.string().optional(),
  date: z.string().min(1, "التاريخ مطلوب"), // Keep as string for form handling
  note: z.string().optional(),
});

type SpendingFormValues = z.infer<typeof spendingSchema>;

export default function SpendingsPage() {
  const { data: session } = authClient.useSession();
  // @ts-ignore - role exists on user
  const isAdmin = session?.user?.role === "admin";
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Queries
  const { data: spendings, isLoading } = api.spending.getAll.useQuery();

  // Mutations
  const createSpending = api.spending.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المصروف بنجاح");
      setOpen(false);
      form.reset();
      utils.spending.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateSpending = api.spending.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المصروف بنجاح");
      setOpen(false);
      setEditingId(null);
      form.reset();
      utils.spending.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteSpending = api.spending.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المصروف بنجاح");
      utils.spending.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Form setup
  const form = useForm<SpendingFormValues>({
    resolver: zodResolver(spendingSchema),
    defaultValues: {
      amount: "",
      reason: "",
      recipient: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const onSubmit = (values: SpendingFormValues) => {
    if (editingId) {
      if (!values.id) return;
      updateSpending.mutate({ 
        ...values, 
        id: values.id, 
        date: new Date(values.date) 
      });
    } else {
      createSpending.mutate({ 
        ...values, 
        date: new Date(values.date) 
      });
    }
  };

  const handleEdit = (spending: any) => {
    setEditingId(spending.id);
    form.reset({
      id: spending.id,
      amount: spending.amount,
      reason: spending.reason,
      recipient: spending.recipient || "",
      date: new Date(spending.date).toISOString().split("T")[0],
      note: spending.note || "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingId(null);
      form.reset({
        amount: "",
        reason: "",
        recipient: "",
        date: new Date().toISOString().split("T")[0],
        note: "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">سجل المصروفات</h1>
        {isAdmin && (
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus size={16} />
                    إضافة مصروف
                  </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "تعديل المصروف" : "إضافة مصروف جديد"}
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
                        <FormLabel>المبلغ (ر.ع)</FormLabel>
                        <FormControl>
                          <Input placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السبب</FormLabel>
                        <FormControl>
                          <Input placeholder="صيانة..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recipient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المدفوع له (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم الشخص أو الجهة" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>التاريخ</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
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
                    disabled={
                      createSpending.isPending || updateSpending.isPending
                    }
                  >
                    {(createSpending.isPending || updateSpending.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingId ? "تحديث" : "حفظ"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">المبلغ</TableHead>
              <TableHead className="text-right">السبب</TableHead>
              <TableHead className="text-right">المدفوع له</TableHead>
              <TableHead className="text-right">ملاحظات</TableHead>
              <TableHead className="text-right">أضيف بواسطة</TableHead>
              {isAdmin && <TableHead className="text-left">إجراءات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {spendings?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className="text-center py-8 text-muted-foreground"
                >
                  لا توجد مصروفات مسجلة
                </TableCell>
              </TableRow>
            )}
            {spendings?.map((spending) => (
              <TableRow key={spending.id}>
                <TableCell>
                  {format(spending.date, "PPP", { locale: ar })}
                </TableCell>
                <TableCell className="font-medium text-red-600">
                  {spending.amount} ر.ع
                </TableCell>
                <TableCell>{spending.reason}</TableCell>
                <TableCell>{spending.recipient || "-"}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={spending.note || ""}>{spending.note || "-"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {spending.createdBy.name}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-left">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(spending)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => {
                          if (confirm("هل أنت متأكد من حذف هذا المصروف؟")) {
                            deleteSpending.mutate({ id: spending.id });
                          }
                        }}
                        disabled={deleteSpending.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
