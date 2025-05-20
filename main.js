
function fetchWeather(city, country = "") {

    const apiKey = 'f3b901ed1fabfe00de2737a8ef2ead84';

    const apiUrl = `https://api.weatherstack.com/current?access_key=${apiKey}&query=${city},${country || ""}`;
    fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
        if (data.success !== undefined && data.success === false) {
            throw new Error(data.error.info);
        }
        
        const temperature = data.current.temperature;
        const weatherDescription = data.current.weather_descriptions[0];
        const isDay = data.current.is_day;

        displayBackgroundColor(isDay);
        displayMainInfo(city, country, temperature, weatherDescription);
        displayAirQuality(data.current.air_quality);
        displayDetailsContainer(data);
        // fetchPixabayImages(weatherDescription, isDay);
    })
    .catch(error => {
        alert('Oops! Couldn\'t fetch the weather right now.')
        console.error("Error fetching weather data:", error)
    })

}

function geolocationSuccess (position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        .then(response => response.json())
        .then(data => {
            const city = data.address.city || data.address.town || data.address.village || "Unknown City";
            const country = data.address.country;

            fetchWeather(city, country);
            displayFourCitiesInUserLocation(country)
        })
        .catch(error => {
            console.log('error fetching location  data:', error)
        })

}

function geolocationError(error) {
    console.log('error getting geolocation:', error);
}


if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError);
} else {
    console.log("Geolocation is not available in this browser")
}

// display background color
function displayBackgroundColor(dayPhase) {
    const mainPage = document.body;
    const sidePage = document.querySelector('div#weather_details');

    if (dayPhase == "yes") {
        mainPage.style.backgroundColor = '#4A90E2';
        sidePage.style.backgroundColor = '#4A90E2';
    } else {
        mainPage.style.backgroundColor = '#263238';
        sidePage.style.backgroundColor = '#263238';
    }
}

// get the weather icon
function getWeatherIcon (weatherDescription) {
        let weatherIcons = {
        sunny: '<i class="fa-solid fa-sun"></i>',
        cloudy: '<i class="fa-solid fa-cloud"></i>',
        rainy: '<i class="fa-solid fa-cloud-rain"></i>',
        'patchy rain nearby': '<i class="fa-solid fa-cloud-rain"></i>',
        snowy: '<i class="fa-solid fa-snowflake"></i>',
        'partly cloudy': '<i class="fa-solid fa-cloud-sun"></i>',
        thunderstorm: '<i class="fa-solid fa-cloud-bolt"></i>',
        'clear night': '<i class="fa-solid fa-moon"></i>',
        'cloudy night': '<i class="fa-solid fa-cloud-moon"></i>',
    }

    let weatherIcon = weatherIcons[weatherDescription.toLowerCase().trim()] || "";
    return weatherIcon;
}

// display main info
function displayMainInfo (city, country, temperature, weatherDescription) {
    const mainInfo = document.querySelector('main.general_look');

    mainInfo.innerHTML = `
        <h2 class="location">${city}, ${country || ""}</h2>
            <p class="tempreature">
                <span>${temperature}°C</span>
                <span>${weatherDescription}  
                    <span class='icon'>${getWeatherIcon(weatherDescription)}</span></span>
            </p>
    `;
    weatherDescription == "Sunny" ? document.querySelector('span.icon').classList.add('sunny') : document.querySelector('span.icon').classList.add('cloud-gray')
}

// display air quality
function displayAirQuality (airQualityData) {
    const hourlyDetails = document.querySelector('div#hourly_details');
    const airQuality = hourlyDetails.querySelector('div#air_quality');
    const measure = airQuality.querySelector('#measure');
    const gauge = measure.querySelector('span');

    if (airQualityData["gb-defra-index"] < 3) {
        airQuality.querySelector('p').innerHTML = `${airQualityData["gb-defra-index"]}-Low Health Risk`;
    } else if (airQualityData["gb-defra-index"] > 3 && airQualityData["gb-defra-index"] < 7) {
        airQuality.querySelector('p').innerHTML = `${airQualityData["gb-defra-index"]}-Medium Health Risk`;
    } else {
        airQuality.querySelector('p').innerHTML = `${airQualityData["gb-defra-index"]}-High Health Risk`;
    }

    gauge.style.left = `${airQualityData["gb-defra-index"]}0%`;

}

