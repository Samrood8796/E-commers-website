// signup validation
$(document).ready(function () {
    $('#signup').validate({
        rules: {
            name: {
                required: true,
                minlength: 4
            },
            password: {
                required: true

            },
            email: {
                required: true,
            },
            phone: {
                required: true,
                number: true,
                minlength: 10,
                maxlength:10

            }


        }
    })

})

// login validation
$(document).ready(function () {
    $('#login').validate({
        rules: {
            email: {
                required: true,
            },
            password: {
                required: true
            },
        }
    })

})

//otp login
// add product
$(document).ready(function () {
    $('#mobileOtp').validate({
        rules: {
            phone: {
                required: true,
                number: true,
                minlength: 10,
                maxlength:10

            }
        }
    })

})

//checkout form
$(document).ready(function () {
    $('#checkout-form').validate({
        rules: {
            name: {
                required: true,
                minlength: 4
            },
            password: {
                required: true

            },
            email: {
                required: true,
            },
            mobile: {
                required: true,
                number: true
            },
            address1: {
                required: true,
            },
            district: {
                required: true,
            },
            city: {
                required: true,
            },
            state: {
                required: true,
            },
            pincode: {
                required: true,
            },
            paymentMethod: {
                required: true,
            }


        }
    })

})