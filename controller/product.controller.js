const { getCache, setCache, removeCacheRegex } = require("../helpers/caching.helper");
const NewError = require("../helpers/error-stack.helper");
const queryDB = require("../helpers/query.helper");

const productList = async (req, res, next) => {
  try {
    const { page } = req.query;
    const limit = 10;

    // Calculate the offset
    const offset = (page - 1) * limit;

    let products;

    const cacheData = await getCache(`products?page${page}`);
    if (cacheData) {
      console.log("Cache Hit");
      products = JSON.parse(cacheData);
    } else {
      console.log("Cache Miss");
      // find all product record
      products = await queryDB(`SELECT name, price FROM products WHERE deleted_at IS NULL LIMIT ? OFFSET ?`, [limit, offset]);

      // check if product exist
      if (products.length === 0) {
        throw new NewError(404, "Product not found");
      }

      setCache(`products?page${page}`, products);
    }

    // count product record
    const count = await queryDB("SELECT COUNT(code) FROM products WHERE deleted_at IS NULL");

    // pagination information
    const pagination = {
      totalFindings: count[0]["COUNT(code)"],
      currenPage: page,
      nextPage: Math.min(Math.ceil(count[0]["COUNT(code)"] / limit), page + 1),
      prevPage: Math.max(1, page - 1),
      totalPage: Math.ceil(count[0]["COUNT(code)"] / limit),
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

    // insert product document
    const product = await queryDB(
      `INSERT INTO products (code, name, price, weight, qty, updated_at, created_at) VALUES (DEFAULT,?,?,?,?,DEFAULT,DEFAULT)`,
      [bodies.name, bodies.price, bodies.weight, bodies.qty]
    );

    removeCacheRegex(`products*`);

    return res.status(201).json({
      message: "Success create product",
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

    // check if product exist
    const findItem = await queryDB(`SELECT name FROM products WHERE code = ? AND deleted_at IS NULL`, code);

    if (findItem.length < 1) {
      throw new NewError(404, "Product not found");
    }

    // soft delete
    const product = await queryDB(`UPDATE products SET deleted_at = NOW() WHERE code = ?`, code);

    removeCacheRegex(`product*`);

    return res.status(200).json({
      message: "Success remove product",
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const bodies = req.body;

    // select product code
    const product = await queryDB(`SELECT code FROM products WHERE code = ? AND deleted_at IS NULL`, req.params.code);

    // check if product exist
    if (product.length < 1) {
      throw new NewError(404, "Product not found");
    }

    // update product record
    const update = await queryDB(
      `UPDATE products SET name = COALESCE(?, name), price = COALESCE(?, price), weight = COALESCE(?, weight), qty = COALESCE(?, qty) WHERE code = ?`,
      [bodies.name, bodies.price, bodies.weight, bodies.qty, req.params.code]
    );

    removeCacheRegex(`product*`);

    res.status(200).json({
      message: "Success update product",
    });
  } catch (error) {
    next(error);
  }
};

const productDetail = async (req, res, next) => {
  try {
    const { name } = req.params;

    let product;

    const cacheData = await getCache(`product/${name}`);
    if (cacheData) {
      console.log("Cache Hit");
      product = JSON.parse(cacheData);
    } else {
      console.log("Cache Miss");
      // select product record
      product = await queryDB(`SELECT name, price, weight, qty FROM products WHERE name = ? AND deleted_at IS NULL`, name);

      // check if product exist
      if (product.length < 1) {
        throw new NewError(404, "Product not found");
      }

      setCache(`product/${name}`, product);
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
    const { name } = req.query;

    let productData = [];

    // select all product record
    const product = await queryDB(`SELECT name, price FROM products WHERE deleted_at IS NULL`);

    // insert the record into array
    for (let i = 0; i < product.length; i++) {
      productData[i] = {};
      productData[i] = product[i];
    }

    // filter the product
    const filteredProducts = productData.filter((product) => {
      const nameMatches = product.name.toLowerCase().includes(name.toLowerCase());
      return nameMatches;
    });

    return res.status(200).json({
      message: `Search results for '${name}'`,
      data: filteredProducts,
    });
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
