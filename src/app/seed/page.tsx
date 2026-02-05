"use client";

import { useState } from "react";
import { api } from "@/trpc/react";

export default function SeedPage() {
  const [message, setMessage] = useState<string | null>(null);

  const utils = api.useUtils();

  const seedMutation = api.seed.seedUsers.useMutation({
    onSuccess: (data) => {
      let msg = data.message;
      if (data.details?.errors?.length > 0) {
        msg += `\n\nأخطاء (${data.details.errors.length}):\n` + data.details.errors.slice(0, 5).join('\n');
        if (data.details.errors.length > 5) {
          msg += `\n... و ${data.details.errors.length - 5} أخطاء أخرى`;
        }
      }
      setMessage(msg);
      utils.seed.getUsers.invalidate();
    },
    onError: (error) => {
      setMessage(`خطأ: ${error.message}`);
    },
  });

  const clearMutation = api.seed.clearUsers.useMutation({
    onSuccess: (data) => {
      setMessage(data.message);
      utils.seed.getUsers.invalidate();
    },
    onError: (error) => {
      setMessage(`خطأ: ${error.message}`);
    },
  });

  const seedPaymentsMutation = api.seed.seedPayments.useMutation({
    onSuccess: (data) => {
      let msg = data.message;
      if (data.details?.errors?.length > 0) {
        msg += `\n\nأخطاء (${data.details.errors.length}):\n` + data.details.errors.slice(0, 5).join('\n');
        if (data.details.errors.length > 5) {
          msg += `\n... و ${data.details.errors.length - 5} أخطاء أخرى`;
        }
      }
      if (data.details?.skipped?.length > 0) {
        msg += `\n\nتم تخطي (${data.details.skipped.length}):\n` + data.details.skipped.slice(0, 3).join('\n');
        if (data.details.skipped.length > 3) {
          msg += `\n... و ${data.details.skipped.length - 3} آخرين`;
        }
      }
      setMessage(msg);
    },
    onError: (error) => {
      setMessage(`خطأ: ${error.message}`);
    },
  });

  const { data: users, isLoading } = api.seed.getUsers.useQuery();

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            color: "#4ade80",
          }}
        >
          إدارة البيانات التجريبية
        </h1>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#22c55e",
              color: "#000",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: seedMutation.isPending ? "not-allowed" : "pointer",
              opacity: seedMutation.isPending ? 0.7 : 1,
            }}
          >
            {seedMutation.isPending ? "جاري الإضافة..." : "إضافة المستخدمين"}
          </button>

          <button
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: clearMutation.isPending ? "not-allowed" : "pointer",
              opacity: clearMutation.isPending ? 0.7 : 1,
            }}
          >
            {clearMutation.isPending ? "جاري الحذف..." : "حذف المستخدمين"}
          </button>

          <button
            onClick={() => seedPaymentsMutation.mutate()}
            disabled={seedPaymentsMutation.isPending}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: seedPaymentsMutation.isPending ? "not-allowed" : "pointer",
              opacity: seedPaymentsMutation.isPending ? 0.7 : 1,
            }}
          >
            {seedPaymentsMutation.isPending ? "جاري الإضافة..." : "إضافة المدفوعات القديمة"}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#1f2937",
              borderRadius: "0.5rem",
              marginBottom: "2rem",
              borderRight: "4px solid #4ade80",
            }}
          >
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        {/* Users List */}
        <div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "1rem",
              color: "#9ca3af",
            }}
          >
            المستخدمون الحاليون
          </h2>

          {isLoading ? (
            <p style={{ color: "#6b7280" }}>جاري التحميل...</p>
          ) : users && users.length > 0 ? (
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
              }}
            >
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    padding: "1rem",
                    backgroundColor: "#1f2937",
                    borderRadius: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: "600",
                        fontSize: "1.1rem",
                      }}
                    >
                      {user.name}
                    </p>
                    <p
                      style={{
                        margin: "0.25rem 0 0",
                        color: "#9ca3af",
                        fontSize: "0.875rem",
                      }}
                    >
                      {user.phoneNumber ?? user.username ?? "—"}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#374151",
                      borderRadius: "1rem",
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                    }}
                  >
                    {user.id}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#6b7280" }}>لا يوجد مستخدمون حالياً</p>
          )}
        </div>
      </div>
    </div>
  );
}
