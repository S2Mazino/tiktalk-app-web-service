// Get the current weather data
 
const getCurrentWeather = (req, res, next) => {
    if (req.body.data === undefined) {
        res.status(400).send({
            message: 'Missing required weather information',
        });
    } else {
        const temp = Math.round(req.body.data.current.temp);
        const descriptionInput = req.body.data.current.weather[0].description;
        const description = descriptionInput.replace(
            /(^\w{1})|(\s+\w{1})/g,
            (letter) => letter.toUpperCase()
        );
        const humidity = Math.round(req.body.data.current.humidity);
        const feels_like = Math.round(req.body.data.current.feels_like);
        const icon = req.body.data.current.weather[0].icon;

        req.body.currentWeather = {
            temp: temp,
            description: description,
            humidity: humidity,
            feels_like: feels_like,
            icon: icon,
        };
        next();
    }
};

// Get the hourly data
const getHourlyForecast = (req, res, next) => {
    let hours = [];
    let hourValue, tempValue, icon;
    const readableDate = new Date(req.body.dt);

    hourValue = readableDate.getHours();

    for (let i = 0; i < 24; i++) {
        tempValue = Math.round(req.body.data.hourly[i].temp);
        icon = req.body.data.hourly[i].weather[0].icon;

        hours[i] = {
            hours: hourValue,
            temp: tempValue,
            icon: icon,
        };
        hourValue = (hourValue + 1) % 24;
    }
    req.body.hourlyForecast = hours;
    next();
};

// Get the daily data
const getDailyForecast = (req, res, next) => {
    let days = [];
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const readableDate = new Date(req.body.dt);
    let dayIndex = readableDate.getDay();

    for (let i = 0; i < 7; i++) {
        const currentDay = dayHeaders[dayIndex];
        const dayTemp = Math.round(req.body.data.daily[i].temp.day);
        const dayIcon = req.body.data.daily[i].weather[0].icon;

        days[i] = {
            day: currentDay,
            temp: dayTemp,
            icon: dayIcon,
        };
        dayIndex = (dayIndex + 1) % 7;
    }
    req.body.dailyForecast = days;
    next();
};

// Convert to the local time using the timezone offset from the api JSON
 
const localTimeZone = (req, res, next) => {
    const currentTime = new Date();
    const currentUTC = currentTime.getTime() + currentTime.getTimezoneOffset() * 60000;
    const currentTimeLoc = currentUTC + req.body.data.timezone_offset * 1000;
    req.body.currTime = currentTimeLoc;
    next();
};

module.exports = {
    getCurrentWeather,
    getHourlyForecast,
    getDailyForecast,
    localTimeZone,
};