import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Map of available docs
const docsMeta: Record<string, { title: string; file: string }> = {
  policy: { title: "سياسة الصندوق", file: "policy.md" },
  "recording-payments": { title: "كيفية تسجيل دفعة", file: "recording-payments.md" },
};

async function getDocContent(slug: string): Promise<string | null> {
  const meta = docsMeta[slug];
  if (!meta) return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/docs/${meta.file}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export default async function DocViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = await getDocContent(slug);
  const meta = docsMeta[slug];

  if (!content || !meta) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <div className="mb-6">
        <Link href="/dashboard/docs">
          <Button variant="ghost" size="sm">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للوثائق
          </Button>
        </Link>
      </div>
      <article className="prose prose-lg dark:prose-invert max-w-none text-right">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </div>
  );
}
