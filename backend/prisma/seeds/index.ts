import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hosthaven.com' },
    update: {},
    create: {
      email: 'admin@hosthaven.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test user
  const userPassword = await bcrypt.hash('User@123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@hosthaven.com' },
    update: {},
    create: {
      email: 'user@hosthaven.com',
      name: 'Test User',
      passwordHash: userPassword,
      role: 'USER',
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Test user created:', user.email);

  // Create vendor user
  const vendorPassword = await bcrypt.hash('Vendor@123', 10);
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@hosthaven.com' },
    update: {},
    create: {
      email: 'vendor@hosthaven.com',
      name: 'Test Vendor',
      passwordHash: vendorPassword,
      role: 'VENDOR',
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      businessName: 'Heritage Stays Pvt Ltd',
      businessAddress: 'MG Road, Vijayawada, Andhra Pradesh',
      gstNumber: '37AABCU9603R1ZM',
      panNumber: 'AABCU9603R',
      isApproved: true,
      approvedAt: new Date(),
    },
  });
  console.log('✅ Vendor created:', vendor.businessName);

  // Sample properties
  const properties = [
    {
      type: 'HOTEL' as const,
      name: 'Vijayawada Grand Hotel',
      slug: 'vijayawada-grand-hotel',
      description: 'A luxurious hotel in the heart of Vijayawada with modern amenities and excellent service. Perfect for business and leisure travelers.',
      shortDesc: 'Luxury hotel in Vijayawada',
      address: 'MG Road, Near Benz Circle',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      pincode: '520010',
      latitude: 16.5062,
      longitude: 80.6480,
      images: [
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', alt: 'Hotel Exterior', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', alt: 'Hotel Lobby', isPrimary: false },
        { url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800', alt: 'Hotel Room', isPrimary: false },
      ],
      amenities: ['wifi', 'parking', 'pool', 'gym', 'restaurant', 'room-service', 'ac', 'tv', 'laundry'],
      highlights: ['Central Location', 'Free WiFi', 'Swimming Pool', 'Multi-cuisine Restaurant'],
      basePrice: 3500,
      currency: 'INR',
      rating: 4.5,
      reviewCount: 128,
      status: 'ACTIVE' as const,
      isFeatured: true,
      vendorId: vendor.id,
    },
    {
      type: 'HOTEL' as const,
      name: 'Temple City Residency',
      slug: 'temple-city-residency',
      description: 'Comfortable stay near Tirumala Temple with easy access to spiritual destinations. Ideal for pilgrims visiting Tirumala.',
      shortDesc: 'Pilgrim-friendly hotel near Tirumala',
      address: 'Tirupati Bazar Road',
      city: 'Tirupati',
      state: 'Andhra Pradesh',
      pincode: '517501',
      latitude: 13.6288,
      longitude: 79.4192,
      images: [
        { url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', alt: 'Hotel Exterior', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800', alt: 'Hotel Room', isPrimary: false },
      ],
      amenities: ['wifi', 'parking', 'ac', 'restaurant', 'room-service'],
      highlights: ['Near Tirumala Temple', 'Pilgrim Packages', '24/7 Reception'],
      basePrice: 2500,
      currency: 'INR',
      rating: 4.2,
      reviewCount: 85,
      status: 'ACTIVE' as const,
      isFeatured: true,
      vendorId: vendor.id,
    },
    {
      type: 'HOME' as const,
      name: 'Krishna Riverside Cottage',
      slug: 'krishna-riverside-cottage',
      description: 'A serene homestay on the banks of Krishna River. Experience authentic Andhra hospitality with home-cooked meals.',
      shortDesc: 'Riverside homestay in Vijayawada',
      address: 'Kondaveedu Village',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      pincode: '521215',
      latitude: 16.3200,
      longitude: 80.5500,
      images: [
        { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', alt: 'Cottage Exterior', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800', alt: 'Living Room', isPrimary: false },
      ],
      amenities: ['wifi', 'parking', 'kitchen', 'ac', 'garden'],
      highlights: ['Riverside Location', 'Home-cooked Food', 'Farm Activities'],
      basePrice: 2800,
      currency: 'INR',
      rating: 4.8,
      reviewCount: 42,
      status: 'ACTIVE' as const,
      isFeatured: false,
      vendorId: vendor.id,
    },
    {
      type: 'TEMPLE' as const,
      name: 'Srikalahasti Temple Stay',
      slug: 'srikalahasti-temple-stay',
      description: 'Comfortable accommodation near the famous Srikalahasti Temple. Perfect for devotees seeking spiritual solace.',
      shortDesc: 'Temple stay near Srikalahasti',
      address: 'Srikalahasti Temple Road',
      city: 'Srikalahasti',
      state: 'Andhra Pradesh',
      pincode: '517644',
      latitude: 13.7518,
      longitude: 79.7029,
      images: [
        { url: 'https://images.unsplash.com/photo-1569429594044-bcc5ad652a65?w=800', alt: 'Temple View', isPrimary: true },
        { url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800', alt: 'Temple Interior', isPrimary: false },
      ],
      amenities: ['wifi', 'parking', 'ac', 'restaurant', 'prayer-room'],
      highlights: ['Near Temple', 'Spiritual Environment', 'Devotional Activities'],
      basePrice: 1800,
      currency: 'INR',
      rating: 4.6,
      reviewCount: 156,
      status: 'ACTIVE' as const,
      isFeatured: true,
      vendorId: vendor.id,
    },
    {
      type: 'TEMPLE' as const,
      name: 'Kanaka Durga Temple Complex',
      slug: 'kanaka-durga-temple-complex',
      description: 'Sacred accommodation on Indrakeeladri Hill, home to Kanaka Durga Temple. Experience divine bliss with panoramic views.',
      shortDesc: 'Hilltop temple accommodation',
      address: 'Indrakeeladri Hill',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      pincode: '520001',
      latitude: 16.5186,
      longitude: 80.6195,
      images: [
        { url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800', alt: 'Temple View', isPrimary: true },
      ],
      amenities: ['wifi', 'parking', 'ac', 'temple-tours'],
      highlights: ['Hilltop Location', 'Temple Views', 'Morning Pooja'],
      basePrice: 2200,
      currency: 'INR',
      rating: 4.9,
      reviewCount: 203,
      status: 'ACTIVE' as const,
      isFeatured: true,
      vendorId: vendor.id,
    },
  ];

  for (const propertyData of properties) {
    const property = await prisma.property.upsert({
      where: { slug: propertyData.slug },
      update: {},
      create: propertyData,
    });
    console.log('✅ Property created:', property.name);

    // Create rooms for each property
    const rooms = [
      {
        propertyId: property.id,
        name: 'Standard Room',
        description: 'Comfortable standard room with all basic amenities',
        type: 'standard',
        capacity: 2,
        extraBedCapacity: 1,
        pricePerNight: propertyData.basePrice,
        amenities: ['ac', 'tv', 'wifi'],
        totalRooms: 10,
        availableRooms: 8,
      },
      {
        propertyId: property.id,
        name: 'Deluxe Room',
        description: 'Spacious deluxe room with premium amenities',
        type: 'deluxe',
        capacity: 3,
        extraBedCapacity: 1,
        pricePerNight: Math.round(propertyData.basePrice * 1.5),
        amenities: ['ac', 'tv', 'wifi', 'mini-bar', 'balcony'],
        totalRooms: 5,
        availableRooms: 4,
      },
      {
        propertyId: property.id,
        name: 'Suite',
        description: 'Luxurious suite with separate living area',
        type: 'suite',
        capacity: 4,
        extraBedCapacity: 2,
        pricePerNight: propertyData.basePrice * 2.5,
        amenities: ['ac', 'tv', 'wifi', 'mini-bar', 'balcony', 'living-room'],
        totalRooms: 2,
        availableRooms: 2,
      },
    ];

    for (const room of rooms) {
      const createdRoom = await prisma.room.upsert({
        where: { id: `${property.id}-${room.type}` },
        update: {},
        create: room,
      });
      console.log('  ✅ Room created:', createdRoom.name);
    }

    // Create temple details for temple properties
    if (propertyData.type === 'TEMPLE') {
      const templeDetails = await prisma.templeDetails.upsert({
        where: { propertyId: property.id },
        update: {},
        create: {
          propertyId: property.id,
          deity: propertyData.name.includes('Kanaka Durga') ? 'Kanaka Durga' : 'Lord Shiva',
          templeType: propertyData.name.includes('Kanaka Durga') ? 'Durga' : 'Shiva',
          builtYear: '16th Century',
          architecture: 'Dravidian Architecture',
          darshanTimings: [
            { day: 'Monday', openTime: '05:00', closeTime: '12:00' },
            { day: 'Monday', openTime: '14:00', closeTime: '21:00' },
            { day: 'Tuesday', openTime: '05:00', closeTime: '12:00' },
            { day: 'Tuesday', openTime: '14:00', closeTime: '21:00' },
            { day: 'Wednesday', openTime: '05:00', closeTime: '12:00' },
            { day: 'Wednesday', openTime: '14:00', closeTime: '21:00' },
            { day: 'Thursday', openTime: '05:00', closeTime: '12:00' },
            { day: 'Thursday', openTime: '14:00', closeTime: '21:00' },
            { day: 'Friday', openTime: '05:00', closeTime: '12:00' },
            { day: 'Friday', openTime: '14:00', closeTime: '21:00' },
            { day: 'Saturday', openTime: '05:00', closeTime: '12:00' },
            { day: 'Saturday', openTime: '14:00', closeTime: '21:00' },
            { day: 'Sunday', openTime: '05:00', closeTime: '12:00' },
            { day: 'Sunday', openTime: '14:00', closeTime: '21:00' },
          ],
          aartiTimings: [
            { name: 'Morning Aarti', time: '06:00', day: 'all' },
            { name: 'Evening Aarti', time: '18:00', day: 'all' },
          ],
          dressCode: 'Traditional Indian attire, no leather items',
          entryFee: [
            { type: 'General', amount: 0, description: 'Free entry' },
            { type: 'Special Darshan', amount: 500, description: 'Special darshan with puja' },
          ],
          photography: true,
          bestTimeToVisit: 'October to March for pleasant weather',
          festivals: [
            { name: 'Diwali', date: '2024-11-01', description: 'Festival of lights' },
            { name: 'Navratri', date: '2024-10-03', description: 'Nine nights of goddess worship' },
          ],
        },
      });
      console.log('  ✅ Temple details created');
    }
  }

  // Create sample reviews
  const allProperties = await prisma.property.findMany();
  const sampleReviews = [
    {
      rating: 5,
      title: 'Amazing stay!',
      comment: 'The hotel was excellent. Staff was very helpful and the location was perfect for our pilgrimage.',
      cleanliness: 5,
      service: 5,
      location: 5,
      value: 4,
    },
    {
      rating: 4,
      title: 'Great experience',
      comment: 'Very clean rooms and good amenities. Would definitely recommend to others.',
      cleanliness: 4,
      service: 4,
      location: 5,
      value: 4,
    },
    {
      rating: 5,
      title: 'Perfect for families',
      comment: 'We stayed with our family and had a wonderful time. The homestay experience was authentic.',
      cleanliness: 5,
      service: 5,
      location: 5,
      value: 5,
    },
  ];

  for (const property of allProperties.slice(0, 3)) {
    await prisma.review.upsert({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId: property.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        propertyId: property.id,
        ...sampleReviews[allProperties.indexOf(property) % sampleReviews.length],
        isVerified: true,
      },
    });
    console.log('✅ Review created for:', property.name);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Admin: admin@hosthaven.com / Admin@123');
  console.log('   User:  user@hosthaven.com / User@123');
  console.log('   Vendor: vendor@hosthaven.com / Vendor@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
