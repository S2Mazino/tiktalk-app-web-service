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
 * 
 */
router.post('/', (request, response,next) => {
    const verifyCode = request.body.verifyCode
    const email = request.body.email
    if(isStringProvided(verifyCode)) {
        let theQuery = "SELECT resetcode FROM members WHERE email=$1"
        let values = [email]
        pool.query(theQuery, values)
            .then(result => {
                if(verifyCode == result.rows[0].resetcode) {
                    request.memberid = result.rows[0].memberid
                    next();
                } 
            }).catch((error) => {
                response.status(400).send({
                    message: "Error on verification check",
                    error: error
                })
            })
    }
},  (request, response) => {
    let salt = generateSalt(32)
    let salted_hash = generateHash(request.body.password, salt)
    let theQuery = "UPDATE credentials SET saltedhash=$1, salt=$2 WHERE memberid=$3"
    let values = [salted_hash, salt, request.memberid]
        pool.query(theQuery, values)
            .then(result => {
                response.status(201).send({
                    success: true,
                })
            }).catch((error) => {
                response.status(400).send({
                    message: "other error, see detail",
                    detail: error.detail
                })
            })
})

module.exports = router