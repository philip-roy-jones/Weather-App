const stateAbbreviations = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

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
  const unitToggle = document.getElementById("unit-dropdown-toggle");
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

  const weekElement = document.getElementById("week");
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

    // Fetch current weather data
    fetch("/weather", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat: latitude, lon: longitude, units: units }),
    })
      .then((weatherResponse) => weatherResponse.json())
      .then((currentData) => {
        // Fetch forecast data
        fetch("/forecast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ lat: latitude, lon: longitude, units: units }),
        })
          .then((forecastResponse) => forecastResponse.json())
          .then((weekData) => {
            fetch("/reverse", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ lat: latitude, lon: longitude }),
            })
              .then((reverseResponse) => reverseResponse.json())
              .then((reverseData) => {
                if (currentData && weekData) {
                  console.log("Weather Data");
                  console.log(currentData.weatherData);
                  console.log("Forecast Data");
                  console.log(weekData.forecastData);
                  console.log("Reverse Data");
                  console.log(reverseData.reverseData[0]);
                  renderContent(
                    currentData.weatherData,
                    weekData.forecastData,
                    reverseData.reverseData[0]
                  );
                } else {
                  console.error("Error fetching weather or forecast data");
                }
              })
              .catch((error) => {
                console.error("error fetcching reverse data:", error);
              });
          })
          .catch((error) => {
            console.error("Error fetching forecast data:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching weather data:", error);
      });

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

  function titleize(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  function renderContent(currentData, weekData, reverseData) {
    const currentDate = new Date(currentData.dt * 1000);
    const options = {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    const currentTime = currentDate.toLocaleString("en-US", options);

    const stateAbbreviation =
      stateAbbreviations[reverseData.state] || reverseData.state;

    currentSummaryElement.innerHTML = `
            <span id="shaded-in-summary-container" class="current-summary other-summary">${
              reverseData.name
            }, ${stateAbbreviation} As of ${currentTime}</span>
            <div class="flex-container">
                <div id="summary-div">
                    <span class="current-summary temperature-summary">${Math.round(
                      currentData.main.temp,
                      0
                    )}°</span>
                    <span class="current-summary other-summary">${titleize(
                      currentData.weather[0].description
                    )}</span>
                    <span class="current-summary other-summary">
                        Max ${Math.round(
                          currentData.main.temp_max,
                          0
                        )}° • Min ${Math.round(currentData.main.temp_min, 0)}°
                    </span>
                </div>
                <div id="icon-div">
                    <span><img src="https://openweathermap.org/img/wn/${
                      currentData.weather[0].icon
                    }@4x.png"></span>
                </div>
            </div>
        `;

    // Render weekly data
    weekElement.innerHTML = `
            <div class="card-content">
                <h2>3-Hour Forecast</h2>
                <ul>
                    ${weekData.list
                      .map((item) => {
                        // Convert Unix timestamp to local time
                        const localTime = new Date(item.dt * 1000); // Multiply by 1000 to convert to milliseconds

                        return `
                            <li>
                                <strong>${localTime.toLocaleString()}</strong>: ${Math.round(
                          item.main.temp,
                          0
                        )}°, ${item.weather[0].description}
                            </li>
                        `;
                      })
                      .join("")}
                </ul>
            </div>
        `;
    currentDetailElement.innerHTML = `
    <span id="current-detail-header" class="mb-4">Current Weather in ${reverseData.name}, ${stateAbbreviation}</span>
    <div id="current-detail-main">
      <div class="inline-container">
        <div id="feels-like-div" class="left-align">
          <span class="current-detail-subheader">Feels Like</span>
          <span id="feels-like-temp">${Math.round(currentData.main.feels_like, 0)}°</span>
        </div>
        <div class="right-align">
          <h3>Sunset shit</h3>
        </div>
      </div>
      <div class="grid-container mt-4">
        <div class="current-main-item" style="border-top: 0 !important;">
          <span>Ground/Sea Level</span>
          <span class="right-align">995/1547</span>
        </div>
        <div class="current-main-item">
          <span>Wind</span>
          <span id="wind-container" class="right-align">
            <img id="wind-arrow" style="transform: rotate(${currentData.wind.deg}deg)" src="images/icons/wind-arrow.svg" alt="arrow of where the wind is blowing" width="16" height="16">
            <span style="margin-left: 1rem;">
            ${
              localStorage.getItem("units") === "imperial" ? 
              `${Math.round(currentData.wind.speed, 0)} mph` :
              `${Math.round(currentData.wind.speed * 3.6, 0)} km/h`
            }
            </span>
          </span>
        </div>
        <div class="current-main-item">test3</div>
        <div class="current-main-item">test4</div>
      </div>
    </div>
    `;
  }
});
