var express = require('express');
var router = express.Router();
var producthelpers = require('../helpers/product-helpers')
var userhelpers = require('../helpers/user-helpers')
var wishlisthelpers = require('../helpers/wishlist-helpers')
var carthelpers = require('../helpers/cart-helpers');
const couponHelpers = require('../helpers/coupon-helpers');
const offerHelpers = require('../helpers/offer-helpers');
const bannerHelpers = require('../helpers/banner-helpers');
/* GET home page. */

//twilio id's
const servicesID = process.env.SERVICE_SID
const accountSID = process.env.ACCOUNT_SID
const authToken = process.env.AUTH_TOKEN
const client = require('twilio')(accountSID, authToken)

// middleware
// veryfilogin middleware
const veryfilogin = (req, res, next) => {
  try {
    if (req.session.userLoggedIn) {
      userhelpers.isblocked(req.session.user._id).then((response) => {
        if (response.isblocked) {
          req.session.userLoggedIn = null
          req.session.blockErr = 'You Are Blocked'
          res.redirect('/login')
        } else {
          next()
        }
      })
    } else {
      res.redirect('/login')
    }
  } catch (err) {
    res.redirect('/login')
  }

}

// HOME PAGE
router.get('/', async (req, res, next) => {
  try {
    let cartCount = 0
    let wishCount = 0
    let user;
    let todayDate = new Date().toISOString().slice(0, 10);
    let banners = await bannerHelpers.getAllBanners()
    let startCategoryOffer = await offerHelpers.startCategoryOffer(todayDate)
    let startCouponOffer = await couponHelpers.startCouponOffer(todayDate)
    let products = await producthelpers.getAllProducts()
    products?.forEach((element) => {
      if (element.stock < 10 && element.stock != 0) {
        element.fewStock = true
      } else if (element.stock == 0) {
        element.noStock = true
      }
    })
    if (req.session.userLoggedIn) {
      user = req.session.user
      wishCount = await wishlisthelpers.getWishlistCount(user._id)
      cartCount = await carthelpers.getCartCount(user._id)
    }
    res.render('user/index', { products, user, cartCount, wishCount, banners })
  } catch (error){
    console.log("error ", error)
  }

});

// signup get
router.get('/signup', (req, res) => {
  let signUpErr = req.session.signUpErr
  let referErr = req.session.referalErr
  res.render('user/signup', { signUpErr, validation: true, referErr })
  req.session.referalErr = false
  req.session.signUpErr = false
})

// signup post
router.post('/signup', (req, res) => {
  userhelpers.dosignup(req.body).then((response) => {
    if (response) {
      res.redirect('/login')
    } else {
      req.session.signUpErr = "Email or mobile already exist"
      res.redirect('/signup')
    }
  }).catch(() => {
    req.session.referalErr = "Invalid referal Code"
    res.redirect('/signup')
  })
})

// login get
router.get('/login', (req, res) => {
  if (req.session.userLoggedIn) {
    res.redirect('/')
  } else {
    let passwordErr = req.session.passwordErr;
    let blockErr = req.session.blockErr;
    let noUserErr = req.session.noUserErr;
    res.render('user/login', { passwordErr, blockErr, noUserErr, validation: true })
    req.session.noUserErr = false
    req.session.passwordErr = false
    req.session.blockErr = false
  }
})

// login post
router.post('/login', (req, res) => {
  userhelpers.dologin(req.body).then((response) => {
    if (response.blocked) {
      req.session.blockErr = "user is temporarily blocked"
      res.redirect('/login')
    }
    else if (response.passwordErr) {
      req.session.passwordErr = "incorrect Password"
      res.redirect('/login')
    } else if (response.noUser) {
      req.session.noUserErr = "no user found"
      res.redirect('/login')
    } else {
      req.session.userLoggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }
  })
})

// shop
router.get('/shop', async (req, res) => {
  let cartCount = 0
  var wishCount = 0
  let user = null
  if (req.session.userLoggedIn) {
    user = req.session.user

    wishCount = await wishlisthelpers.getWishlistCount(user._id)
    cartCount = await carthelpers.getCartCount(user._id)
  }
  let products = await producthelpers.getAllProducts()
  products && products.forEach((element) => {
    if (element.stock < 10 && element.stock != 0) {
      element.fewStock = true
    } else if (element.stock == 0) {
      element.noStock = true
    }
  })
  res.render('user/shop', { products, user, cartCount, wishCount })
})

// otp login get
router.get('/otp-login', (req, res) => {
  let noUserErr = req.session.noUserErr
  let blockErr = req.session.blockErr
  res.render('user/otp-login', { noUserErr, blockErr, validation: true })
  req.session.noUserErr = false
  req.session.blockErr = false
})

