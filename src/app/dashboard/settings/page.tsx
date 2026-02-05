"use client";

import { api } from "@/trpc/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

const addYearSchema = z.object({
  year: z.string().min(4, "Year must be at least 4 characters"),
});

export default function SettingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const utils = api.useUtils();
  const { data: years, isLoading } = api.settings.getYears.useQuery();

  const toggleYearMutation = api.settings.toggleYear.useMutation({
    onSuccess: async () => {
      toast.success("تم تحديث حالة السنة بنجاح");
      await utils.settings.getYears.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addYearMutation = api.settings.addYear.useMutation({
    onSuccess: async () => {
      toast.success("تمت إوافة السنة بنجاح");
      setIsDialogOpen(false);
      form.reset();
      await utils.settings.getYears.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm<z.infer<typeof addYearSchema>>({
    resolver: zodResolver(addYearSchema),
    defaultValues: {
      year: "",
    },
  });

  function onSubmit(values: z.infer<typeof addYearSchema>) {
    addYearMutation.mutate(values);
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">إعدادات النظام</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>سنوات الدفع</CardTitle>
            <CardDescription>
              تفعيل أو تعطيل السنوات التي يمكن للأعضاء الدفع مقابلها.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة سنة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة سنة جديدة</DialogTitle>
                <DialogDescription>
                  أدخل السنة التي ترغب في إضافتها للقائمة. ستكون معطلة افتراضيًا.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السنة</FormLabel>
                        <FormControl>
                          <Input placeholder="2027" {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={addYearMutation.isPending}
                  >
                    {addYearMutation.isPending && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    إضافة
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] text-right">السنة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">تفعيل / تعطيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years?.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-medium">{year.year}</TableCell>
                  <TableCell>
                    {year.isEnabled ? (
                      <span className="text-green-600 font-bold">مفعّلة</span>
                    ) : (
                      <span className="text-gray-500">معطّلة</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={year.isEnabled}
                      onCheckedChange={() =>
                        toggleYearMutation.mutate({ id: year.id })
                      }
                      disabled={toggleYearMutation.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {years?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    لا توجد سنوات مضافة حاليًا.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
