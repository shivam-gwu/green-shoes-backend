const CategoriesSchema = async (client) =>{
    const query = `
    CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `
    await client.query(query, (err, result)=> {
        if (err) throw err
    })
}

module.exports = CategoriesSchema