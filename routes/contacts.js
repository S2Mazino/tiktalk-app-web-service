//express is the framework we're going to use to handle requests
const express = require('express')
const { isValidEmail } = require('../utilities/validationUtils')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided


//outgoing request send
router.post("/", (request, response, next) => {
    const email = request.body.email
    if(isStringProvided(email)) {
        if(isValidEmail(email)) {
            //validate member id exists
            let query = 'SELECT * FROM Members WHERE memberid=$1'
            let values = [request.decoded.memberid]

            pool.query(query, values)
                .then(result => {
                    if (result.rowCount == 0) {
                        response.status(400).send({
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
    }, (request, response, next) => {
        //validate the friendEmail exist
        let query = 'SELECT memberid FROM Members WHERE email = $1'
        let values = [request.body.email]

        pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
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
    },(request, response, next) => {
        //validate if there is no existing contact
        let query = "SELECT * FROM CONTACTS WHERE (memberid_a = $1 AND memberid_b = $2) OR (memberid_a = $2 AND memberid_b = $1)"
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    next()
                } else {
                    response.status(400).send({
                        message: "Contact incoming/outgoing exist already",
                    })
                }

            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact exist validation",
                    error: err
                })
            })

    },(request, response) => {
        //Add a contact request
        let query = 'INSERT INTO Contacts (primarykey, memberid_a, memberid_b, verified) VALUES (default, $1, $2, 0)'
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    response.status(400).send({
                        message: "Contact send request already exist"
                    })
                } else {
                    //console.log(result.rows)
                    response.status(200).send({
                        success: true
                    })
                }
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
                response.status(204).send({
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
                    response.status(204).send({
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
                response.status(400).send({
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
                response.status(200).send({
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
                    response.status(200).send({
                        message: "No Contacts"
                    })
                } else {
                    //console.log(result.rows)
                    response.status(200).send({
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
                response.status(200).send({
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
        let query = 'SELECT Members.FirstName, Members.LastName, Members.Nickname, Members.email, MemberID_A FROM Contacts INNER JOIN Members ON Contacts.MemberID_A = Members.MemberID where Contacts.MemberID_B = $1 AND Contacts.verified = 0;'
        let values = [request.decoded.memberid]
        // let values = [request.params.memberId]
        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(200).send({
                        message: "No Contacts"
                    })
                } else {
                    //console.log(result.rows)
                    response.status(200).send({
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

//accept incoming request
router.post("/accept", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
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
        let query = 'SELECT memberid FROM Members WHERE memberid = $1'
        let values = [request.body.memberid]

        pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "friend ID not found"
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
    },(request, response, next) => {
        //validate if there is no existing contact
        let query = "SELECT * FROM CONTACTS WHERE memberid_a = $1 AND memberid_b = $2"
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    next()
                } else {
                    response.status(400).send({
                        message: "Contact incoming/outgoing exist already",
                    })
                }

            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact exist validation",
                    error: err
                })
            })

    },(request, response, next) => {
        //UPDATE the existing contact that sent the request
        //let query = 'INSERT INTO Contacts (primarykey, memberid_a, memberid_b, verified) VALUES (default, $2, $1, 1)'
        let query = 'UPDATE Contacts SET verified = 1 WHERE memberid_a = $2 AND memberid_b = $1'
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    response.status(400).send({
                        message: "Contact's send request was already verified"
                    })
                } else {
                    //console.log(result.rows)
                    // response.status(200).send({
                    //     success: true
                    // })
                    next()
                }
            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact update",
                    error: err
                })
            })
    }, (request, response) => {
        //Add a contact request
        let query = 'INSERT INTO Contacts (primarykey, memberid_a, memberid_b, verified) VALUES (default, $1, $2, 1)'
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    response.status(400).send({
                        message: "Contact send request already exist"
                    })
                } else {
                    //console.log(result.rows)
                    response.status(200).send({
                        success: true
                    })
                }
            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact accept insert",
                    error: err
                })
            })

})



module.exports = router