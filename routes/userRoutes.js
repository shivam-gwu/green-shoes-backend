const express = require('express')
const pool = require('../connection/postgreSQLConnect')
const router = express.Router()
require('dotenv').config()

router.post('/addToCart', async (req, res) => {
    const { user_id, productId, size, quantity = 1 } = req.body;
    try {
      // Check if the product exists, if the user exists, etc.
      const userExists = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const existingCartItem = await pool.query(
        'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2 AND size = $3',
        [user_id, productId, size]
      );
  
      if (existingCartItem.rows.length > 0) {
        // Update the existing cart item
        await pool.query(
          'UPDATE cart SET quantity = quantity + $1 WHERE id = $2',
          [quantity, existingCartItem.rows[0].id]
        );
        return res.status(200).json({ message: 'Product updated in cart' });
      }
  
      // Insert new product into the cart
      await pool.query(
        'INSERT INTO cart (user_id, product_id, size, quantity) VALUES ($1, $2, $3, $4)',
        [user_id, productId, size, quantity]
      );
  
      return res.status(200).json({ message: 'Product added to cart' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Failed to add product to cart' });
    }
  });

  router.post('/updateCart', async (req, res) => {
    const { user_id, productId, size, quantity } = req.body;
    try {
      // Check if the user exists
      const userExists = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
      if (userExists.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Check if the cart item exists
      const existingCartItem = await pool.query(
        'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2 AND size = $3',
        [user_id, productId, size]
      );
  
      if (existingCartItem.rows.length > 0) {
        // Update the existing cart item
        await pool.query(
          'UPDATE cart SET quantity = $1 WHERE id = $2',
          [quantity, existingCartItem.rows[0].id]
        );
        return res.status(200).json({ message: 'Cart item updated successfully' });
      }
  
      // If item doesn't exist, insert new one
      await pool.query(
        'INSERT INTO cart (user_id, product_id, size, quantity) VALUES ($1, $2, $3, $4)',
        [user_id, productId, size, quantity]
      );
      return res.status(200).json({ message: 'Product added to cart' });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Failed to update cart item' });
    }
  });
  

  router.post('/removeCartItem', async (req, res) => {
    const { user_id, product_id, size } = req.body;

    try {
        const cartItem = await pool.query(
            'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2 AND size = $3',
            [user_id, product_id, size]
        );

        if (cartItem.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Remove the item completely from the cart
        await pool.query(
            'DELETE FROM cart WHERE user_id = $1 AND product_id = $2 AND size = $3',
            [user_id, product_id, size]
        );

        return res.status(200).json({ message: 'Product removed from cart' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to remove product from cart' });
    }
});


router.get('/getCart', async (req, res) => {
  try {
      // Retrieve user_id from cookies or request query
      const userId = req.cookies.user_id || req.query.user_id;

      if (!userId) {
          return res.status(400).json({ error: 'User not logged in' });
      }

      // Check if the user exists
      const userCheck = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);
      if (userCheck.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Fetch cart items along with product details
      const cartItemsQuery = `
          SELECT 
              c.id AS id,
              c.product_id,
              c.size,
              c.quantity,
              p.name AS product_name,
              p.price,
              p.image_urls[1] AS product_image
          FROM 
              cart c
          INNER JOIN 
              products p
          ON 
              c.product_id = p.product_id
          WHERE 
              c.user_id = $1
      `;
      const cartItems = await pool.query(cartItemsQuery, [userId]);

      // Check if there are any cart items
      if (cartItems.rows.length === 0) {
          return res.status(200).json({
              message: 'Your cart is empty.',
              cartItems: [],
          });
      }

      // Identify the item with the highest quantity
      let maxQuantityItem = cartItems.rows[0];
      cartItems.rows.forEach(item => {
          if (item.quantity > maxQuantityItem.quantity) {
              maxQuantityItem = item;
          }
      });

      // Return the cart items along with the highest quantity item
      return res.status(200).json({
          cartItems: cartItems.rows,
          highestQuantityItem: maxQuantityItem,
      });
  } catch (error) {
      console.error('Error fetching cart:', error);
      return res.status(500).json({ error: 'Failed to fetch cart items' });
  }
});

  
  // Backend route
  router.post('/createAddress', async (req, res) => {
    const {
      user_id,
      address_type,
      street1,
      street2,
      city,
      state,
      zip,
      country,
    } = req.body;
  
    // Validate input fields
    if (!user_id || !address_type || !street1 || !city || !state || !zip || !country) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    // SQL query to insert the new address into the userAddress table
    const query = `
      INSERT INTO userAddress (user_id, address_type, street1, street2, city, state, zip, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, address_type, street1, street2, city, state, zip, country;
    `;
  
    const values = [
      user_id,
      address_type,
      street1,
      street2 || null, // If street2 is not provided, set it to null
      city,
      state,
      zip,
      country,
    ];
  
    try {
      const result = await pool.query(query, values);
      const newAddress = result.rows[0]; // Get the newly inserted address
      res.status(201).json({
        message: 'Address added successfully',
        address: newAddress,
      });
    } catch (err) {
      console.error('Error adding address:', err);
      res.status(500).json({
        message: 'Failed to add address',
        error: err.message,
      });
    }
  });


router.get('/addresses/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM useraddress WHERE user_id = $1', [userId]);
    const addresses = result.rows;

    if (addresses.length === 0) {
      return res.status(404).json({ message: 'No addresses found for this user.' });
    }

    res.json({ addresses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to retrieve addresses' });
  }
});

router.put('/updateAddress/:id', async (req, res) => {
  const { id } = req.params;
  const { street1, street2, city, state, zip, country, address_type } = req.body;

  // Ensure the data is valid
  if (!street1 || !city || !state || !zip || !country || !address_type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Update the address in the database
    const result = await pool.query(
      `UPDATE useraddress
       SET street1 = $1, street2 = $2, city = $3, state = $4, zip = $5, country = $6, address_type = $7
       WHERE id = $8 RETURNING *`,
      [street1, street2, city, state, zip, country, address_type, id]
    );

    const updatedAddress = result.rows[0];

    if (!updatedAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Respond with the updated address
    res.json({ address: updatedAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update address' });
  }
});

router.delete('/deleteAddress/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM useraddress WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete address' });
  }
});


router.get('/payment-details/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const query = `
      SELECT id, card_number, cardholder_name, expiry_date, created_at
      FROM payment_details
      WHERE user_id = $1;
    `;
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length > 0) {
      res.json(result.rows);  // Return the payment details
    } else {
      res.status(404).json({ message: 'No payment details found for this user.' });
    }
  } catch (err) {
    console.error("Error fetching payment details:", err);
    res.status(500).send('Server error');
  }
});

router.put('/payment-details/:userId', async (req, res) => {
  const { userId } = req.params;
  const { cardId, cardNumber, cardholderName, expiryDate, cvv } = req.body;

  // Ensure that none of these fields are null or undefined
  if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Update the payment details in the database
    const result = await pool.query(
      'UPDATE payment_details SET card_number = $1, cardholder_name = $2, expiry_date = $3, cvv = $4 WHERE id = $5 AND user_id = $6',
      [cardNumber, cardholderName, expiryDate, cvv, cardId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Payment details not found.' });
    }

    res.status(200).json({ message: 'Payment details updated successfully.' });
  } catch (err) {
    console.error('Error updating payment details:', err);
    res.status(500).json({ error: 'Failed to update payment details.' });
  }
});


router.post('/payment-details/:userId', async (req, res) => {
  const { userId } = req.params;  // User ID from the URL params
  const { card_number, cardholder_name, expiry_date, cvv } = req.body;  // Get details from the request body

  // SQL query to insert a new card
  const query = `
    INSERT INTO payment_details (user_id, card_number, cardholder_name, expiry_date, cvv)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  try {
    // Execute the query
    const result = await pool.query(query, [userId, card_number, cardholder_name, expiry_date, cvv]);
    
    // Send back the inserted row (or just return success)
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add payment details.' });
  }
})

router.delete('/payment-details/:userId/:cardId', async (req, res) => {
  const { userId, cardId } = req.params;

  try {
    // Query to delete the card associated with the user
    const query = 'DELETE FROM payment_details WHERE id = $1 AND user_id = $2 RETURNING *';
    const values = [cardId, userId];

    // Execute query
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Card not found or not associated with this user' });
    }

    // Return a success message
    res.status(200).json({ message: 'Card removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while removing the card. Please try again later.' });
  }
})

//user info
router.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
      const query = `
          SELECT firstName, lastName, userEmail
          FROM users
          WHERE user_id = $1;
      `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length > 0) {
          // Send the user data excluding password
          res.json(result.rows[0]);
      } else {
          // User not found
          res.status(404).json({ message: 'User not found' });
      }
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/createOrder', async (req, res) => {
  const { orders } = req.body;

  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderPromises = orders.map(async (order) => {
      const {
        user_id,
        product_id,
        size,
        quantity,
        total_amount,
        shipping_address,
      } = order;

      if (!user_id || !product_id || !size || !quantity || !total_amount || !shipping_address) {
        throw new Error('Missing required order fields');
      }

      const query = `
        INSERT INTO orders (user_id, product_id, size, quantity, total_amount, shipping_address)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;

      const values = [
        user_id,
        product_id,
        size,
        quantity,
        total_amount,
        shipping_address,
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    });

    const insertedOrders = await Promise.all(orderPromises);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Orders created successfully', orders: insertedOrders });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating orders:', err);
    res.status(500).json({ error: 'Failed to create orders' });
  } finally {
    client.release();
  }
});

router.get('/getOrders', async (req, res) => {
  const { user_id, product_id } = req.query;

  // Construct the base query
  let query = 'SELECT * FROM orders';
  const values = [];
  let conditions = [];

  // If a user_id or product_id is provided, filter the orders
  if (user_id) {
    conditions.push('user_id = $' + (conditions.length + 1));
    values.push(user_id);
  }

  if (product_id) {
    conditions.push('product_id = $' + (conditions.length + 1));
    values.push(product_id);
  }

  // Add the conditions to the query if any
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  try {
    const result = await pool.query(query, values);
    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});


module.exports = router