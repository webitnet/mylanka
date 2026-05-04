import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Placeholder image (Unsplash random — replace with R2 URLs once uploaded)
const ph = (seed: string) =>
  `https://images.unsplash.com/photo-${seed}?w=1200&auto=format&fit=crop&q=80`;

type CategorySeed = {
  slug: string;
  nameUk: string;
  nameEn: string;
  children?: CategorySeed[];
};

const categoryTree: CategorySeed[] = [
  {
    slug: "ceramics",
    nameUk: "Кераміка",
    nameEn: "Ceramics",
    children: [
      { slug: "tableware", nameUk: "Посуд", nameEn: "Tableware" },
      { slug: "figurines", nameUk: "Фігурки", nameEn: "Figurines" },
      { slug: "decorative", nameUk: "Декоративна", nameEn: "Decorative" },
    ],
  },
  {
    slug: "textiles",
    nameUk: "Текстиль",
    nameEn: "Textiles",
    children: [
      { slug: "vyshyvanky", nameUk: "Вишиванки", nameEn: "Vyshyvanky" },
      { slug: "rushnyky", nameUk: "Рушники", nameEn: "Rushnyky" },
      { slug: "accessories-textile", nameUk: "Аксесуари", nameEn: "Accessories" },
    ],
  },
  {
    slug: "woodwork",
    nameUk: "Дерев'яні вироби",
    nameEn: "Woodwork",
    children: [
      { slug: "kitchenware", nameUk: "Кухонне", nameEn: "Kitchenware" },
      { slug: "boxes", nameUk: "Скриньки", nameEn: "Boxes" },
      { slug: "toys", nameUk: "Іграшки", nameEn: "Toys" },
    ],
  },
  {
    slug: "jewelry",
    nameUk: "Прикраси",
    nameEn: "Jewelry",
    children: [
      { slug: "necklaces", nameUk: "Намиста", nameEn: "Necklaces" },
      { slug: "earrings", nameUk: "Сережки", nameEn: "Earrings" },
      { slug: "brooches", nameUk: "Брошки", nameEn: "Brooches" },
    ],
  },
  { slug: "art", nameUk: "Живопис і графіка", nameEn: "Art & Prints" },
  { slug: "magnets", nameUk: "Магніти", nameEn: "Magnets" },
  { slug: "gifts", nameUk: "Подарункові набори", nameEn: "Gift Sets" },
  {
    slug: "regional",
    nameUk: "Регіональні",
    nameEn: "Regional",
    children: [
      { slug: "carpathian", nameUk: "Карпатські", nameEn: "Carpathian" },
      { slug: "hutsul", nameUk: "Гуцульські", nameEn: "Hutsul" },
      { slug: "cossack", nameUk: "Козацькі", nameEn: "Cossack" },
    ],
  },
];

type ProductSeed = {
  sku: string;
  slug: string;
  categorySlug: string;
  nameUk: string;
  nameEn: string;
  descUk: string;
  descEn: string;
  priceUah: number;
  stock: number;
  region?: string;
  material?: string;
  imageSeed: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
};

