require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User.model");
const Food = require("../models/Food.model");
const Coupon = require("../models/Coupon.model");
const Branch = require("../models/Branch.model");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quanli_booking";

const users = [
  {
    name: "Admin Nha Vien",
    email: "admin@nhavien.com",
    password: "admin123",
    phone: "0909123456",
    role: "admin",
  },
  {
    name: "Shipper Nha Vien",
    email: "shipper@nhavien.com",
    password: "shipper123",
    phone: "0909123457",
    role: "shipper",
  },
  {
    name: "Nguyen Van A",
    email: "user1@nhavien.com",
    password: "user1234",
    phone: "0909123458",
    role: "customer",
  },
  {
    name: "Tran Thi B",
    email: "user2@nhavien.com",
    password: "user1234",
    phone: "0909123459",
    role: "customer",
  },
];

const foods = [
  // Soup
  {
    name: "Pho Bo",
    description: "Nuoc pho bo bo, hach cuon ngon, banh pho tuoi",
    price: 55000,
    category: "Soup",
    discount: 0,
    tags: ["best-seller", "vietnamese"],
    isFeatured: true,
  },
  {
    name: "Pho Ga",
    description: "Nuoc pho ga thom ngon, ga ta nguyen vi",
    price: 50000,
    category: "Soup",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  {
    name: "Bun Bo Hue",
    description: "Bun bo Hue cay nen, nam chung chan vit",
    price: 60000,
    category: "Soup",
    discount: 5,
    tags: ["spicy", "vietnamese"],
    isFeatured: true,
  },
  {
    name: "Bun Rieu Cua",
    description: "Bun rieu cua that, rieu nau tu tuong tuong",
    price: 55000,
    category: "Soup",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  {
    name: "Mien Luoc Ga",
    description: "Mien ga gap ruc, nuoc duong that ngon",
    price: 45000,
    category: "Soup",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  // Noodles
  {
    name: "Bun Dau Mam Tom",
    description: "Bun tuoi, dau hu non, mam tom chua cay",
    price: 50000,
    category: "Noodles",
    discount: 0,
    tags: ["best-seller", "vietnamese"],
    isFeatured: true,
  },
  {
    name: "Bun Cha Ha Noi",
    description: "Bun cha Ha Noi cha que thom ngon",
    price: 55000,
    category: "Noodles",
    discount: 0,
    tags: ["vietnamese", "best-seller"],
    isFeatured: true,
  },
  {
    name: "My Quang Ga",
    description: "My quang ga bap, rau thom, nuoc dash",
    price: 50000,
    category: "Noodles",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  {
    name: "Cao Lau",
    description: "Cao lau Hoi An, mi vang, rau xanh",
    price: 60000,
    category: "Noodles",
    discount: 10,
    tags: ["vietnamese", "specialty"],
    isFeatured: true,
  },
  {
    name: "Com Tam Suon Nuong",
    description: "Com tam suon nuong cha bia, trung cha",
    price: 55000,
    category: "Noodles",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  // Rice
  {
    name: "Com Tam Bi",
    description: "Com tam bi suon cha, dua chua",
    price: 50000,
    category: "Rice",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  {
    name: "Com Tam Suon Bi",
    description: "Com tam suon bi cha bia, dua chua",
    price: 55000,
    category: "Rice",
    discount: 0,
    tags: ["best-seller", "vietnamese"],
    isFeatured: true,
  },
  {
    name: "Com Ga Xoi Mo",
    description: "Com ga xoi mo giòn, muoi tieu",
    price: 50000,
    category: "Rice",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  {
    name: "Com Suon Trung Chien",
    description: "Com suon trung chien gion, nuoc mam",
    price: 60000,
    category: "Rice",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  // Salad
  {
    name: "Goi Cuon",
    description: "Goi cuon tom thit, nuoc mam pha",
    price: 45000,
    category: "Salad",
    discount: 0,
    tags: ["healthy", "vietnamese"],
    isFeatured: true,
  },
  {
    name: "Nom Hoa Chuoi",
    description: "Nom hoa chuoi tom kho, dau phong",
    price: 40000,
    category: "Salad",
    discount: 0,
    tags: ["healthy"],
    isFeatured: false,
  },
  {
    name: "Salad Ga Nuong",
    description: "Salad ga nuong, rau xanh, soi",
    price: 60000,
    category: "Salad",
    discount: 5,
    tags: ["healthy"],
    isFeatured: false,
  },
  {
    name: "Nom Du Du",
    description: "Nom du du tom, bau duc",
    price: 45000,
    category: "Salad",
    discount: 0,
    tags: ["healthy"],
    isFeatured: false,
  },
  // Dessert
  {
    name: "Che Ba Mau",
    description: "Che ba mau do, xanh, trang",
    price: 25000,
    category: "Dessert",
    discount: 0,
    tags: ["sweet", "vietnamese"],
    isFeatured: true,
  },
  {
    name: "Che Dau Xanh",
    description: "Che dau xanh thanh long, dau phong",
    price: 25000,
    category: "Dessert",
    discount: 0,
    tags: ["sweet"],
    isFeatured: false,
  },
  {
    name: "Banh Da Lon",
    description: "Banh da lon nhan duong, trai",
    price: 20000,
    category: "Dessert",
    discount: 0,
    tags: ["sweet", "vietnamese"],
    isFeatured: false,
  },
  {
    name: "Sua Chua Nong",
    description: "Sua chua Nep la, trai cay",
    price: 30000,
    category: "Dessert",
    discount: 0,
    tags: ["sweet"],
    isFeatured: false,
  },
  // Drinks
  {
    name: "Ca Phe Den Da",
    description: "Ca phe den Vietnam, da lot",
    price: 20000,
    category: "Drinks",
    discount: 0,
    tags: ["vietnamese", "best-seller"],
    isFeatured: true,
  },
  {
    name: "Ca Phe Sua Da",
    description: "Ca phe sua Vietnam, da, ngot vua",
    price: 25000,
    category: "Drinks",
    discount: 0,
    tags: ["vietnamese", "best-seller"],
    isFeatured: true,
  },
  {
    name: "Tra Da",
    description: "Tra da Vietnam, ngot vua",
    price: 15000,
    category: "Drinks",
    discount: 0,
    tags: ["vietnamese"],
    isFeatured: false,
  },
  {
    name: "Nuoc Ep Cam",
    description: "Nuoc ep cam tuoi, khong duong",
    price: 30000,
    category: "Drinks",
    discount: 0,
    tags: ["healthy"],
    isFeatured: false,
  },
];

const coupons = [
  {
    code: "WELCOME10",
    type: "percent",
    value: 10,
    minOrder: 100000,
    maxDiscount: 30000,
    usageLimit: 100,
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true,
    freeShipping: false,
  },
  {
    code: "FREESHIP",
    type: "fixed",
    value: 15000,
    minOrder: 50000,
    usageLimit: 50,
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
    freeShipping: true,
  },
  {
    code: "SAVE20K",
    type: "fixed",
    value: 20000,
    minOrder: 150000,
    usageLimit: null,
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isActive: true,
    freeShipping: false,
  },
  {
    code: "SUMMER25",
    type: "percent",
    value: 25,
    minOrder: 200000,
    maxDiscount: 50000,
    usageLimit: 30,
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    isActive: true,
    freeShipping: false,
  },
  {
    code: "FIRSTORDER",
    type: "percent",
    value: 15,
    minOrder: 80000,
    maxDiscount: 25000,
    usageLimit: 1,
    endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    isActive: true,
    freeShipping: false,
  },
];

const branches = [
  {
    name: "Nha Vien - Quan 1",
    address: "123 Nguyen Hue, District 1, Ho Chi Minh City",
    phone: "02812345678",
    coordinates: { lat: 10.7769, lng: 106.7009 },
    isActive: true,
    openingHours: { open: "07:00", close: "22:00" },
  },
  {
    name: "Nha Vien - Quan 3",
    address: "456 Dien Bien Phu, District 3, Ho Chi Minh City",
    phone: "02823456789",
    coordinates: { lat: 10.7861, lng: 106.6833 },
    isActive: true,
    openingHours: { open: "08:00", close: "21:30" },
  },
  {
    name: "Nha Vien - Quan 5",
    address: "789 Tran Hung Dao, District 5, Ho Chi Minh City",
    phone: "02834567890",
    coordinates: { lat: 10.7549, lng: 106.6775 },
    isActive: true,
    openingHours: { open: "07:30", close: "21:00" },
  },
  {
    name: "Nha Vien - Quan 7",
    address: "321 Nguyen Van Linh, District 7, Ho Chi Minh City",
    phone: "02845678901",
    coordinates: { lat: 10.7411, lng: 106.7189 },
    isActive: true,
    openingHours: { open: "08:00", close: "22:00" },
  },
  {
    name: "Nha Vien - Binh Thanh",
    address: "555 Dien Bien Phu, Binh Thanh District, Ho Chi Minh City",
    phone: "02856789012",
    coordinates: { lat: 10.8013, lng: 106.7064 },
    isActive: true,
    openingHours: { open: "08:00", close: "21:30" },
  },
  {
    name: "Nha Vien - Go Vap",
    address: "111 Pham Van Dong, Go Vap District, Ho Chi Minh City",
    phone: "02867890123",
    coordinates: { lat: 10.8327, lng: 106.6879 },
    isActive: true,
    openingHours: { open: "07:00", close: "21:00" },
  },
];

const seed = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("\n--- Clearing existing data ---");
    await User.deleteMany({});
    await Food.deleteMany({});
    await Coupon.deleteMany({});
    await Branch.deleteMany({});

    console.log("\n--- Seeding Users ---");
    const hashedUsers = users.map((u) => ({
      ...u,
      password: bcrypt.hashSync(u.password, 10),
    }));
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Created ${createdUsers.length} users`);

    console.log("\n--- Seeding Foods ---");
    const createdFoods = await Food.insertMany(foods);
    console.log(`Created ${createdFoods.length} foods`);

    console.log("\n--- Seeding Coupons ---");
    const createdCoupons = await Coupon.insertMany(coupons);
    console.log(`Created ${createdCoupons.length} coupons`);

    console.log("\n--- Seeding Branches ---");
    const createdBranches = await Branch.insertMany(branches);
    console.log(`Created ${createdBranches.length} branches`);

    console.log("\n--- Seed Summary ---");
    console.log("Admin:      admin@nhavien.com / admin123");
    console.log("Shipper:    shipper@nhavien.com / shipper123");
    console.log("Customer 1: user1@nhavien.com / user1234");
    console.log("Customer 2: user2@nhavien.com / user1234");
    console.log(`Foods:      ${createdFoods.length} items`);
    console.log(`Coupons:    ${createdCoupons.length} coupons`);
    console.log(`Branches:   ${createdBranches.length} branches`);

    console.log("\nSeed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seed();
