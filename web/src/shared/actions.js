import { fullName } from "~/util";
import { currentUser } from "~/util";
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

export const receiveMessage = ({ chatId, message, isTwoPeople, name }) => (dispatch) => {
    if (currentUser._id !== message.author._id){
        dispatch({
            type: "NOTHING_HERE",
            meta: {
                sound: "chatMessageNotification",
            },
        });
        new jBox("Notice", {
            attributes: {
                x: "right",
                y: "bottom"
            },
            theme: "NoticeBorder",
            volume: 100,
            animation: {
                open: "slide:bottom",
                close: "slide:right"
            },
            content: message.content,
            maxWidth: 300,
            maxHeight: 105,
            title: isTwoPeople ? fullName(message.author) : fullName(message.author) + " in " + name,
            closeOnClick: false,
            onOpen: function() {
                $($(this)[0].content).parent().parent().addClass("messageNotification"); // beauty
            },
        });
        $(document).on("click", ".messageNotification", function() {
            if (window.location.pathname !== "/chat") {
                window.location.assign("/chat");
            }
            dispatch(setCurrentChatId(chatId));
        })
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
