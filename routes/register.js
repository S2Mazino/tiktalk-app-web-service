//express is the framework we're going to use to handle requests
const { response } = require('express')
const e = require('express')
const { request } = require('express')
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided
let isValidPassword = validation.isValidPassword
let isValidEmail = validation.isValidEmail
const sender = process.env.EMAIL

const generateHash = require('../utilities').generateHash
const generateSalt = require('../utilities').generateSalt

const sendEmail = require('../utilities').sendEmail

const router = express.Router()

/**
 * @api {post} /auth Request to register a user
 * @apiName PostAuth
 * @apiGroup Auth
 * 
 * @apiParam {String} first a users first name
 * @apiParam {String} last a users last name
 * @apiParam {String} email a users email *unique
 * @apiParam {String} password a users password
 * @apiParam {String} [nickname] a nickname *unique, if none provided, email will be used
 * 
 * @apiParamExample {json} Request-Body-Example:
 *  {
 *      "first":"Charles",
 *      "last":"Bryan",
 *      "nickname": "cfb3",
 *      "email":"cfb3@fake.email",
 *      "password":"test12345"
 *  }
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {String} email the email of the user inserted 
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Nickname exists) {String} message "Nickname exists"
 * 
 * @apiError (400: Email exists) {String} message "Email exists"
 *  
 * @apiError (400: Other Error) {String} message "other error, see detail"
 * @apiError (400: Other Error) {String} detail Information about th error
 * 
 */ 
router.post('/', (request, response, next) => {

    //Retrieve data from query params
    const first = request.body.first
    const last = request.body.last
    const nickname = isStringProvided(request.body.nickname) ?  request.body.nickname : request.body.email
    const email = request.body.email
    const password = request.body.password
    //Verify that the caller supplied all the parameters
    //In js, empty strings or null values evaluate to false
    if(isStringProvided(first) 
        && isStringProvided(last) 
        && isStringProvided(nickname) 
        && isStringProvided(email) 
        && isStringProvided(password)) {
        
        if(isValidEmail(email)) {
            if(isValidPassword(password)) {

                //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
                //If you want to read more: https://stackoverflow.com/a/8265319       
                let theQuery = "INSERT INTO MEMBERS(FirstName, LastName, Nickname, Email) VALUES ($1, $2, $3, $4) RETURNING Email, MemberID"
                let values = [first, last, nickname, email]
                pool.query(theQuery, values)
                    .then(result => {
                        //stash the memberid into the request object to be used in the next function
                        request.memberid = result.rows[0].memberid
                        next()
                    })
                    .catch((error) => {
                        //log the error  for debugging
                        // console.log("Member insert")
                        // console.log(error)
                        if (error.constraint == "members_nickname_key") {
                            response.status(400).send({
                                message: "Nickname exists"
                            })
                        } else if (error.constraint == "members_email_key") {
                            response.status(400).send({
                                message: "Email exists"
                            })
                        } else {
                            response.status(400).send({
                                message: "other error, see detail - insert members",
                                detail: error.detail
                            })
                        }
                    })
            } else {
                response.status(400).send({
                    message: "Missing password requirement"
                })
            }
        } else {
            response.status(400).send({
                message: "Missing email requirement"
            })
        }
        
    } else {
        response.status(400).send({
            message: "Missing required information"
        })
    }
}, (request, response) => {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        let salt = generateSalt(32)
        let salted_hash = generateHash(request.body.password, salt)

        let theQuery = "INSERT INTO CREDENTIALS(MemberId, SaltedHash, Salt) VALUES ($1, $2, $3)"
        let values = [request.memberid, salted_hash, salt]
        pool.query(theQuery, values)
            .then(result => {
                //We successfully added the user!
                response.status(201).send({
                    success: true,
                    email: request.body.email
                })
                
                const url = `https://tiktalk-app-web-service.onrender.com/verify?id=${values[0]}`
                //console.log(url)
                message = `Please click this link to confirm your email: <a href=${url}>${url}</a>`
                sendEmail(sender, request.body.email,"Welcome to our app", message)
            })
            .catch((error) => {
                //log the error for debugging
                // console.log("PWD insert")
                // console.log(error)

                /***********************************************************************
                 * If we get an error inserting the PWD, we should go back and remove
                 * the user from the member table. We don't want a member in that table
                 * without a PWD! That implementation is up to you if you want to add
                 * that step. 
                 **********************************************************************/

                response.status(400).send({
                    message: "other error, see detail - insert credentials",
                    detail: error.detail
                })
            })
})

/**
 * @api {get} /auth/verify Request to verify a user in the system
 * @apiName PostAuth
 * @apiGroup Auth
 * 
 * @apiDescription Request to verify the given id is owned by the actual owner 
 * and allow them to signin once verified
 * 
 * @apiParam {String} id the member to look up. 
 * 
 * @apiSuccess {boolean} success true when the verification is updated
 * @apiSuccess {String} message "Email verification success!"
 * 
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "success": true,
 *       "message": "Email verification success!"
 *     }
 * 
 * @apiError (400: Missing Parameter) {String} message "Missing required information"
 * 
 * @apiError (404: User Not Found) {String} message "User not found"
 * 
 * @apiError (400: User Already Verified) {String} message "User already verified"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 */ 
router.get('/verify', (request, response) => {
    if(isStringProvided(request.query.id)){
        //check if the member already verified or not
        let theQuery = "SELECT verification FROM Members WHERE memberid = $1"
        const values = [request.query.id]
        pool.query(theQuery, values)
        .then(result => { 
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: 'User not found' 
                })
                return
            }

            //console.log(result)
            //console.log(result.rows[0].verification == 1)
            if(result.rows[0].verification == 1) {
                response.status(400).send({
                    message: 'User already verified'
                })
                return
            }

            //update the user verification status to 1
            theQuery = "UPDATE Members SET Verification = 1 WHERE MemberID = $1"

            pool.query(theQuery, values)
            .then(result => { 
                //console.log(result)
                //package and send the results
                response.status(201).send({
                    success: true,
                    message: 'Email verification success!'
                })

            })
            .catch((err) => {
                //log the error
                console.log("Error on UPDATE************************")
                console.log(err)
                console.log("************************")
                console.log(err.stack)
                response.status(400).send({
                    message: err.detail
                })
            })

        })
        .catch((err) => {
            //log the error
            console.log("Error on SELECT************************")
            console.log(err)
            console.log("************************")
            console.log(err.stack)
            response.status(400).send({
                message: err.detail
            })
        })

    }else{
        response.status(400)
        response.send({
            message: "Missing required information"
        })
    }
})


router.get('/hash_demo', (request, response) => {
    let password = 'hello12345'

    let salt = generateSalt(32)
    let salted_hash = generateHash(password, salt)
    let unsalted_hash = generateHash(password)

    response.status(200).send({
        'salt': salt,
        'salted_hash': salted_hash,
        'unsalted_hash': unsalted_hash
    })
})


module.exports = router