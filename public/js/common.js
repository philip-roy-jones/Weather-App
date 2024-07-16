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
    div.textContent = suggestion;
    div.className = 'suggestion-item';
    div.addEventListener('click', () => {
      document.getElementById('location-input').value = suggestion;
      suggestionsContainer.innerHTML = '';
    });
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