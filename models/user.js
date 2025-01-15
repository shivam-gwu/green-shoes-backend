const UserSchema = async (client) =>{
    const query = `
    CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        userEmail VARCHAR(255) UNIQUE NOT NULL,
        phoneNumber VARCHAR(255) NOT NULL,
        userPassword VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW()
    );
    `
    await client.query(query, (err, result)=> {
        if (err) throw err
    })
}

module.exports = UserSchema