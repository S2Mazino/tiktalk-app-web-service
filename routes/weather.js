//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

let weather_api_key = process.env.WEATHER_API_KEY

const https = require('https')

//How to make weather API call: https://openweathermap.org/current
//https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}

//Forcast api call: https://openweathermap.org/forecast5
//https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API key}

//Convert location(city or state or zipcode) to lon&lat: https://openweathermap.org/api/geocoding-api
router.get("/zip", (request, response, next) => {
    //validate on empty parameters
    if (!isStringProvided(request.query.zip)) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
}, (request, response, next) => {
    //make the api call to get long and lat based on location (city or state or zipcode)
    let zip = request.query.zip
    let url = "https://api.openweathermap.org/geo/1.0/zip?zip=" + zip +"&appid=" + weather_api_key
    let body = ""

    https.get(url, res => {
        res.on('data', chunk => {
            body += chunk
        });

        res.on('end', () => {
            body = JSON.parse(body)
            console.log('lat ', body.lat)
        });
    
    }).on('error', err => {
        console.log("Error ", err)
    });

})

module.exports = router