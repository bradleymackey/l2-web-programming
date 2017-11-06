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
    for (var ven in venues) {
      let venObj = venues[ven];
      console.log(venObj);
      const row = `search-results-${Math.floor(itemCount/3)}`;
      if (itemCount % 3 === 0) {
        $insertionPoint.append(`<div class=\"row\" id=\"${row}\"></div>`);
      }
      let rowToInsert = $(`#${row}`);
      rowToInsert.append(`<div class="col-md" id="col-md-${itemCount}"></div>`);
      let column = $(`#col-md-${itemCount}`);
      column.append(`<h3>${venObj.name}</h3>`);
      column.append(`<h5 class="text-muted">${venObj.town}</h5><hr>`);
      column.append(`<button type="button" class="btn btn-success">Add Event</button>`); // FIXME: identify click!
      itemCount += 1;
    }
  });
}

// check if the user has good creditials before we even
$("#invoke-addVenueModal").on('click', function() {
  const auth_token = Cookies.get("auth_token");
  if (auth_token === undefined || auth_token === null) {
    window.location.replace(baseUrl+"/login.html");
    return;
  }
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
    $("#name-required-alert").show();
    return;
  }
  // get the url inclu. /events2017
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
  // check we have a valid auth_token
  const auth_token = Cookies.get("auth_token");
  if (auth_token === undefined || auth_token === null) {
    window.location.replace(baseUrl+"/login.html");
    return;
  }
  let venueToPost = {};
  venueToPost.auth_token = auth_token;
  venueToPost.name = name;
  venueToPost.postcode = postcode;
  venueToPost.town = town;
  venueToPost.url = url;
  venueToPost.icon = icon;
  console.log(venueToPost);
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
