const ProductSizeSchema = async (client) =>{
    const query = `
    CREATE TABLE IF NOT EXISTS product_sizes (
    product_size_id SERIAL PRIMARY KEY,
    product_id INT REFERENCES Products(product_id) ON DELETE CASCADE,
    size_id INT REFERENCES Sizes(size_id) ON DELETE CASCADE,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `
    await client.query(query, (err, result)=> {
        if (err) throw err
    })
}

module.exports = ProductSizeSchema