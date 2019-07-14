import axios from "axios"
import { request } from "~/util/ajax";
import { emit } from "~/util/sio";
import { receiveMessage as receiveMessageShared } from "~/shared/actions";
import { currentUser, getRandomString, notify } from "~/util";
import { imgurClientId } from "~/config";

export const addChatSync = (chat) => ({
    type: "ADD_CHAT_SUCCESS",
    chat,
})

export const addChat = (chat) => async (dispatch) => {
    await request("POST", "/chats", chat);
    // chat is added by socketio
}

export const receiveMessage = ({ chatId, message, isTwoPeople, name }) => (dispatch, getState) => {
    const { currentChatId } = getState();
    let meta = {};
    if (!window.__isFocused && (currentUser._id !== message.author._id)) {
        meta = {
            sound: "chatMessageNotification",
        };
    }
    if (window.__isFocused && currentChatId !== chatId) {
        dispatch(receiveMessageShared({ chatId, message, isTwoPeople, name }));
    }
    dispatch({
        type: "RECEIVE_MESSAGE_SUCCESS",
        chatId,
        currentChatId,
        message: {
            ...message,
            // giving each message a unique id lets the view know which
            // messages are new
            _id: getRandomString(),
        },
        meta, // this is part of redux-sounds
        timestamp: new Date(),
    });
    if (currentChatId === chatId) {
        emit("read message", {
            chatId,
        })
    }
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
        messageId: getRandomString(),
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
    formData.append("image", image);
    const { data } = await axios.post(`https://api.imgur.com/3/image?client_id=${imgurClientId}`, formData)
    .catch(err => {
        console.log(err.response);
        throw err;
    });
    if (data.success) {
        const link = data.data.link;
        dispatch({
            type: "UPLOAD_IMAGE_SUCCESS",
            link,
        });
        document.getElementById("link").select();
        document.execCommand("copy");
        notify("Link copied successfully", link, () => window.open(link, "_blank"));
    } else {
        notify("Image upload failed", action.error);
    }
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
    const chat = chats.find(chat => chat._id == currentChatId);
    if (!chat) {
        return;
    }
    const { data } = await request("GET",
        `/chats/id/${currentChatId}/messages?skip=${chat.messages.length}`
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

export const pageClose = () => (dispatch) => {
    dispatch(stopTyping());
}

export const setInputSize = (heightDiff) => ({
    type: "SET_INPUT_SIZE",
    heightDiff,
})


export const loadChats = (selected) => async (dispatch, getState) => {
    const { currentTab } = getState();
    const { data } = await request("GET", "/chats?" + Date.now());
    const chatId = data.some(chat => chat._id === selected) ? selected
        : (data.length > 0 ? data[0]._id : null);
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
