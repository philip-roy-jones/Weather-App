function currentLocationEventListen() {
  
  document.addEventListener('click', async function(event) {
    const currentLocationSpan = document.getElementById('current-location-span');
    
    
    if (event.target === currentLocationSpan) {
      getLocation();
    }
})};

function getLocation() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(localStorage.getItem('latitude') === null || localStorage.getItem('longitude') ===null ? setLocation : setLocationWithLoading, error);
  } else {
    console.log("Geolocation API not supported.");
    alert("Geolocation is not supported by your browser.");
  }
}

function setLocation(positionOrLat, lon = null) {
  try {
    if (typeof positionOrLat === 'object' && positionOrLat.coords) {
      localStorage.setItem('latitude', `${positionOrLat.coords.latitude}`);
      localStorage.setItem('longitude', `${positionOrLat.coords.longitude}`);
      console.log("Location set from position object");
      console.log(positionOrLat.coords.latitude, positionOrLat.coords.longitude)
    } else if (typeof positionOrLat === 'number' && typeof lon === 'number') {
      localStorage.setItem('latitude', `${positionOrLat}`);
      localStorage.setItem('longitude', `${lon}`);
      console.log("Location set from numeric values");
    } else {
      console.error("Invalid Input for setLocation");
    }
  } catch (error) {
    console.error("An error occurred while setting the location:", error);
  }
}

function setLocationWithLoading(positionorLat, lon=null) {
  setLocation(positionorLat, lon=null);
  console.log("reloading page");
  reloadPage();
}

function reloadPage() {
  const currentPath = window.location.pathname;
    if (currentPath !== '/current' && currentPath !== '/5-day' && currentPath !== '/air-pollution') {
      window.location.href = '/current';
    } else {
      window.location.href = currentPath;
    }
}

function error() {
  console.log("Unable to retrieve your location.");
  alert("Unable to retrieve your location.");
}

function setUnits(units) {
  const currentUnits = localStorage.getItem("units") || "imperial";
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
    if (item.id.includes(units)) {
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

document.addEventListener("DOMContentLoaded", function () {

  let lat = localStorage.getItem('latitude')
  let lon = localStorage.getItem('longitude')
  
  if (lat === null || lon === null) {
    getLocation();
  }
  lat = localStorage.getItem('latitude')
  lon = localStorage.getItem('longitude')

  console.log(`Lat: ${lat}, Lon ${lon}`);

  // if (Number(lat) !== 'number' || Number(lon) !== 'number') {
  //   getLocation();
  //   // location.reload()
  //   console.log(`Failed else if`)
  // }

  document.getElementById('imperial-link').addEventListener('click', function () {
    setUnits('imperial');
  });
  document.getElementById('metric-link').addEventListener('click', function () {
    setUnits('metric');
  });
  document.getElementById('standard-link').addEventListener('click', function () {
    setUnits('standard');
  });

  document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
  });

  document.getElementById('suggestions').addEventListener('click', async function (event) {
    if (event.target.classList.contains('suggestion-item')) {
      const placeID = event.target.dataset.placeID;

      // Send the selected suggestion to the backend
      const response = await fetch('/api/get-coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selection: placeID })
      });

      if (response.ok) {
        const data = await response.json();
        const { lat, lng } = data;

        // Store the coordinates in local storage
        localStorage.setItem('latitude', lat);
        localStorage.setItem('longitude', lng);

        reloadPage();
      } else {
        console.error('Failed to get coordinates');
      }
    }
  });

  const units = localStorage.getItem("units");
  if (!units || !["imperial", "metric", "standard"].includes(units)) {   // if units does not exist in local storage or if its not a valid option
    setUnits("imperial");
  } else {
    applyUnits(); // Apply units if already set
  }

  currentLocationEventListen();
});

// Disappearing suggestions div
document.addEventListener('click', function(event) {
  const suggestionsDiv = document.getElementById('suggestions');
  const locationInput = document.getElementById('location-input');
  
  if (!suggestionsDiv.contains(event.target) && event.target !== locationInput) {
    suggestionsDiv.style.display = 'none'; // Hide suggestions
  }
});

// Reappearing suggestions div
document.getElementById('location-input').addEventListener('focus', function() {
  const suggestionsDiv = document.getElementById('suggestions');
  suggestionsDiv.style.display = 'block'; // Show suggestions
});

document.getElementById('location-input').addEventListener('input', debounce(async function() {
  const query = this.value;
  if (query.length > 2) {
    const response = await fetch(`/api/location-suggestions?query=${encodeURIComponent(query)}`);
    const suggestions = await response.json();
    displaySuggestions(suggestions);
  } else {
    document.getElementById('suggestions').innerHTML = '';
  }
}, 300));

function displaySuggestions(suggestions) {
  const suggestionsContainer = document.getElementById('suggestions');
  suggestionsContainer.innerHTML = '';
  suggestions.forEach(suggestion => {
    const div = document.createElement('div');
    div.textContent = suggestion.description;
    div.dataset.placeID = suggestion.placeID;
    div.className = 'suggestion-item';
    suggestionsContainer.appendChild(div);
  });
}

function debounce(fn, delay) {
  let timeoutID;
  return function(...args) {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => fn.apply(this, args), delay);
  };
}



// DEBUG
function checkLocalStorageCapacity() {
    let testKey = 'test';
    let testValue = 'a'.repeat(1024); // 1 KB string
    let i;

    try {
        for (i = 0; i < 10240; i++) { // Try up to 10 MB
            localStorage.setItem(testKey + i, testValue);
        }
    } catch (e) {
        console.log('LocalStorage limit reached:', i, 'KB');
        for (let j = 0; j < i; j++) {
            localStorage.removeItem(testKey + j);
        }
    }
}

// checkLocalStorageCapacity();

function getLocalStorageSize() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            let value = localStorage[key];
            total += key.length + value.length;
        }
    }
    console.log(`Total localStorage size: ${total} bytes`);
    return total;
}

// getLocalStorageSize();

export {setUnits, applyUnits};