const products: ProductSeed[] = [
  {
    sku: "CER-001", slug: "hutsul-clay-bowl",
    categorySlug: "tableware",
    nameUk: "Гуцульська глиняна миска",
    nameEn: "Hutsul Clay Bowl",
    descUk: "Ручна робота з глини, розписана традиційними гуцульськими орнаментами.",
    descEn: "Hand-thrown clay bowl with traditional Hutsul ornaments.",
    priceUah: 65000, stock: 12, region: "Carpathians", material: "Clay",
    imageSeed: "1578749556568-bc2c40e68b61", isFeatured: true,
  },
  {
    sku: "CER-002", slug: "kosiv-ceramic-jug",
    categorySlug: "tableware",
    nameUk: "Косівський глечик",
    nameEn: "Kosiv Ceramic Jug",
    descUk: "Класичний косівський глечик у жовто-зелено-коричневій палітрі.",
    descEn: "Classic Kosiv jug in the signature yellow-green-brown palette.",
    priceUah: 89000, stock: 7, region: "Kosiv", material: "Ceramic",
    imageSeed: "1565193566173-7a0ee3dbe261",
  },
  {
    sku: "CER-003", slug: "ceramic-rooster-figurine",
    categorySlug: "figurines",
    nameUk: "Керамічний півник",
    nameEn: "Ceramic Rooster Figurine",
    descUk: "Символ дому й оберегу — півник з глини, розписаний вручну.",
    descEn: "A symbol of home and protection — hand-painted clay rooster.",
    priceUah: 35000, stock: 20, material: "Ceramic",
    imageSeed: "1606830733744-0ad778449672", isNewArrival: true,
  },
  {
    sku: "CER-004", slug: "decorative-plate-tree-of-life",
    categorySlug: "decorative",
    nameUk: "Декоративна тарілка «Дерево життя»",
    nameEn: 'Decorative Plate "Tree of Life"',
    descUk: "Настінна тарілка з традиційним мотивом дерева життя.",
    descEn: "Wall plate featuring the traditional tree-of-life motif.",
    priceUah: 120000, stock: 4, material: "Ceramic",
    imageSeed: "1562440499-64c9a111f713",
  },

  {
    sku: "TXT-001", slug: "embroidered-shirt-traditional",
    categorySlug: "vyshyvanky",
    nameUk: "Вишиванка традиційна",
    nameEn: "Traditional Vyshyvanka",
    descUk: "Лляна сорочка з ручною вишивкою хрестиком, червоно-чорний орнамент.",
    descEn: "Linen shirt with hand cross-stitch embroidery, red-black ornament.",
    priceUah: 280000, stock: 5, material: "Linen", isFeatured: true,
    imageSeed: "1542060748-10c28b62716f",
  },
  {
    sku: "TXT-002", slug: "rushnyk-wedding",
    categorySlug: "rushnyky",
    nameUk: "Весільний рушник",
    nameEn: "Wedding Rushnyk",
    descUk: "Традиційний весільний рушник, ручна вишивка, бавовна.",
    descEn: "Traditional wedding rushnyk with hand embroidery on cotton.",
    priceUah: 150000, stock: 8, material: "Cotton",
    imageSeed: "1606112219348-204d7d8b94ee",
  },
  {
    sku: "TXT-003", slug: "wool-scarf-carpathian",
    categorySlug: "accessories-textile",
    nameUk: "Карпатський вовняний шарф",
    nameEn: "Carpathian Wool Scarf",
    descUk: "Теплий шарф з овечої вовни, виткана вручну.",
    descEn: "Warm hand-woven scarf made from sheep wool.",
    priceUah: 95000, stock: 15, region: "Carpathians", material: "Wool",
    imageSeed: "1601762603339-fd61e28b698a",
  },

  {
    sku: "WOD-001", slug: "carved-wooden-spoon-set",
    categorySlug: "kitchenware",
    nameUk: "Набір різьблених ложок",
    nameEn: "Carved Wooden Spoon Set",
    descUk: "Набір з 4-х ложок з ясеня з гуцульським різьбленням.",
    descEn: "Set of 4 ash-wood spoons with Hutsul carvings.",
    priceUah: 45000, stock: 18, material: "Ash wood",
    imageSeed: "1581622558663-b2e33377dfb2",
  },
  {
    sku: "WOD-002", slug: "wooden-jewelry-box",
    categorySlug: "boxes",
    nameUk: "Скринька для прикрас",
    nameEn: "Wooden Jewelry Box",
    descUk: "Різьблена скринька з горіха, оздоблена інкрустацією.",
    descEn: "Carved walnut jewelry box with inlay decoration.",
    priceUah: 175000, stock: 6, material: "Walnut",
    imageSeed: "1607344645866-009c320b63e0", isFeatured: true,
  },
  {
    sku: "WOD-003", slug: "wooden-rocking-horse",
    categorySlug: "toys",
    nameUk: "Дерев'яний коник-гойдалка",
    nameEn: "Wooden Rocking Horse",
    descUk: "Іграшковий коник з натурального дерева, ручна робота.",
    descEn: "Handcrafted natural-wood toy rocking horse.",
    priceUah: 220000, stock: 3, material: "Pine",
    imageSeed: "1558877385-8c1c0d7e6f12",
  },

  {
    sku: "JWL-001", slug: "amber-necklace-classic",
    categorySlug: "necklaces",
    nameUk: "Бурштинове намисто",
    nameEn: "Amber Necklace",
    descUk: "Намисто з натурального українського бурштину.",
    descEn: "Necklace made from natural Ukrainian amber.",
    priceUah: 320000, stock: 4, material: "Amber",
    imageSeed: "1573408301185-9146fe634ad0",
  },
  {
    sku: "JWL-002", slug: "filigree-earrings-silver",
    categorySlug: "earrings",
    nameUk: "Сережки філігрань",
    nameEn: "Filigree Silver Earrings",
    descUk: "Сережки зі срібла з традиційною українською філіграню.",
    descEn: "Silver earrings with traditional Ukrainian filigree.",
    priceUah: 180000, stock: 10, material: "Silver 925",
    imageSeed: "1535632787350-4e68ef0ac584", isNewArrival: true,
  },
  {
    sku: "JWL-003", slug: "brooch-poppy-enamel",
    categorySlug: "brooches",
    nameUk: "Брошка «Мак»",
    nameEn: 'Poppy Brooch',
    descUk: "Емальована брошка у формі маку — символу пам'яті.",
    descEn: "Enameled poppy-shaped brooch — a symbol of remembrance.",
    priceUah: 75000, stock: 14, material: "Enamel on brass",
    imageSeed: "1599643478518-a784e5dc4c8f",
  },

  {
    sku: "ART-001", slug: "petrykivka-painting-floral",
    categorySlug: "art",
    nameUk: "Петриківський розпис",
    nameEn: "Petrykivka Painting",
    descUk: "Картина в техніці петриківського розпису, квітковий мотив.",
    descEn: "Painting in the Petrykivka style, floral motif.",
    priceUah: 250000, stock: 2, region: "Petrykivka",
    imageSeed: "1578321272176-b7bbc0679853", isFeatured: true,
  },
  {
    sku: "ART-002", slug: "ukrainian-icon-print",
    categorySlug: "art",
    nameUk: "Принт української ікони",
    nameEn: "Ukrainian Icon Print",
    descUk: "Якісний принт класичної української ікони.",
    descEn: "High-quality print of a classic Ukrainian icon.",
    priceUah: 65000, stock: 25,
    imageSeed: "1571115764595-644a1f56a55c",
  },

  {
    sku: "MAG-001", slug: "magnet-kyiv-skyline",
    categorySlug: "magnets",
    nameUk: "Магніт «Київ»",
    nameEn: 'Magnet "Kyiv"',
    descUk: "Керамічний магніт із силуетом Києва.",
    descEn: "Ceramic magnet with the Kyiv skyline.",
    priceUah: 12000, stock: 100, material: "Ceramic",
    imageSeed: "1591289009723-87a3d9b80a45",
  },
  {
    sku: "MAG-002", slug: "magnet-trident",
    categorySlug: "magnets",
    nameUk: "Магніт «Тризуб»",
    nameEn: 'Magnet "Trident"',
    descUk: "Дерев'яний магніт з лазерним гравіюванням тризуба.",
    descEn: "Wooden magnet with a laser-engraved trident.",
    priceUah: 9000, stock: 150, material: "Wood",
    imageSeed: "1571115764595-644a1f56a55c",
  },

  {
    sku: "GFT-001", slug: "gift-set-tea-time",
    categorySlug: "gifts",
    nameUk: "Подарунковий набір «Чайний»",
    nameEn: 'Gift Set "Tea Time"',
    descUk: "Глиняний чайник, дві чашки та лляна серветка.",
    descEn: "Clay teapot, two cups, and a linen napkin.",
    priceUah: 320000, stock: 5,
    imageSeed: "1547825407-2d060104b7f8", isFeatured: true,
  },
  {
    sku: "GFT-002", slug: "gift-set-tourist",
    categorySlug: "gifts",
    nameUk: "Подарунковий набір туристу",
    nameEn: "Tourist Gift Set",
    descUk: "Магніт, листівка, керамічна чашка та брелок.",
    descEn: "Magnet, postcard, ceramic mug, and a keychain.",
    priceUah: 85000, stock: 30,
    imageSeed: "1547721064-da6cfb341d50",
  },

  {
    sku: "RGN-001", slug: "hutsul-axe-bartka",
    categorySlug: "hutsul",
    nameUk: "Гуцульська бартка",
    nameEn: "Hutsul Bartka (Ceremonial Axe)",
    descUk: "Декоративна гуцульська бартка з різьбленням по дереву.",
    descEn: "Decorative Hutsul ceremonial axe with wood carving.",
    priceUah: 380000, stock: 2, region: "Hutsul",
    imageSeed: "1605379399843-5870eea9b74e",
  },
  {
    sku: "RGN-002", slug: "carpathian-cheese-board",
    categorySlug: "carpathian",
    nameUk: "Карпатська дошка для сиру",
    nameEn: "Carpathian Cheese Board",
    descUk: "Дошка з ясеня з гуцульською різьбою.",
    descEn: "Ash-wood cheese board with Hutsul carving.",
    priceUah: 95000, stock: 12, region: "Carpathians", material: "Ash wood",
    imageSeed: "1565193566173-7a0ee3dbe261",
  },
  {
    sku: "RGN-003", slug: "cossack-pipe-replica",
    categorySlug: "cossack",
    nameUk: "Козацька люлька (репліка)",
    nameEn: "Cossack Pipe (Replica)",
    descUk: "Декоративна репліка козацької люльки з натуральних матеріалів.",
    descEn: "Decorative replica of a Cossack pipe in natural materials.",
    priceUah: 110000, stock: 8, region: "Cossack",
    imageSeed: "1599643478518-a784e5dc4c8f",
  },
];

