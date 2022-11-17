//express is the framework we're going to use to handle requests
const { response } = require("express");
const express = require("express");

//request module is needed to make a request to a web service
const request = require("request");

const middleware = require("../middleware");
const pool = require("../utilities/sql_conn");

//API key of the OpenWeatherMap API
require("dotenv").config();
const weatherApiKey = process.env.WEATHER_API_KEY1;

const router = express.Router();

/**
 * @api {get} /weather/zipcode/:zipcode Request for current, hourly, and daily weather information in imperial units. (Zipcode)
 * @apiName GetWeatherZipcode
 * @apiGroup Get Weather
 *
 * @apiHeader {String} JWT the jwt of the user
 *
 * @apiparam {Number} zipcode Zipcode of desired location.
 *
 * @apiSuccess (Success 200) {json} Success json object of weather information
 *
 * @apiSuccessExample {json} Success-Response:
 * 
 *  Will show later
 * 
 * * @apiError (400: Invalid Zipcode) {String} message "Invalid zipcode"
 *
 */

// 
router.get("/zipcode/:zipcode", middleware.checkToken, (req, res, next) => {
    let query = "select * from members where memberid = $1";
    let values = [req.decoded.memberid];
    pool.query(query, values)
        .then((result) => {
            if (result.rowCount == 1) {
                next();
            } else {
                res.status(400).send({
                    message: "User not found",
                });
            }
        }).catch((err) => {
            res.status(500).send({
                message: "SQL Error",
                error: err,
            });
        });
    }, (req, res) => {
        // Direct geocoding converts the specified name of a location or zip/post code into the exact geographical coordinates;
        // convert to Coordinates by zip/post code
        // http://api.openweathermap.org/geo/1.0/zip?zip={zip code},{country code}&appid={API key}
        const { zipcode } = req.params;
        let geoUrl = `http://api.openweathermap.org/geo/1.0/zip?zip=${zipcode}&appid=${weatherApiKey}`;

        /**  request the latitude and longitude data from zipcoe
         *  Example of the api call response:
         *  {
         *      "zip": "98402",
         *      "name": "Tacoma",
         *      "lat": 47.2545,
         *      "lon": -122.4405,
         *      "country": "US"
         *  }
         */
        request(geoUrl, function (error, response, body) {
            if (error) {
                res.status(400).send({
                    message: "Invalid zipcode: " + zipcode,
                });
                return;
            } else {
                let geo = JSON.parse(body);
                if (geo.cod == 404) {
                    res.status(400).send({
                        message: "Invalid zipcode: " + zipcode,
                    });
                    return;
                } else if (geo.cod == 400) {
                    res.status(400).send({
                        message: "Invalid zipcode: " + zipcode,
                    });
                    return;
                }
                let lat = geo.lat;
                let lon = geo.lon;
                let city = geo.name;
                
                /*
                *   Call the OpenWeatherMap
                *   https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude={part}&appid={API key}
                */
                let weatherApiURL = `https://api.openweathermap.org/data/3.0/onecall?exclude=minutely,alerts&lat=${lat}&lon=${lon}&appid=${weatherApiKey}`;
                // if it is a valid zipcode, get the current, hourly, and daily weather
                request(weatherApiURL, function (error, response, body) {
                    if (error) {
                        res.status(400).send({
                            message: "Invalid zipcode: " + zipcode,
                        });
                        return;
                    } else {
                        // sending weather information along with city name
                        var result = JSON.parse(body);
                        result["city"] = city;
                        res.status(200).send(result);
                    }
                });
            }
        });
    }
);
