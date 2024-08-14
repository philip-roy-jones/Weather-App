import { locationStorage } from "./common.js";

document.addEventListener("DOMContentLoaded", function () {
  function renderContent() {
    const latitude = localStorage.getItem("latitude");
    const longitude = localStorage.getItem("longitude");
    const units = localStorage.getItem("units") || "imperial";

    fetch("/5-day-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat: latitude, lon: longitude, units: units }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          console.log("Current Weather Data");
          console.log(data.weatherData);
          console.log("Forecast Weather Data");
          console.log(data.forecastData);
          console.log("Reverse Geolocation Data");
          console.log(data.reverseData);

          locationStorage.push({
            weatherData: data.weatherData,
            reverseData: data.reverseData,
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

  renderContent()
});
