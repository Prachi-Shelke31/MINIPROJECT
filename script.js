const apiKey = "7d5e74e7b112e34001dc87b79a2fc7c3";
const weatherApiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const weatherIcon = document.querySelector(".weather-icon");
const AQIFrontView = document.getElementById("AQI");

let cityData = {}; // Unified data object to hold all fetched info

async function fetchCityData(city) {
  try {
    // Fetch weather data from OpenWeatherMap
    const weatherResponse = await fetch(weatherApiUrl + city + `&appid=${apiKey}`);
    if (weatherResponse.status == 404) {
      document.querySelector(".error").style.display = "block";
      document.querySelector(".weather").style.display = "none";
      AQIFrontView.innerHTML = ""; // Clear AQI display if any
      return;
    }
    const weatherData = await weatherResponse.json();

    // Extract city name, coordinates for further API calls
    const cityName = weatherData.name;
    const { lat, lon } = weatherData.coord;

    // Fetch AQI data from Weatherbit API using city name from weather API
    const airRes = await fetch(
      `https://api.weatherbit.io/v2.0/current/airquality?city=${cityName}&key=bc5c2e9a675441e59d93ab9525554ebd`
    );
    const airData = airRes.ok ? await airRes.json() : null;
    const aqi = airData?.data?.[0]?.aqi || null;
    const airStatus = getAQIStatus(aqi);

    // Fetch sunrise and sunset times from Sunrise-Sunset API using coordinates
    const sunriseSunsetUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;
    const sunRes = await fetch(sunriseSunsetUrl);
    const sunData = sunRes.ok ? await sunRes.json() : null;

    // Convert ISO times to local time strings
    let sunriseLocal = "N/A", sunsetLocal = "N/A";
    if (sunData && sunData.status === "OK") {
      sunriseLocal = new Date(sunData.results.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      sunsetLocal = new Date(sunData.results.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Store all fetched data in cityData
    cityData = {
      weather: weatherData,
      aqi,
      airStatus,
      sunrise: sunriseLocal,
      sunset: sunsetLocal,
    };

    // Display all data
    displayWeather(cityData);
    displayAQI(cityData.aqi, cityData.airStatus);
    displaySunriseSunset(cityData.sunrise, cityData.sunset);

    // Show weather container and hide error
    document.querySelector(".weather").style.display = "block";
    document.querySelector(".error").style.display = "none";

  } catch (error) {
    console.error("Error fetching city data:", error);
    document.querySelector(".error").style.display = "block";
    document.querySelector(".weather").style.display = "none";
    AQIFrontView.innerHTML = "";
  }
}

function getAQIStatus(aqi) {
  if (aqi === null) {
    return { level: "N/A", color: "#eee", icon: "", advice: "Data not available" };
  }
  if (aqi <= 50) return { level: "Good", color: "#13b718", icon: "🌿", advice: "Air quality is satisfactory" };
  if (aqi <= 100) return { level: "Moderate", color: "#dfca0f", icon: "😷", advice: "Sensitive people should reduce outdoor exertion" };
  if (aqi <= 150) return { level: "Unhealthy for Sensitive Groups", color: "#e08d0f", icon: "⚠️", advice: "Limit outdoor activities" };
  if (aqi <= 200) return { level: "Unhealthy", color: "#bb3127", icon: "🚫", advice: "Health effects may occur" };
  if (aqi <= 300) return { level: "Very Unhealthy", color: "#900fa6", icon: "☣️", advice: "Emergency health warnings" };
  return { level: "Hazardous", color: "#7d4dcfe8", icon: "☠️", advice: "Serious health effects for everyone" };
}

function displayWeather(data) {
  document.querySelector(".city").innerHTML = data.weather.name;
  document.querySelector(".temp").innerHTML = Math.round(data.weather.main.temp) + "°C";
  document.querySelector(".humidity").innerHTML = data.weather.main.humidity + "%";
  document.querySelector(".wind").innerHTML = Math.round(data.weather.wind.speed * 3.6) + " km/h";

  // Update weather icon based on weather condition
  const mainWeather = data.weather.weather[0].main;
  if (mainWeather === "Clouds") weatherIcon.src = "img/clouds.png";
  else if (mainWeather === "Clear") weatherIcon.src = "img/clear.png";
  else if (mainWeather === "Rain") weatherIcon.src = "img/rain.png";
  else if (mainWeather === "Drizzle") weatherIcon.src = "img/drizzle.png";
  else if (mainWeather === "Mist") weatherIcon.src = "img/mist.png";
  else weatherIcon.src = ""; // Default or clear icon

}

function displayAQI(aqi, airStatus) {
  if (!AQIFrontView) {
    console.error("AQIFrontView element not found");
    return;
  }
  AQIFrontView.innerHTML = `
    <h4>AQI</h4>
    <h1>${aqi || "N/A"}</h1>
    <h2 style="color:${airStatus.color}">${airStatus.level} ${airStatus.icon}</h2>
    <p>${airStatus.advice}</p>
  `;
}

function displaySunriseSunset(sunrise, sunset) {
  const sunriseElem = document.querySelector("#sunrise");
  const sunsetElem = document.querySelector("#sunset");
  if (sunriseElem) sunriseElem.innerHTML = sunrise;
  if (sunsetElem) sunsetElem.innerHTML = sunset;
}

// Event listener for search button
const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");

searchBtn.addEventListener("click", () => {
  const city = searchBox.value.trim();
  if (city) {
    fetchCityData(city);
  }
});

// Optionally, fetch default city data on load
// fetchCityData("Karjat");
