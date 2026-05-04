import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";

export type ProductCardData = {
  slug: string;
  nameUk: string;
  nameEn: string;
  priceUah: number;
  comparePrice?: number | null;
  stock: number;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
};

export function ProductCard({
  product,
  locale,
}: {
  product: ProductCardData;
  locale: "uk" | "en";
}) {
  const t = useTranslations("Product");
  const name = locale === "uk" ? product.nameUk : product.nameEn;
  const onSale = product.comparePrice && product.comparePrice > product.priceUah;
  const outOfStock = product.stock <= 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-wheat">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            —
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.isNewArrival && <Badge variant="new">{t("new")}</Badge>}
          {onSale && <Badge variant="sale">{t("sale")}</Badge>}
          {product.isFeatured && !product.isNewArrival && !onSale && (
            <Badge variant="featured">{t("featured")}</Badge>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-bark/40">
            <Badge>{t("outOfStock")}</Badge>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-sm text-bark group-hover:text-terracotta transition">
          {name}
        </h3>
        <Price amount={product.priceUah} comparePrice={product.comparePrice} />
      </div>
    </Link>
  );
}
