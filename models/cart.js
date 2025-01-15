const CartSchema = async (client) => {
    const query = `
        CREATE TABLE IF NOT EXISTS cart (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
            product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
            size INT NOT NULL,
            quantity INT DEFAULT 1 CHECK (quantity > 0),
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, product_id, size)  -- Ensure that one user cannot add the same product multiple times with different sizes.
        )
    `
    await client.query(query, (err, result)=> {
        if (err) throw err
    })
}

module.exports = CartSchema