// display details container
function displayDetailsContainer(data) {
    document.querySelector('div#hourly_details div.container').innerHTML = "";

    const temperature = data.current.temperature;
    const details = {
        astro: data.current.astro,
        wind: [data.current.wind_dir, data.current.wind_speed],
        humidity: data.current.humidity,
        pressure: data.current.pressure,
        visibility: data.current.visibility,
        feelsLike: data.current.feelslike,
    }

    const detailsContainer = document.querySelector('div#hourly_details div.container');
    
    for (let info in details) {
        const section = document.createElement('section');
        if (typeof details[info] == "object" && info == "astro") {
            section.id = info;
            const astro = details[info];
            section.innerHTML = `
                <h4> Sunrise </h4>
                <div class="info">
                    <span>${astro.sunrise}</span>
                    <p>Sunset: ${astro.sunset}</p>
                </div>
            `
            detailsContainer.appendChild(section)
        } else if (typeof details[info] == "object" && info == "wind") {
            section.id = info;

            const directionMap = {
                N: 0,
                NNE: 22.5,
                NE: 45,
                ENE: 67.5,
                E: 90,
                ESE: 112.5,
                SE: 135,
                SSE: 157.5,
                S: 180,
                SSW: 202.5,
                SW: 225,
                WSW: 247.5,
                W: 270,
                WNW: 292.5,
                NW: 315,
                NNW: 337.5
            }
            const windDir = details[info][0];
            const degrees = directionMap[windDir] ?? 0;
            section.innerHTML = `
                <div class="wind_circle">
                    <p>
                        <span>N</span>
                        <span>S</span>
                    </p>
                    <p>
                        <span>W</span>
                        <span>E</span>
                    </p>
                    <div class="arrow"></div>
                </div>
                <p>Wind Speed: ${details[info][1]} KM/H</p>
            `;
            detailsContainer.appendChild(section)
            document.querySelector('.arrow').style.transform = `rotate(${degrees}deg)`;

        } else if (info == "humidity") {
            function calculateDewPoint(temperature, humidity) {
                const a = 17.27;
                const b = 237.7
                const alpha = ((a * temperature) / (b + temperature) + Math.log(humidity / 100));
                const dewPoint = (b * alpha) / (a - alpha);
                return dewPoint
            }

            section.id = info;
            humidity = details[info];
            section.innerHTML = `
                <h4>${info}</h4>
                <div class="info">
                    <span>${details[info]}%</span>
                    <span>The dew point is ${calculateDewPoint(temperature, humidity).toFixed(2)} right now.</span>
                </div>
            `
            detailsContainer.appendChild(section);

        } else if (info == "pressure") {
            const pressure = details[info];
            const minPressure = 950;
            const maxPressure = 1050;

            const angle = ((pressure - minPressure) / (maxPressure - minPressure)) * -45 + 45;
            section.id = info;
            
            section.innerHTML = `
                <h4> ${info} </h4>
                <div class="pressure_circle">
                    <p> ${details[info]} </p>
                    <span> hPa </span>
                    <span class="meassure" style="transform:rotate(${angle}deg) translateX(-50%)"></span>
                </div>
            `;  
            detailsContainer.appendChild(section);
        } else if (info == "visibility") {
            section.id = info;
            
            section.innerHTML = `
                <h4>${info}</h4>
                <div class="info">
                    <span>${details[info]} KM</span>
                    <span>${details[info] >= 10 ? "It's perfectly clear." : "The atmosphere is hazy."}</span>
                </div>
            `
            detailsContainer.appendChild(section);
        } else if (info == "feelsLike") {
            section.id = info;
            let description;
            if (details[info] == temperature) {
                description = "Similar to the actual temperature."
            } else if (details[info] > temperature) {
                description = "High humidity makes it feel hotter than it is."
            } else {
                description = "Wind chill is making it feel colder"
            }
            section.innerHTML = `
                <h4>${info}</h4>
                <div class="info">
                    <span>${details[info]}C</span>
                    <span>${description}</span>
                </div>
            `
            detailsContainer.appendChild(section);
        }
        
        else {
            section.id = info;
            section.innerHTML = `
                <h4>${info}</h4>
                <div class="info">
                    <span>${details[info]}</span>
                </div>
            `
            detailsContainer.appendChild(section);
        }
    }
}

