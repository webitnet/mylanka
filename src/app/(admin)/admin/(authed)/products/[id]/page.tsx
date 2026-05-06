import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/products/ProductForm";
import {
  getProductForAdmin,
  listCategoriesFlat,
  setProductActive,
  updateProduct,
} from "@/lib/admin/products";
import type { ProductInputT } from "@/lib/admin/products";

export const metadata = { title: "Редагування товару" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForAdmin(id),
    listCategoriesFlat(),
  ]);
  if (!product) notFound();

  const updateAction = async (input: ProductInputT) => {
    "use server";
    await updateProduct(id, input);
  };
  const archiveAction = async () => {
    "use server";
    await setProductActive(id, false);
  };
  const restoreAction = async () => {
    "use server";
    await setProductActive(id, true);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <Link
            href="/admin/products"
            className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted hover:text-bark"
          >
            ← Усі товари
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl italic text-bark">
            {product.nameUk}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted">
            SKU: {product.sku} · /{product.slug}
          </p>
        </div>
        <form action={product.isActive ? archiveAction : restoreAction}>
          <button
            type="submit"
            className="rounded-sm border border-border px-4 py-2 font-[family-name:var(--font-ui)] text-xs uppercase tracking-wider text-muted hover:border-embroidery hover:text-embroidery"
          >
            {product.isActive ? "Архівувати" : "Відновити"}
          </button>
        </form>
      </header>

      <ProductForm
        mode="edit"
        productId={product.id}
        defaults={{
          sku: product.sku,
          slug: product.slug,
          nameUk: product.nameUk,
          nameEn: product.nameEn,
          shortDescUk: product.shortDescUk,
          shortDescEn: product.shortDescEn,
          descUk: product.descUk,
          descEn: product.descEn,
          priceUahKopecks: product.priceUah,
          comparePriceKopecks: product.comparePrice,
          costPriceKopecks: product.costPrice,
          categoryId: product.categoryId,
          stock: product.stock,
          lowStockAt: product.lowStockAt,
          trackStock: product.trackStock,
          material: product.material,
          artisan: product.artisan,
          region: product.region,
          weight: product.weight,
          dimensions: product.dimensions,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isNewArrival: product.isNewArrival,
          metaTitleUk: product.metaTitleUk,
          metaTitleEn: product.metaTitleEn,
          metaDescUk: product.metaDescUk,
          metaDescEn: product.metaDescEn,
          imageUrls: product.images.map((i) => i.url),
        }}
        categories={categories}
        action={updateAction}
      />
    </div>
  );
}
