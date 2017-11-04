// for warning people if they are not logged in
window.addEventListener("load", function(){
  // check if they have the auth_token cookie.
  // if not, put up a warning telling them they need to login first
  const cookie = document.cookie;
  if (cookie.includes("auth_token") === false) {
    // warn them that they need to login
    $("#auth-alert-container").show();
  }
});
