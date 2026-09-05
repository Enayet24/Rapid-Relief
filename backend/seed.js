require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Shelter = require("./models/Shelter");
const EmergencyRequest = require("./models/EmergencyRequest");
const Resource = require("./models/Resource");
const Donation = require("./models/Donation");
const Notification = require("./models/Notification");
const { classifyPriority } = require("./utils/priorityClassifier");

const seedDatabase = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MongoDB URI found in environment.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(uri);
  console.log("MongoDB connected successfully. Clearing existing test data...");

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Shelter.deleteMany({}),
    EmergencyRequest.deleteMany({}),
    Resource.deleteMany({}),
    Donation.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log("Creating demo users...");
  const hashedPassword = await bcrypt.hash("123456", 10);

  // 1. Users
  const admin = await User.create({
    name: "Ariful Islam (Admin)",
    email: "admin@rapidrelief.org",
    password: hashedPassword,
    phone: "+8801711001122",
    role: "admin",
    isActive: true,
  });

  const volunteer1 = await User.create({
    name: "Rafiqul Islam",
    email: "volunteer1@rapidrelief.org",
    password: hashedPassword,
    phone: "+8801811223344",
    role: "volunteer",
    isApprovedVolunteer: true,
    skills: ["First Aid", "Boat Rescue", "Search & Evacuation"],
    isActive: true,
  });

  const volunteer2 = await User.create({
    name: "Tanvir Ahmed",
    email: "volunteer2@rapidrelief.org",
    password: hashedPassword,
    phone: "+8801911445566",
    role: "volunteer",
    isApprovedVolunteer: true,
    skills: ["Medical Support", "Firefighting Assistance"],
    isActive: true,
  });

  const citizen1 = await User.create({
    name: "Ariful Islam Bijoy",
    email: "citizen@rapidrelief.org",
    password: hashedPassword,
    phone: "+8801700998877",
    role: "citizen",
    isActive: true,
  });

  const citizen2 = await User.create({
    name: "Fatema Tuz Zohra",
    email: "fatema@gmail.com",
    password: hashedPassword,
    phone: "+8801611889900",
    role: "citizen",
    isActive: true,
  });

  console.log("Creating demo shelters...");
  // 2. Shelters
  const shelter1 = await Shelter.create({
    name: "Feni Govt Pilot High School Cyclone Shelter",
    location: {
      type: "Point",
      coordinates: [91.3976, 23.0159],
      address: "Trunk Road, Feni Sadar, Feni",
    },
    capacity: 450,
    currentOccupancy: 385,
    status: "open",
    contactPhone: "+8801712345678",
    facilities: ["Medical Corner", "Clean Water Tanks", "Solar Generator", "Women & Children Ward"],
    managedBy: admin._id,
  });

  const shelter2 = await Shelter.create({
    name: "Sylhet City Relief & Flood Shelter",
    location: {
      type: "Point",
      coordinates: [91.8687, 24.8949],
      address: "Kazir Bazar, Kotwali, Sylhet",
    },
    capacity: 600,
    currentOccupancy: 590,
    status: "full",
    contactPhone: "+8801812345678",
    facilities: ["Emergency Clinic", "Water Purification Unit", "Cooked Food Kitchen"],
    managedBy: admin._id,
  });

  const shelter3 = await Shelter.create({
    name: "Chittagong Port Coastal Rescue Shelter",
    location: {
      type: "Point",
      coordinates: [91.8155, 22.3384],
      address: "Patenga Sea Beach Road, Chattogram",
    },
    capacity: 350,
    currentOccupancy: 120,
    status: "open",
    contactPhone: "+8801912345678",
    facilities: ["Lifeboats Staging Area", "First Aid Station", "Blanket Stores"],
    managedBy: admin._id,
  });

  const shelter4 = await Shelter.create({
    name: "Barisal Riverbank Emergency Relief Hub",
    location: {
      type: "Point",
      coordinates: [90.3696, 22.701],
      address: "Band Road, Kirtankhola Riverfront, Barisal",
    },
    capacity: 300,
    currentOccupancy: 95,
    status: "open",
    contactPhone: "+8801612345678",
    facilities: ["Clean Water Station", "Sanitation Blocks", "Emergency Battery Charging"],
    managedBy: admin._id,
  });

  console.log("Creating demo resources...");
  // 3. Resources
  const resources = await Resource.insertMany([
    {
      category: "food",
      name: "Emergency Dry Ration Packs (Biscuits, Flattened Rice)",
      quantity: 1250,
      unit: "packs",
      lowStockThreshold: 300,
      shelter: shelter1._id,
    },
    {
      category: "water",
      name: "Water Purification Tablets (Aquatabs)",
      quantity: 45,
      unit: "boxes (1000 tabs each)",
      lowStockThreshold: 50, // Low stock!
      shelter: shelter1._id,
    },
    {
      category: "water",
      name: "5-Liter Clean Drinking Water Cans",
      quantity: 850,
      unit: "bottles",
      lowStockThreshold: 200,
      shelter: shelter2._id,
    },
    {
      category: "medicine",
      name: "ORS (Oral Rehydration Salts) & Saline Kits",
      quantity: 240,
      unit: "cartons",
      lowStockThreshold: 100,
      shelter: shelter2._id,
    },
    {
      category: "medicine",
      name: "Emergency First Aid Trauma Kits",
      quantity: 18,
      unit: "kits",
      lowStockThreshold: 25, // Low stock!
      shelter: shelter3._id,
    },
    {
      category: "clothing",
      name: "Thermal Emergency Blankets",
      quantity: 650,
      unit: "pieces",
      lowStockThreshold: 150,
      shelter: shelter3._id,
    },
    {
      category: "other",
      name: "Waterproof Rescue Tarpaulins & Tents",
      quantity: 80,
      unit: "sets",
      lowStockThreshold: 100, // Low stock!
      shelter: shelter4._id,
    },
    {
      category: "other",
      name: "High-Visibility Life Jackets",
      quantity: 120,
      unit: "vests",
      lowStockThreshold: 40,
      shelter: shelter3._id,
    },
  ]);

  console.log("Creating demo donations...");
  // 4. Donations
  await Donation.insertMany([
    {
      donorName: "BRAC Alumni Relief Fund",
      donorContact: "+8801700112233",
      donationType: "cash",
      amount: 250000,
      status: "allocated",
      shelter: shelter1._id,
      receivedBy: admin._id,
    },
    {
      donorName: "Red Crescent Humanitarian Supply",
      donorContact: "+8801800223344",
      donationType: "goods",
      itemDescription: "500 Thermal Emergency Blankets",
      quantity: 500,
      status: "allocated",
      linkedResource: resources[5]._id,
      shelter: shelter3._id,
      receivedBy: admin._id,
    },
    {
      donorName: "Apex Pharma Aid",
      donorContact: "+8801900334455",
      donationType: "goods",
      itemDescription: "Essential waterborne disease antibiotics and antipyretics",
      quantity: 150,
      status: "received",
      shelter: shelter2._id,
      receivedBy: admin._id,
    },
  ]);

  console.log("Creating demo emergency requests...");
  // 5. Emergency Requests
  const reqData = [
    {
      reporter: citizen1._id,
      disasterType: "flood",
      location: {
        type: "Point",
        coordinates: [91.3976, 23.0159],
        address: "Village: Daganbhuiyan, Ward 3, Feni",
      },
      numberOfAffectedIndividuals: 14,
      assistanceTypeRequired: "rescue",
      description: "Water level reached 1st floor roof. Elderly grandmother and 4 infants trapped without drinking water. Immediate boat rescue needed.",
      status: "in_progress",
      assignedVolunteer: volunteer1._id,
      statusHistory: [
        { status: "pending", note: "Emergency report submitted via SMS hotline" },
        { status: "assigned", note: "Volunteer Rafiqul Islam dispatched with rescue boat" },
        { status: "in_progress", note: "Rescue team en route to coordinates" },
      ],
    },
    {
      reporter: citizen2._id,
      disasterType: "flood",
      location: {
        type: "Point",
        coordinates: [91.8687, 24.8949],
        address: "Companiganj, Bholaganj Road, Sylhet",
      },
      numberOfAffectedIndividuals: 35,
      assistanceTypeRequired: "food",
      description: "Submerged village school hosting 35 flood victims. Out of dry food and clean drinking water for 36 hours.",
      status: "assigned",
      assignedVolunteer: volunteer2._id,
      statusHistory: [
        { status: "pending", note: "Request received" },
        { status: "assigned", note: "Volunteer Tanvir Ahmed assigned for supply delivery" },
      ],
    },
    {
      reporter: citizen1._id,
      disasterType: "cyclone",
      location: {
        type: "Point",
        coordinates: [91.8155, 22.3384],
        address: "North Patenga Coastal Belt, Chattogram",
      },
      numberOfAffectedIndividuals: 8,
      assistanceTypeRequired: "medical",
      description: "Fallen trees damaged tin house roof. 2 individuals severely injured by debris. Need urgent medical evacuation to shelter.",
      status: "pending",
      assignedVolunteer: null,
      statusHistory: [{ status: "pending", note: "Incident registered with critical severity" }],
    },
    {
      reporter: citizen2._id,
      disasterType: "fire",
      location: {
        type: "Point",
        coordinates: [90.4125, 23.8103],
        address: "Korail Informal Settlement, Mohakhali, Dhaka",
      },
      numberOfAffectedIndividuals: 60,
      assistanceTypeRequired: "shelter",
      description: "Shanties damaged by electrical fire. Families displaced without clothing or emergency shelter tarp.",
      status: "pending",
      assignedVolunteer: null,
      statusHistory: [{ status: "pending", note: "Reported to disaster relief dispatcher" }],
    },
    {
      reporter: citizen1._id,
      disasterType: "landslide",
      location: {
        type: "Point",
        coordinates: [92.1987, 22.1852],
        address: "Lama Upazila, Hill Tracts, Bandarban",
      },
      numberOfAffectedIndividuals: 12,
      assistanceTypeRequired: "rescue",
      description: "Hill slope collapsed blocking road and crushing 2 hillside homes. Need search and rescue equipment.",
      status: "resolved",
      assignedVolunteer: volunteer1._id,
      statusHistory: [
        { status: "pending", note: "Request submitted" },
        { status: "assigned", note: "Rescue team dispatched" },
        { status: "in_progress", note: "Victims evacuated" },
        { status: "resolved", note: "All 12 individuals successfully relocated to Lama Union Center" },
      ],
    },
  ];

  for (const item of reqData) {
    const { priorityScore, priorityLevel } = classifyPriority({
      disasterType: item.disasterType,
      assistanceTypeRequired: item.assistanceTypeRequired,
      numberOfAffectedIndividuals: item.numberOfAffectedIndividuals,
      description: item.description,
    });

    await EmergencyRequest.create({
      ...item,
      priorityScore,
      priorityLevel,
    });
  }

  console.log("Demo database successfully populated!");
  console.log("=========================================");
  console.log("DEMO LOGIN CREDENTIALS (Password for all: 123456)");
  console.log("👑 Admin:      admin@rapidrelief.org");
  console.log("🦺 Volunteer:  volunteer1@rapidrelief.org");
  console.log("👤 Citizen:    citizen@rapidrelief.org");
  console.log("=========================================");

  await mongoose.disconnect();
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
