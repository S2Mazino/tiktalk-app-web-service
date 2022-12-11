//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities').pool

const validation = require('../utilities').validation
const generateHash = require('../utilities').generateHash
const generateSalt = require('../utilities').generateSalt
let isStringProvided = validation.isStringProvided

const router = express.Router()

/**
 * @api {post} /resetpassword/verify Verifies that the code the user inputs is the one assigned to the user inside the database
 * @apiName VerifyResetCode
 * @apiGroup resetpassword
 * 
 * @apiParam {String} email a users email *unique
 * @apiParam {String} code the users verification code
 * 
 * @apiParamExample {json} Request-Body-Example:
 *  {
 *      "email":"cfb3@fake.email",
 *      "code":"code12345""
 *  }
 * @apiSuccess (Success 200) {Integer} memberid the memberid associated with the users email
 * 
 * @apiError (404: Code doesn't match) {String} message "Code Doesnt Match"
 * 
 * @apiError (400: Other Error) {String} message "Error on verification check"
 * 
 */

router.post('/verify', (request, response) => {

    const email = request.body.email
    const code = request.body.code
    console.log(email);
    console.log(code)
    let theQuery = "SELECT resetcode, memberId FROM members WHERE email=$1"
    let values = [email]
    pool.query(theQuery, values)
        .then(result => {
            console.log(result.rows);
            if(code === result.rows[0].resetcode) {
                memberid = result.rows[0].memberid
                response.status(200).send({
                    memberid: memberid
                })
            } else {
                response.status(404).send({
                    message: "Code Doesnt Match"
                })
            }
        }).catch((error) => {
            response.status(400).send({
                message: "Error on verification check",
                error: error
            })
        })
});

/**
 * check if user resetcode is same as in database (client or serverside?)
 * if codes are the same, prompt to enter new password for user (client)
 * 
 * generate salt
 * generatehash (new password, salt)
 * 
 * send new password through query and update the old password
 * (UPDATE credentials SET saltedhash =$1, salt=$2 WHERE memberid=$3) 
 * (need to get memberId based off email)
 * 
 *  *  * @apiParamExample {json} Request-Body-Example:
 *  {
 *      "memberid":"89",
 *      "password":"Test123!"
 *  }
 * 
 */
router.post('/', (request, response) => {
    const memberid = request.body.memberid
    let salt = generateSalt(32)
    let salted_hash = generateHash(request.body.password, salt)
    let theQuery = "UPDATE credentials SET saltedhash=$1, salt=$2 WHERE memberid=$3"
    let values = [salted_hash, salt, memberid]
        pool.query(theQuery, values)
            .then(result => {
                response.status(201).send({
                    success: true,
                    message: "password changed succesfully"
                })
            }).catch((error) => {
                response.status(400).send({
                    message: "other error, see detail",
                    detail: error.detail
                })
            })
});



module.exports = router