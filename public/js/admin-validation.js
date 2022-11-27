const Bulkexports = require("twilio/lib/rest/Bulkexports")

// add product
$(document).ready(function () {
    $('#add-prod').validate({
        rules: {
            name: {
                required: true,
                minlength: 4,
            },
            category: {
                required: true

            },
            price: {
                required: true,
                number: true
            },
            stock: {
                required: true,
                number: true

            },
            description: {
                required: true
            },
            image1: {
                required: true
            },
            image2: {
                required: true
            },
            image3: {
                required: true
            },
            image: {
                required: true
            }

        }
    })

})
//add category

$(document).ready(function () {
    $('#add-category').validate({
        rules: {
            category: {
                required: true,
                minlength:3
            }
        }
    })
})

//add Coupon
$(document).ready(function () {
    $('#addCoupon').validate({
        rules: {
            coupon: {
                required: true,
                minlength:5
            },
            starting:{
                required: true,
            },
            endDate:{
                required: true,
            },
            offer:{
                required: true,
                type:number,
                minlength:2,
                maxlength:2
            }
        }
    })

})