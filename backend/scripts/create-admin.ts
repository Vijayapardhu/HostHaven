import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/password.util'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.argv[2] || 'admin@hosthaven.com'
  const adminPassword = process.argv[3] || 'Admin@123'
  const adminName = process.argv[4] || 'Admin'

  console.log(`Creating/updating admin user: ${adminEmail}`)

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingUser) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'ADMIN',
        isActive: true,
      },
    })
    console.log(`Updated user ${adminEmail} to ADMIN role`)
  } else {
    const passwordHash = await hashPassword(adminPassword)
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        isVerified: true,
      },
    })
    console.log(`Created new admin user: ${adminEmail}`)
  }

  console.log('\nAdmin user ready!')
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