// making up the side page
const goBackButton = document.querySelector('div#weather_details i');
const listButton = document.querySelector('footer i.list');
const page = document.querySelector('div#weather_details');


listButton.addEventListener('click', showPage);
goBackButton.addEventListener("click", hidePage);

function showPage() {
    listButton.classList.add('clicked')
    page.classList.toggle("show");
    setTimeout(() => {
        listButton.classList.remove("clicked")
    }, 100)
}

function hidePage() {
    page.classList.remove('show')
}


const searchInput = document.querySelector('main input#weather');
const citiesList = document.querySelector('#weather_details ul#city_list')
let citiesInUserLocation = []; 

async function fetchAndStoreCountries() {
    const savedData = localStorage.getItem("countries_cities");

    if (savedData) {
        return JSON.parse(savedData)
    }

    try { 
        const res = await fetch('https://countriesnow.space/api/v0.1/countries');
        const data = await res.json();

        if (!data.error) {
            
            
            localStorage.setItem('countries_cities', JSON.stringify(data.data));
            console.log('Fetched data and stored in the localStorage');
            return data.data;
        } else {
            console.error("API Error", data.msg)
        }
    } catch (error) {
        console.log('Fetch Error:', error)
    }

    return [];
}



async function displayFourCitiesInUserLocation(countryName) {
    const countriesData = await fetchAndStoreCountries();


    const userCountry =  countriesData.find(({country}) => country == countryName);

    for (let i = 0; i < 4; i++) {
        citiesInUserLocation.push(userCountry.cities[i])
    }
    displayCities(citiesInUserLocation);
}

document.addEventListener('DOMContentLoaded', displayFourCitiesInUserLocation)


function handleSearch(query) {
    
    const lowerQuery = query.toLowerCase();
    const fullCityList = JSON.parse(localStorage.getItem('countries_cities'));
    const allCities = fullCityList.flatMap((obj) => (obj.cities));

    const matched = allCities.find(city => city.toLowerCase() == lowerQuery);



    let filtered = fullCityList;
    if (matched) {
        filtered = [matched, ...citiesInUserLocation.filter(
            c => c.name !== matched
        ).slice(0, 3)];
        setTimeout(() => {
            displayCities(filtered);
        }, 500)
    } else {
        filtered = citiesInUserLocation.slice(0, 4);
        displayCities(filtered)
    }
}

handleSearch("");

async function displayCities(list) {
    citiesList.innerHTML = "";
    const apiKey = 'f3b901ed1fabfe00de2737a8ef2ead84';

    for (let i = 0; i < 4; i++) {

        // fetch the weather condition for each city
        await fetch(`https://api.weatherstack.com/current?access_key=${apiKey}&query=${list[i]}`)
        .then(response => response.json())
        .then(weatherData => {
            if (weatherData.success === false) {
                throw new Error(weatherData.error.info);
            }

        
        const cityBox = document.createElement('li');
        cityBox.classList.add('city');

        cityBox.innerHTML = `
            <div>
                <h2>${list[i]}</h2>
                <span>${weatherData.location.localtime.split(" ")[1]}</span>
            </div>
            <div>
                <span class="temperature">${weatherData.current.temperature}</span>
                <span>${weatherData.current.weather_descriptions[0]}</span>
            </div>
        `;
            citiesList.appendChild(cityBox);
            setTimeout(() => {
                cityBox.style.transform = 'translate(0)'
            }, 300)

            cityBox.addEventListener('click', (e) => {
                let selectedCity = cityBox.querySelector('h2').textContent;

                cityBox.classList.add('clicked');
                setTimeout(() => {
                    cityBox.classList.remove('clicked')
                }, 300)
                displayAnotherCity(selectedCity);
            });
        })
    }
}

function displayAnotherCity(city) {
    fetchWeather(city);
    setTimeout(() => {
        page.classList.remove('show');
    }, 500)
}


let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            const query = searchInput.value.trim();
                handleSearch(query);
        }, 800)
})
    

// update the weather details

const updatebutton = document.querySelector('footer i.update')

updatebutton.addEventListener("click", updateWeatherDetails);

function updateWeatherDetails () {
    
    updatebutton.classList.add('clicked');
    setTimeout(() => {
        updatebutton.classList.remove("clicked");
    }, 150)
    location.reload();
}


