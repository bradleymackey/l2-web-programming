// WARN PEOPLE IF THEY ARE NOT LOGGED IN
window.addEventListener("load", () => {
  // check if they have the auth_token cookie.
  // if not, put up a warning telling them they need to login first
  const cookie = document.cookie;
  if (cookie.includes("auth_token") === false) {
    // warn them that they need to login
    $("#auth-alert-container").show();
  }
});

// LOAD IN ALL VENUES TO SEE THEM
window.addEventListener("load", () => {
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
});

// <div class="container" id="search-results">
//   <div class="row">
//     <div class="col-md">
//       <h3>Some Venue</h3><br>
//       <button type="button" class="btn btn-success">Add Event</button>
//     </div>
//     <div class="col-md">
//       <h3>Some Venue</h3><br>
//       <button type="button" class="btn btn-success">Add Event</button>
//     </div>
//     <div class="col-md">
//       <h3>Some Venue</h3><br>
//       <button type="button" class="btn btn-success">Add Event</button>
//     </div>
//   </div>
// </div>

$("#add-venue-button").click(() => {

});
