var db = require('../config/connection')
var collection = require('../config/collections');
const { resolve } = require('path');
var objectId = require('mongodb').ObjectId
module.exports = {

    addProduct: (product) => {
        product.price = parseInt(product.price);
        product.date = new Date()
        return new Promise((resolve, reject) => {
            try {


                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ name: product.name }).then((response) => {
                    if (response) {
                        resolve({ status: true })
                    } else {
                        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                            resolve(data.insertedId)
                        })
                    }
                })
            } catch {
                resolve(0)
            }
        })
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({ date: -1 }).toArray()
                resolve(products)
            } catch {
                resolve(0)
            }
        })
    },

    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                    resolve()
                })
            } catch {
                resolve(0)
            }
        })
    },

    getProductDetails: (prodId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },

    updateProduct: (prodId, proDetails) => {
        proDetails.price = parseInt(proDetails.price)
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) }, {
                    $set: {
                        name: proDetails.name,
                        category: proDetails.category,
                        price: proDetails.price,
                        description: proDetails.description,
                        stock: proDetails.stock,
                    }
                }).then((response) => {
                    resolve()
                })
            } catch {
                resolve(0)
            }
        })
    },

    addCategory: (catData) => {
        return new Promise(async (resolve, reject) => {
            catData.category = catData.category.toUpperCase()
            await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: catData.category }).then((response) => {
                if (response) {
                    resolve({ status: false })
                } else {
                    db.get().collection(collection.CATEGORY_COLLECTION).insertOne(catData).then(() => {
                        resolve({ status: true })
                    })
                }
            })
        })
    },

    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },

    getCategory: (id) => {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ _id: objectId(id) })
            resolve(category)
        })
    },

    updateCategory: (catData, id) => {
        return new Promise((resolve, reject) => {
            catData.category = catData.category.toUpperCase()
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: catData.category }).then((response) => {
                    if (response) {
                        resolve({ status: false })
                    } else {
                        db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ _id: objectId(id) }, {
                            $set: {
                                category: catData.category
                            }
                        }).then(() => {
                            resolve({ status: true })
                        })
                    }
                })
            } catch {
                resolve(0)
            }

        })
    },

    deleteCategory: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(id) }).then((response) => {
                resolve(response)
            })
        })
    },

    getStock: (id) => {
        return new Promise((reaolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }).then((response) => {
                reaolve(response.stock)
            })
        })
    },

    filterPrice: (range) => {
        min = parseInt(range.range1)
        max = parseInt(range.range2)
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ offerPrice: { $gte: min, $lte: max } }).toArray()
            console.log(products);
            resolve(products)
        })
    },

    getProductsBySearch: (searchData) => {
        return new Promise(async (resolve, reject) => {
            let length = searchData.length;
            let products = []
            if (length == 0 || searchData === " ") {
                resolve(products)
            } else {
                var re = new RegExp(searchData, "i");
                products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ name: re }).toArray()
                // let arr=[]
                // products.forEach((products,index)=>{
                //     arr.push(products.title)
                // })
                console.log(products);
                resolve(products)
            }
        })
    },

}