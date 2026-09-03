export type FoodImageSuggestion = {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  source: string;
};

// Curated high-resolution Indian restaurant & desi cuisine photography database
const curatedIndianFoodGallery: Record<string, string[]> = {
  // --- North Indian Curries & Gravies ---
  butter_chicken: [
    "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
    "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b",
  ],
  chicken_tikka_masala: [
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
    "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28",
    "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db",
  ],
  tandoori_chicken: [
    "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28",
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46",
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086",
  ],
  chicken_curry: [
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
    "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db",
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46",
  ],
  chicken_65: [
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46",
    "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28",
    "https://images.unsplash.com/photo-1606755962773-d324e0a13086",
  ],
  paneer_butter_masala: [
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1567184109-7756f7db1358",
  ],
  paneer_tikka: [
    "https://images.unsplash.com/photo-1567184109-7756f7db1358",
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],
  palak_paneer: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],
  kadai_paneer: [
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
    "https://images.unsplash.com/photo-1567184109-7756f7db1358",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],
  dal_makhani: [
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46",
  ],
  dal_tadka: [
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46",
  ],
  chole_bhature: [
    "https://images.unsplash.com/photo-1626074353765-517a681e40be",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
  ],
  rajma: [
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
  ],
  mutton_curry: [
    "https://images.unsplash.com/photo-1544025162-d76694265947",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],

  // --- Indian Breads & Parathas ---
  butter_naan: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1626074353765-517a681e40be",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
  ],
  garlic_naan: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1626074353765-517a681e40be",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
  ],
  roti: [
    "https://images.unsplash.com/photo-1626074353765-517a681e40be",
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
  ],
  paratha: [
    "https://images.unsplash.com/photo-1626074353765-517a681e40be",
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
  ],

  // --- Biryani & Rice ---
  chicken_biryani: [
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0",
    "https://images.unsplash.com/photo-1633945274405-b6c8069047b0",
  ],
  mutton_biryani: [
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0",
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
    "https://images.unsplash.com/photo-1633945274405-b6c8069047b0",
  ],
  veg_biryani: [
    "https://images.unsplash.com/photo-1633945274405-b6c8069047b0",
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8",
    "https://images.unsplash.com/photo-1589302168068-964664d93dc0",
  ],
  pulao: [
    "https://images.unsplash.com/photo-1512058564366-18510be2db19",
    "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906",
    "https://images.unsplash.com/photo-1633945274405-b6c8069047b0",
  ],
  fried_rice: [
    "https://images.unsplash.com/photo-1512058564366-18510be2db19",
    "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906",
    "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
  ],

  // --- South Indian Specialties ---
  masala_dosa: [
    "https://images.unsplash.com/photo-1668236543090-82eba5ee5976",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1630383249896-424e482df921",
  ],
  dosa: [
    "https://images.unsplash.com/photo-1668236543090-82eba5ee5976",
    "https://images.unsplash.com/photo-1630383249896-424e482df921",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],
  idli: [
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1668236543090-82eba5ee5976",
    "https://images.unsplash.com/photo-1630383249896-424e482df921",
  ],
  vada: [
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1668236543090-82eba5ee5976",
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
  ],

  // --- Indian Street Food, Chaat & Snacks ---
  samosa: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0",
    "https://images.unsplash.com/photo-1567184109-7756f7db1358",
  ],
  pav_bhaji: [
    "https://images.unsplash.com/photo-1606491956689-2ea866880c84",
    "https://images.unsplash.com/photo-1626074353765-517a681e40be",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],
  vada_pav: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1606491956689-2ea866880c84",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],
  pani_puri: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1567184109-7756f7db1358",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],
  chaat: [
    "https://images.unsplash.com/photo-1601050690597-df0568f70950",
    "https://images.unsplash.com/photo-1567184109-7756f7db1358",
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
  ],
  momos: [
    "https://images.unsplash.com/photo-1625242661157-e6f776264627",
    "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf",
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9",
  ],
  spring_roll: [
    "https://images.unsplash.com/photo-1544025162-d76694265947",
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
    "https://images.unsplash.com/photo-1509722747041-616f39b57569",
  ],
  noodles: [
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
    "https://images.unsplash.com/photo-1612927601601-6638404737ce",
    "https://images.unsplash.com/photo-1585032226651-759b368d7246",
  ],
  manchurian: [
    "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46",
    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
    "https://images.unsplash.com/photo-1585032226651-759b368d7246",
  ],

  // --- Indian Sweets & Desserts ---
  gulab_jamun: [
    "https://images.unsplash.com/photo-1587314168485-3236d6710814",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
  ],
  rasgulla: [
    "https://images.unsplash.com/photo-1587314168485-3236d6710814",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87",
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a",
  ],
  rasmalai: [
    "https://images.unsplash.com/photo-1587314168485-3236d6710814",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87",
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a",
  ],
  jalebi: [
    "https://images.unsplash.com/photo-1587314168485-3236d6710814",
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
  ],
  kulfi: [
    "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb",
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a",
  ],
  icecream: [
    "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f",
    "https://images.unsplash.com/photo-1563805042-7684c019e1cb",
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a",
  ],
  cake: [
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
    "https://images.unsplash.com/photo-1535141192574-5d4897c13136",
  ],

  // --- Indian Beverages & Chai ---
  chai: [
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3",
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
    "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9",
  ],
  masala_chai: [
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3",
    "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
    "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9",
  ],
  coffee: [
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735",
  ],
  lassi: [
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699",
    "https://images.unsplash.com/photo-1556881286-fc6915169721",
    "https://images.unsplash.com/photo-1544145945-f90425340c7e",
  ],
  mango_lassi: [
    "https://images.unsplash.com/photo-1556881286-fc6915169721",
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699",
    "https://images.unsplash.com/photo-1544145945-f90425340c7e",
  ],
  shake: [
    "https://images.unsplash.com/photo-1572490122747-3968b75cc699",
    "https://images.unsplash.com/photo-1579954115545-a95591f28bfc",
    "https://images.unsplash.com/photo-1553787499-6f9133860278",
  ],

  // --- Indian Thali & Full Meals ---
  thali: [
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
    "https://images.unsplash.com/photo-1567184109-7756f7db1358",
  ],

  // --- Cafe & Fast Food (Desi Style) ---
  pizza: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
  ],
  burger: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90",
    "https://images.unsplash.com/photo-1550547660-d9450f859349",
  ],
  sandwich: [
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af",
    "https://images.unsplash.com/photo-1553909489-cd47e0907980",
    "https://images.unsplash.com/photo-1509722747041-616f39b57569",
  ],
  fries: [
    "https://images.unsplash.com/photo-1576107232684-1279f3908594",
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0",
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
  ],
  pasta: [
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141",
    "https://images.unsplash.com/photo-1621996346565-e3d5d6281691",
    "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb",
  ],
  generic_indian_food: [
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc",
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc7",
    "https://images.unsplash.com/photo-1567184109-7756f7db1358",
  ],
};

