// Simple Weather Dashboard using OpenWeatherMap APIs
// Your API key (set by user)
const API_KEY = '2956f8727dc54bafcf2db6d3fb26bb4c';
const UNITS = 'metric'; // 'metric' for °C, 'imperial' for °F

// Add loading state
let isLoading = false;

// DOM
const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const alertBox = document.getElementById('alert');

const currentSection = document.getElementById('current');
const cityNameEl = document.getElementById('city-name');
const localTimeEl = document.getElementById('local-time');
const currentIconEl = document.getElementById('current-icon');
const currentTempEl = document.getElementById('current-temp');
const currentDescEl = document.getElementById('current-desc');
const currentHumidityEl = document.getElementById('current-humidity');
const currentWindEl = document.getElementById('current-wind');

const forecastSection = document.getElementById('forecast');
const forecastGrid = document.getElementById('forecast-grid');

function showAlert(message, duration = 5000) {
  alertBox.textContent = message;
  alertBox.classList.remove('visually-hidden');
  if (duration > 0) {
    setTimeout(() => alertBox.classList.add('visually-hidden'), duration);
  }
}

function hideAlert() {
  alertBox.classList.add('visually-hidden');
}

function formatDateFromUnix(utcSec, timezoneOffsetSec) {
  // returns yyyy-mm-dd and nice day label
  const localMs = (utcSec + timezoneOffsetSec) * 1000;
  const d = new Date(localMs);
  return {
    iso: d.toISOString().slice(0,10),
    label: d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })
  };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(()=>'');
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  return res.json();
}

async function getWeatherByCity(city) {
  try {
    hideAlert();
    // 1) Current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${UNITS}`;
    const current = await fetchJson(currentUrl);

    // 2) 5 day / 3 hour forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${UNITS}`;
    const forecast = await fetchJson(forecastUrl);

    renderCurrent(current);
    renderForecast(forecast);
  } catch (err) {
    console.error(err);
    if (err.status === 404) {
      showAlert('City not found. Please check spelling and try again.');
    } else if (err.status === 401) {
      showAlert('Invalid API key. Please set your OpenWeatherMap API key in script.js.');
    } else {
      showAlert('Network or server error. Please try again.');
    }
    currentSection.classList.add('visually-hidden');
    forecastSection.classList.add('visually-hidden');
  }
}

function renderCurrent(data) {
  currentSection.classList.remove('visually-hidden');

  const { name, sys, main, weather, wind, timezone, dt } = data;
  cityNameEl.textContent = `${name}, ${sys.country}`;

  const timeObj = formatDateFromUnix(dt, timezone);
  localTimeEl.textContent = timeObj.label;

  const w = weather[0];
  const iconUrl = `https://openweathermap.org/img/wn/${w.icon}@4x.png`;
  currentIconEl.src = iconUrl;
  currentIconEl.alt = w.description || 'weather icon';

  currentTempEl.textContent = `${Math.round(main.temp)}°C`;
  currentDescEl.textContent = w.description;
  currentHumidityEl.textContent = `Humidity: ${main.humidity}%`;
  currentWindEl.textContent = `Wind: ${wind.speed} m/s`;
}

function renderForecast(data) {
  forecastSection.classList.remove('visually-hidden');
  forecastGrid.innerHTML = '';

  // Group 3-hour entries by date (local, taking timezone into account)
  const timezone = data.city.timezone; // seconds offset
  const byDate = {};
  data.list.forEach(item => {
    const dateIso = formatDateFromUnix(item.dt, timezone).iso;
    if (!byDate[dateIso]) byDate[dateIso] = [];
    byDate[dateIso].push(item);
  });

  // We want the next 5 days starting from tomorrow or include today depending on time.
  const dates = Object.keys(byDate).slice(0, 6); // take up to 6 to ensure 5 days of full data
  // build summary for each day: find min/max temp and representative icon (choose midday if present)
  const daySummaries = dates.map(iso => {
    const entries = byDate[iso];
    const temps = entries.map(e => e.main.temp);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);

    // choose entry at 12:00:00 if possible, otherwise middle element
    let rep = entries.find(e => e.dt_txt && e.dt_txt.includes('12:00:00')) || entries[Math.floor(entries.length/2)];
    const w = rep.weather[0];

    // human label:
    const label = formatDateFromUnix(rep.dt, timezone).label;

    return {
      iso,
      label,
      min: Math.round(minT),
      max: Math.round(maxT),
      icon: w.icon,
      desc: w.description
    };
  });

  // Only show next 5 days (not more). If first is today and user wants next 5 days, you can adjust — here we show up to 5.
  const toShow = daySummaries.slice(0, 5);

  toShow.forEach(day => {
    const div = document.createElement('div');
    div.className = 'day-card';
    div.setAttribute('role','listitem');
    div.innerHTML = `
      <div class="date">${day.label}</div>
      <div class="icon-wrap-small">
        <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.desc}" />
      </div>
      <div class="desc">${day.desc}</div>
      <div class="temps">H: <strong>${day.max}°</strong> &nbsp; / &nbsp; L: <strong>${day.min}°</strong></div>
    `;
    forecastGrid.appendChild(div);
  });
}

// Load default city on startup
document.addEventListener('DOMContentLoaded', () => {
  getWeatherByCity('London');  // Default city
});

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    showAlert('Please enter a city name.');
    return;
  }
  
  if (isLoading) return;
  
  // Show loading state
  isLoading = true;
  const submitBtn = form.querySelector('button');
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = 'Loading...';
  submitBtn.disabled = true;
  cityInput.disabled = true;
  
  try {
    await getWeatherByCity(city);
  } finally {
    // Reset loading state
    isLoading = false;
    submitBtn.textContent = originalBtnText;
    submitBtn.disabled = false;
    cityInput.disabled = false;
  }
});
