const express = require('express')
const pool = require('../connection/postgreSQLConnect')
const router = express.Router()
require('dotenv').config()


//Add Products
router.post('/addProducts', async (req, res) => {
    const { name, description, price, category_id, image_urls, sizes, color, environmental_message } = req.body

    try {
        await pool.query('BEGIN')

        const addProductQuery = `
            INSERT INTO products (name, description, price, category_id, image_urls, color, environmental_message, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING product_id
        `
        const productResult = await pool.query(addProductQuery, [ 
            name, 
            description, 
            price, 
            category_id, 
            image_urls,  
            color, 
            environmental_message 
        ])
        
        const productId = productResult.rows[0].product_id

        const addSizeQuery = `
            INSERT INTO product_sizes (product_id, size_id, stock_quantity, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `
        for (const size of sizes) {
            const { size_id, quantity } = size
            await pool.query(addSizeQuery, [productId, size_id, quantity])
        }

        await pool.query('COMMIT')
        res.status(201).json({ message: "Product added successfully", productId })
    } catch (error) {
        await pool.query('ROLLBACK')
        console.error(error)
        res.status(500).json({ error: 'An error occurred while adding the product' })
    }
})

function calculateDiscountedPrice(product) {
    if (!product.is_active) return product.price;
    return product.price - (product.price * product.discount_value / 100);
}


//Add discount by product id
router.put('/addProducts/:id/discount', async (req, res) => {
    const { id } = req.params;
    const { discountType, discountValue, discountStart, discountEnd, isActive } = req.body;
  
    try {
      // Update the product in the database
      const query = `
        UPDATE products
        SET
          discount_type = $1,
          discount_value = $2,
          discount_start = $3,
          discount_end = $4,
          is_active = $5
        WHERE product_id = $6
        RETURNING *;
      `;
  
      const values = [
        discountType,
        discountValue,
        discountStart,
        discountEnd,
        isActive,
        id,
      ];
  
      const result = await pool.query(query, values);
  
      // Check if the product was updated
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating discount:', error);
      res.status(500).json({ error: 'Failed to update discount' });
    }
  });

// const calculateDiscountedPrice = (product) => {
//     const { price, discountType, discountValue, discountStart, discountEnd, isActive } = product;
  
//     if (!isActive || !discountStart || !discountEnd) return price;
//     const now = new Date();
//     if (now < new Date(discountStart) || now > new Date(discountEnd)) return price;
  
//     if (discountType === 'flat') {
//       return Math.max(0, price - discountValue);
//     } else if (discountType === 'percentage') {
//       return Math.max(0, price * (1 - discountValue / 100));
//     }
  
//     return price;
//   };



//Get Products
router.get('/getProducts', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT product_id, 
               name, 
               description, 
               price, 
               color, 
               category_name, 
               image_urls[1] AS image_url, -- Get the first image
               discount_type,
               discount_value,
               discount_start,
               discount_end,
               is_active
        FROM products
        JOIN categories ON products.category_id = categories.category_id;
      `);

      const products = result.rows;


      const productsWithDiscount = products.map(product => ({
        ...product,
        discountedPrice: calculateDiscountedPrice(product),
      }));
      
      // Return the result as JSON
      res.status(200).json(productsWithDiscount);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  router.get('/getProducts/promotions', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT product_id, 
               name, 
               description, 
               price, 
               color, 
               category_name, 
               image_urls[1] AS image_url, -- Get the first image
               discount_type,
               discount_value,
               discount_start,
               discount_end,
               is_active
        FROM products
        JOIN categories ON products.category_id = categories.category_id
        where is_active= TRUE;
      `);

      const products = result.rows;


      const productsWithDiscount = products.map(product => ({
        ...product,
        discountedPrice: calculateDiscountedPrice(product),
      }));
      
      // Return the result as JSON
      res.status(200).json(productsWithDiscount);

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

