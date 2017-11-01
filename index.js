

/*

ON HOLD UNTIL I KNOW IF I CAN USE FIREBASE OR NOT!

*/


// create the app
let express = require('express');
let app = express();
// local database for local storage of events
let db = require('node-localdb');
// create database instances to manage
let venuedb = db('database/venues.json');
let eventdb = db('database/events.json');
// base url for everything
let base = '/events2017';

// MARK: - JSON API

// list all venue details
// no parameters
app.get(base+'/venues', (req, res) => {
  venuedb.find({}).then((allEventsArray) => {
    // if we cannot get data for some reason, we cannot provide allEventsArray
    // just return the empty object.
    if (allEventsArray === undefined || allEventsArray === null) {
      res.json({});
      res.end();
    }
    // all events are returned as an ARRAY of objects, so we need to send them as one mega object
    var allVenues = {};
    for (venue of allEventsArray) {
      // event is an object containing the 'venueName' and '_id'.
      // we need to embed this venue object within 'venueName' and remove '_id'.
      const venueName = venue.venueName;
      // remove the 2 properties
      delete venue._id;
      delete venue.venueName;
      // add the object to the return object
      allVenues[venueName] = venue;
    }
    res.json(allVenues);
  }).catch((error) => {
    // log error
    console.log(error);
    res.json({});
    res.end();
  });
});
// test
app.get('/', (req,res) => {
  let names = ["dick","trick","dicksdf","sdf","sdfsdfsdfs","dsff87wtfe","sdfgskdf","Sdfsdf"];
  for (name of names) {
    venuedb.insert({venueName:name,name:"Grinton Lodge Youth Hostel",postcode:"DL11 6HS",town:"Richmond"}).then((u) => {
      console.log("inserted!")
    });
  }
  res.send("nice");
});

// Parameter 'search' url-encoded string to be used to search event title (optional)
// Parameter 'date' url-encoded string representing the date to search for (optional)
app.get(base+'/events/search', (req,res) => {
  res.json({name:"john"});
});

// Parameter event_id in URL (required)
// Single event object returned, in same format as elements in search result list
// see spec for how to handle errors
app.get(base+'/events/get/:event_id', (req,res) => {

});

// Parameter auth_token (required)
// Parameter name text value (required)
// Parameter postcode text value (optional)
// Parameter town text value (optional)
// Parameter url text value (optional)
// Parameter icon text value of url (optional)
// see spec for how to handle errors, response code of 400 should be sent in the event of an error
app.post(base+'/venues/add', (req,res) => {

});

// Parameter auth_token (required)
// Parameter event_id text value (required)
// Parameter title text value (required)
// Parameter venue_id text value (required)
// Parameter date must accept ISO8601 (required)
// Parameter url text value of url (optional)
// Parameter blurb text value (optional)
app.post(base+'/events/add', (req,res) => {

});





// MARK: - Web Pages

// Single page HTML web app to access events
// Initially search form provided allowing user to choose keywords and/or dates
// When search results are produced, they should be listed under the search box with title, date and venue name
// When a search result is clicked, full details of the event and venue should be displayed
// All results should be accessed via the above web service with AJAX
// Response from service should be converted to HTML and rendered into the page
app.get([base+'/index.html',base+'/'], (req,res) => {
  res.send("hello fans");
});

// Single page HTML web app to administer events
// List and add venues
// Add events to a selected venue
// If auth_token is not defined then forward to a login page
// Save auth_token as cookie after login
app.get(base+'/admin.html', (req,res) => {

});





// MARK: - Authentication

// post to here with 'user', 'pass', 'ipaddress'
// issues auth token which lasts 2 hours
app.post(base+'/request-token', (req,res) => {

});

// get method that checks whether token is valid or not (takes)
// The auth_token "concertina" should be valid for all times for IP addresses 129.234.xxx.yyy
app.get(base+'/check-token', (req,res) => {

});

// function to check whether a given token is valid
// this is an external function because we will need to call it for the '/check-token' path and when we do post requests.
function checkToken(token,ipAddress) {

}


// begin listening
app.listen(8090, () => {
  console.log("listening on localhost:8090");
});
