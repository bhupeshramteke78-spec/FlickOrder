export type ItemPortion = {
  name: string;
  price: number;
};

export type ParsedItemVariants = {
  description: string;
  hasPortions: boolean;
  portions: ItemPortion[];
};

export function parseItemVariants(description: string | null | undefined): ParsedItemVariants {
  if (!description) {
    return { description: "", hasPortions: false, portions: [] };
  }

  const tagMatch = description.match(/<!--portions:(.*?)-->/);
  if (tagMatch) {
    try {
      const parsed = JSON.parse(tagMatch[1]) as ItemPortion[];
      const cleanDesc = description.replace(/<!--portions:.*?-->/g, "").trim();
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          description: cleanDesc,
          hasPortions: true,
          portions: parsed.map((p) => ({
            name: String(p.name).trim(),
            price: Math.max(Number(p.price) || 0, 0),
          })),
        };
      }
    } catch {
      // Ignore parse error and return clean description
    }
  }

  return {
    description: description.trim(),
    hasPortions: false,
    portions: [],
  };
}

export function serializeItemVariants(descriptionText: string, portions: ItemPortion[]): string {
  const cleanDesc = (descriptionText ?? "").replace(/<!--portions:.*?-->/g, "").trim();
  const validPortions = (portions ?? []).filter((p) => p.name.trim().length > 0 && p.price > 0);

  if (validPortions.length === 0) {
    return cleanDesc;
  }

  const encodedTag = `<!--portions:${JSON.stringify(validPortions)}-->`;
  return cleanDesc.length > 0 ? `${cleanDesc}\n${encodedTag}` : encodedTag;
}

export function getItemDisplayPrice(price: number, offerPrice: number | null, portions: ItemPortion[]): string {
  if (portions && portions.length > 0) {
    const prices = portions.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice !== maxPrice) {
      return `₹${minPrice} - ₹${maxPrice}`;
    }
    return `₹${minPrice}`;
  }

  const effective = offerPrice ?? price;
  return `₹${effective}`;
}
