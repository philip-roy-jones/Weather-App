function setUnits(units) {
  const currentUnits = localStorage.getItem("units") || "imperial";
  // console.log(`currentUnits`);
  // console.log(currentUnits);
  localStorage.setItem("units", units);

  if (currentUnits !== units) {
    location.reload();
  } else {
    applyUnits();
  }
}

function applyUnits() {
  const units = localStorage.getItem("units") || "imperial";
  // console.log("Units applied:", units);

  const dropdownItems = document.querySelectorAll(
    ".dropdown-menu .dropdown-item"
  );
  dropdownItems.forEach((item) => {
    if (item.getAttribute("onclick").includes(units)) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Update dropdown toggle text based on active unit
  const unitText = document.getElementById("current-unit");

  switch (units) {
    case "imperial":
      unitText.textContent = "°F";
      break;
    case "metric":
      unitText.textContent = "°C";
      break;
    case "standard":
      unitText.textContent = "°K";
      break;
    default:
      unitText.textContent = "Unknown Unit";
      break;
  }
}

document.addEventListener("DOMContentLoaded", function (event) {
  if (!localStorage.getItem("units")) {
    setUnits("imperial");
  } else {
    applyUnits(); // Apply units if already set
  }

  const threeHrForecastElement = document.getElementById("three-hr");
  const currentSummaryElement = document.getElementById("current-summary");
  const currentDetailElement = document.getElementById("current-detail");

  const currentData = window.currentData || {};
  const weekData = window.weekData || {};

  if (currentData && Object.keys(currentData).length > 0) {
    renderContent(currentData, weekData);
  } else {
    getLocation(); // Call function to get location
  }

  function getLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      console.log("Geolocation API not supported.");
      alert("Geolocation is not supported by your browser.");
    }
  }

  function success(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
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
          
        } else {
          console.error("Error fetching data:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    // Only feature not precompiled backend
    var map = L.map("map").setView([latitude, longitude], 10);

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

  function error() {
    console.log("Unable to retrieve your location.");
    alert("Unable to retrieve your location.");
  }

});
