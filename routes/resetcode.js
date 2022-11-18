//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided
const sender = process.env.EMAIL
const code = "TestCode"

const sendEmail = require('../utilities').sendEmail

const router = express.Router()

/**
 * @api {post} /resetcode Request to register a user
 * @apiName PostResetCode
 * @apiGroup Auth
 * 
 * @apiParam {String} email a users email *unique
 * 
 * @apiParamExample {json} Request-Body-Example:
 *  {
 *      "email":""email":"cfb3@fake.email",
 *      "code":"code12345""
 *  }
 * 
 * @apiSuccess (Success 201) {boolean} success true when the name is inserted
 * @apiSuccess (Success 201) {String} email the email of the user inserted 
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * 
 * @apiError (400: Email exists) {String} message "Email exists"
 *  
 * @apiError (400: Other Error) {String} message "other error, see detail"
 * @apiError (400: Other Error) {String} detail Information about th error
 * 
 */ 
router.post('/', (request, response, next) => {

    //Retrieve data from query params
    const email = request.body.email
    if(isStringProvided(email)) {
        next();
    }
}, (request, response, next) => {
    const email = request.body.email
    let theQuery = "SELECT * FROM members WHERE email=$1"
    let values = [email]
    pool.query(theQuery, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Email not found"
                })
            } else {
                next();
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error on email check",
                error: error
            })
        })
}, (request, response) => {
        message = "Please enter the verification code in your app."
        sendEmail(sender, request.body.email, code, message)
        .catch((error) => {
            response.status(400).send({
                message: "other error, see detail",
                detail: error.detail
            })
        })
});

module.exports = router