// logs the user in when the login button is pressed
$("#login-form").on('submit', (event) => {
  event.preventDefault();
  const username = $("#username-field").val();
  const password = $("#password-field").val();
  if (username === "" || username === null || username === undefined) {
    $("#server-alert-container").hide();
    $("#login-alert-container").show();
    return;
  }
  if (password === "" || password === null || password === undefined) {
    $("#server-alert-container").hide();
    $("#login-alert-container").show();
    return;
  }
  $("#login-alert-container").hide();
  // get the current url, so we know where the server is running
  const getUrl = window.location;
  const baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];
  // make the login request to the server
  $.post(baseUrl+"/request-token",{username:username,password:password}, (data) => {
    if (data.auth_token !== null && data.auth_token !== undefined) {
      // set the cookie
      console.log("setting cookie");
      let now = new Date();
      let time = now.getTime();
      time += 2 * 60 * 60 * 1000; // set expire in 2 hours
      now.setTime(time);
      document.cookie = "auth_token=" + data.auth_token + "; expires=" + now.toUTCString() + '; path=/events2017/'; // set the expiry time and the path to be all the pages it may be used on
      // redirect to admin panel
      window.location.replace("/events2017/admin.html");
    } else {
      console.log("no auth token returned from server. must be the incorrect username/password combination");
      // no auth_token returned!! must be an error
      $("#login-alert-container").hide();
      $("#server-alert-container").show();
    }
  }).fail(() => {
    console.log("no auth token returned from server. must be the incorrect username/password combination");
    // no auth_token returned!! must be an error
    $("#login-alert-container").hide();
    $("#server-alert-container").show();
  });
});
