const SizeSchema = async (client) => {
    const query = `
        CREATE TABLE IF NOT EXISTS sizes (
            size_id SERIAL PRIMARY KEY,
            size_label VARCHAR(10) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `
    await client.query(query)
}

module.exports = SizeSchema