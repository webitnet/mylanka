import { useEffect, useState } from "react";
import { initTelegram } from "@/lib/telegram";
import { authenticate, setInitData, type Customer } from "@/lib/api";
import { useRouter } from "@/lib/router";
import { CatalogPage } from "@/pages/CatalogPage";
import { ProductPage } from "@/pages/ProductPage";
import { CartPage } from "@/pages/CartPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { ConfirmationPage } from "@/pages/ConfirmationPage";

type AuthState =
  | { stage: "loading" }
  | { stage: "ready"; customer: Customer | null; isTelegram: boolean }
  | { stage: "error"; message: string };

export function App() {
  const [auth, setAuth] = useState<AuthState>({ stage: "loading" });
  const { route, push, back, reset } = useRouter();

  useEffect(() => {
    const { initData, isTelegram } = initTelegram();
    setInitData(initData);
    if (!isTelegram) {
      setAuth({ stage: "ready", customer: null, isTelegram: false });
      return;
    }
    authenticate()
      .then((customer) => setAuth({ stage: "ready", customer, isTelegram: true }))
      .catch((err) =>
        setAuth({
          stage: "error",
          message: err instanceof Error ? err.message : "Помилка авторизації",
        }),
      );
  }, []);

  if (auth.stage === "loading") {
    return (
      <div className="h-full grid place-items-center text-sm text-muted">
        Завантаження…
      </div>
    );
  }
  if (auth.stage === "error") {
    return (
      <div className="h-full grid place-items-center p-6 text-center">
        <div>
          <p className="text-sm text-embroidery">Не вдалося авторизуватись</p>
          <p className="mt-2 text-xs text-muted">{auth.message}</p>
        </div>
      </div>
    );
  }

  switch (route.name) {
    case "catalog":
      return (
        <CatalogPage
          onOpenProduct={(slug) => push({ name: "product", slug })}
          onOpenCart={() => push({ name: "cart" })}
        />
      );
    case "product":
      return (
        <ProductPage
          slug={route.slug}
          onAdded={() => back()}
        />
      );
    case "cart":
      return <CartPage onCheckout={() => push({ name: "checkout" })} />;
    case "checkout":
      return (
        <CheckoutPage
          customer={auth.customer}
          onPlaced={(orderNumber) => reset({ name: "confirmation", orderNumber })}
        />
      );
    case "confirmation":
      return (
        <ConfirmationPage
          orderNumber={route.orderNumber}
          onClose={() => reset({ name: "catalog" })}
        />
      );
  }
}
