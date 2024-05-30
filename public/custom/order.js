// Event listener for Add More button
$('#addProduct').on('click', function() {
    // Clone the hidden product row and show it
    const newRow = $('#itemsInOrder tr.product-item:first').clone();
    newRow.css('display', 'table-row'); // show the cloned row
    newRow.find('select').val('');
    newRow.find('.product-price, .product-total').val('');
    newRow.find('.product-qty').val('1');
    newRow.find('.delete-product').show(); // show delete button

    // Append the new row to the table
    $('#itemsInOrder').append(newRow);

    // Update total cost after adding a new row
    updateTotal();
});

// Event listener for product selection change
$(document).on('change', '.cart-product', function() {
    const selectedOption = $(this).find('option:selected');
    const selectedProductPrice = selectedOption.attr('data-price');
    const priceField = $(this).closest('tr').find('.product-price');
    priceField.val(selectedProductPrice);
    updateTotal();
});

// Event listener for quantity change
$(document).on('change', '.product-qty', function() {
    updateTotal();
});

// Event listener for Delete button
$(document).on('click', '.delete-product', function() {
    $(this).closest('tr.product-item').remove();
    updateTotal();
});

// Function to update total
function updateTotal() {
    let totalCost = 0;
    $('#itemsInOrder tr.product-item:visible').each(function() {
        const price = parseFloat($(this).find('.product-price').val());
        const quantity = parseInt($(this).find('.product-qty').val());
        const total = price * quantity;
        $(this).find('.product-total').val(total.toFixed(2));
        totalCost += total;
    });
    $('#totalCost').val(totalCost.toFixed(2));
}

// Initial update of total on page load
$(document).ready(function() {
    // Add the first product row when the page loads
    $('#addProduct').trigger('click');
});