// Priority multi-word phrase dictionary for Indian dishes
const phraseMatchMap: Array<[string, keyof typeof curatedIndianFoodGallery]> = [
  ["paneer butter masala", "paneer_butter_masala"],
  ["butter paneer", "paneer_butter_masala"],
  ["shahi paneer", "paneer_butter_masala"],
  ["palak paneer", "palak_paneer"],
  ["kadai paneer", "kadai_paneer"],
  ["kadhai paneer", "kadai_paneer"],
  ["paneer tikka", "paneer_tikka"],
  ["paneer chilli", "manchurian"],
  ["chilli paneer", "manchurian"],
  ["paneer", "paneer_butter_masala"],

  ["butter chicken", "butter_chicken"],
  ["murgh makhani", "butter_chicken"],
  ["murg makhani", "butter_chicken"],
  ["chicken tikka masala", "chicken_tikka_masala"],
  ["chicken tikka", "tandoori_chicken"],
  ["tandoori chicken", "tandoori_chicken"],
  ["chicken 65", "chicken_65"],
  ["kadhai chicken", "chicken_curry"],
  ["kadai chicken", "chicken_curry"],
  ["chicken curry", "chicken_curry"],
  ["chicken handi", "chicken_curry"],
  ["chicken", "chicken_curry"],

  ["dal makhani", "dal_makhani"],
  ["dal makhni", "dal_makhani"],
  ["dal tadka", "dal_tadka"],
  ["dal fry", "dal_tadka"],
  ["yellow dal", "dal_tadka"],
  ["dal", "dal_tadka"],

  ["chole bhature", "chole_bhature"],
  ["chole bhaturey", "chole_bhature"],
  ["chana masala", "chole_bhature"],
  ["chole", "chole_bhature"],
  ["bhature", "chole_bhature"],
  ["rajma chawal", "rajma"],
  ["rajma", "rajma"],

  ["mutton rogan josh", "mutton_curry"],
  ["rogan josh", "mutton_curry"],
  ["mutton curry", "mutton_curry"],
  ["mutton biryani", "mutton_biryani"],
  ["mutton", "mutton_curry"],

  ["butter naan", "butter_naan"],
  ["garlic naan", "garlic_naan"],
  ["cheese naan", "garlic_naan"],
  ["tandoori naan", "butter_naan"],
  ["naan", "butter_naan"],
  ["tandoori roti", "roti"],
  ["rumali roti", "roti"],
  ["roti", "roti"],
  ["chapati", "roti"],
  ["phulka", "roti"],
  ["aloo paratha", "paratha"],
  ["paneer paratha", "paratha"],
  ["laccha paratha", "paratha"],
  ["paratha", "paratha"],
  ["kulcha", "butter_naan"],
  ["poori", "chole_bhature"],
  ["puri", "chole_bhature"],

  ["hyderabadi biryani", "chicken_biryani"],
  ["chicken biryani", "chicken_biryani"],
  ["mutton dum biryani", "mutton_biryani"],
  ["veg biryani", "veg_biryani"],
  ["dum biryani", "chicken_biryani"],
  ["biryani", "chicken_biryani"],
  ["jeera rice", "pulao"],
  ["veg pulao", "pulao"],
  ["pulao", "pulao"],
  ["fried rice", "fried_rice"],
  ["schezwan fried rice", "fried_rice"],
  ["rice", "pulao"],

  ["masala dosa", "masala_dosa"],
  ["mysore masala dosa", "masala_dosa"],
  ["plain dosa", "dosa"],
  ["ghee roast dosa", "dosa"],
  ["dosa", "dosa"],
  ["idli sambar", "idli"],
  ["idli", "idli"],
  ["medu vada", "vada"],
  ["sambar vada", "vada"],
  ["vada", "vada"],
  ["uttapam", "dosa"],

  ["pav bhaji", "pav_bhaji"],
  ["vada pav", "vada_pav"],
  ["misal pav", "pav_bhaji"],
  ["pani puri", "pani_puri"],
  ["golgappa", "pani_puri"],
  ["puchka", "pani_puri"],
  ["sev puri", "chaat"],
  ["bhel puri", "chaat"],
  ["dahi puri", "chaat"],
  ["papdi chaat", "chaat"],
  ["aloo tikki", "chaat"],
  ["chaat", "chaat"],
  ["samosa", "samosa"],
  ["kachori", "samosa"],

  ["hakka noodles", "noodles"],
  ["schezwan noodles", "noodles"],
  ["veg noodles", "noodles"],
  ["chowmein", "noodles"],
  ["noodles", "noodles"],
  ["veg manchurian", "manchurian"],
  ["chicken manchurian", "manchurian"],
  ["manchurian", "manchurian"],
  ["tandoori momos", "momos"],
  ["fried momos", "momos"],
  ["steamed momos", "momos"],
  ["momos", "momos"],
  ["momo", "momos"],
  ["spring roll", "spring_roll"],
  ["roll", "spring_roll"],
  ["kathi roll", "spring_roll"],
  ["frankie", "spring_roll"],

  ["gulab jamun", "gulab_jamun"],
  ["rasgulla", "rasgulla"],
  ["ras malai", "rasmalai"],
  ["rasmalai", "rasmalai"],
  ["jalebi", "jalebi"],
  ["rabdi", "jalebi"],
  ["kulfi", "kulfi"],
  ["gajar halwa", "gulab_jamun"],
  ["kheer", "rasmalai"],
  ["ice cream", "icecream"],
  ["icecream", "icecream"],
  ["cake", "cake"],
  ["pastry", "cake"],

  ["masala chai", "masala_chai"],
  ["ginger tea", "masala_chai"],
  ["elaichi chai", "masala_chai"],
  ["cutting chai", "masala_chai"],
  ["chai", "chai"],
  ["tea", "chai"],
  ["filter coffee", "coffee"],
  ["cold coffee", "coffee"],
  ["coffee", "coffee"],
  ["mango lassi", "mango_lassi"],
  ["sweet lassi", "lassi"],
  ["chaas", "lassi"],
  ["buttermilk", "lassi"],
  ["lassi", "lassi"],
  ["chocolate shake", "shake"],
  ["milkshake", "shake"],
  ["shake", "shake"],

  ["thali", "thali"],
  ["special thali", "thali"],
  ["deluxe thali", "thali"],

  ["pizza", "pizza"],
  ["burger", "burger"],
  ["sandwich", "sandwich"],
  ["french fries", "fries"],
  ["peri peri fries", "fries"],
  ["fries", "fries"],
  ["pasta", "pasta"],
];

