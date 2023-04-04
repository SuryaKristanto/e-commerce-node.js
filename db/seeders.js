require("dotenv").config();

const { faker } = require("@faker-js/faker");
const crypto = require("crypto");
const Users = require("./schemas/user.schema");
const Products = require("./schemas/product.schema");
const { default: mongoose } = require("mongoose");

async function seedDatabase() {
  // connect to mongodb
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Successfully connected to mongodb"))
    .catch((err) => console.log(err));

  function generateUserData() {
    return {
      role_id: new mongoose.Types.ObjectId("642a9e2de361627290bd7f6f"),
      email: faker.internet.email().toLowerCase(),
      password: crypto.createHmac("sha256", "zxcvbnm").update("admin123").digest("hex"),
      name: `${faker.name.firstName()} ${faker.name.lastName()}`,
      address: faker.address.city(),
      phone: faker.phone.number("08##########"),
    };
  }

  for (let i = 0; i < 10; i++) {
    const userData = generateUserData();
    const user = await Users.create(userData);
    console.log(user);
  }

  function generateProductData() {
    return {
      name: `${faker.commerce.productName()}`,
      price: faker.commerce.price(1000, 100000, 0),
      weight: faker.datatype.number({ min: 1, max: 100 }),
      qty: faker.datatype.number({ min: 10, max: 100 }),
    };
  }

  for (let i = 0; i < 10; i++) {
    const productData = generateProductData();
    const product = await Products.create(productData);
    console.log(product);
  }

  console.log("Seeding completed !");
}

seedDatabase();
