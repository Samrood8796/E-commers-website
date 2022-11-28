var express = require('express');
var router = express.Router();
const producthelpers = require('../helpers/product-helpers')
const adminhelpers = require('../helpers/admin-helpers');
const userHelpers = require('../helpers/user-helpers');
const couponhelpers = require('../helpers/coupon-helpers')
const offerhelpers = require('../helpers/offer-helpers')
const bannerHelper = require('../helpers/banner-helpers')
// const path = require('path')
const fs =require('fs')
// setting layout for admin side seperate...
const setAdminLayout = (req, res, next) => {
  res.locals.layout = 'admin-layout'
  next()
}
// using admin layout...
router.use(setAdminLayout)

// middleware
// veryfy login Middleware
const verifyAdminLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}

// admin login get
router.get('/login', (req, res) => {
  let loginErr = req.session.loginErr
  res.render('admin/login', { loginErr })
  req.session.loginErr = false
})

// admin login post
router.post('/login', (req, res) => {
  adminhelpers.adminLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin')
    } else {
      req.session.loginErr = "invalid email or password"
      res.redirect('/admin/login')
    }
  })
})

// dashboard management
router.get('/', verifyAdminLogin, async (req, res) => {
  let admin = req.session.admin
  let userCount = await adminhelpers.getUsersCount()
  let orderCount = await adminhelpers.totalOrders()
  let productCount = await adminhelpers.totalProducts()
  let cancelCount = await adminhelpers.cancelTotal()
  let dailyRevenue = await adminhelpers.dailyRevenue()
  let weeklyRevenue = await adminhelpers.weeklyRevenue()
  let yearlyRevenue = await adminhelpers.yearlyRevenue()
  let totalRevenue = await adminhelpers.totalRevenue()
  let monthlyRevenue = await adminhelpers.monthlyRevenue()
  res.render('admin/dashboard', {
    userCount,
    orderCount,
    totalRevenue,
    yearlyRevenue,
    weeklyRevenue,
    monthlyRevenue,
    dailyRevenue,
    cancelCount,
    productCount,
    admin
  })
})

// product management
router.get('/product-management', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin
    producthelpers.getAllProducts().then((products) => {
      res.render('admin/product-management', { products, admin })
    })

})

//view product details
router.get('/view-product-details/:id',verifyAdminLogin,(req,res)=>{
  let admin = req.session.admin
  producthelpers.getProductDetails(req.params.id).then((product) => {
    res.render('admin/view-product-details', { product, admin })
  })
})

// add product get
router.get('/add-product', verifyAdminLogin, (req, res, next) => {
  let admin = req.session.admin
  producthelpers.getAllCategory().then((response) => {
    let category = response
    let productExistErr = req.session.productExistErr
    res.render('admin/add-product', { category, productExistErr, admin, validation: true })
    req.session.productExistErr = false
  })
})

// add product post
router.post('/add-product', verifyAdminLogin, (req, res) => {
  producthelpers.addProduct(req.body).then((response) => {
    let image = req.files.image
    let image1 = req.files.image1
    let image2 = req.files.image2
    let image3 = req.files.image3
    if (response.status) {
      req.session.productExistErr = "this product is exist"
      res.redirect('/admin/add-product')
    } else {
      id = response
      image.mv('./public/product-images/' + id + '.jpg')
      image1.mv('./public/product-images/' + id + '1.jpg')
      image2.mv('./public/product-images/' + id + '2.jpg')
      image3.mv('./public/product-images/' + id + '3.jpg')
      res.redirect('/admin/product-management')
    }
  })
})

// edit product get
router.get('/edit-product/:id', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin
  producthelpers.getProductDetails(req.params.id).then((product) => {
    producthelpers.getAllCategory().then((category) => {
      res.render('admin/edit-product', { product, category, admin })
    })
  })
})

// edit product post
router.post('/edit-product/:id', verifyAdminLogin, (req, res) => {
  id = req.params.id
  producthelpers.updateProduct(req.params.id, req.body).then(() => {
    try{
    if (req.files.image) {
      let image = req.files.image
      image.mv('./public/product-images/' + id + '.jpg')
    }
    if (req.files.image1) {
      let image1 = req.files.image1
      image1.mv('./public/product-images/' + id + '1.jpg')
    }
    if (req.files.image2) {
      let image2 = req.files.image2
      image2.mv('./public/product-images/' + id + '2.jpg')
    }
    if (req.files.image3) {
      let image3 = req.files.image3
      image3.mv('./public/product-images/' + id + '3.jpg')
    }
    res.redirect('/admin/product-management')

  }catch{
    res.redirect('/admin/product-management')
  }
  })
})

