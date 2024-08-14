import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import ejs from 'ejs';
import {stateAbbreviations} from './shared/stateAbbreviations.js';

function titleize(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

dotenv.config();

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const openWeatherMapToken = process.env.OPEN_WEATHER_MAP_TOKEN;
const googleKey = process.env.GOOGLE_KEY

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
  res.render("index");
});

app.get("/current", (req, res) => {
  res.render("current");
});

app.get("/5-day", (req, res) => {
  res.render("5-day");
})

app.get("/air-pollution", (req, res) => {
  res.render("air-pollution");
})

app.post("/set-units", (req, res) => {
  const units = req.body.units; // Extract units from request body

  // Optionally validate units (ensure it's 'metric', 'imperial', or 'standard')
  if (!["metric", "imperial", "standard"].includes(units)) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid units specified" });
  }

  // Implement logic to store units in backend or use it in subsequent API calls
  console.log("Received units:", units);

  // Respond to frontend with success message or data
  res.status(200).send("Units updated successfully");
});

app.post("/current-data", async (req, res) => {
  const { lat, lon, units } = req.body;

  try {
    const currentAPI = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${openWeatherMapToken}`;
    const forecastAPI = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${openWeatherMapToken}`;
    const reverseAPI = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${openWeatherMapToken}`;

    // Make API requests in parallel
    const [currentResponse, forecastResponse, reverseResponse] =
      await Promise.all([
        axios.get(currentAPI),
        axios.get(forecastAPI),
        axios.get(reverseAPI),
      ]);

    const currentData = currentResponse.data;
    const forecastData = forecastResponse.data;
    const reverseData = reverseResponse.data[0];

    const stateAbbreviation =
      stateAbbreviations[reverseData.state] || reverseData.state;

    function formatUTCToTime(unixTS, timeOffset) {
      const offset = (timeOffset * 1000);
      const utcDate = new Date(unixTS * 1000 + offset);

      let hours = utcDate.getUTCHours();
      let minutes = utcDate.getUTCMinutes();
      const amOrPm = hours >= 12 ? 'PM' : 'AM'

      // Formatting
      hours = hours % 12;
      hours = hours ? hours: 12; // If hour is '0' it should really be '12'

      minutes = minutes < 10 ? '0' + minutes : minutes;   // Minutes should always have two digits

      return `${hours}:${minutes} ${amOrPm}`;
    }

    // Current Summary Rendering
    let templateData = {
      locationName: reverseData.name,
      stateAbbreviation: stateAbbreviation,
      currentTime : formatUTCToTime(currentData.dt, currentData.timezone),
      currentTemp: Math.round(currentData.main.temp),
      weatherDescription: titleize(currentData.weather[0].description),
      maxTemp: Math.round(currentData.main.temp_max),
      minTemp: Math.round(currentData.main.temp_min),
      weatherIcon: currentData.weather[0].icon,
    };
    
    const currentSummaryHTML = await ejs.renderFile(
      path.join(__dirname, "views", "partials", "current-summary.ejs"),
      templateData
    );

    // Calculating the degree of the cycle
    const lengthOfDay = currentData.sys.sunset - currentData.sys.sunrise;
    const timeElapse = currentData.dt - currentData.sys.sunrise;
    const timeElapseToLengthOfDay = timeElapse/lengthOfDay;

    // Current Detail Rendering
    templateData = {
      locationName: reverseData.name,
      stateAbbreviation: stateAbbreviation,
      feelsLikeTemp: Math.round(currentData.main.feels_like),
      sunriseTime: formatUTCToTime(currentData.sys.sunrise, currentData.timezone),
      sunsetTime: formatUTCToTime(currentData.sys.sunset, currentData.timezone),
      timeElapseToLengthOfDay: timeElapseToLengthOfDay,
      windSpeed: currentData.wind.speed,
      windDegree: currentData.wind.deg,
      windGust: currentData.wind.gust,
      humidity: currentData.main.humidity,
      pressure: currentData.main.pressure,
      groundPressure: currentData.main.grnd_level,
      seaPressure: currentData.main.sea_level,
      visibility: currentData.visibility,
      cloudiness: currentData.clouds.all,
      rain1H: currentData.rain?.["1h"] ?? null,  // Optional chaining and nullish coalescing operator
      rain3H: currentData.rain?.["3h"] ?? null,  // Optional chaining and nullish coalescing operator
      snow1H: currentData.snow?.["1h"] ?? null,  // Optional chaining and nullish coalescing operator
      snow3H: currentData.snow?.["3h"] ?? null,  // Optional chaining and nullish coalescing operator
      units: units,
    }

    const currentDetailHTML = await ejs.renderFile(
      path.join(__dirname, "views", "partials", "current-detail.ejs"),
      templateData
    );

    // 3hr Forecast Rendering
    const forecastTimeZone = forecastData.city.timezone * 1000
    const forecastTimes = forecastData.list.slice(0, 4).map(item => {

      const utcDate = new Date(item.dt * 1000 + forecastTimeZone)
      let hours = utcDate.getUTCHours()
      const amOrPm = hours >= 12 ? 'PM' : 'AM'

      hours = hours % 12;
      hours = hours ? hours: 12; // If hour is '0' it should really be '12'

      return `${hours} ${amOrPm}`
    });

    templateData = {
      forecastListData: forecastData.list,
      forecastTimes: forecastTimes,
      currentData: currentData
    }

    const threeHRForecastHTML = await ejs.renderFile(
      path.join(__dirname, "views", "partials", "three-hr-forecast.ejs"),
      templateData
    )
    
    res.json({
      currentSummaryHTML: currentSummaryHTML,
      currentDetailHTML: currentDetailHTML,
      threeHrForecastHTML: threeHRForecastHTML,
      weatherData: currentData,
      forecastData: forecastData,
      reverseData: reverseData,
      status: "success"
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.post("/5-day-data", async (req, res) => {
  const { lat, lon, units } = req.body;

  try {
    const currentAPI = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${openWeatherMapToken}`;
    const forecastAPI = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${openWeatherMapToken}`;
    const reverseAPI = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${openWeatherMapToken}`;

    // Make API requests in parallel
    const [currentResponse, forecastResponse, reverseResponse] =
    await Promise.all([
      axios.get(currentAPI),
      axios.get(forecastAPI),
      axios.get(reverseAPI),
    ]);

    const currentData = currentResponse.data;
    const forecastData = forecastResponse.data;
    const reverseData = reverseResponse.data[0];

    const dayHash = {};
    const timeOffset = forecastData.city.timezone
    for (const item of forecastData.list) {
      const unix = item.dt * 1000 + timeOffset * 1000
      const date = new Date(unix)
      const utcDate = date.getUTCDate();
      (dayHash[utcDate] ??= []).push(item)
    }

    res.json({
      weatherData: currentData,
      forecastData: forecastData,
      reverseData: reverseData,
      status: "success"
    })

  } catch (error) {
    console.log(`ERROR: ${error.message}`)
    res.status(500).json({ status: "error", message: error.message });
  }
})

