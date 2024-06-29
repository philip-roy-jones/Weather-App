import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import ejs from 'ejs';

function titleize(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

const stateAbbreviations = {
  "Alabama": "AL",
  "Alaska": "AK",
  "Arizona": "AZ",
  "Arkansas": "AR",
  "California": "CA",
  "Colorado": "CO",
  "Connecticut": "CT",
  "Delaware": "DE",
  "Florida": "FL",
  "Georgia": "GA",
  "Hawaii": "HI",
  "Idaho": "ID",
  "Illinois": "IL",
  "Indiana": "IN",
  "Iowa": "IA",
  "Kansas": "KS",
  "Kentucky": "KY",
  "Louisiana": "LA",
  "Maine": "ME",
  "Maryland": "MD",
  "Massachusetts": "MA",
  "Michigan": "MI",
  "Minnesota": "MN",
  "Mississippi": "MS",
  "Missouri": "MO",
  "Montana": "MT",
  "Nebraska": "NE",
  "Nevada": "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  "Ohio": "OH",
  "Oklahoma": "OK",
  "Oregon": "OR",
  "Pennsylvania": "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  "Tennessee": "TN",
  "Texas": "TX",
  "Utah": "UT",
  "Vermont": "VT",
  "Virginia": "VA",
  "Washington": "WA",
  "West Virginia": "WV",
  "Wisconsin": "WI",
  "Wyoming": "WY"
};

dotenv.config();

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const bearerToken = process.env.BEARER_TOKEN;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
  res.render("index");
});

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
    const currentAPI = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${bearerToken}`;
    const forecastAPI = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${bearerToken}`;
    const reverseAPI = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${bearerToken}`;

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

    // Current Summary Rendering
    var templateData = {
      locationName: reverseData.name,
      stateAbbreviation: stateAbbreviation,
      currentTime: new Date(currentData.dt * 1000).toLocaleDateString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
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

    // Current Detail Rendering
    templateData = {
      locationName: reverseData.name,
      stateAbbreviation: stateAbbreviation,
      feelsLikeTemp: Math.round(currentData.main.feels_like),
      sunriseTime: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
      sunsetTime: new Date(currentData.sys.sunset * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
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
    templateData = {

    }

    const threeHRForecastHTML = await ejs.renderFile(
      path.join(__dirname, "views", "partials", "three-hr-forecast.ejs"),
      templateData
    )

    res.json({
      status: "success",
      currentSummaryHTML: currentSummaryHTML,
      currentDetailHTML: currentDetailHTML,
      threeHrForecastHTML: threeHRForecastHTML,
      weatherData: currentData,
      forecastData: forecastData,
      reverseData: reverseData,
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Needs to remain separate due to constant updates from user interaction
app.get("/map/:layer/:z/:x/:y", async (req, res) => {
  const { layer, z, x, y } = req.params;
  try {
    const response = await axios.get(
      `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${bearerToken}`,
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
