document.addEventListener("DOMContentLoaded", function () {

  const threeHrForecastElement = document.getElementById("three-hr");
  const currentSummaryElement = document.getElementById("current-summary");
  const currentDetailElement = document.getElementById("current-detail");

  function renderContent() {
    const latitude = localStorage.getItem('latitude');
    const longitude = localStorage.getItem('longitude');
    const units = localStorage.getItem("units") || "imperial";
    
    fetch("/current-data", {
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

          currentSummaryElement.innerHTML = data.currentSummaryHTML;
          currentDetailElement.innerHTML = data.currentDetailHTML;
          threeHrForecastElement.innerHTML = data.threeHrForecastHTML;

          // Style for time/weather
          styleUpdate(data.weatherData.dt, data.weatherData.sys.sunset);

        } else {
          console.error("Error fetching data:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    // Only feature not precompiled backend
    let map = L.map("map").setView([latitude, longitude], 10);

    // Add a base layer (e.g., OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.tileLayer("/map/{layer}/{z}/{x}/{y}", {
      attribution:
        '&copy; <a href="https://www.openweathermap.org/">OpenWeatherMap</a>',
      layer: "precipitation", // Example layer, change as needed
      maxZoom: 18,
    }).addTo(map);
  }

  function styleUpdate(currentTime, sunsetTime) {
    const cyclePath = document.getElementById("path");

    if (currentTime > sunsetTime) {
      cyclePath.style.borderColor = "darkblue";
    } 
  }

  renderContent();
});