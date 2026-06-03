import prisma from '../../config/database'
import { logger } from '../../utils/logger.util'
import { ERROR_CODES } from '../../constants/error-codes'
import { cacheService } from '../../services/cache.service'
import { generateSlug } from '../../utils/crypto.util'
import type { CreateServiceInput, UpdateServiceInput, ServiceFilterInput } from './services.schema'

class ServicesService {
  async create(data: CreateServiceInput) {
    const slug = generateSlug(data.name)
    const service = await prisma.service.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        category: data.category,
        city: data.city,
        location: data.location,
        locations: data.locations,
        price: data.basePrice,
        priceUnit: data.priceUnit || 'per_person',
        advanceType: data.advanceType || 'percentage',
        advanceValue: data.advanceValue || 30,
        duration: data.duration,
        images: data.images || [],
        isActive: data.active !== false,
      },
    })
    logger.info({ serviceId: service.id }, 'Service created')
    // Invalidate list cache on creation
    await cacheService.invalidate(`hosthaven:services:list:*`)
    return service
  }

  async update(id: string, data: UpdateServiceInput) {
    const existing = await prisma.service.findUnique({ where: { id } })
    if (!existing) {
      const error = new Error('Service not found')
        ; (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND
      throw error
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.locations !== undefined && { locations: data.locations }),
        ...(data.basePrice !== undefined && { price: data.basePrice }),
        ...(data.priceUnit !== undefined && { priceUnit: data.priceUnit }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.advanceType && { advanceType: data.advanceType }),
        ...(data.advanceValue !== undefined && { advanceValue: data.advanceValue }),
        ...(data.images && { images: data.images }),
        ...(data.active !== undefined && { isActive: data.active }),
      },
    })
    logger.info({ serviceId: service.id }, 'Service updated')
    await cacheService.del(cacheService.keys.serviceDetail(id))
    await cacheService.invalidate(`hosthaven:services:list:*`)
    return service
  }

  async delete(id: string) {
    const existing = await prisma.service.findUnique({ where: { id } })
    if (!existing) {
      const error = new Error('Service not found')
        ; (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND
      throw error
    }

    await prisma.service.update({
      where: { id },
      data: { isDeleted: true },
    })
    logger.info({ serviceId: id }, 'Service deleted')
    await cacheService.del(cacheService.keys.serviceDetail(id))
    await cacheService.invalidate(`hosthaven:services:list:*`)
    return { message: 'Service deleted successfully' }
  }

  async getById(idOrSlug: string) {
    const cacheKey = cacheService.keys.serviceDetail(idOrSlug)
    const cached = await cacheService.get<any>(cacheKey)
    if (cached) return cached

    // Try by ID first, then by slug
    let service = await prisma.service.findFirst({
      where: { id: idOrSlug, isDeleted: false },
    })
    
    if (!service) {
      service = await prisma.service.findFirst({
        where: { slug: idOrSlug, isDeleted: false },
      })
    }
    
    if (!service) {
      const error = new Error('Service not found')
        ; (error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND
      throw error
    }
    const result = {
      ...service,
      basePrice: service.price?.toNumber?.() || 0,
      price: undefined,
    }
    await cacheService.set(cacheKey, result, cacheService.getTTL().PROPERTY_DETAIL)
    return result
  }

  async getAll(filters: ServiceFilterInput) {
    const { page, limit, search, category, active } = filters
    const skip = (page - 1) * limit

    const where: any = {
      isDeleted: false,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (active !== undefined) {
      where.isActive = active
    }

    const cacheKey = cacheService.keys.serviceList(JSON.stringify(filters))
    const cached = await cacheService.get<any>(cacheKey)
    if (cached) return cached

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.service.count({ where }),
    ])

    const result = {
      services: services.map((s: any) => ({
        ...s,
        basePrice: s.price?.toNumber?.() || 0,
        price: undefined,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
    await cacheService.set(cacheKey, result, cacheService.getTTL().PROPERTY_LIST)
    return result
  }

  async activate(id: string) {
    const existing = await prisma.service.findUnique({ where: { id } })
    if (!existing) {
      const error = new Error('Service not found')
      ;(error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND
      throw error
    }
    const service = await prisma.service.update({
      where: { id },
      data: { isActive: true },
    })
    logger.info({ serviceId: id }, 'Service activated')
    await cacheService.del(cacheService.keys.serviceDetail(id))
    await cacheService.invalidate(`hosthaven:services:list:*`)
    return service
  }

  async deactivate(id: string) {
    const existing = await prisma.service.findUnique({ where: { id } })
    if (!existing) {
      const error = new Error('Service not found')
      ;(error as any).code = ERROR_CODES.RESOURCE_NOT_FOUND
      throw error
    }
    const service = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    })
    logger.info({ serviceId: id }, 'Service deactivated')
    await cacheService.del(cacheService.keys.serviceDetail(id))
    await cacheService.invalidate(`hosthaven:services:list:*`)
    return service
  }

  async getCities() {
    const cacheKey = 'hosthaven:services:cities'
    const cached = await cacheService.get<string[]>(cacheKey)
    if (cached) return cached

    const services = await prisma.service.findMany({
      where: { isDeleted: false, isActive: true },
      select: { city: true, location: true, locations: true },
    })

    const citySet = new Set<string>()
    services.forEach(s => {
      if (s.city) citySet.add(s.city)
      if (s.location) citySet.add(s.location)
      if (s.locations) s.locations.forEach(l => citySet.add(l))
    })

    const cities = Array.from(citySet).sort()
    await cacheService.set(cacheKey, cities, 3600)
    return cities
  }
}

export const servicesService = new ServicesService()
export default servicesService
