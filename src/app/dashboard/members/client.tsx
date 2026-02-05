"use client";

import { api } from "@/trpc/react";
import { MembersTable } from "./members-table";
import { UserDialog } from "./user-dialog";
import { authClient } from "@/server/better-auth/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function MembersClientPage() {
  const { data: session } = authClient.useSession();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Use tRPC to fetch users
  // We can also pass initial data from server component if we want, but simple query is fine
  const { data: users, isLoading, refetch } = api.user.list.useQuery();

  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الأعضاء</h1>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة عضو
          </Button>
        )}
      </div>

      <MembersTable 
        users={users ?? []} 
        isLoading={isLoading} 
        isAdmin={isAdmin} 
        onUpdate={() => refetch()}
      />

      <UserDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        mode="create"
        onSuccess={() => refetch()}
      />
    </div>
  );
}