function formatPhotoUrl(baseUrl: string, width = 600) {
  const url = new URL(baseUrl);
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", "80");
  return url.toString();
}

export function getMatchingFoodImages(query: string, category?: string): FoodImageSuggestion[] {
  const normalizedText = `${query || ""} ${category || ""}`.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

  let matchedKey: string | null = null;

  // 1. Check exact Indian dish phrases (sorted longest first for high precision)
  const sortedPhrases = [...phraseMatchMap].sort((a, b) => b[0].length - a[0].length);
  for (const [phrase, key] of sortedPhrases) {
    if (normalizedText.includes(phrase)) {
      matchedKey = key;
      break;
    }
  }

  // 2. Check individual token matches if no phrase matched
  if (!matchedKey) {
    const tokens = normalizedText.split(/\s+/).filter((t) => t.length >= 3);
    for (const token of tokens) {
      if (curatedIndianFoodGallery[token]) {
        matchedKey = token;
        break;
      }
    }
  }

  // 3. Indian restaurant category-based fallback
  if (!matchedKey && category) {
    const cat = category.toLowerCase();
    if (cat.includes("starter") || cat.includes("tandoor") || cat.includes("kabab") || cat.includes("appetizer")) {
      matchedKey = "tandoori_chicken";
    } else if (cat.includes("main") || cat.includes("curry") || cat.includes("gravy") || cat.includes("sabzi")) {
      matchedKey = "paneer_butter_masala";
    } else if (cat.includes("roti") || cat.includes("bread") || cat.includes("naan") || cat.includes("paratha")) {
      matchedKey = "butter_naan";
    } else if (cat.includes("rice") || cat.includes("biryani") || cat.includes("pulao")) {
      matchedKey = "chicken_biryani";
    } else if (cat.includes("south") || cat.includes("dosa") || cat.includes("idli")) {
      matchedKey = "masala_dosa";
    } else if (cat.includes("chaat") || cat.includes("street") || cat.includes("snack")) {
      matchedKey = "samosa";
    } else if (cat.includes("chinese") || cat.includes("noodle") || cat.includes("momo")) {
      matchedKey = "noodles";
    } else if (cat.includes("sweet") || cat.includes("dessert") || cat.includes("mithai")) {
      matchedKey = "gulab_jamun";
    } else if (cat.includes("beverage") || cat.includes("drink") || cat.includes("chai") || cat.includes("tea") || cat.includes("coffee")) {
      matchedKey = "masala_chai";
    } else if (cat.includes("pizza")) {
      matchedKey = "pizza";
    } else if (cat.includes("burger")) {
      matchedKey = "burger";
    }
  }

  const baseUrls = curatedIndianFoodGallery[matchedKey ?? "generic_indian_food"] || curatedIndianFoodGallery.generic_indian_food;

  return baseUrls.map((baseUrl, index) => ({
    id: `${matchedKey || "indian-food"}-${index + 1}`,
    url: formatPhotoUrl(baseUrl, 800),
    thumbnailUrl: formatPhotoUrl(baseUrl, 300),
    title: `${query || "Dish"} Photo ${index + 1}`,
    source: "Authentic Indian Food Gallery",
  }));
}
