import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Вхід в адмінку" };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-sm border border-border bg-linen/40 p-8 shadow-sm">
        <p className="text-center font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.3em] text-brass">
          Mylanka — Миланка
        </p>
        <h1 className="mt-3 text-center font-[family-name:var(--font-display)] text-3xl italic text-bark">
          Адмін-панель
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Увійдіть, щоб керувати магазином
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