// otp login post
router.post('/otp-login', (req, res) => {
  userhelpers.checkMobile(req.body).then((response) => {
    try {
      if (response.blocked) {
        req.session.blockErr = "user is temporarily blocked"
        res.redirect('/otp-login')
      } else if (response.noUser) {
        req.session.noUserErr = "no user found please signup"
        res.redirect('/otp-login')
      } else {
        let phone = response.phone
        client.verify
          .services(servicesID)
          .verifications.create({ to: `+91${req.body.phone}`, channel: "sms" })
          .then(() => {
            res.render('user/enter-otp', { phone })
          })
      }
    } catch {
      res.render('/otp-login')
    }
  })
})

// otp code getting
router.get('/enter-otp', (req, res) => {
  let otpErr = req.session.invalidOtpErr
  res.render('user/enter-otp', { otpErr })
  req.session.invalidOtpErr = false
})

// otp verifying post
router.post('/enter-otp', (req, res) => {
  try {
    let otp = req.body.otp
    let phone = req.body.phone
    client.verify
      .services(servicesID)
      .verificationChecks.create({ to: `+91${phone}`, code: otp })
      .then((response) => {
        let valid = response.valid
        if (valid) {
          userhelpers.userOtp(phone).then((response) => {
            req.session.userLoggedIn = true;
            req.session.user = response;
            res.redirect('/')
          })
        } else {
          req.session.invalidOtpErr = "invalid otp"
          res.redirect('/enter-otp')
        }
      });
  } catch {
    res.redirect('/otp-login')
  }
})

// view one product details
router.get('/view-product/:id', async (req, res) => {
  let id = req.params.id
  let cartCount = 0
  var wishCount = 0
  let user = null
  if (req.session.userLoggedIn) {
    user = req.session.user
    wishCount = await wishlisthelpers.getWishlistCount(user._id)
    cartCount = await carthelpers.getCartCount(user._id)
  }
  let productDetails = await producthelpers.getProductDetails(id)
  let allProducts = await producthelpers.getAllProducts()
  allProducts.forEach((element) => {
    if (element.stock < 10 && element.stock != 0) {
      element.fewStock = true
    } else if (element.stock == 0) {
      element.noStock = true
    }
  })

  if (productDetails.stock < 10 && productDetails.stock != 0) {
    productDetails.fewStock = true
  } else if (productDetails.stock == 0) {
    productDetails.noStock = true
  }
  res.render('user/view-product', ({ productDetails, allProducts, user, cartCount, wishCount, zoom: true }))
})

// cart
router.get('/cart', veryfilogin, async (req, res) => {
  let user = req.session.user
  let wishCount = await wishlisthelpers.getWishlistCount(user._id)
  let cartCount = await carthelpers.getCartCount(user._id)
  let cartProduct = await carthelpers.getCartProducts(user._id)
  let totalValue = await carthelpers.getTottalAmount(user._id)
  res.render('user/cart', { cartProduct, totalValue, user, cartCount, wishCount })
})

// add to cart get
router.get('/add-to-cart/:id', async (req, res) => {
  if (req.session.userLoggedIn) {
    let userId = req.session.user._id
    let proId = req.params.id
    let stock = await producthelpers.getStock(proId)
    let proquantity = await carthelpers.findCartQuantity(userId, proId)
    if (proquantity == 3) {
      res.json({ limitStock: true })
    }
    else if (stock <= proquantity) {
      res.json({ noStock: true })
    } else if (stock == 0) {
      res.json({ noStock: true })
    } else {
      carthelpers.addToCart(proId, userId).then(() => {
        carthelpers.getCartSubTotal(userId, proId).then((response) => {
          res.json({ status: true })
        })
      })
    }
  } else {
    res.json({ status: false })
  }
})

// change product quantity 
router.post('/change-product-quantity', veryfilogin, async (req, res) => {
  let userId = req.body.user;
  let proId = req.body.product;
  count = req.body.count
  let proquantity = await carthelpers.findCartQuantity(userId, proId)
  console.log(proquantity);
  if (proquantity == 3 && count == 1) {
    res.json({ limitStock: true })
  } else {
    carthelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await carthelpers.getTottalAmount(userId)
      response.cartSubTotal = await carthelpers.getCartSubTotal(userId, proId)
      res.json(response)
    }).catch(() => {
      res.json({ noStock: true })
    })
  }
})

// delete cart item
router.get('/delete-cart-item/:proId/:cartId', veryfilogin, (req, res) => {
  proId = req.params.proId
  cartId = req.params.cartId
  carthelpers.deleteCartItem(proId, cartId).then((response) => {
    res.json({ status: true })
  })
})

// place order get
router.get('/place-order', veryfilogin, async (req, res) => {
  let user = await userhelpers.getUserData(req.session.user._id)
  let cartProduct = await carthelpers.getCartProducts(user._id)
  let totalValue = await carthelpers.getTottalAmount(req.session.user._id)
  let show_Wallet = false;
  if (user.wallet >= totalValue) {
    show_Wallet = true
  }
  res.render('user/place-order', { totalValue, user, cartProduct, show_Wallet })
})

