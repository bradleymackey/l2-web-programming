// create the app
const express = require('express');
const app = express();
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

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


// MARK: - JSON API

// for parsing POST information (request.body.parameter_name)
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// used for getting cookies (request.cookies.cookie_name)
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// app.get('/', function(req,res)  {
//   let ven = {
//     "event_id":"e_2",
//     "title":"BoardMasters",
//     "blurb":"The biggest and best concertina weekend in the world. Held each May in Grinton Lodge YHA, North Yorkshire",
//     "date":"2018-05-21T16:00:00Z",
//     "url":"http://www.swaledalesqueeze.org.uk",
//     "venue": {
//     "name":"Sage Gateshead",
//     "postcode":"NE8 2JR",
//     "town":"Gateshead",
//     "url":"someurl",
//     "icon":"someicon",
//     "venue_id":"v_2"
//      }
//     }
//   eventdb.insert(ven);
//       res.send("done");
// });

// app.get('/', function (req,res) {
//   let ven = {
//     "venue_id":"v_2",
//     "name":"Sage Gateshead",
//     "postcode":"NE8 2JR",
//     "town":"Gateshead",
//     "url":"http://www.sagegateshead.com/",
//     "icon":"http://www.sagegateshead.com/files/images/pageimage/1683.7123dea7/630x397.fitandcrop.jpg"
//   }
//   venuedb.insert(ven);
//   res.send("done");
// });

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
    searchParams.title = searchedTitle;
  }
  if (searchedDate !== undefined && searchedDate !== "") {
    searchParams.date = searchedDate;
  }
  eventdb.find(searchParams).then((allEventsArray) => {
    for (event of allEventsArray) {
      delete event._id;
    }
    res.json({events:allEventsArray});
    res.end();
  }).catch((error) => {
    res.status(400);
    res.json({error:"error retrieving values"});
    res.end();
  });
});

// Parameter event_id in URL (required)
// Single event object returned, in same format as elements in search result list
// see spec for how to handle errors
app.get(base+'/events/get/:event_id', (req,res) => {
  const eventID = req.params.event_id;
  eventdb.findOne({event_id:eventID}).then((databaseEvent) => {
    if (databaseEvent === undefined || databaseEvent === null) {
      console.log("nothing found");
      res.json({error:"no such event"});
      res.end();
    } else {
      delete databaseEvent._id;
      res.json(databaseEvent);
      res.end();
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
    console.log("invalid token");
    res.status(400);
    res.json({error: "not authorised, wrong token"});
    res.end();
    return;
  }
  // we have a valid token!
  const name = req.body.name;
  if (name === undefined) {
    console.log("no name parameter");
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
    console.log("couldn't add to database");
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
    console.log("bad event id or venue id");
    res.status(400);
    res.json({error:"insufficient parameters"});
    res.end();
    return;
  }
  if (ISO_8601_FULL.test(date) === false) {
    console.log("bad date");
    res.status(400);
    res.json({error:"date is not in the correct format (expected ISO8601)"});
    res.end();
    return;
  }
  let newEvent = {};
  newEvent.event_id = event_id;
  newEvent.title = title;
  newEvent.date = date;
  newEvent.url = req.body.url;
  newEvent.blurb = req.body.blurb;
  // find an event with this event id so that we can inline it into the event database entry
  venuedb.findOne({venue_id:venue_id}).then((venue) => {
    if (venue === undefined || venue === null) {
      // we cannot find that venue, so we cannot insert this event.
      console.log("can't find venue");
      res.status(400);
      res.json({error:"error inserting event into database"});
    } else {
      // we have found the venue,
      // inline the venue_id for easy retrieval when we get this event.
      const venueID = venue_id;
      venue.venue_id = venue_id;
      delete venue._id;
      // set the venue inline
      newEvent.venue = venue;
      // insert to database
      eventdb.insert(newEvent).then((event) => {
        res.json({success:"added event successfully"});
      }).catch((error) => {
        console.log("can't insert event");
        res.status(400);
        res.json({error:"error inserting event into database"});
      });
    }
  }).catch((error) => {
    console.log("can't insert event");
    res.status(400);
    res.json({error:"error inserting event into database"});
  });
});


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
    res.json({error:"username and password required"});
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
