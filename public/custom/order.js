const selectElement = document.querySelector('.cart-product');

// Event listener to detect changes in the selected option
selectElement.addEventListener('change', function() {
    // Get the selected option
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    // Get the selected product id and price
    const selectedProductId = selectedOption.value;
    const selectedProductPrice = selectedOption.getAttribute('data-price');

    const price = document.querySelector('.product-price');
    price.value = selectedProductPrice;

    updateTotal();
});


const quantityField = document.querySelector('.product-qty');
quantityField.addEventListener('change', function() {
    updateTotal();
});

// Function to update the total field
function updateTotal() {
    const price = parseFloat(document.querySelector('.product-price').value);
    const quantity = parseInt(document.querySelector('.product-qty').value);
    const total = price * quantity;

    // Update the total field
    const totalField = document.querySelector('.product-total');
    totalField.value = total.toFixed(2);
}