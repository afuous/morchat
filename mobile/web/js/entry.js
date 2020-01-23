window.onload = function() {
    // check if need to log in or not, otherwise go to chat list
    if (!localStorage.authorization) {
        navigateTo("login");
    } else {
        navigateTo(location.hash.substring(1));
    }
};

if (document.readyState == "complete") {
    window.onload();
}
