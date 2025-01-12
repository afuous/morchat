import axios from "axios"
import { request } from "~/util/ajax";
import { emit } from "~/util/sio";
import { receiveMessage as receiveMessageShared } from "~/shared/actions";
import { currentUser, getRandomString, notify } from "~/util";

export const addChatSync = (chat) => ({
    type: "ADD_CHAT_SUCCESS",
    chat: {
        ...chat,
        messages: [],
        unreadMessages: 0,
    },
})

export const addChat = (chat) => async (dispatch) => {
    await request("POST", "/chats", chat);
    // chat is added by socketio
}

export const receiveMessage = ({ chatId, message, isTwoPeople, name }) => (dispatch, getState) => {
    const { currentChatId } = getState();
    let meta = {};
    if (!window.__isFocused && (currentUser.id != message.author.id)) {
        meta = {
            sound: "chatMessageNotification",
        };
    }
    if (currentChatId != chatId) {
        dispatch(receiveMessageShared({ chatId, message, isTwoPeople, name, sound: false }));
    }

    let markAsRead = (currentChatId == chatId && window.__isFocused) || currentUser.id == message.author.id;
    dispatch({
        type: "RECEIVE_MESSAGE_SUCCESS",
        chatId,
        message,
        meta, // this is part of redux-sounds
        timestamp: new Date(),
        markAsRead,
    });
    if (markAsRead) {
        emit("read message", {
            chatId,
        })
    }
}

export const windowFocused = () => async (dispatch, getState) => {
    const { currentChatId } = getState();
    dispatch({
        type: "MARK_MESSAGES_READ",
        chatId: currentChatId,
    });
    emit("read message", {
        chatId: currentChatId,
    });
}

export const sendMessage = (content) => (dispatch, getState) => {
    const { currentChatId } = getState();
    emit("sendMessage", {
        chatId: currentChatId,
        content,
    });
    dispatch(stopTyping());
    dispatch({
        type: "SEND_MESSAGE_LOADING",
        chatId: currentChatId,
        content,
        timestamp: new Date(),
    });
}

export const messageSent = ({ chatId, content }) => (dispatch) => {
    dispatch({
        type: "SEND_MESSAGE_SUCCESS",
        chatId,
        content,
        timestamp: new Date(),
    });
}

export const setChatNameSync = ({ chatId, name }) => ({
    type: "SET_CHAT_NAME_SUCCESS",
    chatId,
    name,
})

export const setChatName = ({ chatId, name }) => async (dispatch) => {
    await request("PUT", `/chats/id/${chatId}/name`, {
        newName: name,
    });
    // chat is renamed by socketio
}

export const uploadImage = (image) => async (dispatch) => {
    const formData = new FormData();
    formData.append("file", image);
    const { data: { baseUrl, uploadUrl } } = await request("POST", "/generateMorimgUploadUrl");
    const { data } = await axios.post(uploadUrl, formData);
    const link = baseUrl + data.path;
    notify("Click to send link", link, () => dispatch(sendMessage(link)), true);
}

export const setCurrentChatId = (chatId) => (dispatch) => {
    localStorage.selectedChatId = chatId;
    dispatch({
        type: "SET_CURRENT_CHAT_ID",
        chatId,
    })
    emit("read message", {
        chatId,
    })
}

let isLoading = false;
export const loadMessages = () => async (dispatch, getState) => {
    if (isLoading) {
        return;
    }
    isLoading = true;
    const { currentChatId, chats } = getState();
    const chat = chats.find(chat => chat.id == currentChatId);
    if (!chat) {
        return;
    }
    let skip = chat.messages.length;
    const { data } = await request("GET",
        `/chats/id/${currentChatId}/messages?skip=${skip}`
        + "&" + Date.now()
    );
    isLoading = false;
    if (data.length === 0) {
        dispatch({
            type: "ALL_MESSAGES_LOADED",
            chatId: currentChatId,
        });
    } else {
        dispatch({
            type: "LOAD_MESSAGES_SUCCESS",
            messages: data,
            chatId: currentChatId,
        });
    }
}

export const setIsTyping = ({ chatId, isTyping }) => ({
    type: "SET_IS_TYPING",
    chatId,
    isTyping,
})

export const startTyping = () => (dispatch, getState) => {
    const { currentChatId } = getState();
    emit("start typing", {
        chatId: currentChatId,
    });
}

export const stopTyping = () => (dispatch, getState) => {
    const { currentChatId } = getState();
    emit("stop typing", {
        chatId: currentChatId,
    });
}

export const markMessagesRead = ({ chatId }) => ({
    type: "MARK_MESSAGES_READ",
    chatId,
})

export const pageClose = () => (dispatch) => {
    dispatch(stopTyping());
}

export const setInputSize = (heightDiff) => ({
    type: "SET_INPUT_SIZE",
    heightDiff,
})

export const loadChats = (selected) => async (dispatch, getState) => {
    const { data } = await request("GET", "/chats?" + Date.now());
    const chatId = data.some(chat => chat.id == selected) ? selected
        : (data.length > 0 ? data[0].id : null);
    for (let chat of data) {
        chat.messages = [];
    }
    dispatch({
        type: "LOAD_CHATS_SUCCESS",
        chats: data,
        chatId: chatId,
    });

    if (chatId) {
        dispatch(setCurrentChatId(chatId));
    }
}

export async function initialActions(dispatch) {
    dispatch(loadChats(localStorage.selectedChatId));
}
