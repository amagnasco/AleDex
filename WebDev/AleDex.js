// AleDex
// Finds identified species for any given coordinates using the iNaturalist API

// PAGE SETUP
// generate loading messages
// generate buttons
// load map from MapBox
    var map = L.map('map').setView([42, -72], 13);

    let dummyData = [
        {
            name: "nyc",
            lng: -73.96820068359375,
            lat: 40.772221877329024

        },
        {
            name: "la",
            lng: -118.125,
            lat: 34.016241889667015
        }
    ]

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    let bndsArray = []

    dummyData.forEach(function (city) {
        var marker = L.marker([city.lat, city.lng]).addTo(map);
        bndsArray.push([city.lat, city.lng])
    });

    map.fitBounds(bndsArray)

    //Create an empty array that will have all the results appended to
    let allResults = [];
    //Search radius
    let radius = 1;
    //Lat/lng
    let lat = 40.78885994449482;
    let lng = -74.1577148;

    //What to do when everything is done
    function processFullResults(){
        //Add all the results to the map
    }
// let user know page is ready to search

// USER INPUT VALIDATION
// listen for user input
// determine if input is valid, return error message otherwise
// determine if area is too large or will likely return too many results for API, return error message otherwise
// print valid input as coordinates and accuracy radius

// SEARCH
//Take the minimum id to start looking for
function recursiveGet(min_id, totalResults) {

    //Construct the url
    let url = `https://api.inaturalist.org/v1/observations?id_above=${min_id}&lat=${lat}&lng=${lng}&radius=${radius}&order=asc&order_by=id&per_page=200`

    //Get the data
    axios.get(url).then((rsp) => {
        //Concat the array returned in results to all results
        allResults = allResults.concat(rsp.data.results);
        console.log(allResults)
        console.log(rsp.data.results)
        //Wait so you don't timeout the API
        setTimeout(() => {
            //If the length of all the results is still less than the total, increment the minimum id and try again
            if (allResults.length < totalResults || typeof rsp.data.results === 'undefined') {
                recursiveGet((rsp.data.results[rsp.data.results.length - 1].id), totalResults);
            }else{
                //Otherwise, it's done!
                console.log('DONE!')
                processFullResults();
            }
        }, 100);


        console.log(url);
        console.log(`${totalResults - allResults.length} more needed!`)
        console.log(allResults)
    })
}

//Get the total number of results and the id of the first result
function getNumResults() {
    let url = `https://api.inaturalist.org/v1/observations?lat=${lat}&lng=${lng}8&radius=${radius}&order=asc&order_by=id&per_page=1`
    axios.get(url).then((rsp) => {
        let total = rsp.data.total_results;
        console.log(total)
        //Start off by looking at 1 less than the first id
        recursiveGet(+rsp.data.results[0].id - 1, total);


    })
}

//Start it all off
getNumResults();

// GENERATE RESULTS