//Get Product by id
//Get Product by id
router.get('/getProducts/:id', async (req, res) => {
    const productId = parseInt(req.params.id);

    try {
        const result = await pool.query(`
            SELECT 
                p.product_id, 
                p.name, 
                p.description, 
                p.price, 
                p.image_urls, 
                p.color, 
                c.category_name,
                p.environmental_message,
                json_agg(json_build_object(
                    'size_label', s.size_label,
                    'stock_quantity', ps.stock_quantity
                ) ORDER BY s.size_label) AS sizes,
               p.discount_type,
               p.discount_value,
               p.discount_start,
               p.discount_end,
               is_active
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_sizes ps ON p.product_id = ps.product_id
            LEFT JOIN sizes s ON ps.size_id = s.size_id
            WHERE p.product_id = $1
            GROUP BY p.product_id, c.category_name
        `, [productId]);

        

        const product = result.rows[0];

        

        const productWithDiscount = {
            ...product, // spread the original product properties
            discountedPrice: calculateDiscountedPrice(product),
        };
        if (productWithDiscount.rows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json(productWithDiscount);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

//Get categories
router.get('/getCategory', async(req, res) => {
    try{
        const result = await pool.query(`SELECT * FROM categories`)
        res.status(200).json(result.rows)
    }catch (error){
        return res.status(500).json({message: 'Server Error'})
    }
})

// Edit product route
router.put('/products/:id', async (req, res) => {
    const productId = parseInt(req.params.id);
    const { name, description, price, image_urls, color, environmental_message, sizes } = req.body;

    try {
        await pool.query('BEGIN'); // Start transaction

        // Update the product details (name, description, price, image_urls, color, and environmental_message)
        const updateProductQuery = `
            UPDATE products
            SET 
                name = $1,
                description = $2,
                price = $3,
                image_urls = $4,
                color = $5,
                environmental_message = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $7
            RETURNING product_id;
        `;
        
        const result = await pool.query(updateProductQuery, [name, description, price, image_urls, color, environmental_message, productId]);

        if (result.rowCount === 0) {
            await pool.query('ROLLBACK'); // Rollback transaction if the product is not found
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete all existing sizes for this product
        const deleteSizesQuery = `DELETE FROM product_sizes WHERE product_id = $1;`;
        await pool.query(deleteSizesQuery, [productId]);

        // Insert the new sizes for this product
        const insertSizeQuery = `
            INSERT INTO product_sizes (product_id, size_id, stock_quantity, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        `;

        for (const size of sizes) {
            const { size_id, stock_quantity } = size;
            await pool.query(insertSizeQuery, [productId, size_id, stock_quantity]);
        }

        await pool.query('COMMIT'); // Commit the transaction

        res.status(200).json({ message: 'Product updated successfully', product_id: productId });
    } catch (error) {
        await pool.query('ROLLBACK'); // Rollback in case of an error
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'An error occurred while updating the product' });
    }
});


//Get categories by ID
router.get('/getCategory/:id', async (req, res) => {
    const { id } = req.params

    try {
        const result = await pool.query(`SELECT * FROM categories WHERE category_id = $1`, [id])
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' })
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' })
    }
})

// Get products by category ID
router.get('/getCategory/:id/products', async (req, res) => {
    const categoryId = parseInt(req.params.id)

    try {
        const result = await pool.query(`
            SELECT p.product_id, p.name, p.description, p.price, p.image_urls, p.color, p.environmental_message,
                json_agg(json_build_object(
                'size_label', s.size_label,
                'stock_quantity', ps.stock_quantity
            )) AS sizes
            FROM products p
            LEFT JOIN product_sizes ps ON p.product_id = ps.product_id
            LEFT JOIN sizes s ON ps.size_id = s.size_id
            WHERE p.category_id = $1
            GROUP BY p.product_id

        `, [categoryId])

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No products found for this category' })
        }
        res.status(200).json(result.rows)
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' })
    }
})


//Get Sizes
router.get('/getSizes', async(req, res) => {
    try{
        const result = await pool.query(`SELECT * FROM sizes`)
        res.status(200).json(result.rows)
    }catch (error){
        return res.status(500).json({message: 'Server Error'})
    }
})

//Get Color
router.get('/getColor', async(req, res) => {
    try{
        const result = await pool.query(`SELECT * FROM color`)
        res.status(200).json(result.rows)
    }catch (error){
        return res.status(500).json({message: 'Server Error'})
    }
})


module.exports = router