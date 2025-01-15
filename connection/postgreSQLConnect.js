const { Pool } = require('pg')
require('dotenv').config()
const AdminSchema = require('../models/admins')
const UserSchema = require('../models/user')
const UserAddressSchema = require('../models/userAddress')
const CategoriesSchema = require('../models/category')
const ProductSizeSchema = require('../models/sizeTable')
const SizeSchema = require('../models/size')
const ProductsSchema = require('../models/products')
const CartSchema = require('../models/cart')
const PaymentDetailsSchema = require('../models/payment')
const OrderSchema = require('../models/orders')

const pool = new Pool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT || 5432,
})

const initializeDatabase = async () => {
    const client = await pool.connect()
    console.log('PostgreSQL is connected')

    try {
        await AdminSchema(client)
        await UserSchema(client)
        await UserAddressSchema(client)
        await CategoriesSchema(client)
        await ProductsSchema(client)
        await SizeSchema(client)
        await ProductSizeSchema(client)
        await CartSchema(client)
        await PaymentDetailsSchema(client)
        await OrderSchema(client)
        
        console.log("All tables created successfully.")
    } catch (error) {
        console.error("Error creating schema:", error)
    } finally {
        client.release()
    }
};

initializeDatabase().catch((err) => console.error("Database initialization failed:", err))

module.exports = pool