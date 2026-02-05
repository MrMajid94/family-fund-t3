"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  userId: z.string().min(1, "المستخدم مطلوب"),
  amount: z.string().min(1, "المبلغ مطلوب"),
  paymentForMonth: z.date({
    required_error: "شهر الدفع مطلوب",
  }),
  note: z.string().optional(),
  proof: z.string().optional(),
});

interface UpsertPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentToEdit?: {
    id: string;
    userId: string;
    amount: string;
    paymentForMonth: Date | string;
    note: string | null;
    proof: string | null;
  } | null;
}

export function UpsertPaymentDialog({
  open,
  onOpenChange,
  paymentToEdit,
}: UpsertPaymentDialogProps) {
  const { data: session } = authClient.useSession();
  const utils = api.useUtils();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch users for admin selection
  const { data: users } = api.user.list.useQuery(undefined, {
    enabled: (session?.user as any)?.role === "admin",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: session?.user?.id ?? "",
      amount: "10",
      note: "",
      proof: "",
    },
  });

  // Create mutation
  const createMutation = api.payment.create.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الدفع بنجاح");
      utils.payment.invalidate();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = api.payment.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الدفع بنجاح");
      utils.payment.invalidate();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (paymentToEdit) {
      form.reset({
        userId: paymentToEdit.userId,
        amount: paymentToEdit.amount,
        paymentForMonth: new Date(paymentToEdit.paymentForMonth),
        note: paymentToEdit.note ?? "",
        proof: paymentToEdit.proof ?? "",
      });
    } else {
      form.reset({
        userId: session?.user?.id ?? "",
        amount: "10",
        paymentForMonth: new Date(),
        note: "",
        proof: "",
      });
    }
  }, [paymentToEdit, open, session, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (paymentToEdit) {
      updateMutation.mutate({
        id: paymentToEdit.id,
        amount: values.amount,
        paymentForMonth: values.paymentForMonth,
        note: values.note,
        proof: values.proof,
      });
    } else {
      createMutation.mutate({
        userId: values.userId,
        payments: [
          {
            amount: values.amount,
            paymentForMonth: values.paymentForMonth,
          },
        ],
        note: values.note,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isAdmin = (session?.user as any)?.role === "admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {paymentToEdit ? "تعديل الدفع" : "تسجيل دفع جديد"}
          </DialogTitle>
          <DialogDescription>
            {paymentToEdit
              ? "قم بتعديل بيانات الدفع أدناه"
              : "أدخل تفاصيل الدفع الجديد"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isAdmin && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستخدم</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!paymentToEdit} // Disable changing user on edit
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستخدم" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>المبلغ (ر.ع.)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentForMonth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>عن شهر</FormLabel>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "MM/yyyy")
                          ) : (
                            <span>اختر الشهر</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                           if (date) {
                                field.onChange(date);
                                setIsCalendarOpen(false);
                           }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظة</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="أي ملاحظات إضافية..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proof"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رابط الإيصال (اختياري)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
