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
      let $rowToInsert = $(`#${row}`);
      $rowToInsert.append(`<div class="col-md" id="col-md-${itemCount}"><div class="init-show" id="init-show-${itemCount}"></div><div class="init-hidden" id="init-hidden-${itemCount}"></div></div>`);
      // portion that is initially shown to the user
      let $initShow = $(`#init-show-${itemCount}`);
      $initShow.append(`<h3>${event.title}</h3><hr>`);
      $initShow.append(`<h5>${event.venue.name}</h5>`);
      $initShow.append(`<p class="text-muted">${event.date}</p>`);
      $initShow.append(`<button type="button" class="btn btn-info more-button">More Info</button>`);
      // portion that will be shown when more-button is clicked
      let $initHidden = $(`#init-hidden-${itemCount}`);
      $initHidden.append(`<p>${event.blurb}</p>`);
      $initHidden.append(`<p>Event ID: <code>${event.event_id}</code></p>`);
      $initHidden.append(`<a href="${event.url}">Event Website</a><br><br>`);
      $initHidden.append(`<img style="max-width: 100px; max-height: 50px; object-fit: contain;" src="${event.venue.icon}" alt="${event.venue.name}"><br><br>`);
      $initHidden.append(`<p>${event.venue.name}, ${event.venue.town}, ${event.venue.postcode}</p>`);
      $initHidden.append(`<p>Venue ID: <code>${event.venue.venue_id}</code></p>`);
      $initHidden.append(`<a href="${event.venue.url}">Venue Website</a>`);
      itemCount += 1;
    }
  });
});


// when the show more button is clicked
// IMPORTANT, the main element we are referencing MUST have been visible before the javascript loaded
// its subordinates can come it at any time though
$("#search-results").on('click', ".more-button", function () {
  console.log("pressing");
  // hide the buttton
  $(this).hide();
  // show the currently hidden portion
  let hiddenId = $(this).parent().attr("id").replace("show","hidden"); // get the div containing the button, which is the init-show-${id}. then replace 'show' with 'hidden'
  $(`#${hiddenId}`).show();
});