// place order post
router.post('/place-order', async (req, res) => {
  try {
    if (req.session.couponTotal) {
      var totalAmount = req.session.couponTotal
    } else {
      totalAmount = await carthelpers.getTottalAmount(req.body.user_id)
    }
    let products = await carthelpers.getCartProductList(req.body.user_id)
    userhelpers.placeOrder(req.body, products, totalAmount).then((orderId) => {
      req.session.orderId = orderId
      req.session.couponTotal = null

      if (req.body.paymentMethod == 'COD') {
        res.json({ codSuccess: true })
      }

      else if (req.body.paymentMethod == 'paypal') {
        userhelpers.generatePaypal(orderId, totalAmount).then((link) => {
          res.json({ link, paypal: true })
        })
      }

      else if (req.body.paymentMethod == 'wallet') {
        userhelpers.reduceWallet(req.body.user_id, totalAmount).then(() => {
          res.json({ wallet: true })
        })
      }

      else {
        userhelpers.generateRazorpay(orderId, totalAmount).then((response) => {
          console.log('jjj');
          console.log(response);
          res.json(response)
        }).catch((err) => {
          console.log(err)
        })
      }
    })
  }
  catch (err) {
    console.log(err);
    res.redirect('/place-order')
  }
})

// order success
router.get('/order-placed', veryfilogin, (req, res) => {
  res.render('user/order-placed', { order: true })
})

// view user orders
router.get('/view-orders', veryfilogin, async (req, res) => {
  let user = req.session.user
  let wishCount = await wishlisthelpers.getWishlistCount(user._id)
  let cartCount = await carthelpers.getCartCount(user._id)
  let orderData = await userhelpers.getUserOrders(user._id)
  res.render('user/view-orders', { orderData, user, cartCount, wishCount })
})

// user orders 
router.get('/view-order-products/:id', veryfilogin, async (req, res) => {
  let user = req.session.user
  let products = await userhelpers.getOrderProducts(req.params.id)
  let track = await userhelpers.statusTrack(req.params.id)
  let wishCount = await wishlisthelpers.getWishlistCount(user._id)
  let cartCount = await carthelpers.getCartCount(user._id)
  console.log(products[0].item);
  res.render('user/view-order-products', { user, track, products, cartCount, wishCount })
})

//status tracking
router.get('/view-order-products/:id', async (req, res) => {

  let products = await userhelpers.getOrderProducts(req.params.id)
  let track = await userhelpers.statusTrack(req.params.id)
  let orders = await userhelpers.getOrder(req.params.id)
  console.log('--------------------------------------------');
  console.log(track)
  res.render('user/status-track', { user, products, track, orders })
})

//return product
router.get('/return-order/:id', (req, res) => {
  userhelpers.returnOrder(req.params.id).then(() => {
    res.redirect('/view-orders')
  })
})

// invoice
router.get('/invoice/:id', veryfilogin, async (req, res) => {
  let user = req.session.user
  let invoice = await userhelpers.getUserInvoice(req.params.id)
  console.log(invoice);
  let products = await userhelpers.getOrderProducts(req.params.id)
  console.log(products);
  res.render('user/invoice', { user, invoice, products })
})

// cancel order get
router.get('/cancel-order/:id', veryfilogin, (req, res) => {
  userhelpers.cancelOrder(req.params.id).then(() => {
    res.redirect('/view-orders')
  })
})

// veryfy payment
router.post('/verify-payment', (req, res) => {
  userhelpers.verifyPayment(req.body).then(() => {
    console.log('successss');
    console.log(req.body);
    userhelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment successfull');
      res.json({ status: true })
    })
  }).catch(() => {
    res.json({ status: false })
  })
})

// my profile
router.get('/my-profile', veryfilogin, async (req, res) => {
  let user = await userhelpers.getUserData(req.session.user._id)
  var wishCount = await wishlisthelpers.getWishlistCount(user._id)
  let cartCount = await carthelpers.getCartCount(user._id)
  res.render('user/my-profile', { user, cartCount, wishCount, passwordErr: 'req.session.passwordErr ', validation: true })
  req.session.passwordErr = false
})

// edit profile
router.post('/edit-profile', veryfilogin, (req, res) => {
  userhelpers.updateUserData(req.body).then(() => {
    res.redirect('/my-profile')
  })

})

//add adress for shipping
router.get('/add-shipping-address', veryfilogin, (req, res) => {
  res.render('user/add-shipping-address')
})
//shipping address post

router.post('/add-shipping-address', veryfilogin, (req, res) => {
  userhelpers.addAddres(req.body, req.session.user._id).then(() => {
    res.redirect('/place-order')
  })
})