// Needs to remain separate due to constant updates from user interaction
app.get("/map/:layer/:z/:x/:y", async (req, res) => {
  const { layer, z, x, y } = req.params;
  try {
    const response = await axios.get(
      `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${openWeatherMapToken}`,
      {
        responseType: "arraybuffer",
      }
    );
    res.setHeader("Content-Type", "image/png");
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error fetching map tile");
  }
});

app.get('/api/location-suggestions', async (req, res) => {
  const query = req.query.query.toLocaleLowerCase();
  const autocompleteAPI = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${googleKey}`;

  try {
    const response = await axios.get(autocompleteAPI);

    if (response.status !== 200) {
      throw new Error('Failed to fetch from Google Places API');
    }
    const suggestions = response.data.predictions.map(prediction => ({ description: prediction.description, placeID: prediction.place_id }));

    // const jsonData = JSON.stringify(response.data, null, 2);
    // const filePath = './test.json';
    // (async () => {
    //   try {
    //     await fs.writeFile(filePath, jsonData, 'utf8');
    //     console.log('JSON data has been written to', filePath);
    //   } catch (err) {
    //     console.error('Error writing file:', err);
    //   }
    // })();

    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching location suggestions:', error.message);
    res.status(500).json({ error: 'Failed to fetch location suggestions' });
  }
});

app.post('/api/get-coordinates', async (req, res) => {
  const { selection } = req.body;
  const fields = 'geometry/location'; // Specify the fields you want to retrieve to save money
  const placeDetailsAPI = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${selection}&fields=${fields}&key=${googleKey}`;

  try {
    const response = await axios.get(placeDetailsAPI);

    if (response.status !== 200) {
      throw new Error('Failed to fetch from Google Places API');
    }

    const { lat, lng } = response.data.result.geometry.location;
    res.json({ lat, lng });
  } catch (error) {
    console.error('Error fetching coordinates:', error.message);
    res.status(500).json({ error: 'Failed to fetch coordinates' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
