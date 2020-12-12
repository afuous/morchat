import { fullName, currentUser, notify } from "~/util";
import { setCurrentChatId } from "~/chat/actions";

export const setOnlineClients = (userIds) => ({
    type: "SET_ONLINE_CLIENTS",
    userIds,
})

export const joinOnlineClient = (userId) => ({
    type: "JOIN_ONLINE_CLIENT",
    userId,
})

export const leaveOnlineClient = (userId) => ({
    type: "LEAVE_ONLINE_CLIENT",
    userId,
})

export const receiveMessage = ({ chatId, message, isTwoPeople, name, sound }) => (dispatch) => {
    if (currentUser.id !== message.author.id){
        if (sound) {
            dispatch({
                type: "NOTHING_HERE",
                meta: {
                    sound: "chatMessageNotification",
                },
            });
        }
        const title = isTwoPeople ? fullName(message.author) : fullName(message.author) + " in " + name;
        notify(title, message.content, () => {
            if (window.location.pathname !== "/chat") {
                window.location.assign("/chat");
            } else {
                dispatch(setCurrentChatId(chatId));
            }
        }, false);
    }
}

export const toggleLeftbar = () => (dispatch, getState) => {
    const { isLeftbarOpen } = getState();
    if (isLeftbarOpen) {
        dispatch(closeLeftbar());
    } else {
        dispatch(openLeftbar());
    }
}

export function openLeftbar() {
    return {
        type: "OPEN_LEFTBAR"
    }
}

export function closeLeftbar() {
    return {
        type: "CLOSE_LEFTBAR"
    }
}

export function toggleDropdown() {
    return {
        type: "TOGGLE_DROPDOWN",
    }
}
