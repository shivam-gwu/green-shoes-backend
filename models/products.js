const ProductsSchema = async (client) => {
    const query = `
    CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT,
    image_urls TEXT[], 
    color VARCHAR(255),
    environmental_message TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
    );
    ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_value FLOAT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_start DATE;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_end DATE;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;
    `
    await client.query(query, (err, result) => {
        if (err) throw err
    })
}

module.exports = ProductsSchema