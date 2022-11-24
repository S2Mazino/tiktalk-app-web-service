//express is the framework we're going to use to handle requests
const { response } = require("express");
const express = require("express");

const request = require("request");

const middleware = require("../middleware");
const pool = require("../utilities/sql_conn");

require("dotenv").config();

// OpenWeatherMap API Key
const API_KEY = process.env.WEATHER_API_KEY1;

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
 *  --- Let see the result ---
 *
 * @apiError (400: Invalid Zipcode) {String} message c
 *
 */

// get zipcode from the user
router.get("/zipcode/:zipcode",(req, res) => {
        const { zipcode } = req.params;

        /*
        * Use the Geocoding API to convert zipcode that receive from the user then convert to the coordinates, latitude and longitude
        * Example result from Geocoding API
        * {
        *       "zip": "98402",
        *       "name": "Tacoma",
        *       "lat": 47.2545,
        *       "lon": -122.4405,
        *       "country": "US"
        * }
        */

        const geoURL = `http://api.openweathermap.org/geo/1.0/zip?zip=${zipcode}&appid=${API_KEY}`;
        request(geoURL, function (error, response, body) {
            if (error) {
                res.status(400).send({
                    message: "Invalid zipcode: " + zipcode,
                });
                return;
            } else {
                let geoInfo = JSON.parse(body);
                if (geoInfo.cod == 404) {
                    res.status(400).send({
                        message: "Invalid zipcode: " + zipcode,
                    });
                    return;
                } else if (geoInfo.cod == 400) {
                    res.status(400).send({
                        message: "Invalid zipcode: " + zipcode,
                    });
                    return;
                }
                let lat = geoInfo.lat;
                let lon = geoInfo.lon;
                let city = geoInfo.name;

                // Use latitude and longitude for the weather API call
                // https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude={part}&appid={API key}

                let weatherURL = `https://api.openweathermap.org/data/3.0/onecall?exclude=minutely,alerts&lat=${lat}&lon=${lon}&appid=${API_KEY}`;
                
                // check if there are invalid lat and lon
                request(weatherURL, function (error, response, body) {
                    if (error) {
                        res.status(400).send({
                                message: "Invalid coordinates: lat " + lat + ", lon " + lon,
                        });
                        return;
                    } else {

                        /*********************************************
                        * The data need for the current weather API *
                        *********************************************/

                        let result = JSON.parse(body);
                        const currTempValue = result.current.temp;
                        const currTempF = Math.round ((9/5)*(currTempValue - 273.15) + 32);
                        const currTempC = Math.round (currTempValue - 273.15);
                        const currConditionValue = result.current.weather[0].description;
                        const currWeatherCondition = currConditionValue.replace(
                            /(^\w{1})|(\s+\w{1})/g,
                            (letter) => letter.toUpperCase()
                        );
                        const currIconValue = result.current.weather[0].icon;
                        const currIcon = 'http://openweathermap.org/img/wn/' + currIconValue + '@4x.png'

                        /************************************************
                        * The data need for the hourly weather forecast *
                        ************************************************/
                        
                         let hourly = [];
                         const hourHeaders = [ '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM', '12Pm']; 
                         let hourValue, hourlyAvgTemp, hourlyTempF, hourlyTempC, hourlyIconValue, hourlyIcon, hourlyPop;
     
                         for (let i = 0; i < 24; i++) {
                             const dt = result.hourly[i].dt;
                             const targetTime = new Date(dt * 1000);
                             hourValue = hourHeaders[targetTime.getHours()];
                             hourlyAvgTemp = result.hourly[i].temp;
                             hourlyTempF = Math.round ((9/5)*(hourlyAvgTemp - 273.15) + 32);
                             hourlyTempC = Math.round (hourlyAvgTemp - 273.15);
                             hourlyIconValue = result.hourly[i].weather[0].icon;
                             hourlyIcon = 'http://openweathermap.org/img/wn/' + hourlyIconValue + '@4x.png'
                             hourlyPop = result.hourly[i].pop * 100;
     
                             hourly[i] = {
                                 hours: hourValue,
                                 tempF: hourlyTempF,
                                 tempC: hourlyTempC,
                                 iconValue: hourlyIconValue,
                                 icon: hourlyIcon,
                                 pop: hourlyPop,
                             };
                         }  
 
                        /***********************************************
                        * The data need for the daily weather forecast *
                        ***********************************************/

                         let daily = [];
                         const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                         let dayValue, day, dayTemp, dayTempF, dayTempC, minTemp, minTempF, minTempC, maxTemp, maxTempF, maxTempC, dayIconValue, dayIcon, dayPop;
                     
                         for (let i = 0; i < 7; i++) {
                                
                                 dayValue = (Math.floor(result.daily[i].dt/86400) + 4) % 7;
                                 //hourValue = hourHeaders[targetTime.getHours()];
                                 day = dayHeaders[dayValue];
                                 dayTemp = result.daily[i].temp.day;
                                 dayTempF = Math.round ((9/5)*(dayTemp - 273.15) + 32);
                                 dayTempC = Math.round (dayTemp - 273.15);
                                 minTemp = result.daily[i].temp.min;
                                 minTempF = Math.round ((9/5)*(minTemp - 273.15) + 32);
                                 minTempC = Math.round (minTemp - 273.15);
                                 maxTemp = result.daily[i].temp.max;
                                 maxTempF = Math.round ((9/5)*(maxTemp - 273.15) + 32);
                                 maxTempC = Math.round (maxTemp - 273.15);
                                 dayIconValue = result.daily[i].weather[0].icon;
                                 dayIcon = 'http://openweathermap.org/img/wn/' + dayIconValue + '@4x.png'
                                 dayPop = result.daily[i].pop * 100;

                                 daily[i] = {
                                         day: day,
                                         tempF: dayTempF,
                                         tempC: dayTempC,
                                         minTempF: minTempF,
                                         minTempC: minTempC,
                                         maxTempF: maxTempF,
                                         maxTempC: maxTempC,
                                         iconValue: dayIconValue,
                                         icon: dayIcon,
                                         pop: dayPop,
                                 };
                         }   

                        res.status(200).send({
                            current: {
                                tempF: currTempF,
                                tempC: currTempC,
                                condition: currWeatherCondition,
                                iconValue: currIconValue,
                                icon: currIcon,
                            },
                            hourly,
                            daily,
                            city: city,
                        });
                    }
                });
            }
        });
    }
    
);

