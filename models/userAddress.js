const UserAddressSchema = async (client) => {
    const query = `
        CREATE TABLE IF NOT EXISTS userAddress (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            address_type VARCHAR(50) NOT NULL CHECK (address_type IN ('Home', 'Billing', 'Shipping')),
            street1 VARCHAR(255) NOT NULL,
            street2 VARCHAR(255),
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            zip VARCHAR(20) NOT NULL,
            country VARCHAR(100) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );
    `;

    try {
        await client.query(query);
    } catch (err) {
        console.error('Error creating UserAddress table:', err);
        throw err;
    }
};

module.exports = UserAddressSchema;