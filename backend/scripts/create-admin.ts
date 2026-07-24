import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/hash.util'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.argv[2] || 'admin@hosthaven.com'
  const adminPassword = process.argv[3] || 'Admin@123'
  const adminName = process.argv[4] || 'Admin'

  console.log(`Creating/updating admin user: ${adminEmail}`)

  const passwordHash = await hashPassword(adminPassword)

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isDeleted: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  })

  console.log(`Admin user ready: ${user.email}`)
  console.log(`Email: ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
  console.log('\nLogin at: https://admin.hosthaven.in/login')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