async function upsertCategoryTree(tree: CategorySeed[], parentId: string | null = null) {
  for (const node of tree) {
    const cat = await prisma.category.upsert({
      where: { slug: node.slug },
      update: { nameUk: node.nameUk, nameEn: node.nameEn, parentId: parentId ?? undefined },
      create: { slug: node.slug, nameUk: node.nameUk, nameEn: node.nameEn, parentId },
    });
    if (node.children?.length) {
      await upsertCategoryTree(node.children, cat.id);
    }
  }
}

async function main() {
  console.log("Seeding categories…");
  await upsertCategoryTree(categoryTree);

  console.log(`Seeding ${products.length} products…`);
  for (const p of products) {
    const cat = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (!cat) throw new Error(`Category not found: ${p.categorySlug}`);

    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        slug: p.slug,
        nameUk: p.nameUk,
        nameEn: p.nameEn,
        descUk: p.descUk,
        descEn: p.descEn,
        priceUah: p.priceUah,
        stock: p.stock,
        region: p.region,
        material: p.material,
        isFeatured: p.isFeatured ?? false,
        isNewArrival: p.isNewArrival ?? false,
        categoryId: cat.id,
        images: {
          create: [
            { url: `https://images.unsplash.com/photo-${p.imageSeed}?w=1200&auto=format&fit=crop&q=80`, isPrimary: true, sortOrder: 0 },
          ],
        },
      },
    });
  }

  console.log("Seeding admin user…");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ridne.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "Admin",
      role: "SUPER_ADMIN",
    },
  });

  console.log("✔ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
