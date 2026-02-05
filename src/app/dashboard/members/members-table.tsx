"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Loader2 } from "lucide-react";
import { useState } from "react";
import { UserDialog } from "./user-dialog";
import { type RouterOutputs } from "@/trpc/react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

type User = RouterOutputs["user"]["list"][number];

interface MembersTableProps {
  users: User[];
  isLoading: boolean;
  isAdmin: boolean;
  onUpdate: () => void;
}

export function MembersTable({ users, isLoading, isAdmin, onUpdate }: MembersTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الاسم</TableHead>
              <TableHead className="text-right">رقم الهاتف (اسم المستخدم)</TableHead>
              <TableHead className="text-right">تاريخ بداية الدفع</TableHead>
              <TableHead className="text-right">الدور</TableHead>
              {isAdmin && <TableHead className="text-right">إجراءات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="h-24 text-center">
                  لا يوجد أعضاء
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.phoneNumber ?? user.username}</TableCell>
                  <TableCell>
                     {user.paymentStartDate ? format(new Date(user.paymentStartDate), "PPP", { locale: arSA }) : "-"}
                  </TableCell>
                  <TableCell>{user.role === "admin" ? "مسؤول" : "عضو"}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <UserDialog
          open={!!editingUser}
          onOpenChange={(open: boolean) => !open && setEditingUser(null)}
          mode="update"
          user={editingUser}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}
