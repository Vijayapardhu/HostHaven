import prisma from '../config/database';

let cachedCities: string[] | null = null;

export async function getActiveCities(): Promise<string[]> {
  if (cachedCities) {
    return cachedCities;
  }
  
  try {
    const cities = await prisma.platformCity.findMany({
      where: { isActive: true },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    const cityNames = cities.map((c) => c.name);
    cachedCities = cityNames;
    return cityNames;
  } catch {
    return [];
  }
}

export function clearCachedCities(): void {
  cachedCities = null;
}
