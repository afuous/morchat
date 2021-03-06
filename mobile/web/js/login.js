function loginPage() {

    async function onSubmit() {
        if (serverInput.value == "morteam.com") {
            serverInput.value = "www.morteam.com";
        }

        localStorage.server = serverInput.value;
        let username = usernameInput.value;
        let password = passwordInput.value;

        let hadError = (errorTextElem.innerHTML != "");
        errorTextElem.innerHTML = "";
        let startTime = Date.now();

        try {
            let obj = await httpRequest("post", "/login", {
                emailOrUsername: username,
                password: password,
                useCookie: false,
                // if undefined, this field should not appear in stringified JSON
                mobileDeviceToken: window._mobileDeviceToken,
            });
            localStorage.authorization = obj.auth;
            localStorage.currentUser = JSON.stringify(obj.user); // TODO: this needs to be updated from time to time somehow
            currentUser = obj.user;
            navigateTo("chatlist");
        } catch (errorMsg) {
            function showError() {
                errorTextElem.innerHTML = "";
                errorTextElem.appendChild(document.createTextNode(errorMsg));
            }
            let minWait = 1000;
            let currentTime = Date.now();
            if (!hadError || currentTime - startTime > minWait) {
                showError();
            } else {
                setTimeout(showError, minWait + startTime - currentTime);
            }
        }
    }

    let serverInput = tag("input", {className: "login-input", type: "text", autocapitalize: "none", autocorrect: "off",});
    let usernameInput = tag("input", {className: "login-input", type: "text", autocapitalize: "none", autocorrect: "off",});
    let passwordInput = tag("input", {className: "login-input", type: "password"});

    if (localStorage.server) {
        serverInput.value = localStorage.server;
        usernameInput.autofocus = true;
    } else {
        serverInput.autofocus = true;
    }

    let errorTextElem = tag("td", {colSpan: 2, className: "login-center-td"});

    let root = tag("div", {className: "big-table"}, [
        tag("div", {className: "navbar"}, [
            tag("div", {className: "navbar-flex-container"}, [
                tag("div", {className: "navbar-elem"}, [
                    "MorChat",
                ]),
            ]),
        ]),
        tag("div", {className: "content"}, [
            tag("div", {className: "content-flex-container"}, [
                tag("form", {
                    action: "javascript:void(0);",
                    style: "margin-bottom: 0;",
                    onsubmit: onSubmit,
                }, [
                    tag("table", {className: "login-table"}, [
                        tag("tr", [
                            tag("td", {className: "description"}, [
                                "Server:",
                            ]),
                            tag("td", [
                                serverInput,
                            ]),
                        ]),
                        tag("tr", [
                            tag("td", {className: "description"}, [
                                "Username:",
                            ]),
                            tag("td", [
                                usernameInput,
                            ]),
                        ]),
                        tag("tr", [
                            tag("td", {className: "description"}, [
                                "Password:",
                            ]),
                            tag("td", [
                                passwordInput,
                            ]),
                        ]),
                        tag("tr", [
                            errorTextElem,
                        ]),
                        tag("tr", [
                            tag("td", {colSpan: 2, className: "login-center-td"}, [
                                tag("input", {type: "submit", value: "Login", className: "login-button"}),
                            ]),
                        ]),
                    ]),
                ]),
            ]),
        ]),
    ]);

    return root;
}
