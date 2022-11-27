var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectId
var moment = require('moment')

module.exports = {
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },

    adminLogin: (adminData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            try{
            await db.get().collection('admin').findOne({ email: adminData.email }).then((result) => {
                adminData.password = parseInt(adminData.password)
                if (result) {
                    if (result.password == adminData.password) {
                        response.status = true;
                        response.admin = result;
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                } else {
                    resolve({ status: false })
                }
            })
        }catch{
            resolve(0)
        }
        })
    },

    blockUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: {
                    isblocked: true
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    unblockUser: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                $set: {
                    isblocked: false
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            let allOrders = await db.get().collection(collection.ORDER_COLLECTION).find().sort({
                date: -1
            }).toArray()
            for (i = 0; i < allOrders.length; i++) {
                allOrders[i].date = moment(allOrders[i].date).format('lll');
            }
            resolve(allOrders)
        })
    },

    changeOrdeStatus: (data) => {
        return new Promise((resolve, reject) => {
            try{
            if (data.status == 'Shipped') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(data.OrderId) },
                    {
                        $set: {
                            status: data.status,
                            is_shipped: true
                        }
                    }).then((response) => {
                        resolve()
                    })
            } else if (data.status == 'Delivered') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(data.OrderId) },
                    {
                        $set: {
                            status: data.status,
                            is_delivered: true,  
                            deliverdDate: new Date()
                        }
                    }).then((response) => {

                        resolve()
                    })
            } else if (data.status == 'Cancelled') {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(data.OrderId) },
                    {
                        $set: {
                            status: data.status,
                            is_Cancelled: true
                        }
                    }).then((response) => {

                        resolve()
                    })
            }
            else {
                db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(data.OrderId) },
                    {
                        $set: {
                            status: data.status
                        }
                    }).then((response) => {

                        resolve()
                    })
            }
        }catch{
            resolve(0)
        }
        })
    },

    getUsersCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            if (users) {
                count = users.length
                resolve(count)
            } else {
                resolve(count)
            }

        })
    },

    totalOrders: () => {
        return new Promise(async (resolve, reject) => {
            let totalOrders = await db.get().collection(collection.ORDER_COLLECTION).count()
            resolve(totalOrders)
        })
    },

    totalProducts: () => {
        return new Promise(async (resolve, reject) => {
            let totalProducts = await db.get().collection(collection.PRODUCT_COLLECTION).count()
            resolve(totalProducts)
        })
    },

    cancelTotal: () => {
        return new Promise(async (resolve, reject) => {
            let orderCancelled = await db.get().collection(collection.ORDER_COLLECTION).find({ is_Cancelled: true }).count()
            resolve(orderCancelled)
        })
    },

    dailyRevenue: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let dailyRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            date: {
                                $gte: new Date(new Date() - 1000 * 60 * 60 * 24)
                            }
                        }
                    },
                    {
                        $match: {
                            status: "Delivered"
                        }

                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    }

                ]).toArray()
                console.log(dailyRevenue);
                resolve(dailyRevenue[0].totalAmount)
            } catch {
                resolve(0)
            }
        })
    },

    weeklyRevenue: () => {
        return new Promise(async (resolve, reject) => {
            // console.log(new Date(new Date()-1000*60*60*24*2));
            try {
                let weeklyRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            date: {
                                $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7)
                            }
                        }
                    },
                    {
                        $match: {
                            status: "Delivered"
                        }

                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    }
                ]).toArray()
                // console.log("weekly"+weeklyRevenue[0].totalAmount);
                resolve(weeklyRevenue[0].totalAmount)
            } catch {
                resolve(0)
            }

        })
    },

    monthlyRevenue: () => {
        return new Promise(async (resolve, reject) => {
            // console.log(new Date(new Date()-1000*60*60*24*2));
            try {
                let monthlyRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match: {
                            date: {
                                $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7 *12)
                            }
                        }
                    },
                    {
                        $match: {
                            status: "Delivered"
                        }

                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    }
                ]).toArray()
                // console.log("weekly"+weeklyRevenue[0].totalAmount);
                resolve(monthlyRevenue[0].totalAmount)
            } catch {
                resolve(0)
            }

        })
    },

    yearlyRevenue: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let yearlyRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {

                        $match: {
                            date: {
                                $gte: new Date(new Date() - 1000 * 60 * 60 * 24 * 7 * 4 * 12)
                            }
                        }
                    },
                    {
                        $match: {
                            status: "Delivered"
                        }

                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    }

                ]).toArray()

                resolve(yearlyRevenue[0].totalAmount)
            } catch {
                resolve(0)
            }
        })
    },

    totalRevenue: () => {
        return new Promise(async (resolve, reject) => {
            try{
            let totalRevenue = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Delivered"
                    }

                },
                {
                    $project: {
                        totalAmount: "$totalAmount"
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$totalAmount' }
                    }
                }
            ]).toArray()
             console.log(totalRevenue[0]);
            resolve(totalRevenue[0].totalAmount)
        }catch{
            resolve(0)
        }
        })
    },


    getchartData: (req, res) => {
        return new Promise((resolve, reject) => {
            try{
            db.get().collection(collection.ORDER_COLLECTION).aggregate([
                { $match: { "status": "Delivered" } },
                {
                    $project: {
                        date: { $convert: { input: "$_id", to: "date" } }, total: "$totalAmount"
                    }
                },
                {
                    $match: {
                        date: {
                            $lt: new Date(), $gt: new Date(new Date().getTime() - (24 * 60 * 60 * 1000 * 365))
                        }
                    }
                },
                {
                    $group: {
                        _id: { $month: "$date" },
                        total: { $sum: "$total" }
                    }
                },
                {
                    $project: {
                        month: "$_id",
                        total: "$total",
                        _id: 0
                    }
                }
            ]).toArray().then(result => {
                db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    { $match: { "status": "Delivered" } },
                    {
                        $project: {
                            date: { $convert: { input: "$_id", to: "date" } }, total: "$totalAmount"
                        }
                    },
                    {
                        $match: {
                            date: {
                                $lt: new Date(), $gt: new Date(new Date().getTime() - (24 * 60 * 60 * 1000 * 7))
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { $dayOfWeek: "$date" },
                            total: { $sum: "$total" }
                        }
                    },
                    {
                        $project: {
                            date: "$_id",
                            total: "$total",
                            _id: 0
                        }
                    },
                    {
                        $sort: { date: 1 }
                    }
                ]).toArray().then(weeklyReport => {
                    console.log("weekly", weeklyReport)
                    console.log("result", result);
                    let obj = {
                        result, weeklyReport
                    }
                    // resolve(result,weeklyReport)
                    resolve(obj)
                    // res.json({ data: result, weeklyReport})
                    // console.log(result)
                })
            })
        }catch{
            resolve(0)
        }
        })
    },
}