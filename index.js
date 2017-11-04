// create the app
const express = require('express');
const app = express();
// for parsing POST information
// request.body.parameter_name
const bodyParser = require('body-parser');
// local database for local storage of events
// this adds some eronous properties to the entries, so objects will need to be recreated before returning
const db = require('node-localdb');
// create database instances to manage
const venuedb = db('database/venues.json');
const eventdb = db('database/events.json');
// base url for everything
const base = '/events2017';

// keeps track of all our auth tokens
// doesn't scale well, but oh well.
const sha256 = require('js-sha256');
// uuidv4 produces random uuid tokens, not based on a timestamp or anything
const uuidv4 = require('uuid/v4');

// current auth tokens and associated information
let auth_tokens = {};

// MARK: - STATIC WEB FILES

app.use(base, express.static("public"));

// MARK: - JSON API

// support json encoded bodies
app.use(bodyParser.json());
// support encoded bodies
app.use(bodyParser.urlencoded({extended:true}));

// list all venue details
// no parameters
app.get(base+'/venues', (req, res) => {
  venuedb.find({}).then((allEventsArray) => {
    // if we cannot get data for some reason, we cannot provide allEventsArray
    // just return the empty object.
    if (allEventsArray === undefined || allEventsArray === null) {
      // there is nothing in the database, so return nothing
      res.json({venues:{}});
      res.end();
    }
    // all events are returned as an ARRAY of objects, so we need to send them as one mega object
    var allVenues = {};
    allVenues.venues = {};
    for (venue of allEventsArray) {
      let venueObj = {};
      // create the object with only the properties that we need
      venueObj.name = venue.name;
      venueObj.postcode = venue.postcode;
      venueObj.town = venue.town;
      venueObj.url = venue.url;
      venueObj.icon = venue.icon;
      // add the object to the return object
      allVenues.venues[venue.venue_id] = venueObj;
    }
    res.json(allVenues);
  }).catch((error) => {
    // log error
    console.log(error);
    // return nothingcd
    res.json({venues:{}});
    res.end();
  });
});

// Parameter 'search' url-encoded string to be used to search event title (optional)
// Parameter 'date' url-encoded string representing the date to search for (optional)
app.get(base+'/events/search', (req,res) => {
  // the query strings will be undefined if they are not present.
  const searchedTitle = req.query.search;
  const searchedDate = req.query.date;
  const searchParams = {};
  if (searchedTitle !== undefined && searchedTitle !== "") {
    searchParams.eventName = searchedTitle;
  }
  if (searchedDate !== undefined && searchedDate !== "") {
    searchParams.date = searchedDate;
  }
  // TODO: I need to know if I should return NONE or all of the events if no search terms are provided.
  res.json({name:"john"});
});

// Parameter event_id in URL (required)
// Single event object returned, in same format as elements in search result list
// see spec for how to handle errors
app.get(base+'/events/get/:event_id', (req,res) => {
  const eventID = req.params.event_id;
  eventdb.findOne({event_id:eventID}).then((databaseEvent) => {
    if (databaseEvent === undefined) {
      res.json({error:"no such event"});
      res.end();
    } else {
      const venueID = databaseEvent.venue_id;
      // return the promise so that it can be evaluated in the outer promise
      return venuedb.findOne({venue_id:venueID}).then((databaseVenue) => {
        if (databaseVenue === undefined) {
          // we actually could find the event, but we could not find the venue associated with it.
          res.json({error:"no such event"});
        } else {
          // the embedded venue within the event
          const venueObj = new FinalVenue(databaseVenue);
          // the event JSON object we will respond with
          const eventObj = new FinalEvent(databaseEvent,venueObj);
          res.json(eventObj);
        }
      });
    }
  }).catch((error) => {
    console.log(error);
    res.json({error:"no such event"});
  });
});

// Parameter auth_token (required)
// Parameter name text value (required)
// Parameter postcode text value (optional)
// Parameter town text value (optional)
// Parameter url text value (optional)
// Parameter icon text value of url (optional)
// see spec for how to handle errors, response code of 400 should be sent in the event of an error
app.post(base+'/venues/add', (req,res) => {
  const token = req.body.auth_token;
  const ip = req.ip;
  if (checkToken(token,ip) === false) {
    res.status(400);
    res.json({error: "not authorised, wrong token"});
    res.end();
    return;
  }
  // we have a valid token!
  const name = req.body.name;
  if (name === undefined) {
    res.status(400);
    res.json({error: "name parameter required"});
    res.end();
    return;
  }
  // we have all the fields we need
  let newVenue = {};
  newVenue.venue_id = uuidv4(); // FIXME: should we autogenerate this? the spec says nothing about the user providing this
  newVenue.name = name;
  newVenue.postcode = req.body.postcode;
  newVenue.town = req.body.town;
  newVenue.url = req.body.url;
  newVenue.icon = req.body.icon;
  venuedb.insert(newVenue).then((added) => {
    res.json({success:"added venue successfully"});
  }).catch((error) => {
    res.status(400);
    res.json({error:"error inserting venue into database"});
  });
});

