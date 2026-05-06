import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "Дашборд" };

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  return (
    <div>
      <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-[0.3em] text-brass">
        Дашборд
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic text-bark">
        Вітаємо, {session?.user.name}
      </h1>
      <p className="mt-3 text-muted">
        Тут зʼявляться статистика, замовлення та сповіщення про низький залишок.
        Поки що Iter A — лише авторизація. Наступним кроком буде дашборд.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <PlaceholderCard title="Замовлення сьогодні" />
        <PlaceholderCard title="Виторг сьогодні" />
        <PlaceholderCard title="Очікують обробки" />
      </div>
    </div>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  return (
    <div className="rounded-sm border border-border bg-linen/40 p-5">
      <p className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
        {title}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-bark">—</p>
    </div>
  );
}
