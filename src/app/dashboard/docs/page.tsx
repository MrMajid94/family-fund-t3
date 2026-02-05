"use client";

import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Static list of available docs - add new docs here
const docs = [
  // {
  //   slug: "policy",
  //   title: "سياسة الصندوق (ويب)",
  //   description: "القواعد والإرشادات الخاصة بصندوق العائلة",
  //   icon: FileText,
  // },
  // {
  //   slug: "recording-payments",
  //   title: "كيفية تسجيل دفعة",
  //   description: "شرح خطوات تسجيل الدفعات والمساهمات",
  //   icon: FileText,
  // },
  {
    href: "/policy_may_2021.pdf",
    title: "تحميل السياسة (PDF)",
    description: "نسخة PDF من سياسة الصندوق (مايو 2021)",
    icon: Download,
    target: "_blank",
  },
];

export default function DocsPage() {
  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-6">الوثائق</h1>
      <p className="text-muted-foreground mb-8">
        اقرأ المستندات والسياسات الخاصة بصندوق العائلة
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc, index) => {
          // @ts-ignore
          const href = doc.href || `/dashboard/docs/${doc.slug}`;
          const Icon = doc.icon;
          
          return (
            <Link 
              key={index} 
              href={href} 
              // @ts-ignore
              target={doc.target}
            >
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription className="mt-1">{doc.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
