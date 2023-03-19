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
    socket = io(getServerUrl(), {
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

    function formatForHtml(text) {
        let replacements = [
            [/&/g, "&amp;"],
            [/</g, "&lt;"],
            [/>/g, "&gt;"]
        ];
        for (let replacement of replacements) {
            text = text.replace(replacement[0], replacement[1]);
        }
        return text;
    }

    function addLinks(text) {
        return Autolinker.link(text, {
            newWindow: true,
            urls: true,
            email: false,
            phone: false,
            mention: false,
            hashtag: false,
            stripPrefix: false,
            stripTrailingSlash: false,
            decodePercentEncoding: false,
        });
    }

    function getLinkifiedHtml(text) {
        return sanitizeHTML(addLinks(formatForHtml(text)));
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
                createdAt: data.timestamp,
            });
        }
    });

    function addMessage(message) {
        let index = messageList.length;
        while (index > 0) {
            if (new Date(messageList[index - 1].message.createdAt).getTime() < new Date(message.createdAt).getTime()) {
                break;
            }
            index--;
        }
        let messageElem = getMessageElem(message);
        if (index == 0) {
            chatMessagesTable.insertBefore(messageElem, chatMessagesTable.childNodes[numMessagesLoaded - 1].nextSibling);
        } else {
            chatMessagesTable.insertBefore(messageElem, messageList[index - 1].elem.nextSibling);
        }
        messageList.splice(index, 0, {
            message: message,
            elem: messageElem,
        });
        fixScrollAfterNewMessage();
    }

    function fixScrollAfterNewMessage() {
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
                tag("span", {innerHTML: getLinkifiedHtml(content)}, []),
            ]),
        ]);
        chatMessagesTable.insertBefore(pendingElem, typingIndicator);
        fixScrollAfterNewMessage();
        pendingMessageList.push({
            content: content,
            elem: pendingElem,
        });
        socket.emit("sendMessage", {
            chatId: chatId,
            content: content,
        });
        chatInput.value = "";
        setChatInputRows();
        chatInput.focus();
    }

    let chatMessagesTable = tag("div", {className: "chat-messages-table"});
    let chatMessages = tag("div", {className: "chat-messages"}, [chatMessagesTable]);

    let chatInput = tag("textarea", {className: "chat-input-textarea", rows: "1", onkeydown: (event) => {
        if (!event.shiftKey && event.which == 13) { // enter key
            // TODO: dont do this on mobile
            event.preventDefault();
            onSubmit();
        }
    }});

    function setChatInputRows() {
        chatInput.style.height = "0px";
        chatInput.rows = Math.min(6, Math.floor(chatInput.scrollHeight / 17));
        chatInput.style.height = "";
        scrollOnResize();
    }
    chatInput.oninput = setChatInputRows;

    let typingIndicator = tag("div", {className: "bubble-wrapper"}, [
        tag("div", {className: "chat-bubble other-bubble"}, [
            "..."
        ]),
    ]);
    // typingIndicator.style.visibility = "hidden";
    typingIndicator.style.display = "none"; // default table-row
    chatMessagesTable.appendChild(typingIndicator);

    let lastChatMessagesHeight = 0;
    requestAnimationFrame(function() {
        lastChatMessagesHeight = chatMessages.clientHeight;
    });
    function scrollOnResize() {
        if (chatMessages.clientHeight < lastChatMessagesHeight) {
            chatMessages.scrollTop += lastChatMessagesHeight - chatMessages.clientHeight;
        }
        lastChatMessagesHeight = chatMessages.clientHeight;
    };
    window.onresize = scrollOnResize;

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
        if (message.author.id == currentUser.id) {
            return tag("div", {className: "bubble-wrapper"}, [
                tag("div", {className: "chat-bubble self-bubble"}, [
                    tag("span", {innerHTML: getLinkifiedHtml(message.content)}, []),
                ]),
            ]);
        } else {
            return tag("div", {className: "bubble-wrapper"}, [
                tag("div", {className: "chat-bubble other-bubble"}, [
                    getProfPicElem(message.author.profPicUrl, {className: "chat-profpic"}),
                    tag("p", {className: "chat-opponent"}, [
                        message.author.firstname + " " + message.author.lastname[0] + ":",
                    ]),
                    tag("span", {innerHTML: getLinkifiedHtml(message.content)}, []),
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