// delete product
router.get('/delete-product/:id', verifyAdminLogin, (req, res) => {
  let id = req.params.id
  producthelpers.deleteProduct(id).then((response) => {
    res.redirect('/admin/product-management')
    fs.unlinkSync('public/product-images/' + id +'.jpg')
    fs.unlinkSync('public/product-images/' + id +'1.jpg')
    fs.unlinkSync('public/product-images/' + id +'2.jpg')
    fs.unlinkSync('public/product-images/' + id +'3.jpg')   
  })
})

// user management
router.get('/user-management', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin
  adminhelpers.getAllUsers().then((users) => {
    res.render('admin/user-management', { users, admin })
  })
})

// Category management
router.get('/category', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin
  producthelpers.getAllCategory().then((category) => {
    res.render('admin/category-management', { category, admin })
  })
})

// add category
router.get('/add-category', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin
  res.render('admin/add-category', { "catAddErr": req.session.catAddErr, admin })
  req.session.catAddErr = false
})

// add category post
router.post('/add-category', verifyAdminLogin, (req, res) => {
  producthelpers.addCategory(req.body).then((response) => {
    if (response.status) {
      res.redirect('/admin/category')
    } else {
      req.session.catAddErr = "Category Already Exist"
      res.redirect('/admin/add-category')
    }
  })
})

// edit category
router.get('/edit-category/:id', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin
  producthelpers.getCategory(req.params.id).then((cate) => {
    res.render('admin/edit-category', { cate, "catEditErr": req.session.catEditErr, admin })
    req.session.catEditErr = false
  })
})

// edit category post
router.post('/edit-category/:id', verifyAdminLogin, (req, res) => {
  let id = req.params.id
  producthelpers.updateCategory(req.body, id).then((response) => {
    if (response.status) {
      res.redirect('/admin/category/')
    } else {
      req.session.catEditErr = "this item Already Exist"
      res.redirect('/admin/edit-category/' + id)
    }
  })
})

// delete category
router.get('/delete-category/:id', verifyAdminLogin, (req, res) => {
  producthelpers.deleteCategory(req.params.id).then(() => {
    res.redirect('/admin/category')
  })
})

// block user
router.get('/block-user/:id', verifyAdminLogin, (req, res) => {
  adminhelpers.blockUser(req.params.id).then((response) => {
    res.redirect('/admin/user-management')
  })
})

// unblock user
router.get('/unblock-user/:id', verifyAdminLogin, (req, res) => {
  adminhelpers.unblockUser(req.params.id).then((response) => {
    res.redirect('/admin/user-management')
  })
})

// order management
router.get('/order-management', verifyAdminLogin, async (req, res) => {
  let admin = req.session.admin
  let allOrders = await adminhelpers.getAllOrders()
  res.render('admin/order-management', { allOrders, admin })
})

//view ordered product details
router.get('/view-order-products/:id', async (req, res) => {
  let admin = req.session.admin
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-order-products', { products, admin })
})

// order status
router.post('/change-order-status', verifyAdminLogin, (req, res) => {
  adminhelpers.changeOrdeStatus(req.body).then(() => {
    res.redirect('/admin/order-management')
  })
})

// sales report
router.get('/sales-report', verifyAdminLogin, async (req, res) => {
  let admin = req.session.admin
  let allOrders = await adminhelpers.getAllOrders()
  res.render('admin/sales-report', { allOrders, admin })
})

// coupon management
router.get('/coupon-management', verifyAdminLogin, async (req, res) => {
  let admin = req.session.admin
  let coupons = await couponhelpers.getAllCoupons()
  res.render('admin/coupon-management', { coupons, 'coupExistErr': req.session.couponExist, admin })
  req.session.couponExist = false
})

// add coupon get
router.get('/add-coupon', verifyAdminLogin,async (req, res) => {
  let admin = req.session.admin
  res.render('admin/add-coupon', { admin})
})

// add coupon post
router.post('/add-coupon', verifyAdminLogin, (req, res) => {
  couponhelpers.addCoupon(req.body).then(() => {
    res.redirect('/admin/coupon-management')
  }).catch(() => {
    req.session.couponExist = "Coupon Already Exist!!!"
    res.redirect('/admin/coupon-management')
  })
})

// edit coupon get
router.get('/edit-coupon/:id', verifyAdminLogin, async (req, res) => {
  let admin = req.session.admin
  let coupon = await couponhelpers.getCoupon(req.params.id)
  res.render('admin/edit-coupon', { coupon, admin })
})