/**
 * @api {get} /weather/lat-lon/:lat/:lon Request for current, hourly, and daily weather information in imperial units. (Lat/Lon)
 * @apiName GetWeatherLatLon
 * @apiGroup Get Weather
 *
 * @apiHeader {String} JWT jwt of the user
 *
 * @apiParam {Number} lat Latitude of desired location.
 * @apiParam {Number} lon Longitude of desired location.
 *
 *
 * @apiSuccess (Success 200) {json} Success json object of weather information
 *
 * @apiSuccessExample {json} Success-Response:
 * 
 *  --- Let see the result ---
 *
 * @apiError (400: Invalid Latitude and/or Longitude) {String} message "Invalid Latitude and/or Longitude"
 *
 */

// get latitude and longitude from the user
router.get("/lat-lon/:lat/:lon", (req, res) => {
        //getting user input lat and long
        const { lat } = req.params;
        const { lon } = req.params;

        // Get the city name from latitude and longitude
        let cityURL = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        //sends request to get the city and country of the latitude and longitude
        request(cityURL, function (error, response, body) {
            if (error) {
                res.status(400).send({
                    message: "Invalid latitude: " + lat + ", or longitude: " + lon,
                });
            } else {
                let cityInfo = JSON.parse(body);
                if (cityInfo.length >= 1) {
                    let city = cityInfo[0].name;
                    
                    // Use latitude and longitude for the weather API call
                // https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude={part}&appid={API key}

                let weatherURL = `https://api.openweathermap.org/data/3.0/onecall?exclude=minutely,alerts&lat=${lat}&lon=${lon}&appid=${API_KEY}`;
                
                // check if there are invalid lat and lon
                request(weatherURL, function (error, response, body) {
                    if (error) {
                        res.status(400).send({
                                message: "Invalid coordinates: lat " + lat + ", lon " + lon,
                        });
                        return;
                    } else {

                        /*********************************************
                        * The data need for the current weather API *
                        *********************************************/

                        let result = JSON.parse(body);
                        const currTempValue = result.current.temp;
                        const currTempF = Math.round ((9/5)*(currTempValue - 273.15) + 32);
                        const currTempC = Math.round (currTempValue - 273.15);
                        const currConditionValue = result.current.weather[0].description;
                        const currWeatherCondition = currConditionValue.replace(
                            /(^\w{1})|(\s+\w{1})/g,
                            (letter) => letter.toUpperCase()
                        );
                        const currIconValue = result.current.weather[0].icon;
                        const currIcon = 'http://openweathermap.org/img/wn/' + currIconValue + '@4x.png'

                        /************************************************
                        * The data need for the hourly weather forecast *
                        ************************************************/
                        
                        let hourly = [];
                        const hourHeaders = [ '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM', '12Pm']; 
                        let hourValue, hourlyAvgTemp, hourlyTempF, hourlyTempC, hourlyIconValue, hourlyIcon, hourlyPop;
    
                        for (let i = 0; i < 24; i++) {
                            const dt = result.hourly[i].dt;
                            const targetTime = new Date(dt * 1000);
                            hourValue = hourHeaders[targetTime.getHours()];
                            hourlyAvgTemp = result.hourly[i].temp;
                            hourlyTempF = Math.round ((9/5)*(hourlyAvgTemp - 273.15) + 32);
                            hourlyTempC = Math.round (hourlyAvgTemp - 273.15);
                            hourlyIconValue = result.hourly[i].weather[0].icon;
                            hourlyIcon = 'http://openweathermap.org/img/wn/' + hourlyIconValue + '@4x.png'
                            hourlyPop = result.hourly[i].pop * 100;
    
                            hourly[i] = {
                                hours: hourValue,
                                tempF: hourlyTempF,
                                tempC: hourlyTempC,
                                iconValue: hourlyIconValue,
                                icon: hourlyIcon,
                                pop: hourlyPop,
                            };
                        }  

                        /***********************************************
                        * The data need for the daily weather forecast *
                        ***********************************************/

                         let daily = [];
                         const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                         let dayValue, day, dayTemp, dayTempF, dayTempC, minTemp, minTempF, minTempC, maxTemp, maxTempF, maxTempC, dayIconValue, dayIcon, dayPop;
                     
                         for (let i = 0; i < 7; i++) {
                                 const targetTime = new Date(result.daily[i].dt * 1000);
                 
                                 dayValue = (Math.floor(result.daily[i].dt/86400) + 4) % 7;
                                 //hourValue = hourHeaders[targetTime.getHours()];
                                 day = dayHeaders[dayValue];
                                 dayTemp = result.daily[i].temp.day;
                                 dayTempF = Math.round ((9/5)*(dayTemp - 273.15) + 32);
                                 dayTempC = Math.round (dayTemp - 273.15);
                                 minTemp = result.daily[i].temp.min;
                                 minTempF = Math.round ((9/5)*(minTemp - 273.15) + 32);
                                 minTempC = Math.round (minTemp - 273.15);
                                 maxTemp = result.daily[i].temp.max;
                                 maxTempF = Math.round ((9/5)*(maxTemp - 273.15) + 32);
                                 maxTempC = Math.round (maxTemp - 273.15);
                                 dayIconValue = result.daily[i].weather[0].icon;
                                 dayIcon = 'http://openweathermap.org/img/wn/' + dayIconValue + '@4x.png'
                                 dayPop = result.daily[i].pop * 100;

                                 daily[i] = {
                                         day: day,
                                         tempF: dayTempF,
                                         tempC: dayTempC,
                                         minTempF: minTempF,
                                         minTempC: minTempC,
                                         maxTempF: maxTempF,
                                         maxTempC: maxTempC,
                                         iconValue: dayIconValue,
                                         icon: dayIcon,
                                         pop: dayPop,
                                 };
                         }   

                        res.status(200).send({
                            current: {
                                tempF: currTempF,
                                tempC: currTempC,
                                condition: currWeatherCondition,
                                iconValue: currIconValue,
                                icon: currIcon,
                            },
                            hourly,
                            daily,
                            city: city,
                        });
                    }
                });
                } else {
                    res.status(400).send({
                        message: "Invalid latitude or longitude",
                    });
                }
            }
        });
    }
);

module.exports = router;