import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv'

dotenv.config();

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
const bearerToken = process.env.BEARER_TOKEN;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", async (req, res) => {
    const weatherData = req.query.weatherData ? JSON.parse(req.query.weatherData) : null;
    const forecastData = req.query.forecastData ? JSON.parse(req.query.forecastData) : null;

    res.render('index', { weatherData: weatherData, forecastData: forecastData });
});

app.post('/set-units', (req, res) => {
    const units = req.body.units; // Extract units from request body
  
    // Optionally validate units (ensure it's 'metric', 'imperial', or 'standard')
    if (!['metric', 'imperial', 'standard'].includes(units)) {
        return res.status(400).json({ status: 'error', message: 'Invalid units specified' });
    }

    // Implement logic to store units in backend or use it in subsequent API calls
    console.log('Received units:', units);
  
    // Respond to frontend with success message or data
    res.status(200).send('Units updated successfully');
  });

app.post("/weather", async (req, res) => {
    const { lat, lon, units } = req.body;

    const API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${bearerToken}`;
    try {
        const result = await axios.get(API_URL);
        // console.log(result);
        res.json({ status: 'success', weatherData: result.data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post("/forecast", async (req, res) => {
    const { lat, lon, units } = req.body;
    
    const API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${bearerToken}`;
    try {
        const result = await axios.get(API_URL);
        // console.log(result);
        res.json({ status: 'success', forecastData: result.data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post("/reverse", async (req, res) => {
    const {lat, lon, units} = req.body;

    const API_URL = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&units=${units}&appid=${bearerToken}`

    try {
        const result = await axios.get(API_URL);
        // console.log(result);
        res.json({ status: 'success', reverseData: result.data});
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/map/:layer/:z/:x/:y', async (req, res) => {
    const { layer, z, x, y } = req.params;
    try {
        const response = await axios.get(`https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${bearerToken}`, {
            responseType: 'arraybuffer'
        });
        res.setHeader('Content-Type', 'image/png');
        res.send(response.data);
        // console.log("Success");
    } catch (error) {
        res.status(500).send('Error fetching map tile');
        // console.log("We fucked up");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});