// add address
router.post('/add-address', veryfilogin, (req, res) => {
  userhelpers.addAddres(req.body, req.session.user._id).then(() => {
    res.redirect('/my-profile')
  })
})

//edit Address
router.post("/edit-address", (req, res) => {
  let userId = req.session.user._id
  userhelpers.editAddress(req.body, userId).then((response) => {
    res.json({ status: true })
  }).catch(() => {
    res.json({ status: false })
  })
})


// delete address
router.get('/delete-address/:addressId', veryfilogin, (req, res) => {
  userhelpers.deleteAddress(req.params.addressId, req.session.user._id).then(() => {
    res.redirect('/my-profile')
  })
})

// change password
router.post('/change-password', veryfilogin, (req, res) => {
  userhelpers.changePassword(req.session.user._id, req.body).then((response) => {
    if (response.status) {
      req.session.passwordErr = "incorrect Password"
      res.redirect('/')
    } else {
      res.redirect('/my-profile')
    }
  })
})

// men 
router.get('/men', async (req, res) => {
  let cartCount = 0
  var wishCount = 0
  let user = null
  if (req.session.userLoggedIn) {
    user = req.session.user
    wishCount = await wishlisthelpers.getWishlistCount(user._id)
    cartCount = await carthelpers.getCartCount(user._id)
  }
  let products = await userhelpers.filterByMen()
  res.render('user/men', { products, user, cartCount, wishCount })
})

// women
router.get('/women', async (req, res) => {
  let cartCount = 0
  var wishCount = 0
  let user = null
  let products = await userhelpers.filterByWomen()
  if (req.session.userLoggedIn) {
    user = req.session.user
    wishCount = await wishlisthelpers.getWishlistCount(user._id)
    cartCount = await carthelpers.getCartCount(user._id)
  }
  res.render('user/women', { products, user, cartCount, wishCount })
})

// add to wishlist
router.get('/add-to-wishlist/:proId', (req, res) => {
  if (req.session.userLoggedIn) {
    let proId = req.params.proId
    let userId = req.session.user._id
    wishlisthelpers.addToWishlist(proId, userId).then(() => {
      res.json({ status: true })
    }).catch(() => {
      res.json({ status: false })
    })
  } else {
    res.json({ login: true })
  }
})

// wishlist get
router.get('/wishlist', veryfilogin, async (req, res) => {
  let userId = req.session.user._id
  let wishCount = await wishlisthelpers.getWishlistCount(userId)
  let wishProduct = await wishlisthelpers.getWishlistProduct(userId)
  let cartCount = await carthelpers.getCartCount(userId)
  res.render('user/wishlist', { wishProduct, wishCount, cartCount })
})

// delete wishlist item
router.get('/delete-wish-item/:proId/:wishId', (req, res) => {
  let proId = req.params.proId
  let wishId = req.params.wishId
  wishlisthelpers.deleteWishlist(proId, wishId).then(() => {
    res.json({ status: true })
  })
})

// coupon apply
router.post('/coupon-apply', async (req, res) => {
  let id = req.session.user._id
  let coupon = req.body.coupon
  let totalAmount = await carthelpers.getTottalAmount(req.session.user._id)
  couponHelpers.validateCoupon(req.body, id, totalAmount).then((response) => {
    req.session.couponTotal = response.total
    if (response.success) {
      console.log('success');
      res.json({ couponSuccess: true, total: response.total, discountValue: response.discountValue, coupon })

    } else if (response.couponUsed) {
      res.json({ couponUsed: true })
    }
    else if (response.couponExpired) {
      console.log('expired');
      res.json({ couponExpired: true })
    }
    else {
      res.json({ invalidCoupon: true })
    }
  })
})

// logout
router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false
  res.redirect('/')
})

// router.get('/searching/:val',(req,res)=>{
//   console.log(req.params.val);
//   producthelpers.searchProducts(req.params.val).then((response)=>{
//     res.json({response})
//   })
// })
router.get('/filter-product', async(req, res) => {
  console.log("filter function called")
  console.log(req.query)
  const { range, status } = req.query
  console.log(status);
  let startRange=0; 
  let lastRange = 0;
  if (status !== 'true')return;
  console.log('ddddddd');
  if (range === "price-1") {  startRange = 1000;  lastRange = 2000 }
  if (range === "price-2") {  startRange = 100;  lastRange = 200 } 
  if (range === "price-3") {  startRange = 200;  lastRange = 300 }
 const data = await producthelpers.filterPrice(startRange, lastRange)  
 if(data){
   console.log(data);
  res.status(200).json(data)
 }
}) 

router.get('/search',async(req,res) => {
  const searchKey = req.query.searchKey
  const response =await producthelpers.getProductsBySearch(searchKey)
  res.json(response)
})

module.exports = router; 



