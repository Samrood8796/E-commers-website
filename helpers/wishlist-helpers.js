var db = require('../config/connection')
var collection = require('../config/collections');
var objectId = require('mongodb').ObjectId

module.exports = {
// add to wishlist
    addToWishlist: (proId, userId) => {
        let proObj = {
            item: objectId(proId)
        }
        return new Promise(async (resolve, reject) => {
            let userWish = await db.get().collection(collection.WISHLIST_COLLECTON).findOne({ user: objectId(userId) })
            if (userWish) {
                let productExist = userWish.products.findIndex(product => product.item == proId)
                console.log(productExist);
                if (productExist != -1) {
                    db.get().collection(collection.WISHLIST_COLLECTON).updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                        {
                            $pull: { products: { item: objectId(proId) } }
                        }).then(() => {
                            reject()
                        })
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTON).updateOne({ user: objectId(userId) },
                        {
                            $push: { products: proObj }
                        }).then(() => {
                            resolve()
                        })
                }
            } else {
                let wishObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTON).insertOne(wishObj).then(() => {
                    resolve()
                })
            }
        })
    },

// getting wishlist products
    getWishlistProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.WISHLIST_COLLECTON).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item'
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
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(products)
        })
    },
 
    // delete wishlist item
    deleteWishlist: (proId, wishId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTON).
                updateOne({ _id: objectId(wishId), 'products.item': objectId(proId) },
                    {
                        $pull: { products: { item: objectId(proId) } }
                    }).then(() => {
                        resolve()
                    })
        })

    },

    //wishlist count
    getWishlistCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try{
            let count = 0;
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTON).findOne({ user: objectId(userId) })
            if (wishlist) {
                count = wishlist.products.length
                resolve(count)
            } else {
                resolve(count)
            }
        }catch(err){
            console.log("error"+err);
            resolve(0)
        }
        })
    }
}