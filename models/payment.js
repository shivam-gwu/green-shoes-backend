const PaymentDetailsSchema = async (client) => {
    const query = `
    CREATE TABLE IF NOT EXISTS payment_details (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        card_number VARCHAR(16) NOT NULL,
        cardholder_name VARCHAR(255) NOT NULL,
        expiry_date VARCHAR(5) NOT NULL,
        cvv VARCHAR(3) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
    `;
    await client.query(query, (err, result) => {
        if (err) throw err;
    });
}

module.exports = PaymentDetailsSchema;