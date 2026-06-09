// Global DOM Selectors
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
const errorBox = document.getElementById('error-box');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherDesc = document.getElementById('weather-desc');
const weatherIcon = document.getElementById('weather-icon');
const humidity = document.getElementById('humidity');
const conditionStatus = document.getElementById('condition-status');

// App Lifecycle Init
document.addEventListener('DOMContentLoaded', () => {
    // TASK REQUIREMENT: App start hote hi automatic live location detect karega
    getLiveUserLocation();

    // Event Bindings
    searchBtn.addEventListener('click', runSearchPipeline);
    cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') runSearchPipeline(); });
    geoBtn.addEventListener('click', getLiveUserLocation);
});

// CONCEPT: Detecting user's current location using the Geolocation API
function getLiveUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            (error) => {
                console.warn("Location permission denied. Loading fallback.");
                fetchWeatherByCityName('Quetta'); // Fallback safe local setting
            }
        );
    } else {
        fetchWeatherByCityName('Quetta');
    }
}

// CONCEPT: Fetching data from APIs using fetch() by Coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        errorBox.classList.add('hidden');
        // Public Free open API context: Uses weather.gov / open-meteo proxy rules safely
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`);
        
        if (!response.ok) throw new Error();
        const data = await response.json(); // CONCEPT: Handling JSON responses
        
        // Reverse geocoding for UI city text names fallback
        cityName.textContent = "My Live Location";
        processAndRenderData(data.current);
    } catch (err) {
        showErrorUI();
    }
}

// CONCEPT: Fetching data from APIs using fetch() by City Name Input
async function fetchWeatherByCityName(city) {
    try {
        errorBox.classList.add('hidden');
        
        // Geocoding public step to resolve name string to lat/lon without restricted keys
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoResponse.json();
        
        // ✅ Handle errors for incorrect city names
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City matches no valid spatial lookup context');
        }
        
        const target = geoData.results[0];
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${target.latitude}&longitude=${target.longitude}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`);
        
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        cityName.textContent = `${target.name}, ${target.country_code || ''}`;
        processAndRenderData(data.current);
    } catch (err) {
        showErrorUI();
    }
}

// UI Rendering Engine (CONCEPT: Updating the DOM dynamically)
function processAndRenderData(currentData) {
    const temp = Math.round(currentData.temperature_2m);
    const humidValue = currentData.relative_humidity_2m;
    const code = currentData.weather_code;

    // Set metrics text nodes safely
    temperature.textContent = `${temp}°C`;
    humidity.textContent = `${humidValue}%`;

    // Map WMO Weather Codes to String states and Icons
    let textState = "Clear";
    let iconClass = "fa-solid fa-sun text-amber-400"; // ☀️ Sunny
    let bgImage = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80"; // Clear design background

    if (code === 0) {
        textState = "Sunny / Clear";
        iconClass = "fa-solid fa-sun text-amber-400"; // ☀️ Sunny
        bgImage = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80";
    } else if ([1, 2, 3].includes(code)) {
        textState = "Cloudy";
        iconClass = "fa-solid fa-cloud text-slate-300"; // ☁️ Cloudy
        bgImage = "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80";
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
        textState = "Rainy";
        iconClass = "fa-solid fa-cloud-showers-heavy text-sky-400"; // 🌧️ Rainy
        bgImage = "https://images.unsplash.com/photo-1438449805896-28a666819a20?auto=format&fit=crop&w=1920&q=80";
    } else {
        textState = "Atmospheric / Overcast";
        iconClass = "fa-solid fa-cloud-bolt text-yellow-500";
        bgImage = "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80";
    }

    // Apply state strings dynamically
    weatherDesc.textContent = textState;
    conditionStatus.textContent = textState;
    
    // ✅ Show an appropriate weather icon
    weatherIcon.innerHTML = `<i class="${iconClass}"></i>`;

    // ✅ ADDITIONAL CHALLENGE: Add a background image that changes based on weather conditions
    document.body.style.backgroundImage = `url('${bgImage}')`;
}

// Pipeline Controller Trigger
function runSearchPipeline() {
    const inputVal = cityInput.value.trim();
    if (inputVal) fetchWeatherByCityName(inputVal);
}

function showErrorUI() {
    errorBox.classList.remove('hidden');
    cityName.textContent = "Error";
    temperature.textContent = "--°C";
    weatherDesc.textContent = "--";
    conditionStatus.textContent = "--";
    humidity.textContent = "--%";
    weatherIcon.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-400"></i>`;
}