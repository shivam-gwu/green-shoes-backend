const AdminSchema = async (client) => {
    const query = `
        CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW()
        )
    `
    await client.query(query, (err, result)=> {
        if (err) throw err
    })
}

module.exports = AdminSchema