document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();

            const productId = event.target.closest('.add-to-cart').dataset.productId;
            const userId = document.getElementById('userId').value; // Read the user ID from the hidden element

            try {
                const response = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId, productId })
                });

                const result = await response.json();
                if (response.ok) {
                    alert('Product added to cart successfully');
                } else {
                    alert(`Error: ${result.error}`);
                }
            } catch (error) {
                console.error('Error adding product to cart:', error);
                alert('An error occurred while adding the product to the cart');
            }
        });
    });
});