// edit coupon post
router.post('/edit-coupon', verifyAdminLogin, (req, res) => {
  couponhelpers.editCoupon(req.body).then(() => {
    res.redirect('/admin/coupon-management')
  })
})

// delete coupon 
router.get('/delete-coupon/:id', verifyAdminLogin, (req, res) => {
  couponhelpers.deleteCoupon(req.params.id).then(() => {
    res.redirect('/admin/coupon-management')
  })
})

// offer management start
// add category offer get
router.get('/category-offer', verifyAdminLogin, async (req, res) => {
  let admin = req.session.admin
  let category = await producthelpers.getAllCategory()
  let allCatOffer = await offerhelpers.getAllCatOffers()
  res.render('admin/category-offer', { category, allCatOffer, 'offerExist': req.session.offerExist, admin })
  req.session.offerExist = false
})

// add category offer post
router.post('/category-offer', verifyAdminLogin, (req, res) => {
  offerhelpers.addCategoryOffer(req.body).then(() => {
    res.redirect('/admin/category-offer')
  }).catch(() => {
    req.session.offerExist = "offer for this category is already added"
    res.redirect('/admin/category-offer')
  })
})

// edit category offer get
router.get('/edit-catOffer/:id', verifyAdminLogin, async (req, res) => {
  let id = req.params.id
  let admin = req.session.admin
  let category = await producthelpers.getAllCategory()
  let catOffer = await offerhelpers.getCatOfferDetails(id)
  res.render('admin/edit-catOffer', { catOffer, category, admin });
});

// edit category offer post
router.post('/edit-catOffer/:id', verifyAdminLogin, async (req, res) => {
  let id = req.params.id
  offerhelpers.updateCatOffer(id, req.body).then(() => {
    res.redirect('/admin/category-offer')
  })
})

// delete category offer
router.get('/delete-catOffer/:id', verifyAdminLogin, (req, res) => {
  let id = req.params.id
  offerhelpers.deleteCatOffer(id).then(() => {
    res.redirect('/admin/category-offer')
  })
})



// chart data
router.get('/chart-data', verifyAdminLogin, (req, res) => {
  adminhelpers.getchartData().then((obj) => {
    let result = obj.result
    let weeklyReport = obj.weeklyReport
    console.log(result, "resultttttttt");
    console.log(weeklyReport, "weeekkkklyyyy");
    res.json({ data: result, weeklyReport })
  })
})

// banner management
router.get('/banner-management', verifyAdminLogin, (req, res, next) => {
  let admin = req.session.admin
  bannerHelper.getAllBanners().then((allbanners) => {
      res.render('admin/banner-management', { allbanners,admin })
  })
})

// add banner
router.get('/add-banner', verifyAdminLogin, (req, res, next) => {
  let admin = req.session.admin
  res.render('admin/add-banner', { admin })
})
router.post('/add-banner', verifyAdminLogin, (req, res) => {
  console.log(req.body);
  bannerHelper.addBanner(req.body).then((response) => {
      let id = response.insertedId
      let image = req.files.image
      image.mv('./public/banner-images/' + id +'.jpg')
      res.redirect('/admin/banner-management')
  }).catch(() => {
      req.session.bannerRepeatError = "Banner already added!!"  
      res.redirect('/admin/add-banner')
  })
})

// edit banner
router.get('/edit-banner/:id', verifyAdminLogin, (req, res) => {
  let admin = req.session.admin
  let id = req.params.id
  bannerHelper.getBannerDetails(id).then((bannerDetails) => {
      console.log(bannerDetails);
      res.render('admin/edit-banner', {bannerDetails, admin })
  })
})

//edit banner post
router.post('/edit-banner', (req, res) => {
  let id = req.body._id
  bannerHelper.editBanner(req.body).then(() => {
      if (req.files.image) {
          let image = req.files.image
          image.mv('./public/banner-images/' + id +'.jpg')
      }
      res.redirect('/admin/banner-management')
  })
})

// delete banner
router.get('/delete-banner/:id', verifyAdminLogin, (req, res) => {
  let id = req.params.id
  bannerHelper.deleteBanner(id).then(() => {
      res.redirect('/admin/banner-management')
      fs.unlinkSync('public/banner-images/' + id +'.jpg')
  })
});

// admin logout
router.get('/logout', (req, res) => {
  req.session.admin = null
  res.redirect('/admin/login')
})
  
module.exports = router;