//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided


router.post("/", (request, response, next) => {
 
})

/*
* get all contacts associated with the token's member id
*/
router.get("/:memberId?", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    //let values = [request.decoded.memberid]
    let values = [request.params.memberId]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Member ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in member validation",
                error: error
            })
        })
    }, (request, response) => {
        //Retrieve the member's contact
        let query = 'SELECT Members.FirstName, Members.LastName, Members.Nickname, Members.email, MemberID_B FROM Contacts INNER JOIN Members ON Contacts.MemberID_B = Members.MemberID where Contacts.MemberID_A = $1'
        //let values = [request.decoded.memberid]
        let values = [request.params.memberId]
        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "Contacts not found"
                    })
                } else {
                    //console.log(result.rows)
                    response.send({
                        memberId: request.params.memberId,
                        rowCount: result.rowCount,
                        rows: result.rows
                    })
                }
            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact retrieve",
                    error: err
                })
            })
});

module.exports = router