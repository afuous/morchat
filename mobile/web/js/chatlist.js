function chatListPage() {

    let chatListTable = tag("div", {className: "chat-list-table"});

    async function logOut() {
        await httpRequest("post", "/logout", {
            mobileDeviceToken: window._mobileDeviceToken,
        });
        localStorage.authorization = "";
        localStorage.currentUser = "";
        currentUser = {};
        navigateTo("login");
    }

    let root = tag("div", {className: "big-table"}, [
        tag("div", {className: "navbar"}, [
            tag("div", {className: "navbar-flex-container"}, [
                tag("div", {className: "navbar-elem"}, [
                    "MorChat",
                ]),
                tag("div", {className: "flex-spacer"}),
                tag("div", {className: "navbar-elem navbar-link", onclick: logOut,}, [
                    "Log out",
                ]),
            ]),
        ]),
        tag("div", {className: "chat-list"}, [
            chatListTable,
        ]),
    ]);

    (async function() {
        try {
            let chats = await httpRequest("get", "/chats");
            for (let chat of chats) {
                let imageUrl = "https://www.morteam.com/images/group.png";
                let name = chat.name;
                if (chat.isTwoPeople) {
                    let otherUser = chat.users.find(user => user.id != currentUser.id);
                    imageUrl = otherUser.profPicUrl;
                    name = otherUser.firstname + " " + otherUser.lastname;
                }
                let numUnread = chat.unreadMessages;
                let style = "";
                if (numUnread > 0) {
                    name = "(" + numUnread + ") " + name;
                    style = "font-weight: 400;";
                }
                let chatItem = tag("div", {className: "chat-list-item", style: style,}, [
                    getProfPicElem(imageUrl, {className: "chat-list-image"}),
                    name,
                ]);
                chatItem.onclick = function() {
                    navigateTo("chat-" + chat.id);
                };
                chatListTable.appendChild(chatItem);
            }
        } catch (e) {
            console.log(e);
        }
    })();

    return root;
}
