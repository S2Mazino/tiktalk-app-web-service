//express is the framework we're going to use to handle requests
const express = require('express');

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

// Get the data from OpenWeatherMap API
const weatherUtils = require('../utilities').weatherUtils;
const getCurrentWeather = weatherUtils.getCurrentWeather;
const getHourlyForecast = weatherUtils.getHourlyForecast;
const getDailyForecast = weatherUtils.getDailyForecast;
const localTimeZone = weatherUtils.localTimeZone;

const router = express.Router();

const validation = require('../utilities').validation;
let isStringProvided = validation.isStringProvided

let weather_api_key = process.env.WEATHER_API_KEY1

// const https = require('https')

// Use node to fetch the data from OpenWeatherMap API
const fetch = require('node-fetch');

//How to make Current weather API call: https://openweathermap.org/current
//https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}
//Forcast api call: https://openweathermap.org/forecast5
//https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API key}


// How to call the weather API for One Call API 3.0 from OpenWeatherMap
// https://openweathermap.org/api/one-call-3
// https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude={part}&appid={API key}

// Hard code for now. 
// const lat = 47.2529;
// const lon = -122.4443;

const weatherApiURL = 'https://api.openweathermap.org/data/2.5/onecall';
const coordsParams = (lat, lon) => { return `?lat=${lat}&lon=${lon}`; };
const optionalParams = '&exclude=minutely,alerts';
const keyParam = `&appid=${weather_api_key}`;

/**
 * @api {get} /weather/?lat={latitude}&lon={longitude} Request formatted weather data with specified coordinates.
 * @apiName GetWeather
 * @apiGroup Weather
 *
 * @apiHeader {String} authorization "username:password" uses Basic Auth
 *
 * @apiSuccess {boolean} success true when API response processing is successful
 * @apiSuccess {String} currentWeather nicely formatted weather data
 * @apiSuccess {String} currentWeather nicely formatted current weather forecast data
 * @apiSuccess {String} hourlyData nicely formatted hourly weather forecast data
 * @apiSuccess {String} dailyData nicely formatted daily weather forecast data
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *       "success": true,
 *       "currentWeather": {
 *                              temp: 69,
 *                              description: Clear Sky,
 *                              minTemp: 42,
 *                              maxtemp: 72,
 *                              humidity: 20,
 *                              feels_like: 63,
 *                              prob_precipitation: 0.2,
 *                              icon: 01d
 *                         },
 *       "hourlyForecast": {
 *                          [hours: 1, temp: 65, icon: 01d],
 *                          [hours: 2, temp: 65, icon: 01d],
 *                          [...],
 *                          [hours: 23, temp: 65, icon: 01d],
 *                     },
 *       "dailyForecast": {
 *                          [day: Sun, temp: 65, icon: 01d],
 *                          [day: Mon, temp: 65, icon: 01d],
 *                          [...],
 *                          [day: Sat, temp: 65, icon: 01d],
 *                    }
 *     }
 *
 * @apiError (404: Missing required information) {String} message "Missing required information"
 *
 * @apiError (404: Invalid parameters) {String} message "Invalid parameters"
 *
 * @apiError (400: API Request Failed) {String} message "Weather API request failed"
 *
 */

 router.get('/', (req, res, next) => {
    if (!(isStringProvided(req.query.lat) && isStringProvided(req.query.lon))) {
        res.status(404).send({
            message: 'Missing required information',
        });
    } else if (isNaN(req.query.lat) || isNaN(req.query.lon)) {
        res.status(404).send({
            message: 'Invalid parameters',
        });
    } else next();
}, (req, res, next) => {
    // const lat = req.query.lat;
    // const lon = req.query.lon;
// Hard code for now. 
    const lat = 47.2529;
    const lon = -122.4443;

    const url = weatherApiURL + coordsParams(lat, lon) + optionalParams + keyParam;
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            req.body.data = data;
            console.log(data);
            next();
        }).catch((err) => {
            res.status(400).send({
                message: 'Weather API request failed',
                detail: err.detail,
            });
        });
    },
    // Data Processing
    getCurrentWeather,
    getHourlyForecast,
    getDailyForecast,
    localTimeZone,
    (req, res) => {
        res.status(201).send({
            success: true,
            currentWeather: req.body.currentWeather,
            hourlyForecast: req.body.hourlyForecast,
            dailyForecast: req.body.dailyForecast,
        });
    }
);

//Convert location(city or state or zipcode) to lon&lat: https://openweathermap.org/api/geocoding-api
// router.get("/zip", (request, response, next) => {
//     //validate on empty parameters
//     if (!isStringProvided(request.query.zip)) {
//         response.status(400).send({
//             message: "Missing required information"
//         })
//     } else {
//         next()
//     }
// }, (request, response, next) => {
//     //make the api call to get long and lat based on location (city or state or zipcode)
//     let zip = request.query.zip
//     let url = "https://api.openweathermap.org/geo/1.0/zip?zip=" + zip +"&appid=" + weather_api_key
//     let body = ""

//     https.get(url, res => {
//         res.on('data', chunk => {
//             body += chunk
//         });

//         res.on('end', () => {
//             body = JSON.parse(body)
//             console.log('lat ', body.lat)
//         });
    
//     }).on('error', err => {
//         console.log("Error ", err)
//     });

// })

module.exports = router