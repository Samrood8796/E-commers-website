var db = require('../config/connection')
var collection = require('../config/collections')
const { DeactivationsList } = require('twilio/lib/rest/messaging/v1/deactivation')
var objectId = require('mongodb').ObjectId

module.exports = {
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            try{
                let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
                if (userCart) {
                    let productExist = userCart.products.findIndex(product => product.item == proId)
                    if (productExist != -1) {
                        db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }).then(() => {
                                resolve()
                            })
                    } else {
                        db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) }, {
                            $push: { products: proObj }
                        }).then(() => {
                            resolve()
                        })
                    }
                } else {
                    let cartobj = {
                        user: objectId(userId),
                        products: [proObj]
                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response) => {
                        resolve(response)
                    })
                }
            }catch{
                resolve(0)
            }
        })
    },

    getCartCount: (userId) => {
        let count = 0
        return new Promise(async (resolve, reject) => {
            try{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
                resolve(count)
            } else {
                resolve(count)
            }
        }catch(err){
            console.log("error:"+err);
            resolve(0)
        }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try{ 
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        subtotal: '$products.subtotal'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, subtotal: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        }catch{
            resolve(0)
        }
        })
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        console.log(details);
        return new Promise(async (resolve, reject) => {
            try{
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(details.product) })
            if (details.quantity >= product.stock && details.count == 1) {
                reject()
            } else {
                
                if (details.count == -1 && details.quantity == 1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }).then((response) => {
                            resolve({ itemRemoved: true })
                        })

                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((response) => {
                            resolve({ status: true })
                        })
                }
            }
        }catch{
            resolve(0)
        }
        })
    },

    deleteCartItem: (proId, cartId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cartId), 'products.item': objectId(proId) },
                {
                    $pull: { products: { item: objectId(proId) } }
                }).then((response) => {
                    resolve()
                })
        })
    },

    //tottal price for all products in the cart
    getTottalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try{
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }

            ]).toArray()
            if (total.length > 0) {
                resolve(total[0].total)
            } else {
                resolve(0)
            }
        }catch{
            resolve(0)
        }
        })
    },


    //tottal price for sub product
    getCartSubTotal: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            try{
            let cartSubTotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $match: {
                        item: objectId(proId)
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        unitprice: { $toInt: '$product.price' },
                        quantity: { $toInt: '$quantity' }
                    }
                },
                {
                    $project: {
                        _id: null,
                        subtotal: { $sum: { $multiply: ['$quantity', '$unitprice'] } }
                    }
                }
            ]).toArray()
            if (cartSubTotal.length > 0) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), "products.item": objectId(proId) },
                    {
                        $set: {
                            'products.$.subtotal': cartSubTotal[0].subtotal
                        }
                    }).then((response) => {
                        resolve(cartSubTotal[0].subtotal)
                    })
            }
            else {
                cartSubTotal = 0
                resolve(cartSubTotal)
            }
        }catch{
            resolve(0)
        }
        })
    },


    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            try{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                resolve(cart.products)
            }
        }catch{
            resolve(0)
        }
        })
    },

    findCartQuantity: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
          try {
            let userCart = await db
              .get()
              .collection(collection.CART_COLLECTION)
              .aggregate([
                {
                  $match: { user: objectId(userId) },
                },
                {
                  $unwind: "$products",
                },
                {
                  $project: {
                    item: "$products.item",
                    quantity: "$products.quantity",
                  },
                },
                {
                  $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "product",
                  },
                },
                {
                  $match: {
                    item: objectId(proId),
                  },
                },
                {
                  $project: {
                    item: 1,
                    quantity: 1,
                    product: { $arrayElemAt: ["$product", 0] },
                  },
                },
                {
                  $project: {
                    unitprice: { $toInt: "$product.price" },
                    quantity: { $toInt: "$quantity" },
                  },
                },
              ])
              .toArray();
            resolve(userCart[0].quantity);
          } catch {
            resolve(0);
          }
        });
      },
}

