import Link from "next/link";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { createProduct, listCategoriesFlat } from "@/lib/admin/products";

export const metadata = { title: "Новий товар" };

export default async function NewProductPage() {
  const categories = await listCategoriesFlat();

  return (
    <div className="space-y-6">
      <header>
        <Link
          href="/admin/products"
          className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted hover:text-bark"
        >
          ← Усі товари
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic text-bark">
          Новий товар
        </h1>
      </header>

      <ProductForm
        mode="create"
        defaults={{}}
        categories={categories}
        action={createProduct}
      />
    </div>
  );
}
