const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.argv[2] || 'admin@hosthaven.com'
  const adminPassword = process.argv[3] || 'Admin@123'
  const adminName = process.argv[4] || 'Super Admin'

  console.log(`Creating/updating admin user: ${adminEmail}`)

  const passwordHash = await bcrypt.hash(adminPassword, 10)

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (existingUser) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'ADMIN',
        isActive: true,
        passwordHash,
      },
    })
    console.log(`Updated user ${adminEmail} to ADMIN role`)
  } else {
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

  console.log('\n✅ Admin user ready!')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
