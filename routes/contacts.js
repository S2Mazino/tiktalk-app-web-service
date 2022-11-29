//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided


//outgoing request send
router.post("/:friendEmail?", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]

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
    }, (request, response, next) => {
        //validate the friendEmail exist
        let query = 'SELECT memberid FROM Members WHERE email = $1'
        let values = [request.params.friendEmail]

        pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "friend email not found"
                })
            } else {
                request.params.friendId = result.rows[0].memberid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in contact validation",
                error: error
            })
        })
    },(request, response) => {
        //Add a contact request
        let query = 'INSERT INTO Contacts (primarykey, memberid_a, memberid_b, verified) VALUES (default, $1, $2, 0)'
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                //console.log(result.rows)
                response.status(200).send({
                    success: true
                })
            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact retrieve",
                    error: err
                })
            })
})

/*
* get all contacts friend associated with the token's member id
*/
router.get("/", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]
    //let values = [request.params.memberId]

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
        let query = 'SELECT Members.FirstName, Members.LastName, Members.Nickname, Members.email, MemberID_B FROM Contacts INNER JOIN Members ON Contacts.MemberID_B = Members.MemberID where Contacts.MemberID_A = $1 AND Contacts.verified = 1'
        let values = [request.decoded.memberid]
        // let values = [request.params.memberId]
        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "No Contacts"
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

/*
* delete the friendID from the associated token's memberid
*/
router.delete("/:friendID?", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.friendID) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.friendID)) {
        response.status(400).send({
            message: "Malformed parameter. friendID must be a number"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //memberid_a = person making the call, memberid_b = the person to be removed
    let query = 'DELETE FROM Contacts WHERE (memberid_a=$1 AND memberid_b=$2) OR (memberid_a=$2 AND memberid_b=$1)'
    let values = [request.decoded.memberid, request.params.friendID]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "Contact does not exist"
                })
            } else {
                //console.log(result.rows)
                response.status(200).send({
                    success: true
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in delete contact",
                error: error
            })
        })
});

/*
* get all outgoing contacts associated with the token's member id
*/
router.get("/search", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]
    //let values = [request.params.memberId]

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
        let query = 'SELECT Members.FirstName, Members.LastName, Members.Nickname, Members.email, MemberID_B FROM Contacts INNER JOIN Members ON Contacts.MemberID_B = Members.MemberID where Contacts.MemberID_A = $1 AND Contacts.verified = 0'
        let values = [request.decoded.memberid]
        // let values = [request.params.memberId]
        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "No Contacts"
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

/*
* get all incoming contacts associated with the token's member id
*/
router.get("/request", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]
    //let values = [request.params.memberId]

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
        let query = 'SELECT Members.FirstName, Members.LastName, Members.Nickname, Members.email, MemberID_B FROM Contacts INNER JOIN Members ON Contacts.MemberID_B = Members.MemberID where Contacts.MemberID_B = $1 AND Contacts.verified = 0'
        let values = [request.decoded.memberid]
        // let values = [request.params.memberId]
        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: "No Contacts"
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