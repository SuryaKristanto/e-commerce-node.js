const connection = require("../db");

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

const productList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = 5;

    // Calculate the offset
    const offset = (page - 1) * limit;

    const products = await queryDB(
      `SELECT name, price FROM products WHERE deleted_at IS NULL LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const isProductExist = products.length > 0;
    if (!isProductExist) {
      // kalo ngga ada data, maka return status
      return res.status(404).json({
        message: "product not found",
      });
    }
    // console.log(isProductExist);

    const count = await queryDB(
      "SELECT name FROM products WHERE deleted_at IS NULL"
    );

    const pagination = {
      totalFindings: count.length,
      currenPage: page,
      nextPage: Math.min(Math.ceil(count.length / limit), page + 1),
      prevPage: Math.max(1, page - 1),
      totalPage: Math.ceil(count.length / limit),
    };

    return res.status(200).json({
      message: "Product List",
      data: products,
      pagination: page ? pagination : null,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const bodies = req.body;

    const product = await queryDB(
      `INSERT INTO products (code, name, price, weight, qty, updated_at, created_at) VALUES (DEFAULT,?,?,?,?,DEFAULT,DEFAULT)`,
      [bodies.name, bodies.price, bodies.weight, bodies.qty]
    );
    console.log(product);

    return res.status(200).json({
      message: "success create product",
      data: {
        name: bodies.name,
        price: bodies.price,
        weight: bodies.weight,
        qty: bodies.qty,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { code } = req.params;

    const findItem = await queryDB(
      `SELECT name FROM products WHERE code = ? AND deleted_at IS NULL`,
      [code]
    );
    console.log(findItem);
    if (findItem.length < 1)
      return res.status(404).json({
        message: "product not found",
      });

    const product = await queryDB(
      `UPDATE products SET deleted_at = NOW() WHERE code = ?`,
      [code]
    );
    console.log(product);

    return res.status(200).json({
      message: "success remove product",
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await queryDB(
      `SELECT code FROM products WHERE code = ? AND deleted_at IS NULL`,
      [req.params.code]
    );
    console.log(product);
    if (product.length < 1) {
      return res.status(404).json({
        message: "product not found",
      });
    }

    const bodies = req.body;
    const update = await queryDB(
      `UPDATE products SET name = COALESCE(?, name), price = COALESCE(?, price), weight = COALESCE(?, weight), qty = COALESCE(?, qty) WHERE code = ?`,
      [bodies.name, bodies.price, bodies.weight, bodies.qty, req.params.code]
    );
    console.log(update);

    res.status(200).json({
      message: "success update product",
    });
  } catch (error) {
    next(error);
  }
};

const productDetail = async (req, res, next) => {
  try {
    const product = await queryDB(
      `SELECT name, price, weight, qty FROM products WHERE name = ? AND deleted_at IS NULL`,
      [req.params.name]
    );

    if (product.length < 1) {
      return res.status(404).json({
        message: "product not found",
      });
    }

    return res.status(200).json({
      message: "Product Detail",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const searchProduct = async (req, res, next) => {
  try {
    const name = req.query;
    // console.log(name);
    let productData = [];

    const product = await queryDB(
      `SELECT name, price FROM products WHERE deleted_at IS NULL`
    );
    // console.log(product);

    for (let i = 0; i < product.length; i++) {
      productData[i] = {};
      productData[i] = product[i];
    }
    // console.log(productData);

    const filteredProduct = productData.filter((user) => {
      let isValid = true;
      for (key in name) {
        // console.log(key, user[key], name[key]);
        isValid = isValid && user[key] == name[key];
      }
      return isValid;
    });
    // console.log(filteredProduct);
    res.send(filteredProduct);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  productList,
  createProduct,
  deleteProduct,
  updateProduct,
  productDetail,
  searchProduct,
};
