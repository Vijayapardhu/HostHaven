import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/utils/hash.util";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create admin user
  const adminPassword = await hashPassword("Admin@123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@hosthaven.com" },
    update: {
      passwordHash: adminPassword,
      role: "ADMIN",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "admin@hosthaven.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create real admin user
  const realAdminPassword = await hashPassword("HostHaven@Admin");
  const realAdmin = await prisma.user.upsert({
    where: { email: "clpprincess29@gmail.com" },
    update: {
      passwordHash: realAdminPassword,
      role: "ADMIN",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "clpprincess29@gmail.com",
      name: "Super Admin",
      passwordHash: realAdminPassword,
      role: "ADMIN",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log("✅ Real Admin user created:", realAdmin.email);

  // Create test user
  const userPassword = await hashPassword("User@123");
  const user = await prisma.user.upsert({
    where: { email: "user@hosthaven.com" },
    update: {
      passwordHash: userPassword,
      role: "USER",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "user@hosthaven.com",
      name: "Test User",
      passwordHash: userPassword,
      role: "USER",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log("✅ Test user created:", user.email);

  // Create vendor user
  const vendorPassword = await hashPassword("Vendor@123");
  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor@hosthaven.com" },
    update: {
      passwordHash: vendorPassword,
      role: "VENDOR",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "vendor@hosthaven.com",
      name: "Test Vendor",
      passwordHash: vendorPassword,
      role: "VENDOR",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      businessName: "Heritage Stays Pvt Ltd",
      businessAddress: "MG Road, Vijayawada, Andhra Pradesh",
      gstNumber: "37AABCU9603R1ZM",
      panNumber: "AABCU9603R",
      isApproved: true,
      approvedAt: new Date(),
    },
  });
  console.log("✅ Vendor created:", vendor.businessName);

  // Create more vendors
  const vendor2Password = await hashPassword("Vendor@123");
  const vendor2User = await prisma.user.upsert({
    where: { email: "temple_stays@example.com" },
    update: { passwordHash: vendor2Password, role: "VENDOR", isVerified: true },
    create: {
      email: "temple_stays@example.com",
      name: "Temple Stays Management",
      passwordHash: vendor2Password,
      role: "VENDOR",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { userId: vendor2User.id },
    update: {},
    create: {
      userId: vendor2User.id,
      businessName: "Temple Stays Management",
      businessAddress: "Tirupati, Chittoor District, Andhra Pradesh - 517501",
      gstNumber: "37AABCU9603R2ZN",
      panNumber: "AABCU9603S",
      isApproved: true,
      approvedAt: new Date(),
    },
  });
  console.log("✅ Vendor created:", vendor2.businessName);

  const vendor3Password = await hashPassword("Vendor@123");
  const vendor3User = await prisma.user.upsert({
    where: { email: "coastal_retreats@example.com" },
    update: { passwordHash: vendor3Password, role: "VENDOR", isVerified: true },
    create: {
      email: "coastal_retreats@example.com",
      name: "Coastal Retreats Pvt Ltd",
      passwordHash: vendor3Password,
      role: "VENDOR",
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const vendor3 = await prisma.vendor.upsert({
    where: { userId: vendor3User.id },
    update: {},
    create: {
      userId: vendor3User.id,
      businessName: "Coastal Retreats Pvt Ltd",
      businessAddress: "Visakhapatnam, Andhra Pradesh - 530001",
      gstNumber: "37AABCU9603R3ZM",
      panNumber: "AABCU9603T",
      isApproved: true,
      approvedAt: new Date(),
    },
  });
  console.log("✅ Vendor created:", vendor3.businessName);

  // Sample properties
  const properties = [
    {
      type: "HOTEL" as const,
      name: "Gateway Hotel MG Road",
      slug: "gateway-hotel-mg-road-vijayawada",
      description:
        "A premium luxury hotel located in the bustling center of Vijayawada. Perfect for business travelers and families seeking world-class hospitality, gourmet dining, and spectacular views of the Krishna River and Indrakeeladri hills. The hotel features an expansive outdoor pool, a state-of-the-art fitness center, and multi-cuisine ambient restaurants.",
      shortDesc: "Premium luxury hotel overlooking Krishna River",
      address: "39-1-63 MG Road",
      city: "VIJAYAWADA",
      state: "Andhra Pradesh",
      pincode: "520010",
      latitude: 16.5055,
      longitude: 80.6480,
      images: [
        {
          url: "https://images.unsplash.com/photo-1542314831-c6a4d27ce66b?q=80&w=2070",
          alt: "Hotel Exterior",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1551882547-ff40c0d1398c?q=80&w=2070",
          alt: "Luxury Lobby",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?q=80&w=1974",
          alt: "Deluxe Bedroom",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1621293954908-907159247fc8?q=80&w=2070",
          alt: "Rooftop Pool",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=2070",
          alt: "Gourmet Restaurant",
          isPrimary: false,
        }
      ],
      amenities: [
        "Free WiFi",
        "AC",
        "Parking",
        "Lift",
        "Restaurant",
        "Room Service",
        "TV",
        "Gym",
        "Pool",
        "Business Center"
      ],
      highlights: [
        "River View",
        "Luxury Stay",
        "Temple Nearby",
        "Family Friendly"
      ],
      basePrice: 5500,
      currency: "INR",
      rating: 4.8,
      reviewCount: 342,
      status: "ACTIVE" as const,
      isFeatured: true,
      vendorId: vendor.id,
    },
    {
      type: "HOTEL" as const,
      name: "Suryadham Pilgrims Retreat",
      slug: "suryadham-pilgrims-retreat",
      description:
        "Comfortable and serene stay designed specifically for pilgrims visiting the holy temples of Nandiyala. Experience pure vegetarian cuisine, morning satsangs, and easy access to Mahanandi and Yaganti. The retreat offers clean, air-conditioned rooms and spacious family suites.",
      shortDesc: "Peaceful pilgrim retreat near ancient temples",
      address: "Mahanandi Road, Outer Ring",
      city: "NANDIYALA",
      state: "Andhra Pradesh",
      pincode: "518501",
      latitude: 15.4851,
      longitude: 78.4842,
      images: [
        {
          url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070",
          alt: "Retreat Entrance",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=2070",
          alt: "Family Room",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1968",
          alt: "Vegetarian Dining",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=2057",
          alt: "Meditation Hall",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070",
          alt: "Standard Room",
          isPrimary: false,
        }
      ],
      amenities: ["Free WiFi", "AC", "Parking", "Restaurant", "Room Service", "24/7 Reception", "Hot Water", "CCTV"],
      highlights: [
        "Temple Nearby",
        "Budget Friendly",
        "Family Friendly"
      ],
      basePrice: 2200,
      currency: "INR",
      rating: 4.3,
      reviewCount: 156,
      status: "ACTIVE" as const,
      isFeatured: false,
      vendorId: vendor.id,
    },
    {
      type: "HOME" as const,
      name: "Bhavani Riverfront Villa",
      slug: "bhavani-riverfront-villa-vijayawada",
      description:
        "An exclusive private 3-bedroom homestay located on the serene banks of the Krishna River. Perfect for weekend getaways, family reunions, and peaceful retreats. Features a private garden, a fully-equipped modern kitchen, and a beautiful terrace offering stunning sunset views.",
      shortDesc: "Private 3BHK riverfront villa with garden",
      address: "Bhavani Island View Road",
      city: "VIJAYAWADA",
      state: "Andhra Pradesh",
      pincode: "520012",
      latitude: 16.5135,
      longitude: 80.6015,
      images: [
        {
          url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070",
          alt: "Villa Exterior",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070",
          alt: "Living Room",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070",
          alt: "Modern Kitchen",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=2070",
          alt: "Master Bedroom",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1585128719715-4677684112e5?q=80&w=1932",
          alt: "Garden View",
          isPrimary: false,
        }
      ],
      amenities: ["Free WiFi", "AC", "Kitchen", "Parking", "Hot Water", "TV", "Pet Friendly", "Garden", "Power Backup"],
      highlights: ["River View", "Family Friendly", "Eco Friendly"],
      basePrice: 6500,
      currency: "INR",
      rating: 4.9,
      reviewCount: 64,
      status: "ACTIVE" as const,
      isFeatured: true,
      vendorId: vendor.id,
    },
    {
      type: "TEMPLE" as const,
      name: "Sri Veda Vyasa Ashram Stay",
      slug: "sri-veda-vyasa-ashram-stay-vetlapalem",
      description:
        "Immerse yourself in authentic spiritual living at this tranquil ashram stay located near the ancient temples of Vetlapalem. Accommodation includes simple, clean rooms with sattvic meals provided. Guests can participate in morning yoga, evening aartis, and guided temple tours.",
      shortDesc: "Spiritual ashram living with guided tours",
      address: "Main Temple Street",
      city: "VETLAPALEM",
      state: "Andhra Pradesh",
      pincode: "533433",
      latitude: 16.9416,
      longitude: 82.0234,
      images: [
        {
          url: "https://images.unsplash.com/photo-1574744577846-9b6d80d2ad90?q=80&w=2070",
          alt: "Ashram Courtyard",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1627885078712-16a7f4ea6c94?q=80&w=2070",
          alt: "Simple Room",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069",
          alt: "Temple Shrine",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1512413914619-74d32a931bb4?q=80&w=2070",
          alt: "Dining Area",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=1964",
          alt: "Yoga Hall",
          isPrimary: false,
        }
      ],
      amenities: ["Parking", "Restaurant", "Hot Water", "24/7 Reception", "CCTV", "Wheelchair Access"],
      highlights: [
        "Temple Nearby",
        "Heritage Property",
        "Budget Friendly",
        "Eco Friendly"
      ],
      basePrice: 1200,
      currency: "INR",
      rating: 4.6,
      reviewCount: 205,
      status: "ACTIVE" as const,
      isFeatured: true,
      vendorId: vendor.id,
    },
    {
      type: "HOTEL" as const,
      name: "Tirupati Grand Residency",
      slug: "tirupati-grand-residency",
      description:
        "Elegantly designed hotel aimed at providing maximum comfort for tourists and devotees visiting Tirumala. It features a grand vegetarian restaurant, in-house travel desk for darshan bookings, and spacious accommodations with 24/7 hot water supply.",
      shortDesc: "Comfortable stay for Tirumala devotees",
      address: "Renigunta Road",
      city: "TIRUPATI",
      state: "Andhra Pradesh",
      pincode: "517501",
      latitude: 13.6288,
      longitude: 79.4192,
      images: [
        {
          url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070",
          alt: "Hotel Exterior",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=2070",
          alt: "Standard Bedroom",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2070",
          alt: "Reception Desk",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070",
          alt: "Dining Hall",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1528699633788-424224dc89b5?q=80&w=2053",
          alt: "Travel Desk",
          isPrimary: false,
        }
      ],
      amenities: ["Free WiFi", "AC", "Parking", "Lift", "Room Service", "TV", "Hot Water", "CCTV", "Wheelchair Access"],
      highlights: ["Near Railway Station", "Temple Nearby", "Family Friendly"],
      basePrice: 2800,
      currency: "INR",
      rating: 4.4,
      reviewCount: 420,
      status: "ACTIVE" as const,
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
    console.log("✅ Property created:", property.name);

    // Create rooms for each property
    const rooms = [
      {
        propertyId: property.id,
        name: "Standard Room",
        description: "Comfortable standard room with all basic amenities",
        type: "standard",
        capacity: 2,
        extraBedCapacity: 1,
        pricePerNight: propertyData.basePrice,
        amenities: ["ac", "tv", "wifi"],
        totalRooms: 10,
        availableRooms: 8,
      },
      {
        propertyId: property.id,
        name: "Deluxe Room",
        description: "Spacious deluxe room with premium amenities",
        type: "deluxe",
        capacity: 3,
        extraBedCapacity: 1,
        pricePerNight: Math.round(propertyData.basePrice * 1.5),
        amenities: ["ac", "tv", "wifi", "mini-bar", "balcony"],
        totalRooms: 5,
        availableRooms: 4,
      },
      {
        propertyId: property.id,
        name: "Suite",
        description: "Luxurious suite with separate living area",
        type: "suite",
        capacity: 4,
        extraBedCapacity: 2,
        pricePerNight: propertyData.basePrice * 2.5,
        amenities: ["ac", "tv", "wifi", "mini-bar", "balcony", "living-room"],
        totalRooms: 2,
        availableRooms: 2,
      },
    ];

    await prisma.room.deleteMany({ where: { propertyId: property.id } });
    await prisma.room.createMany({ data: rooms });
    console.log("  ✅ Rooms created:", rooms.length);

    // Create temple details for temple properties
    if (propertyData.type === "TEMPLE") {
      const templeDetails = await prisma.templeDetails.upsert({
        where: { propertyId: property.id },
        update: {},
        create: {
          propertyId: property.id,
          deity: propertyData.name.includes("Kanaka Durga")
            ? "Kanaka Durga"
            : "Lord Shiva",
          templeType: propertyData.name.includes("Kanaka Durga")
            ? "Durga"
            : "Shiva",
          builtYear: "16th Century",
          architecture: "Dravidian Architecture",
          darshanTimings: [
            { day: "Monday", openTime: "05:00", closeTime: "12:00" },
            { day: "Monday", openTime: "14:00", closeTime: "21:00" },
            { day: "Tuesday", openTime: "05:00", closeTime: "12:00" },
            { day: "Tuesday", openTime: "14:00", closeTime: "21:00" },
            { day: "Wednesday", openTime: "05:00", closeTime: "12:00" },
            { day: "Wednesday", openTime: "14:00", closeTime: "21:00" },
            { day: "Thursday", openTime: "05:00", closeTime: "12:00" },
            { day: "Thursday", openTime: "14:00", closeTime: "21:00" },
            { day: "Friday", openTime: "05:00", closeTime: "12:00" },
            { day: "Friday", openTime: "14:00", closeTime: "21:00" },
            { day: "Saturday", openTime: "05:00", closeTime: "12:00" },
            { day: "Saturday", openTime: "14:00", closeTime: "21:00" },
            { day: "Sunday", openTime: "05:00", closeTime: "12:00" },
            { day: "Sunday", openTime: "14:00", closeTime: "21:00" },
          ],
          aartiTimings: [
            { name: "Morning Aarti", time: "06:00", day: "all" },
            { name: "Evening Aarti", time: "18:00", day: "all" },
          ],
          dressCode: "Traditional Indian attire, no leather items",
          entryFee: [
            { type: "General", amount: 0, description: "Free entry" },
            {
              type: "Special Darshan",
              amount: 500,
              description: "Special darshan with puja",
            },
          ],
          photography: true,
          bestTimeToVisit: "October to March for pleasant weather",
          festivals: [
            {
              name: "Diwali",
              date: "2024-11-01",
              description: "Festival of lights",
            },
            {
              name: "Navratri",
              date: "2024-10-03",
              description: "Nine nights of goddess worship",
            },
          ],
        },
      });
      console.log("  ✅ Temple details created");
    }
  }

  // Create sample reviews
  const allProperties = await prisma.property.findMany();
  const sampleReviews = [
    {
      rating: 5,
      title: "Amazing stay!",
      comment:
        "The hotel was excellent. Staff was very helpful and the location was perfect for our pilgrimage.",
      cleanliness: 5,
      service: 5,
      location: 5,
      value: 4,
    },
    {
      rating: 4,
      title: "Great experience",
      comment:
        "Very clean rooms and good amenities. Would definitely recommend to others.",
      cleanliness: 4,
      service: 4,
      location: 5,
      value: 4,
    },
    {
      rating: 5,
      title: "Perfect for families",
      comment:
        "We stayed with our family and had a wonderful time. The homestay experience was authentic.",
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
        ...sampleReviews[
        allProperties.indexOf(property) % sampleReviews.length
        ],
        isVerified: true,
      },
    });
    console.log("✅ Review created for:", property.name);
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📝 Login credentials:");
  console.log("   Admin: admin@hosthaven.com / Admin@123");
  console.log("   User:  user@hosthaven.com / User@123");
  console.log("   Vendor: vendor@hosthaven.com / Vendor@123");

  // Create sample temples
  const temples = [
    {
      name: "Tirumala Tirupati Temple",
      slug: "tirumala-tirupati-temple",
      city: "TIRUPATI" as const,
      fullAddress:
        "Tirumala, Tirupati, Chittoor District, Andhra Pradesh - 517501",
      landmark: "Tirumala Hills",
      description:
        "Tirumala Tirupati Temple is one of the most visited religious places in the world. Dedicated to Lord Venkateswara (an incarnation of Vishnu), this ancient temple attracts millions of devotees annually. The temple complex sits atop the Tirumala hills and is known for its rich traditions, magnificent architecture, and the famous Srivari Prasadam (laddu).",
      shortDesc: "World's most visited pilgrimage center",
      latitude: 13.6828,
      longitude: 79.4192,
      deityName: "Lord Venkateswara",
      templeType: "Vaishnavite",
      builtYear: "300 AD",
      founder: "Unknown (Ancient)",
      mythologicalSignificance:
        "According to legends, Lord Vishnu descended to Earth as Venkateswara to save humanity from Kali Yuga troubles and to grant moksha to his devotees.",
      historicalSignificance:
        "The temple has been patronized by various dynasties including the Cholas, Pandyas, and Vijayanagara rulers. It is one of the wealthiest temples in the world.",
      architectureStyle: "Dravidian Architecture",
      uniqueFeatures:
        "Ananda Nilayam (Golden Sanctum), Srivari Mettu (Seven Hills), Chakra Teertham",
      sacredNearby:
        "Sri Kapileswaraswami Temple, Sri Padmavathi Ammavaru Temple, Silathoranam",
      associatedLegends:
        "The legend of Lord Venkateswara taking loan from Kubera for his marriage and the story of Bhakta Prahlada",
      darshanTimings: [
        {
          day: "Monday",
          morningOpen: "03:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Tuesday",
          morningOpen: "03:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Wednesday",
          morningOpen: "03:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Thursday",
          morningOpen: "03:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Friday",
          morningOpen: "03:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Saturday",
          morningOpen: "03:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Sunday",
          morningOpen: "03:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
      ],
      morningAarti: "05:00 AM",
      afternoonAarti: "12:00 PM",
      eveningAarti: "07:00 PM",
      specialSevas:
        "Archana, Sahasra Namarchana, Kalyanotsavam, Swarna Pushpanjali",
      festivalSpecificTimings:
        "Brahmotsavam (September-October), Vaikunta Ekadasi, Rathasapthami",
      generalEntryFee: "Free",
      specialDarshanFee: "₹300 - ₹500",
      vipDarshanFee: "₹1000 - ₹5000",
      parkingAvailable: true,
      wheelchairAccessible: true,
      cloakroomAvailable: true,
      restroomsAvailable: true,
      drinkingWaterAvailable: true,
      prasadamCounterAvailable: true,
      photographyAllowed: false,
      mobileRestrictions: "Mobile phones not allowed inside temple premises",
      dressCodeMen: "Dhoti and shirt or formal wear, no leather items",
      dressCodeWomen: "Saree or churidar, no leather items",
      securityNotes: "Security check at entry points, belongings scanned",
      majorFestivals:
        "Brahmotsavam, Vaikunta Ekadasi, Rathasapthami, Sri Ramanavami",
      festivalDates:
        "Brahmotsavam: September-October, Vaikunta Ekadasi: December-January",
      annualBrahmotsavam: "9 days festival with processions",
      rathotsavamDetails: "Annual chariot festival during Brahmotsavam",
      crowdExpectationLevel: "Very High",
      specialPoojas: "Suprabhata, Thomala Seva, Archana, Sahasra Namarchana",
      specialDecorationDays: "Fridays, Sundays, and festival days",
      bestMonths: "October to March",
      bestTimeOfDay: "Early morning (3-6 AM) for minimal crowd",
      peakCrowdDays: "Weekends, festival days, Saturdays",
      avoidDays: "Weekdays (except Friday)",
      weatherConditions:
        "Pleasant in winter (15-25°C), hot in summer (35-45°C)",
      nearbyTemples:
        "Sri Kapileswaraswami Temple (1km), Sri Padmavathi Temple (15km)",
      nearbyBeachesOrHills: "Tirumala Hills, Kapila Theertham (15km)",
      nearbyRestaurants: "TIRUPATI",
      nearbyHotels: "TIRUPATI",
      distanceRailwayStation: "Tirupati Main Station - 26km",
      distanceBusStand: "Tirupati Bus Station - 28km",
      distanceAirport: "Tirupati Airport - 40km",
      images: [
        {
          url: "https://images.unsplash.com/photo-1596791220463-54cd8c21da8a?q=80&w=1924",
          alt: "Tirumala Temple Gopuram",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1589308103328-97103a88fb03?q=80&w=1964",
          alt: "Golden Vimanam",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1597811776887-142bf6ff0cf9?q=80&w=1974",
          alt: "Sacred Pushkarini",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1582298538104-efa9cb10ec87?q=80&w=2070",
          alt: "Outer Courtyard",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1579222622722-1d529eb4bf8a?q=80&w=2074",
          alt: "Temple Elephant",
          isPrimary: false,
        }
      ],
      videos: [],
      virtualTourUrl: "https://tirumala.org/virtual-tour",
      metaTitle:
        "Tirumala Tirupati Temple | Book Darshan, Pooja & Accommodation",
      metaDescription:
        "Visit Tirumala Tirupati Temple - one of the world's most visited pilgrimage centers. Book darshan, special sevas, and accommodation online.",
      searchKeywords:
        "Tirupati temple, Tirumala darshan, Venkateswara temple, booking",
      thingsToCarry:
        "ID proof, water bottle, comfortable footwear, traditional dress",
      thingsNotAllowed: "Mobile phones, leather items, cameras, weapons",
      idealVisitDuration: "1-2 days",
      suggestedItinerary:
        "Day 1: Arrival, TTD counter registration, darshan. Day 2: Early morning darshan, temple visit, departure.",
      localFoodRecommendations:
        "Srivari Laddu (must try), South Indian thali, Pongal",
      faqs: [
        {
          question: "How to book darshan online?",
          answer: "Visit ttdonline.com or use TTD mobile app",
        },
        {
          question: "What is the best time to visit?",
          answer:
            "October to March for pleasant weather, early morning for less crowd",
        },
        {
          question: "Is accommodation available?",
          answer: "Yes, TTD provides free and paid accommodation complexes",
        },
      ],
      emergencyContact: "Toll Free: 1800 222 323",
      templeOfficePhone: "0877-2277777",
      active: true,
    },
    {
      name: "Srikalahasti Temple",
      slug: "srikalahasti-temple",
      city: "TIRUPATI" as const,
      fullAddress: "Srikalahasti, Chittoor District, Andhra Pradesh - 517644",
      landmark: "Near Srikalahasti Railway Station",
      description:
        "Srikalahasti Temple is one of the most famous Shiva temples in South India, known for its unique architecture and the rare Vayu Lingam (wind lingam). The temple is one of the Pancha Bhoota Stalas, representing the element of Wind (Vayu).",
      shortDesc: "Famous Shiva temple with Vayu Lingam",
      latitude: 13.7518,
      longitude: 79.7029,
      deityName: "Lord Shiva (Sri Kalahasteeswara)",
      templeType: "Shaivite",
      builtYear: "5th Century AD",
      founder: "Nandivarman (Ancient Chola King)",
      mythologicalSignificance:
        "According to legend, Shiva granted moksha to three devotees - spider (Sri), snake (Kali), and elephant (Hasthi) who prayed here. The temple name combines their names.",
      historicalSignificance:
        "Built by the Cholas and later expanded by Vijayanagara rulers. One of the most prominent Shiva temples in South India.",
      architectureStyle: "Dravidian Architecture with Vijayanagara influence",
      uniqueFeatures:
        "Vayu Lingam (one of the Pancha Bhoota Stalas), 1200 years old, largest Nandi idol",
      sacredNearby:
        "Srikalahasti Railway Station, Veyilingala Kona (holy hills)",
      associatedLegends:
        "Story of spider, snake, and elephant attaining moksha",
      darshanTimings: [
        {
          day: "Monday",
          morningOpen: "06:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "20:00",
        },
        {
          day: "Tuesday",
          morningOpen: "06:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "20:00",
        },
        {
          day: "Wednesday",
          morningOpen: "06:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "20:00",
        },
        {
          day: "Thursday",
          morningOpen: "06:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "20:00",
        },
        {
          day: "Friday",
          morningOpen: "06:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "20:00",
        },
        {
          day: "Saturday",
          morningOpen: "06:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "20:00",
        },
        {
          day: "Sunday",
          morningOpen: "06:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "20:00",
        },
      ],
      morningAarti: "07:00 AM",
      afternoonAarti: "12:00 PM",
      eveningAarti: "06:30 PM",
      specialSevas: "Rudrabhishekam, Rahu Ketu Pooja, Pradosha Puja",
      festivalSpecificTimings: "Karthigai Deepam, Maha Shivaratri",
      generalEntryFee: "Free",
      specialDarshanFee: "₹300 - ₹500",
      parkingAvailable: true,
      wheelchairAccessible: true,
      cloakroomAvailable: true,
      restroomsAvailable: true,
      drinkingWaterAvailable: true,
      prasadamCounterAvailable: true,
      photographyAllowed: false,
      mobileRestrictions: "Allowed outside sanctum only",
      dressCodeMen: "Dhoti or formal wear, no leather",
      dressCodeWomen: "Saree or traditional wear",
      majorFestivals: "Maha Shivaratri, Karthigai Deepam, Navratri",
      festivalDates:
        "Karthigai Deepam: November-December, Maha Shivaratri: February-March",
      crowdExpectationLevel: "High on weekends and festivals",
      bestMonths: "October to March",
      bestTimeOfDay: "Early morning hours",
      nearbyTemples: "Tirumala (35km), Tirupati (36km)",
      nearbyBeachesOrHills: "Horsley Hills (80km)",
      distanceRailwayStation: "Srikalahasti Station - 2km",
      distanceBusStand: "Srikalahasti Bus Stand - 1km",
      distanceAirport: "Tirupati Airport - 50km",
      images: [
        {
          url: "https://images.unsplash.com/photo-1596791220463-54cd8c21da8a?q=80&w=1924",
          alt: "Ancient Stone Carvings",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1597811776887-142bf6ff0cf9?q=80&w=1974",
          alt: "Temple Courtyard",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1579222622722-1d529eb4bf8a?q=80&w=2074",
          alt: "Temple Elephant",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1627885078712-16a7f4ea6c94?q=80&w=2070",
          alt: "Devotees Praying",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1582298538104-efa9cb10ec87?q=80&w=2070",
          alt: "Temple Entrance",
          isPrimary: false,
        }
      ],
      metaTitle: "Srikalahasti Temple | Vayu Lingam | Rahu Ketu Pooja",
      metaDescription:
        "Visit Srikalahasti Temple - one of the Pancha Bhoota Stalas dedicated to Lord Shiva. Very famous for Rahu Ketu Sarpadosha Nivarana Pooja.",
      thingsToCarry: "Traditional dress, water bottle",
      thingsNotAllowed: "Leather items inside temple",
      idealVisitDuration: "Half day",
      localFoodRecommendations: "South Indian thali, Pulihora",
      emergencyContact: "08578-222777",
      active: true,
    },
    {
      name: "Kanaka Durga Temple",
      slug: "kanaka-durga-temple",
      city: "VIJAYAWADA" as const,
      fullAddress:
        "Indrakeeladri Hill, Vijayawada, Krishna District, Andhra Pradesh - 520001",
      landmark: "Indrakeeladri Hill",
      description:
        "Kanaka Durga Temple is a renowned Hindu temple dedicated to Goddess Kanaka Durga, located on the Indrakeeladri Hill in Vijayawada. The temple is known for its powerful deity and attracts devotees seeking protection and prosperity. The shrine is situated atop a hill offering panoramic views of Vijayawada city and the Krishna River.",
      shortDesc: "Powerful goddess temple on hilltop",
      latitude: 16.5186,
      longitude: 80.6195,
      deityName: "Kanaka Durga",
      templeType: "Shakti Peetha",
      builtYear: "16th Century",
      founder: "King Vasireddy Venkatadri Nayudu",
      mythologicalSignificance:
        "According to legend, Goddess Kanaka Durga killed the demon Mahishasura on this hill. The hill is shaped like a bow (Indra Dhanush), hence the name Indrakeeladri.",
      historicalSignificance:
        "Built by the Reddy kings, later renovated by the British. One of the most visited temples in Andhra Pradesh and the second largest temple by visitors in AP.",
      architectureStyle: "Dravidian Architecture",
      uniqueFeatures:
        "Fast-moving hill (Indrakeeladri), annual Bonalu festival, magnificent Navaratri celebrations and river ghats",
      sacredNearby: "Pradakshina Patha (circumambulation route), Bhavani Island, Prakasam Barrage",
      associatedLegends: "Story of Mahishasura Vadha by Goddess Durga",
      darshanTimings: [
        {
          day: "Monday",
          morningOpen: "05:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Tuesday",
          morningOpen: "05:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Wednesday",
          morningOpen: "05:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Thursday",
          morningOpen: "05:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Friday",
          morningOpen: "05:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Saturday",
          morningOpen: "05:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
        {
          day: "Sunday",
          morningOpen: "05:00",
          morningClose: "12:00",
          eveningOpen: "14:00",
          eveningClose: "21:00",
        },
      ],
      morningAarti: "06:00 AM",
      afternoonAarti: "12:00 PM",
      eveningAarti: "07:00 PM",
      specialSevas:
        "Kanaka Durga Sahasra Namarchana, Rudrabhishekam, Navaratri special pujas",
      festivalSpecificTimings: "Navratri (October), Bonalu (July-August)",
      generalEntryFee: "Free",
      specialDarshanFee: "₹100 - ₹500",
      parkingAvailable: true,
      wheelchairAccessible: false,
      cloakroomAvailable: true,
      restroomsAvailable: true,
      drinkingWaterAvailable: true,
      prasadamCounterAvailable: true,
      photographyAllowed: false,
      dressCodeMen: "Traditional wear, no leather",
      dressCodeWomen: "Saree or traditional wear",
      securityNotes: "Security check at hill base",
      majorFestivals: "Navratri, Bonalu, Dussehra",
      festivalDates: "Navratri: October, Bonalu: July-August",
      crowdExpectationLevel: "Very High during Navratri",
      bestMonths: "October to March",
      bestTimeOfDay: "Early morning or evening",
      peakCrowdDays: "Fridays, Navratri, festival days",
      weatherConditions: "Pleasant in winter, hot in summer",
      nearbyTemples: "Maha Pradakshina Patha, Parvathi Temple",
      nearbyBeachesOrHills: "Indrakeeladri Hill, Bhavani Island (20km)",
      nearbyRestaurants: "Vijayawada City",
      nearbyHotels: "Vijayawada City",
      distanceRailwayStation: "Vijayawada Junction - 5km",
      distanceBusStand: "Vijayawada Bus Station - 3km",
      distanceAirport: "Vijayawada Airport - 15km",
      images: [
        {
          url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069",
          alt: "Kanaka Durga Sanctum",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1596791220463-54cd8c21da8a?q=80&w=1924",
          alt: "Hilltop Temple View",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1627885078712-16a7f4ea6c94?q=80&w=2070",
          alt: "Devotees Queue",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1579222622722-1d529eb4bf8a?q=80&w=2074",
          alt: "Festival Decorations",
          isPrimary: false,
        },
        {
          url: "https://images.unsplash.com/photo-1582298538104-efa9cb10ec87?q=80&w=2070",
          alt: "Pradakshina Pathway",
          isPrimary: false,
        }
      ],
      metaTitle: "Kanaka Durga Temple Vijayawada | Darshan Timings & Bookings",
      metaDescription:
        "Visit Kanaka Durga Temple on Indrakeeladri Hill. Known for powerful deity and Navratri celebrations.",
      thingsToCarry: "Water, comfortable shoes for hill climbing",
      thingsNotAllowed: "Non-vegetarian food, leather items",
      idealVisitDuration: "3-4 hours",
      localFoodRecommendations: "Andhra thali, Pesarattu, Pulihara",
      emergencyContact: "0866-2475555",
      active: true,
    },
  ];

  for (const templeData of temples) {
    await prisma.temple.upsert({
      where: { slug: templeData.slug },
      update: {},
      create: templeData,
    });
    console.log("✅ Temple created:", templeData.name);
  }

  // Create sample services
  const services = [
    {
      name: "Tirupati VIP Darshan & Guide",
      slug: "tirupati-vip-darshan-guide",
      description:
        "Skip the lines and get expert insights into the history and architecture of Tirumala. A dedicated guide will take you through the temple rituals, ensure you get a comfortable VIP darshan, and assist with Prasadam collection.",
      category: "Guide",
      searchText: "guide tirupati darshan vip",
      price: 2500,
      priceUnit: "per_person",
      advanceType: "percentage",
      advanceValue: 50,
      duration: "4-6 Hours",
      isActive: true,
      isVerified: true,
      rating: 4.8,
      reviewCount: 420,
      images: [
        {
          url: "https://images.unsplash.com/photo-1627885078712-16a7f4ea6c94?q=80&w=2070",
          alt: "VIP Darshan",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1596791220463-54cd8c21da8a?q=80&w=1924",
          alt: "Temple Guide",
          isPrimary: false,
        }
      ]
    },
    {
      name: "Luxury AC Cab - Vijayawada Airport Transfer",
      slug: "luxury-ac-cab-vijayawada-airport-transfer",
      description:
        "Comfortable and hassle-free airport transfer connecting Vijayawada International Airport to any hotel in the city limits. Professional drivers, pristine air-conditioned sedans or SUVs, and complimentary bottled water.",
      category: "Transport",
      searchText: "cab taxi airport transfer vijayawada",
      price: 1200,
      priceUnit: "per_trip",
      advanceType: "fixed",
      advanceValue: 300,
      duration: "1 Hour",
      isActive: true,
      isVerified: true,
      rating: 4.9,
      reviewCount: 156,
      images: [
        {
          url: "https://images.unsplash.com/photo-1549317661-bc61c8ee0145?q=80&w=2070",
          alt: "Luxury Sedan",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1622396090075-ab1b9fe358a9?q=80&w=2070",
          alt: "Chauffeur Service",
          isPrimary: false,
        }
      ]
    },
    {
      name: "Srikalahasti Rahu-Ketu Pooja Package",
      slug: "srikalahasti-rahu-ketu-pooja-package",
      description:
        "A full spiritual package for the famous Rahu-Ketu Sarpa Dosha Nivarana Pooja. Includes all pooja completely arranged by a local pandit, premium entry tickets, and assistance throughout the complex rituals.",
      category: "Religious",
      searchText: "srikalahasti rahu ketu pooja",
      price: 3500,
      priceUnit: "per_couple",
      advanceType: "percentage",
      advanceValue: 100,
      duration: "3 Hours",
      isActive: true,
      isVerified: true,
      rating: 4.7,
      reviewCount: 89,
      images: [
        {
          url: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?q=80&w=800",
          alt: "Pooja Items",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1579222622722-1d529eb4bf8a?q=80&w=2074",
          alt: "Temple Rituals",
          isPrimary: false,
        }
      ]
    },
    {
      name: "Full-Day Vijayawada Heritage Photography Tour",
      slug: "full-day-vijayawada-heritage-photography-tour",
      description:
        "Explore the incredible heritage of Vijayawada with a professional photographer. Visit the ancient Undavalli Caves, Prakasam Barrage, and Kanaka Durga Temple. You'll receive 50+ professionally edited portrait and landscape photographs of your journey.",
      category: "Photography",
      searchText: "tour photography photoshoot vijayawada",
      price: 4500,
      priceUnit: "per_day",
      advanceType: "percentage",
      advanceValue: 20,
      duration: "8 Hours",
      isActive: true,
      isVerified: true,
      rating: 5.0,
      reviewCount: 34,
      images: [
        {
          url: "https://images.unsplash.com/photo-1516961642265-531546e84af2?q=80&w=1974",
          alt: "Photographer with Camera",
          isPrimary: true,
        },
        {
          url: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=1974",
          alt: "Camera Lens",
          isPrimary: false,
        }
      ]
    }
  ];

  await prisma.service.deleteMany(); // Clear existing
  for (const serviceData of services) {
    const s = await prisma.service.create({
      data: serviceData,
    });
    console.log("✅ Service created:", s.name);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
