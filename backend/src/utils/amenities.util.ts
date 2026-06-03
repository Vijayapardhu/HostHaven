import prisma from '../config/database';

export const normalizeAmenityName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export const getAmenityNamesFromJson = (items: unknown): string[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const syncAmenityCatalog = async (names: string[]) => {
  const uniqueNames = Array.from(new Set(names.map(normalizeAmenityName).filter(Boolean)));

  if (uniqueNames.length === 0) {
    return;
  }

  await Promise.all(
    uniqueNames.map(async (name) => {
      const existing = await prisma.platformAmenity.findFirst({
        where: {
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        if (!existing.isActive) {
          await prisma.platformAmenity.update({
            where: { id: existing.id },
            data: { name, isActive: true },
          });
        }
        return;
      }

      await prisma.platformAmenity.create({ data: { name } });
    }),
  );
};
