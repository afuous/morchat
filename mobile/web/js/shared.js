function httpRequest(method, path, data) {
    return new Promise((resolve, reject) => {
        method = method.toUpperCase();
        let url = "https://" + localStorage.server + "/api" + path;
        // let url = "http://" + localStorage.server + "/api" + path;
        if (method == "GET" && data) {
            let queryString = "";
            for (let key of Object.keys(data)) {
                queryString += "&" + key + "=" + data[key];
            }
            url += "?" + queryString.substring(1);
        }
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    let result = null;
                    if (xhr.responseText.length > 0) {
                        result = JSON.parse(xhr.responseText);
                    }
                    resolve(result);
                } else {
                    reject(xhr.responseText);
                }
            }
        };
        xhr.open(method, url, true);
        if (localStorage.authorization) {
            xhr.setRequestHeader("Authorization", "Bearer " + localStorage.authorization);
        }
        if (method == "POST" && data) {
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    });
}

function tag(name, props, children) {
    if (Array.isArray(props)) {
        children = props;
        props = {};
    }
    if (!props) {
        props = {};
    }
    let result = document.createElement(name);
    for (let prop of Object.keys(props)) {
        result[prop] = props[prop];
    }
    if (!Array.isArray(children)) {
        if (children) {
            children = [children];
        } else {
            children = [];
        }
    }
    for (let child of children) {
        let childNode = child;
        if (typeof(child) == "string") {
            childNode = document.createTextNode(child);
        }
        result.appendChild(childNode);
    }
    return result;
}

function getProfPicElem(url, props, children) {
    return tag("img", {
        src: url,
        onerror: function() {
            this.src = "https://www.morteam.com/images/user.jpg";
            this.onerror = null;
        },
        ...props,
    }, children);
}

function navigateTo(hash) {
    location.hash = hash;
    hashChange();
}

let lastHash = "";
function hashChange() {
    if (lastHash.startsWith("#chat-")) {
        if (socket) {
            socket.disconnect();
        }
    }
    lastHash = location.hash;
    if (location.hash == "#login") {
        document.body.innerHTML = "";
        document.body.appendChild(loginPage());
    } else if (location.hash == "#chatlist") {
        document.body.innerHTML = "";
        document.body.appendChild(chatListPage());
    } else if (location.hash.startsWith("#chat-")) {
        let chatId = location.hash.substring("#chat-".length);
        document.body.innerHTML = "";
        document.body.appendChild(chatPage(chatId));
    } else {
        navigateTo("chatlist");
    }
}
window.addEventListener("hashchange", hashChange);

let currentUser = {};
if (localStorage.currentUser) {
    currentUser = JSON.parse(localStorage.currentUser);
}

let socket;
