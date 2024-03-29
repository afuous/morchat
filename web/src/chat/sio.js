import {
    receiveMessage,
    messageSent,
    setIsTyping,
    pageClose,
    addChatSync,
    deleteChatSync,
    setChatNameSync,
    markMessagesRead,
} from "./actions";

export function initListeners(socket, dispatch) {

    socket.on("message", ({ chatId, message, isTwoPeople, name }) => {
        dispatch(receiveMessage({
            chatId,
            message,
            isTwoPeople,
            name,
        }))
    })

    socket.on("message-sent", ({ chatId, content }) => {
        dispatch(messageSent({
            chatId,
            content,
        }))
    })

    socket.on("start typing", ({ chatId }) => {
        dispatch(setIsTyping({
            chatId,
            isTyping: true,
        }))
    })

    socket.on("stop typing", ({ chatId }) => {
        dispatch(setIsTyping({
            chatId,
            isTyping: false,
        }))
    })

    socket.on("addChat", ({ chat }) => {
        dispatch(addChatSync(chat));
    });

    socket.on("deleteChat", ({ chatId }) => {
        dispatch(deleteChatSync(chatId));
    });

    socket.on("renameChat", ({ chatId, name }) => {
        dispatch(setChatNameSync({ chatId, name }));
    });

    socket.on("mark-messages-read", ({ chatId }) => {
        dispatch(markMessagesRead({ chatId }));
    });

    $(window).unload(() => {
        dispatch(pageClose());
    });
}
