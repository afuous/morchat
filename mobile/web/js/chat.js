// for some reason socketio isnt letting me set withCredentials: false
let oldSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function() {
    this.withCredentials = false;
    oldSend.apply(this, arguments);
};
// https://github.com/socketio/socket.io-client/issues/1140#issuecomment-325958737
// https://github.com/socketio/socket.io/issues/3334

// https://github.com/cure53/DOMPurify/blob/master/demos/hooks-target-blank-demo.html#L31
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if ("target" in node) {
        node.setAttribute("target", "_blank");
        node.setAttribute('rel', 'noopener noreferrer');
    }
    if (!node.hasAttribute("target")
        && (node.hasAttribute("xlink:href") || node.hasAttribute("href"))
    ) {
        node.setAttribute("xlink:show", "new");
    }
});

function chatPage(chatId) {

    if (socket) {
        socket.off("message");
        socket.off("message-sent");
        socket.off("start typing");
        socket.off("stop typing");
    }
    socket = io("https://" + localStorage.server, {
        transportOptions: {
            polling: {
                extraHeaders: {
                    "Authorization": "Bearer " + localStorage.authorization,
                },
            },
        },
    });

    let isWindowFocused;
    window.onfocus = function() {
        isWindowFocused = true;
        socket.emit("read message", {
            chatId: chatId,
        });
    };
    window.onblur = function() {
        isWindowFocused = false;
    };
    window.onfocus();


    function sanitizeHTML(html) {
        let regex = /<(?!(a\s|\/))/g;
        return DOMPurify.sanitize(html.replace(regex, "&lt;"));
    }

    // there is no pressing need to add messages loaded over HTTP to the message list
    // for now this array will only contain messages sent or received in this session
    let messageList = [];
    let pendingMessageList = [];

    socket.on("message", function(data) {
        if (data.chatId == chatId) {
            addMessage(data.message);
        }
        if (isWindowFocused) {
        socket.emit("read message", {
            chatId: chatId,
        });
        }
    });

    socket.on("message-sent", function(data) {
        if (data.chatId == chatId) {
            for (let i = 0; i < pendingMessageList.length; i++) {
                if (pendingMessageList[i].content == data.content) {
                    pendingMessageList[i].elem.parentElement.removeChild(pendingMessageList[i].elem);
                    pendingMessageList.splice(i, 1);
                    break;
                }
            }
            addMessage({
                author: currentUser,
                content: data.content,
                timestamp: Date.now(),
            });
        }
    });

    function addMessage(message) {
        let index = messageList.length;
        while (index > 0) {
            if (new Date(messageList[index - 1].message.timestamp).getTime() < new Date(message.timestamp).getTime()) {
                break;
            }
            index--;
        }
        let messageElem = getMessageElem(message);
        if (index == 0) {
            chatMessagesTable.insertBefore(messageElem, chatMessagesTable.childNodes[numMessagesLoaded].nextSibling);
        } else {
            chatMessagesTable.insertBefore(messageElem, messageList[index - 1].elem.nextSibling);
        }
        messageList.splice(index, 0, {
            message: message,
            elem: messageElem,
        });
        if (chatMessages.scrollHeight - (chatMessages.scrollTop + chatMessages.clientHeight) < 200) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    socket.on("start typing", function() {
    });

    socket.on("stop typing", function() {
    });

    function onSubmit() {
        let content = chatInput.value;
        if (content.length == 0) {
            return;
        }
        let pendingElem = tag("div", {className: "bubble-wrapper"}, [
            tag("div", {className: "chat-bubble self-bubble chat-pending-message"}, [
                tag("span", {innerHTML: sanitizeHTML(Autolinker.link(content))}, []),
            ]),
        ]);
        chatMessagesTable.insertBefore(pendingElem, typingIndicator);
        pendingMessageList.push({
            content: content,
            elem: pendingElem,
        });
        socket.emit("sendMessage", {
            chatId: chatId,
            content: content,
        });
        chatInput.value = "";
        chatInput.focus();
    }

    let chatMessagesTable = tag("div", {className: "chat-messages-table"});
    let chatMessages = tag("div", {className: "chat-messages"}, [chatMessagesTable]);

    let chatInput = tag("textarea", {className: "chat-input-textarea", rows: "1", onkeydown: (event) => {
        if (!event.shiftKey && event.which == 13) { // enter key
            event.preventDefault();
            onSubmit();
        }
    }});

    let typingIndicator = tag("div", {className: "bubble-wrapper"}, [
        tag("div", {className: "chat-bubble other-bubble"}, [
            "..."
        ]),
    ]);
    // typingIndicator.style.visibility = "hidden";
    typingIndicator.style.display = "none"; // default table-row
    chatMessagesTable.appendChild(typingIndicator);

    let loadingMessages = false;
    let allMessagesLoaded = false;
    let numMessagesLoaded = 0;
    async function checkScrollAndLoadMessages() {
        if (loadingMessages || allMessagesLoaded) {
            return;
        }
        if (chatMessages.scrollTop < window.innerHeight) {
            loadingMessages = true;
            let newMessages = await httpRequest("get", "/chats/id/" + chatId + "/messages", {
                skip: numMessagesLoaded,
            });
            numMessagesLoaded += newMessages.length;
            if (newMessages.length == 0) {
                allMessagesLoaded = true;
            }
            let originalScrollHeight = chatMessages.scrollHeight;
            for (let message of newMessages) {
                chatMessagesTable.insertBefore(getMessageElem(message), chatMessagesTable.firstChild);
            }
            if (chatMessages.scrollTop == 0) {
                // not sure why this is the scrolling logic that happens to work, but it is
                chatMessages.scrollTop += chatMessages.scrollHeight - originalScrollHeight;
            }
            loadingMessages = false;
        }
    };
    checkScrollAndLoadMessages();
    chatMessages.onscroll = checkScrollAndLoadMessages;

    function getMessageElem(message) {
        if (message.author._id == currentUser._id) {
            return tag("div", {className: "bubble-wrapper"}, [
                tag("div", {className: "chat-bubble self-bubble"}, [
                    tag("span", {innerHTML: sanitizeHTML(Autolinker.link(message.content))}, []),
                ]),
            ]);
        } else {
            return tag("div", {className: "bubble-wrapper"}, [
                tag("div", {className: "chat-bubble other-bubble"}, [
                    getProfPicElem(message.author.profPicUrl, {className: "chat-profpic"}),
                    tag("p", {className: "chat-opponent"}, [
                        message.author.firstname + " " + message.author.lastname[0] + ":",
                    ]),
                    tag("span", {innerHTML: sanitizeHTML(Autolinker.link(message.content))}, []),
                ]),
            ]);
        }
    }

    let root = tag("div", {className: "big-table"}, [
        tag("div", {className: "navbar"}, [
            tag("div", {className: "navbar-flex-container"}, [
                tag("div", {className: "navbar-elem navbar-link", onclick: () => navigateTo("chatlist"),}, [
                    "Back",
                ]),
            ]),
        ]),
        chatMessages,
        tag("div", {className: "chat-input-div"}, [
            tag("form", {
                action: "javascript:void(0);",
                style: "margin-bottom: 0;",
                onsubmit: onSubmit,
            }, [
                tag("div", {className: "chat-input-flex-container"}, [
                    chatInput,
                    tag("input", {type: "submit", value: "send", className: "chat-input-button"}),
                ]),
            ]),
        ]),
    ]);

    return root;
}