const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i

// Parameter auth_token (required)
// Parameter event_id text value (required)
// Parameter title text value (required)
// Parameter venue_id text value (required)
// Parameter date must accept ISO8601 (required)
// Parameter url text value of url (optional)
// Parameter blurb text value (optional)
app.post(base+'/events/add', (req,res) => {
  const token = req.body.auth_token;
  const ip = req.ip;
  if (checkToken(token,ip) === false) {
    res.status(400);
    res.json({error: "not authorised, wrong token"});
    res.end();
    return;
  }
  const event_id = req.body.event_id;
  const title = req.body.title;
  const venue_id = req.body.venue_id;
  const date = req.body.date;
  if (event_id === undefined || title === undefined || venue_id === undefined || date === undefined) {
    res.status(400);
    res.json({error:"insufficient parameters"});
    res.end();
    return;
  }
  if (ISO_8601_FULL.test(date) === false) {
    res.status(400);
    res.json({error:"date is not in the correct format (expected ISO8601)"});
    res.end();
    return;
  }
  let newEvent = {};
  newEvent.event_id = event_id;
  newEvent.title = title;
  newEvent.venue_id = venue_id;
  newEvent.date = date;
  newEvent.url = req.body.url;
  newEvent.blurb = req.body.blurb;
  eventdb.insert(newEvent).then((event) => {
    res.json({success:"added event successfully"});
  }).catch((error) => {
    res.status(400);
    res.json({error:"error inserting event into database"});
  });
});

// builds a venue that our API should return (fixes anomalies caused by the database)
function FinalEvent(databaseEvent,embeddedVenue) {
  this.event_id = databaseEvent.event_id;
  this.title = databaseEvent.title;
  this.blurb = databaseEvent.blurb;
  this.date = databaseEvent.date;
  this.url = databaseEvent.url;
  this.venue = embeddedVenue;
}

// builds a venue that our API should return (fixes anomalies caused by the database)
// this won't work for the BASE/venues call though, as the format is different
function FinalVenue(databaseVenue) {
  this.name = databaseVenue.name;
  this.postcode = databaseVenue.postcode;
  this.town = databaseVenue.town;
  this.url = databaseVenue.url;
  this.icon = databaseVenue.icon;
  this.venue_id = databaseVenue.venue_id;
}


// MARK: - Authentication

// post to here with 'username', 'password'
// issues auth token which lasts 2 hours
app.post(base+'/request-token', (req,res) => {
  const username = req.body.username;
  // passsword should be pre-hashed
  const password = req.body.password;
  const ip = req.ip;
  if (username === undefined || password === undefined) {
    res.status(400);
    res.send("username and password required");
  } else {
    // save the entry with the ip address and timestamp, so we know if the user trying to use the token is in a different location or if the key has expired.
    const random_token = uuidv4();
    auth_tokens[random_token] = {
      ip:ip,
      issued:Date.now(),
      user:username
    };
    res.json({auth_token:random_token});
  }
});

// get method that checks whether token is valid or not (takes)
// The auth_token "concertina" should be valid for all times for IP addresses 129.234.xxx.yyy
// FIXME: should the ip address be a URL parameter?
app.get(base+'/check-token', (req,res) => {
  const token = req.query.auth_token;
  console.log(token);
  const ip = req.ip;
  console.log(ip);
  if (checkToken(token,ip)) {
    res.json({success:"valid token"});
    res.end();
  } else {
    res.json({error:"invalid token"});
    res.end();
  }
});

// function to check whether a given token is valid
// this is an external function because we will need to call it for the '/check-token' path and when we do post requests.
// returns true if token is valid, false if not
function checkToken(token,ipAddress) {
  // edge case to please steven
  if (token === undefined || ipAddress === undefined) {
    return false;
  }
  // "concertina" allowed for durham external and for local installations
  if (token === "concertina" && (ipAddress.startsWith("129.234") || ipAddress.startsWith("127.0.0.1") || ipAddress.startsWith("::1"))) {
    return true;
  }
  const tokenObj = auth_tokens[token];
  if (tokenObj === undefined || tokenObj === null) {
    return false;
  }
  const dateDiffMins = ((Date.now() - tokenObj.issued)/1000)/60;
  console.log(`minutes since token issued: ${dateDiffMins}`);
  if (dateDiffMins <= 120 && tokenObj.ip === ipAddress) {
    return true;
  } else {
    return false;
  }
}

// begin listening
app.listen(8090, () => {
  console.log("listening on port 8090");
});
