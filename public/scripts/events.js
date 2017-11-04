$("#event-search").submit( (event) => {
  event.preventDefault();
  let searchParams = {};
  const nameSearch = $("#name-field").val();
  if (nameSearch !== "" && nameSearch !== undefined && nameSearch !== null) {
    searchParams.search = nameSearch;
  }
  let dateSearch = $("#date-field").val();
  if (dateSearch !== undefined && dateSearch !== null && dateSearch !== "") {
    searchParams.date = dateSearch
    const date = new Date(dateSearch);
  }

  // get the url inclu. /events2017
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
  $.get(baseUrl+"/events/search", searchParams, (data) => {
    let itemCount = 0
    const events = data.events;
    let $insertionPoint = $("#search-results");
    $insertionPoint.html(""); // clear existing results
    for (event of events) {
      console.log(event);
      const row = `search-results-${Math.floor(itemCount/3)}`;
      if (itemCount % 3 === 0) {
        $insertionPoint.append(`<div class=\"row\" id=\"${row}\"></div>`);
      }
      let rowToInsert = $(`#${row}`);
      rowToInsert.append(`<div class="col-md" id="col-md-${itemCount}"></div>`);
      let column = $(`#col-md-${itemCount}`);
      column.append(`<h3>${event.title}</h3><hr>`);
      column.append(`<h5>${event.venue.name}</h5>`);
      column.append(`<p class="text-muted">${event.date}</p>`);
      column.append(`<button type="button" class="btn btn-info" id="eventid_${event.event_id}">More</button>`); // so we can identify the click
      itemCount += 1;
    }
  });
  return false;
});


// <div class="container" id="search-results">
//   <div class="row">
//     <div class="col-md">
//       <h3>Some Event with a long title it is nice sdfjdsdfsdfsfd</h3>
//       <hr>
//       <h5>Some Venue</h5>
//       <p class="text-muted">26 June 2017</p>
//       <button type="button" class="btn btn-info">More</button>
//     </div>
//     <div class="col-md">
//       <h3>Some Event</h3>
//       <hr>
//       <h5>Some Venue</h5>
//       <p class="text-muted">26 June 2017</p>
//       <button type="button" class="btn btn-info">More</button>
//     </div>
//     <div class="col-md">
//       <h3>Some Event</h3>
//       <hr>
//       <h5>Some Venue</h5>
//       <p class="text-muted">26 June 2017</p>
//       <button type="button" class="btn btn-info">More</button>
//     </div>
//   </div>
// </div>
