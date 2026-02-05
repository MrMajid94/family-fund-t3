"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { authClient } from "@/server/better-auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BackgroundPattern } from "@/components/background-pattern";

export default function Hero() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 8) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.username({
        username: phoneNumber,
        password: phoneNumber,
      });

      if (result.error) {
        setError("رقم الهاتف غير صحيح");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6" dir="rtl">
      <BackgroundPattern />

      <div className="relative z-10 max-w-3xl text-center">
        <h1 className="mt-6 font-semibold text-4xl tracking-tighter sm:text-5xl md:text-6xl md:leading-[1.2] lg:text-7xl">
          صندوق عائلة الشكيلي
        </h1>
        <p className="mt-6 text-foreground/80 md:text-lg">
          منصة لإدارة مساهمات أفراد العائلة في الصندوق العائلي.
          سجّل دفعاتك الشهرية وتابع سجل مساهماتك بكل سهولة.
        </p>
        <div className="mt-8 text-foreground/60 text-sm">
          <p>المساهمة الشهرية: <span className="font-bold text-foreground">١٠ ر.ع</span></p>
          <p>موعد السداد: الخامس من كل شهر</p>
        </div>

        {/* Quick Login Form */}
        <Card className="mt-10 mx-auto max-w-sm bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="أدخل رقم هاتفك"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  disabled={isLoading}
                  className="text-center tracking-wider"
                />
                <Button
                  type="submit"
                  disabled={isLoading || phoneNumber.length < 8}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shrink-0"
                >
                  {isLoading ? "..." : "دخول"}
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center justify-center">
          <Button
            asChild
            className="rounded-full text-base shadow-none"
            size="lg"
            variant="ghost"
          >
            <Link href="#about">
              <ArrowLeft className="h-5! w-5! ms-2 rtl:rotate-180" /> المزيد عن الصندوق
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
