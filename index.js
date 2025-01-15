const express = require('express')
const cors = require('cors')
const routes = require('./routes/route')
const productRoutes = require('./routes/productRoutes')
const userRoutes = require('./routes/userRoutes')
const cookieParser = require('cookie-parser')

const app = express()

app.use(express.json())

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

app.use(cookieParser())

app.use('/', routes)
app.use('/', productRoutes)
app.use('/', userRoutes)

app.listen(3001, () => {
    console.log('Server runs')
})