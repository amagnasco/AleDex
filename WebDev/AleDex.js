// AleDex
// Finds identified species for any given coordinates using the iNaturalist API

// PAGE SETUP
// generate initial datapoints
    let coords = {lng: -72,lat: 22, rad: 20} // rad is radius in km
    let taxon = "aves"

// check if MapBox can render in this browser
// https://docs.mapbox.com/mapbox-gl-js/example/check-for-support/

// load map from MapBox
// https://docs.mapbox.com/mapbox-gl-js/example/drag-a-point/

mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hZ25hc2NvIiwiYSI6ImNsNjVqcTk1YjAzZzkzZHM3OXFoMTJqMzUifQ.O-oSk96QJMtHyMzQL80VyA';

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [coords.lng, coords.lat], // starting center in [lng, lat]
    zoom: 1, // starting zoom
    projection: 'globe', // display map as a 3D 'globe'. can use 'naturalEarth' for 2d
    // add pitch and bearing
    //pitch: 50,
    //bearing: 150,
});
    
map.on('style.load', () => {
    map.setFog({}); // Set the default atmosphere style
});

// terrain not working for some reason, but required for elevation data
//map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

// Add text input box for user to search for location
// https://docs.mapbox.com/mapbox-gl-js/example/mapbox-gl-geocoder/ 
map.addControl(
    new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl

    // update lon, lat
    //coords.lng = 
    })
);

// Add a button for user to geolocate their device
map.addControl(
    new mapboxgl.GeolocateControl({
    positionOptions: {
    enableHighAccuracy: true
    },
    // When active the map will receive updates to the device's location as it changes.
    trackUserLocation: true,
    // Draw an arrow next to the location dot to indicate which direction the device is heading.
    showUserHeading: true

    // update lon, lat
    // coords.lng  = 
    })
);

// generate a circle at coords using Turf.js
// https://stackoverflow.com/questions/37599561/drawing-a-circle-with-the-radius-in-miles-meters-with-mapbox-gl-js
let circleIt = function(lng,lat,rad){
    let _center = turf.point([lng,lat]);
    let _radius = rad;
    let _options = {
        steps: 80,
        units: 'kilometers'
    };
    let circle = turf.circle(_center, _radius, _options);
    return circle;
};

// render initial search radius circle, which will be updated on user input
map.on('style.load', () => {
    map.addSource("circleData", {
        type: "geojson",
        data: circleIt(coords.lng,coords.lat,coords.rad)
    });
    map.addLayer({
        id: "circle-fill",
        type: "fill",
        source: "circleData",
        paint: {
            "fill-color": "blue",
            "fill-opacity": 0.2,
        },
    });
});

// Determine clicked location
// https://docs.mapbox.com/mapbox-gl-js/example/mouse-position/
let updateLocation = function (lng, lat, rad){
    // Sample & round the terrain elevation
    let elevation = Math.floor(
        // Do not use terrain exaggeration to get actual meter values
        map.queryTerrainElevation([lng,lat], { exaggerated: false })
    );
    // update circle
    map.getSource("circleData").setData(circleIt(lng,lat,rad));
    // display lon, lat, elevation
    document.getElementById('selected-area').innerHTML = 
        'Lat: ' + Math.round((lat + Number.EPSILON)*1000)/1000 + '; '
        + 'Lon: ' + Math.round((lng + Number.EPSILON)*1000)/1000
        + '<br>'
        + 'Elevation: ' + elevation + ' m (work in progress); '
        + 'Search radius: ' + rad + ' km'
}

// update location on click
map.on('click', (e) => {
    coords.lat = e.lngLat.lat;
    coords.lng = e.lngLat.lng;
    updateLocation(coords.lng,coords.lat,coords.rad);
});

// change map style 
// https://docs.mapbox.com/mapbox-gl-js/example/setstyle/

// let user know page is ready to search
map.on('style.load', () => {
    // enable search button
    document.getElementById("submit-button").disabled = false;
});

// USER INPUT VALIDATION
// listen for user input
// https://dev.to/am20dipi/how-to-build-a-simple-search-bar-in-javascript-4onf
const taxonInput = document.getElementById("taxon-select");
const radiusInput = document.getElementById("user-radius");
const searchInput = document.getElementById("submit-button");

taxonInput.addEventListener("input", (e) => {
    let value = e.target.value
    // determine if input is valid, return error message otherwise
    if (value){
        // valid input
        taxon = value;
    } else {
        // invalid input error msg
    }
});

radiusInput.addEventListener("input", (e) => {
    let value = e.target.value
    // determine if area is too large or will likely return too many results for API
    if (value){
        coords.rad = value;
        // print valid input as coordinates and accuracy radius
        updateLocation(coords.lng,coords.lat,coords.rad);
    } else {
        // invalid input error msg
    }
});

// SEARCH
// Take the minimum id to start looking for
function recursiveGet(min_id, totalResults) {

    //Construct the url

    // NEED TO ADD THE TAXON !!!!!!!!!!!!!!!!!
    let url = `https://api.inaturalist.org/v1/observations?id_above=${min_id}&lat=${coords.lat}&lng=${coords.lng}&radius=${(coords.rad/1000)}&order=asc&order_by=id&per_page=200`

    // Get the data
    axios.get(url).then((rsp) => {
        // Concat the array returned in results to all results
        allResults = allResults.concat(rsp.data.results);
        console.log(allResults)
        console.log(rsp.data.results)
        // Wait so you don't timeout the API
        setTimeout(() => {
            // If the length of all the results is still less than the total, increment the minimum id and try again
            if (allResults.length < totalResults || typeof rsp.data.results === 'undefined') {
                recursiveGet((rsp.data.results[rsp.data.results.length - 1].id), totalResults);
            }else{
                // Otherwise, it's done!
                console.log('DONE!')
                processFullResults();
            }
        }, 100);
        console.log(url);
        console.log(`${totalResults - allResults.length} more needed!`)
        console.log(allResults)
    })
}

// Get the total number of results and the id of the first result
function getNumResults() {
    // NEED TO ADD THE TAXON !!!!!!!!!!!!!!
    let url = `https://api.inaturalist.org/v1/observations?lat=${coords.lat}&lng=${coords.lng}8&radius=${(coords.rad/1000)}&order=asc&order_by=id&per_page=1`
    axios.get(url).then((rsp) => {
        let total = rsp.data.total_results;
        console.log(`Results: ${total}!`)
        document.getElementById("results-descript").innerHTML = "There have been "+total+" observations of this taxon in this area."
        // Start off by looking at 1 less than the first id
        recursiveGet(+rsp.data.results[0].id - 1, total);
    })
}

//Start it all off
searchInput.addEventListener("click", (e) => {
    console.log(`Searching iNaturalist for ${taxon} within ${coords.rad}km of lat ${coords.lat} lon ${coords.lng}...`)
    getNumResults();
});

// GENERATE STATISTICS ON PAGE


// GENERATE RESULTS ON PAGE