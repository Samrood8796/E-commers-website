
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
            } else if (response.noStock) {

                swal.fire({
                    icon: 'error',
                    text: 'Sold out'
                })
            }
            else if (response.limitStock) {

                swal.fire({
                    icon: 'error',
                    text: 'limit is reached'
                })
            }
            else {
                location.href = '/login'
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
            if (response.status) {
                let count = $('#wish-count').html()
                count = parseInt(count) + 1
                $('#wish-count').html(count)
                document.getElementById(proId).style.backgroundColor = '#FFD333'
                swal.fire({
                    icon: "success",
                    title: "Item Added To wishlist",
                    showConfirmButton: false,
                    timer: 1000
                })

            } else if (response.login) {
                location.href = "/login"
            }
            else {
                let count = $('#wish-count').html()
                count = parseInt(count) - 1
                $('#wish-count').html(count)
                document.getElementById(proId).style.backgroundColor = ''
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


function handlefilter(range) {
    console.log('flter function called')
    const checked = document.getElementById(range).checked
    $.ajax({
        url: `/filter-product?range=${range}&status=${checked}`,
        method: 'get',
        success: (response) => {
            console.log(response);
            if (response.status) {
                swal.fire({
                    icon: "success",
                    title: "Item filtered",
                    showConfirmButton: false,
                    timer: 1000
                })
            } else if (response.login) {
                location.href = "/login"
            }
            else {
                let count = $('#wish-count').html()
                count = parseInt(count) - 1
                $('#wish-count').html(count)
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


function search() {
    let strings = document.getElementById('searchBox').value
    console.log(strings);
    $.ajax({
        url: "/search",
        data: {
            searchKey: strings
        },
        method: 'get',
        success: (response) => {
            if (response.length != 0) {
                document.getElementById("drop").innerHTML = ''
                for (i = 0; i < response.length; i++) {
                    const div1 = document.getElementById("drop");
                    const aTag = document.createElement('a');
                    aTag.setAttribute('href', "/view-product/" + response[i]._id);
                    aTag.innerText = response[i].name;
                    aTag.style.color = 'black';
                    aTag.style.margin = '10px';
                    div1.appendChild(aTag);
                    const bTag = document.createElement('br');
                    div1.appendChild(bTag);
                }
 
            } else {
                document.getElementById("drop").innerHTML = ''


            }
        }
    })

}