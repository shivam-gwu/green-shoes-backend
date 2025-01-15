const express = require('express')
const bcrypt = require('bcryptjs/dist/bcrypt')
const pool = require('../connection/postgreSQLConnect')
const router = express.Router()
require('dotenv').config()

//Admin Register 
router.post('/adminHome', async (req, res) => {
    const {name, username, password} = req.body

    try{
        const result = await pool.query('SELECT * FROM admins WHERE username = $1',[username])
        const adminExists = result.rows

        if(adminExists.length > 0){
            return res.status(409).json({message: 'Admin exists'})
        }

        // hasing the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        //Create new admin
        await pool.query('INSERT INTO admins (name, username, password) VALUES ($1, $2, $3)',
            [name, username, hashedPassword])
        res.status(200).json({message: 'Admin Created successfully'})

    }   catch (error){
            res.status(500).json({message: 'Server Error'})
        }
    
})

//Admin Login
router.post('/admin', async (req, res) => {
    const {username, password} = req.body

    try{
        const result = await pool.query('SELECT * FROM admins WHERE username = $1',[username])
        const admin = result.rows[0]
        //checking username
        if(!admin){
            return res.status(404).json({message: 'Admin not found'})
        }

        //checking password
        const isMatch = await bcrypt.compare(password, admin.password)
        if(!isMatch){
            return res.status(401).json({message: 'Invalid credentials'})
        }
        return res.status(200).json({message: 'Login Successful'})
    }catch (error){
        res.status(500).json({message: 'Server Error'})
    }
})

//Check User
router.post('/checkUser', async (req, res) => {
    const { userEmail } = req.body 
    try{
        const result = await pool.query('SELECT * FROM users WHERE userEmail = $1', [userEmail])
        const user = result.rows[0]
        if(user){
            return res.status(200).json({message: 'User found'})
        }else{
            return res.status(204).json({message: 'User not found'})
        }
    }catch (error){
        console.error('Error during user registration:', error)
        return res.status(500).json({message: 'Server Error'})
        }
})

// UserSignUp
router.post('/userSignUp', async (req, res) => {
    const { firstName, lastName, userEmail, phoneNumber, userPassword } = req.body
    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userPassword, salt)

        // Insert new user into the database
        const result = await pool.query(
            `INSERT INTO users (firstName, lastName, userEmail, phoneNumber, userPassword) 
             VALUES ($1, $2, $3, $4, $5) RETURNING user_id, firstName`,
            [firstName, lastName, userEmail, phoneNumber, hashedPassword]
        );

        const newUser = result.rows[0];

        // Set cookies for userId and firstName
        res.cookie('userId', newUser.user_id, { path: '/' })
        res.cookie('firstName', newUser.firstname, { path: '/' })

        res.status(200).json({ message: 'User Created Successfully', user_id: newUser.id, firstName: newUser.firstname });
    } catch (error) {
        console.error('Error during user registration:', error)
        return res.status(500).json({ message: 'Server Error' })
    }
})

// UserLogin
router.post('/userLogin', async (req, res) => {
    const { userEmail, userPassword } = req.body
    try {
        const result = await pool.query('SELECT * FROM users WHERE userEmail = $1', [userEmail])
        const user = result.rows[0]

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const isMatch = await bcrypt.compare(userPassword, user.userpassword)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        // Set cookies for userId and firstName
        res.cookie('userId', user.user_id, { path: '/' })
        res.cookie('firstName', user.firstname, { path: '/' })
        console.log(user.firstname)
        console.log(user.user_id)
        return res.status(200).json({
            message: 'Login Successful',
            userId: user.user_id,
            firstName: user.firstname,
        })
    } catch (error) {
        console.error('Error during user login:', error)
        return res.status(500).json({ message: 'Server Error' })
    }
})

//userLogout
router.post('/logout', (res, req) => {
    res.clearCookie('userId')
    res.status(200). json({ message: 'Logged out successfully' })
})

//address
router.post('/address', async(req, res) => {
    const {userStreet1, userStreet2, userCity, userState, userCountry, userZipCode, userPhoneNumber } = req.body 
     try{
            await pool.query(`INSERT INTO users 
                (userStreet1, userStreet2, userCity, userState, userCountry, userZipCode, userPhoneNumber) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userStreet1, userStreet2, userCity, userState, userCountry, userZipCode, userPhoneNumber])
            res.status(200).json({message: 'Address Added'})
     } catch (error){
        return res.status(500).json({message: 'Server Error'})
     }
})

module.exports = router