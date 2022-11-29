
function addToCart(proId) {
    console.log('add to cart function called')
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'get',
        success: (response) => {
            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
                swal.fire({
                    icon: "success",
                    title: "Item Added To Cart",
                    showConfirmButton: false,
                    timer: 1000
                })
            }else if(response.noStock){
                
                swal.fire({
                    icon:'error',
                    text:'Sold out'
                })
            }
            else if(response.limitStock){
                
                swal.fire({
                    icon:'error',
                    text:'limit is reached'
                })
            }
            else{
                location.href='/login'
            }
        }
    })
}


function addTowishlist(proId) {
    console.log('wishlist function called')   
    $.ajax({
        url: '/add-to-wishlist/' + proId,
        method: 'get',
        success: (response) => {
            if(response.status){
                let count = $('#wish-count').html()
                count = parseInt(count) + 1
                $('#wish-count').html(count)
                document.getElementById(proId).style.backgroundColor='#FFD333'
                swal.fire({
                    icon: "success",
                    title: "Item Added To wishlist",
                    showConfirmButton: false,
                    timer: 1000
                })

            }else{
                let count = $('#wish-count').html()
                count = parseInt(count) - 1
                $('#wish-count').html(count)
                document.getElementById(proId).style.backgroundColor=''
                swal.fire({
                    icon: "success",
                    title: "Item Removed from wishlist",
                    showConfirmButton: false,
                    timer: 1000
                })
            }
        }
    })
}


