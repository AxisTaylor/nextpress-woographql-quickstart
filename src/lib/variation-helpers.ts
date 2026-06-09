import type { ProductAttribute, ProductAttributeValue, ProductVariation } from "@/lib/wp";

export type SelectedAttributes = Record<string, string>;

export function getDefaultAttributes(
  attributes: ProductAttribute[],
  defaults: ProductAttributeValue[],
): SelectedAttributes {
  const labelToName: Record<string, string> = attributes.reduce<Record<string, string>>(
    (acc, { name, label }) => {
      if (name) acc[label] = name;
      return acc;
    },
    {},
  );

  if (defaults.length) {
    return defaults.reduce<SelectedAttributes>((acc, { label, value }) => {
      const name = labelToName[label] ?? label;
      if (name && value) acc[name] = value;
      return acc;
    }, {});
  }

  return attributes.reduce<SelectedAttributes>((acc, { name, options, variation }) => {
    if (variation && options?.length) acc[name] = options[0];
    return acc;
  }, {});
}

export function findMatchingVariation(
  selected: SelectedAttributes,
  variations: ProductVariation[],
): ProductVariation | null {
  return (
    variations.find((variation) =>
      variation.attributes.every(({ value, name }) => !value || selected[name] === value),
    ) ?? null
  );
}

export function getRequiredAttributes(
  selected: SelectedAttributes,
  variation: ProductVariation | null,
): Array<{ attributeName: string; attributeValue: string }> {
  if (!variation) return [];
  return Object.entries(selected)
    .filter(([name]) =>
      variation.attributes.some(({ value, name: vName }) => !value && vName === name),
    )
    .map(([name, value]) => ({ attributeName: name, attributeValue: value }));
}
