require("dotenv").config();

const mysql = require("mysql");
const { faker } = require("@faker-js/faker");
const crypto = require("crypto");

async function seedDatabase() {
  const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "ecommerce",
    port: 3306,
    timezone: "local",
  });

  async function queryDB(query, param) {
    return new Promise((resolve) => {
      connection.query(query, param, function (err, result, fields) {
        if (err) {
          //resolve('err : ' + err.stack);
          resolve("err :" + err.message);
        } else {
          resolve(result);
        }
      });
    });
  }

  const roleData = ["admin", "member", "guest"];

  for (let i = 0; i < 3; i++) {
    const insertQuery = `INSERT INTO roles (id, name, updated_at, created_at) VALUES (DEFAULT,?,DEFAULT,DEFAULT)`;
    const role = await queryDB(insertQuery, roleData[i]);
    console.log(role);
  }

  function generateUserData() {
    return {
      role_id: 1,
      email: faker.internet.email().toLowerCase(),
      password: crypto.createHmac("sha256", "zxcvbnm").update("admin123").digest("hex"),
      name: `${faker.name.firstName()} ${faker.name.lastName()}`,
      address: faker.address.city(),
      phone: faker.phone.number("08##########"),
    };
  }

  for (let i = 0; i < 10; i++) {
    const userData = generateUserData();
    const insertQuery = `INSERT INTO users (id,role_id,email,password,name,address,phone,created_at,updated_at) VALUES (DEFAULT,?,?,?,?,?,?,DEFAULT,DEFAULT)`;
    const user = await queryDB(insertQuery, [
      userData.role_id,
      userData.email,
      userData.password,
      userData.name,
      userData.address,
      userData.phone,
    ]);
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

  for (let i = 0; i < 20; i++) {
    const productData = generateProductData();
    const insertQuery = `INSERT INTO products (code, name, price, weight, qty, updated_at, created_at) VALUES (DEFAULT,?,?,?,?,DEFAULT,DEFAULT)`;
    const product = await queryDB(insertQuery, [productData.name, productData.price, productData.weight, productData.qty]);
    console.log(product);
  }

  console.log("Seeding completed !");
  await connection.end();
}

seedDatabase();
