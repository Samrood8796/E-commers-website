var db = require('../config/connection')
var collection = require('../config/collections')
var bcrypt = require('bcrypt')
const ObjectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const paypal = require('paypal-rest-sdk')
const moment = require('moment')
let referralCodeGenerator = require('referral-code-generator')

//Razorpay
var instance = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
});

paypal.configure({
    'mode': 'sandbox',
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET
});

module.exports = {
    // signup
    dosignup: (userData) => {     
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let user1 = await db.get().collection(collection.USER_COLLECTION).findOne({ phone: userData.phone })
            if (user || user1) {
                resolve(response.status = false)
            }
            else if (userData.referalCode) {
                let referUser = await db.get().collection(collection.USER_COLLECTION).findOne({ referalCode: userData.referalCode })
                console.log('ffffffffffffffffffffffffff');
                console.log(referUser);
                if (referUser) {
                    userData.password = await bcrypt.hash(userData.password, 10)
                    let referalCode = userData.name.slice(0, 3) + referralCodeGenerator.alpha('lowercase', 6)
                    userData.referalCode = referalCode
                    userData.wallet = parseInt(50)
                    db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(() => {
                        let walletAmount = parseInt(referUser.wallet)
                        console.log('haaai');
                        console.log(referUser.wallet);
                        if (referUser.wallet) {
                            console.log('hhhai');

                            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(referUser._id) },
                                {
                                    $set: {
                                        wallet: parseInt(100) + walletAmount
                                    }
                                }).then(() => {
                                    console.log('hai');
                                    resolve({ status: true })
                                })
                        } else {
                            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(referUser._id) },
                                {
                                    $set: {
                                        wallet: parseInt(100)
                                    }
                                }).then(() => {
                                    console.log('haiii');
                                    resolve({ status: true })
                                })
                        }
                    })
                } else {
                    reject()
                }

            }
            else {
                userData.password = await bcrypt.hash(userData.password, 10)
                userData.wallet = parseInt(0)
                let referalCode = userData.name.slice(0, 3) + referralCodeGenerator.alpha('lowercase', 6)
                userData.referalCode = referalCode
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((response) => {
                    resolve(response)
                })
            }
        })

    },

    // login
    dologin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (user) {
                if (user.isblocked) {
                    resolve({ blocked: true })
                } else {
                    bcrypt.compare(userData.password, user.password).then((status) => {

                        if (status) {
                            console.log("login success");
                            response.user = user;
                            response.status = true
                            resolve(response)
                        } else {
                            console.log('login failed');
                            resolve({ passwordErr: true })
                        }

                    })
                }

            } else {
                console.log('login failedd');
                resolve({ noUser: true })
            }
        })
    },

    // mobile login
    checkMobile: (mobile) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).findOne({ phone: mobile.phone }).then((response) => {
                if (response) {
                    if (response.isblocked) {

                        resolve({ blocked: true })

                    } else {
                        resolve(response)
                    }

                } else {
                    resolve({ noUser: true })
                }
            })
        })
    },

    // getting user data using phone number
    userOtp: (phone) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).findOne({ phone: phone }).then((response) => {
                resolve(response)
            })
        })
    },

    // place order 
    placeOrder: (order, products, totalAmount) => {
        return new Promise((resolve, reject) => {
            try {
                if (order.coupon) {
                    db.get().collection(collection.COUPON_COLLECTION).updateOne({ coupon: order.coupon },
                        {
                            $push: {
                                users: order.user_id
                            }
                        })
                }
                let status = order.paymentMethod === 'COD' || order.paymentMethod === 'wallet' || order.paymentMethod === 'paypal' ? 'Placed' : 'Pending'
                let orderObj = {
                    deliverydetails: {
                        firstName: order.firstName,
                        mobile: order.mobile,
                        address1: order.address1,
                        district: order.district,
                        town: order.town,
                        state: order.state,
                        pincode: order.pincode,
                    },
                    userId: ObjectId(order.user_id),
                    paymentMethod: order.paymentMethod,
                    products: products,
                    totalAmount: totalAmount,
                    status: status,
                    coupon: order.coupon,
                    date: new Date()
                }

                db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                    products.forEach(async (element) => {
                        let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: element.item });
                        let pquantity = Number(product.stock);
                        pquantity = pquantity - element.quantity;
                        await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                            { _id: element.item },
                            {
                                $set: {
                                    stock: pquantity,
                                },
                            }
                        );
                    });

                    db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.user_id) })
                    resolve(response.insertedId)
                })
            } catch {
                resolve(0)
            }
        })
    },

    // orders
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).sort({ date: -1 }).toArray()
            if (orders) {
                for (i = 0; i < orders.length; i++) {
                    orders[i].date = moment(orders[i].date).format('lll');
                }
                resolve(orders)
            } else {
                resolve(0)
            }
        })
    },
    
    // ordered product details
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }

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
                }
            ]).toArray()
            resolve(orderItems)
        })
    },

    // invoice
    getUserInvoice: (orderId) => {
        return new Promise(async (resolve, reject) => {
            console.log(orderId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ _id: ObjectId(orderId) }, { sort: { date: -1 } }).toArray()
            var i;
            for (i = 0; i < orders.length; i++) {
                orders[i].date = moment(orders[i].date).format('lll');
            }
            var k;
            for (k = 0; k < orders.length; k++) {
                orders[k].deliverdDate = moment(orders[k].deliverdDate).format('lll');
            }
            resolve(orders)
        })
    },

    // cancel order
    cancelOrder: (id) => {
        return new Promise(async(resolve, reject) => {
            let order =await db.get().collection(collection.ORDER_COLLECTION).findOne({_id: ObjectId(id)})
            if(order.paymentMethod === "wallet" || order.paymentMethod === "Razorpay" || order.paymentMethod ==="paypal"){
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(order.userId)},
                {
                    $inc:{
                        wallet :order.totalAmount
                    }
                })
            }
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(id) },
                {
                    $set: {
                        is_Cancelled: true,
                        status: 'cancelled'
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    //checking user is blocked or unblocked
    isblocked: (id) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(id) })
            resolve(user)
        })
    },

    //razorpay
    generateRazorpay: (orderId, totalAmount) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: "" + orderId,
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    reject(err)
                } else {
                    console.log(order)
                    resolve(order)
                }
            })
        })
    },


    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', process.env.key_secret)
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            console.log(hmac);
            console.log(details['payment[razorpay_signature]']);
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },




    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            console.log('rrr');
            console.log(orderId);
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then(() => {
                    console.log('gggg');
                    resolve()
                })
        })
    },

    generatePaypal: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/order-placed",
                    "cancel_url": "http://localhost:3000/place-order"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "item",
                            "sku": "item",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "This is the payment description."
                }]
            };
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                    console.log("Create Payment Response");
                    console.log(payment.links[1].href);
                    resolve(payment.links[1].href)
                }
            });
        })
    },

    reduceWallet: (userId, totalAmount) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            let newWallet = parseInt(user.wallet - totalAmount)
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) },
                {
                    $set: {
                        wallet: newWallet
                    }
                })
            resolve()
        })
    },

    getUserData: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(id) }).then((response) => {
                resolve(response)
            })
        })
    },

    updateUserData: (userData) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userData._id) },
                {
                    $set: {
                        name: userData.name,
                        email: userData.email,
                        phone: userData.mobile
                    }
                }).then((response) => {
                    console.log(response);
                    resolve()
                })
        })
    },

    addAddres: (addressData, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) },
                {
                    $addToSet: {
                        address: addressData
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    deleteAddress: (addressId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId), 'address.id': addressId },
                {
                    $pull: {
                        address: { id: addressId }
                    }
                }).then(() => {
                    resolve()
                })
        })
    },

    //edit address
    editAddress: (data, userId) => {
        if (data.id != '' && data.name != '' && data.address != '' && data.town != '' && data.district != '' && data.state != '' && data.pincode != '' && data.phone != '') {
            let uniqueid = data.id
            return new Promise(async (resolve, reject) => {
                let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
                console.log(user);
                //  let index= user.address.findIndex(address=>address.uniqueid==uniqueid)
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId), 'address.id': uniqueid }, {
                    $set: {
                        'address.$': data
                    }
                }).then(() => {
                    resolve()
                })
            })
        } else {
            reject()
        }
    },

    changePassword: (userId, data) => {
        return new Promise(async (resolve, reject) => {
            data.newpassword = await bcrypt.hash(data.newpassword, 10)
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) })
            if (user) {
                bcrypt.compare(data.password, user.password).then((response) => {
                    if (response) {

                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) },
                            {
                                $set: {
                                    password: data.newpassword
                                }
                            }).then(() => {
                                resolve({ status: false })
                            })
                    } else {
                        resolve({ status: true })
                    }
                })
            } else {
                resolve({ status: true })
            }
        })
    },

    //return order
    returnOrder: (id) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(id) })
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(order.userId) },
                {
                    $inc: {
                        wallet: order.totalAmount
                    }
                }).then(() => {
                    db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(id) },
                        {
                            $set: {
                                is_returned: true,
                                status: 'returned',
                                returnedDate : new Date()
                            }
                        })
                })
            resolve()
        })
    },

    statusTrack: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let track = await db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: ObjectId(orderId) })
            track.date = moment(track.date).format('lll');
            track.shippedDate = moment(track.shippedDate).format('lll');
            track.cancellDate = moment(track.cancellDate).format('lll');
            track.OutForDeliveryDate = moment(track.OutForDeliveryDate).format('lll');
            track.deliverdDate = moment(track.deliverdDate).format('lll');
            resolve(track)
        })
    },

    filterByMen: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: 'MEN' }).toArray()
            resolve(product)
        })
    },

    filterByWomen: () => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: 'WOMEN' }).toArray()
            resolve(product)
        })
    }
}