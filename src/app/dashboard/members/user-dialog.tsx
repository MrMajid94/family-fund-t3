"use client";

import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useEffect } from "react";

import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const userFormSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phoneNumber: z.string().min(8, "رقم الهاتف يجب أن يكون 8 أرقام على الأقل"),
  password: z.string().optional(),
  role: z.enum(["admin", "user"]),
  paymentStartDate: z.date({
    required_error: "تاريخ بداية الدفع مطلوب",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "update";
  user?: {
    id: string;
    name: string;
    phoneNumber?: string | null;
    username?: string | null;
    role: "admin" | "user";
    paymentStartDate: Date; 
  };
  onSuccess: () => void;
}

export function UserDialog({
  open,
  onOpenChange,
  mode,
  user,
  onSuccess,
}: UserDialogProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      mode === "create"
        ? userFormSchema.extend({
            password: z.string().min(6, "كلمة المرور مطلوبة (6 أحرف على الأقل)"),
          })
        : userFormSchema
    ),
    defaultValues: {
      name: "",
      phoneNumber: "",
      password: "",
      role: "user",
      paymentStartDate: new Date("2026-01-01"),
    },
  });

  useEffect(() => {
    if (user && mode === "update") {
        form.reset({
            name: user.name,
            phoneNumber: user.phoneNumber ?? user.username ?? "",
            role: user.role,
            paymentStartDate: user.paymentStartDate ? new Date(user.paymentStartDate) : new Date("2026-01-01"),
        });
    } else {
        form.reset({
            name: "",
            phoneNumber: "",
            password: "",
            role: "user",
            paymentStartDate: new Date("2026-01-01"),
        })
    }
  }, [user, mode, form, open]);

  const createMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة العضو بنجاح");
      onOpenChange(false);
      onSuccess();
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء إضافة العضو");
    },
  });

  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("تم تعديل العضو بنجاح");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء تعديل العضو");
    },
  });

  const onSubmit = (values: UserFormValues) => {
    if (mode === "create") {
      createMutation.mutate({
        name: values.name,
        phoneNumber: values.phoneNumber,
        password: values.password!,
        role: values.role,
        paymentStartDate: values.paymentStartDate,
      });
    } else if (user) {
      updateMutation.mutate({
        id: user.id,
        name: values.name,
        phoneNumber: values.phoneNumber,
        role: values.role,
        paymentStartDate: values.paymentStartDate,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "إضافة عضو جديد" : "تعديل بيانات العضو"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "أدخل بيانات العضو الجديد أدناه."
              : "قم بتعديل بيانات العضو أدناه."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم</FormLabel>
                  <FormControl>
                    <Input placeholder="الاسم الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: 91234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="paymentStartDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>تاريخ بداية الدفع</FormLabel>
                  <Popover>
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
                            format(field.value, "PPP", { locale: arSA })
                          ) : (
                            <span>اختر التاريخ</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date("2026-01-01") 
                        }
                        initialFocus
                        locale={arSA}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === "create" && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>كلمة المرور</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الدور</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدور" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">عضو</SelectItem>
                      <SelectItem value="admin">مسؤول</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "إضافة" : "حفظ التغييرات"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
