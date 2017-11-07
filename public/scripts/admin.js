// WARN PEOPLE IF THEY ARE NOT LOGGED IN
window.addEventListener("load", () => {
  // update the venues
  updateVenues();
  // check if they have the auth_token cookie.
  // if not, put up a warning telling them they need to login first
  const cookie = document.cookie;
  if (cookie.includes("auth_token") === false) {
    // warn them that they need to login
    $("#auth-alert-container").show();
  }
});

// loads all venues via ajax
function updateVenues() {
  // get the url inclu. /events2017
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
  $.get(baseUrl+"/venues", (data) => {
    let itemCount = 0;
    let $insertionPoint = $("#search-results");
    $insertionPoint.html(""); // clear existing results
    console.log(data);
    const venues = data.venues;
    for (var venueID in venues) {
      let venObj = venues[venueID];
      console.log(venObj);
      const row = `search-results-${Math.floor(itemCount/3)}`;
      if (itemCount % 3 === 0) {
        $insertionPoint.append(`<div class=\"row\" id=\"${row}\"></div>`);
      }
      let rowToInsert = $(`#${row}`);
      rowToInsert.append(`<div class="col-md" id="col-md-${itemCount}"></div>`);
      let column = $(`#col-md-${itemCount}`);
      column.append(`<h3>${venObj.name}</h3>`);
      column.append(`<h5 class="text-muted">${venObj.town} ${venObj.postcode}</h5><hr>`);
      if (venObj.url !== undefined && venObj.url !== null) {
        if (venObj.url !== "") {
          column.append(`<a href="${venObj.url}"><b>Website</b></a><br>`);
        }
      }
      column.append(`<p class="text-muted">ID: <code>${venueID}</code></p>`)
      column.append(`<button type="button" class="btn btn-success invoke-addVenueModal" data-id="${venueID}" data-toggle="modal" data-target="#addEventModal">Add Event</button>`);
      itemCount += 1;
    }
  });
}

// checks the auth_token cookie to see if it is non-existant or expired.
// if it is either, redirect to the login page.
function checkAuthTokenCookie() {
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
  const auth_token = Cookies.get("auth_token");
  if (auth_token === undefined || auth_token === null) {
    window.location.replace(baseUrl+"/login.html");
    return null;
  } else {
    return auth_token;
  }
}

$("#search-results").on('click', 'invoke-addVenueModal', function() {
  checkAuthTokenCookie();
});

// check if the user has good creditials before we even
$("#invoke-addVenueModal").on('click', function() {
  checkAuthTokenCookie();
});

// when the 'ADD VENUE' form is submitted
$("#add-venue-form").on('submit', (event) => {
  event.preventDefault();
  let name = $("#venue-name-field").val();
  const postcode = $("#venue-postcode-field").val();
  const town = $("#venue-town-field").val();
  const url = $("#venue-url-field").val();
  const icon = $("#venue-icon-field").val();
  if (name !== undefined && name !== null) {
    name = name.trim();
  }
  if (name === "" || name === undefined || name === null) {
    $("#venue-name-required-alert").show();
    return;
  }
  const auth_token = checkAuthTokenCookie();
  let venueToPost = {};
  venueToPost.auth_token = auth_token;
  venueToPost.name = name;
  venueToPost.postcode = postcode;
  venueToPost.town = town;
  venueToPost.url = url;
  venueToPost.icon = icon;
  console.log(venueToPost);
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
  $.post(baseUrl+"/venues/add",venueToPost, (data) => {
    if (data.error !== undefined) {
      // there was an error for some reason, so redirect to the login page, becuase it's probably a bad auth_token
      window.location.replace(baseUrl+"/login.html");
    } else {
      // no error, remove the modal and update the page.
      $( '.modal' ).modal( 'hide' ).data( 'bs.modal', null );
      updateVenues();
    }
  }).fail(function() {
    // there was an error for some reason, so redirect to the login page, becuase it's probably a bad auth_token
    window.location.replace(baseUrl+"/login.html");
  });
});

// pass data from the venue into the event form, because the event should directly relate to the venue
$(document).on('click', ".invoke-addVenueModal", function() {
  const venueIDForSelectedVenue = $(this).data('id');
   $("#event-venue_id-field").val(venueIDForSelectedVenue);
});

const ISO_8601_FULL = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i

// when the event form is submitted
$("#add-event-form").on('submit', (event) => {
  event.preventDefault();
  let title = $("#event-title-field").val();
  let id = $("#event-id-field").val();
  let date = $("#event-date-field").val();
  const url = $("#event-url-field").val();
  const blurb = $("#event-blurb-field").val();
  const venue_id = $("#event-venue_id-field").val();
  // check that we have name
  if (title !== undefined && title !== null) {
    title = title.trim();
  }
  if (title === "" || title === undefined || title === null) {
    $("#event-title-required-alert").show();
    return;
  }
  // check that we have date
  if (date !== undefined && date !== null) {
    date = date.trim();
  }
  if (date === "" || date === undefined || date === null || ISO_8601_FULL.test(date) === false) {
    $("#event-date-required-alert").show();
    return;
  }
  if (id !== undefined && id !== null) {
    id = id.trim();
  }
  if (id === "" || id === undefined || id === null) {
    $("#event-id-required-alert").show();
    return;
  }
  // check the auth_token
  const auth_token = checkAuthTokenCookie();
  // create the post
  let eventToPost = {};
  eventToPost.auth_token = auth_token;
  eventToPost.venue_id = venue_id;
  eventToPost.event_id = id;
  eventToPost.title = title;
  eventToPost.date = date;
  eventToPost.url = url;
  eventToPost.blurb = blurb;
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
  let posting = $.post(baseUrl+"/events/add", eventToPost);
  posting.done((data) => {
    if (data.error !== undefined) {
      console.log("error callback");
      // there was an error for some reason, so redirect to the login page, becuase it's probably a bad auth_token
      window.location.replace(baseUrl+"/login.html");
    } else {
      // no error, remove the modal and update the page.
      $('.modal').modal('hide').data('bs.modal', null );
    }
  });
  posting.fail(function() {
    console.log("fail");
    // there was an error for some reason, so redirect to the login page, becuase it's probably a bad auth_token
    window.location.replace(baseUrl+"/login.html");
  });
});
