const OrderSchema = async (client) =>{
    const query = `
    CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    size VARCHAR(10) NOT NULL,
    quantity INT NOT NULL,
    order_time TIMESTAMP DEFAULT NOW(),
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_address JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending'
    );
    `
    await client.query(query, (err, result)=> {
        if (err) throw err
    })
}

module.exports = OrderSchema