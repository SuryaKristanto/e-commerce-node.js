const Products = require("../db/schemas/product.schema");
const NewError = require("../helpers/error-stack.helper");

const productList = async (req, res, next) => {
  try {
    const { page, limit } = req.body;

    // Calculate the offset
    const offset = (page - 1) * limit;

    // find all product document
    const products = await Products.find({ deleted_at: null }, { _id: 0, name: 1, price: 1 }).skip(offset).limit(limit);

    // check if product exist
    if (!products) {
      throw new NewError(404, "Product not found");
    }

    // count product document
    const count = await Products.countDocuments({ deleted_at: null });

    // pagination information
    const pagination = {
      totalFindings: count,
      currenPage: page,
      nextPage: Math.min(Math.ceil(count / limit), page + 1),
      prevPage: Math.max(1, page - 1),
      totalPage: Math.ceil(count / limit),
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
    const product = await Products.create(bodies);

    return res.status(201).json({
      message: "Success create product",
      data: {
        name: product.name,
        price: product.price,
        weight: product.weight,
        qty: product.qty,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;

    const product = await Products.findOneAndUpdate({ _id: _id, deleted_at: null }, { deleted_at: new Date() });

    if (!product) {
      throw new NewError(404, "Product not found");
    }

    return res.status(200).json({
      message: "Success remove product",
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { _id } = req.params;

    // find and update product
    const product = await Products.findOneAndUpdate({ _id: _id, deleted_at: null }, req.body);

    // check if the product exist
    if (!product) {
      throw new NewError(404, "Product not found");
    }

    return res.status(200).json({
      message: "Success update product",
    });
  } catch (error) {
    next(error);
  }
};

const productDetail = async (req, res, next) => {
  try {
    // find product
    const product = await Products.find({ name: req.params.name, deleted_at: null }, { _id: 0, name: 1, price: 1, weight: 1, qty: 1 });

    // check if the product exist
    if (!product) {
      throw new NewError(404, "Product not found");
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

    // find all product document
    const products = await Products.find({ deleted_at: null }, { _id: 0, name: 1, price: 1 });

    // filter the product
    const filteredProducts = products.filter((product) => {
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
