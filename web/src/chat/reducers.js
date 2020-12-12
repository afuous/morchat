import update from "react/lib/update";
import { reverse, currentUser } from "~/util";

const initialChats = [];

function chats(state = initialChats, action) {
    let index;
    let newState;
    switch (action.type) {
        case "LOAD_CHATS_PENDING":
            return []
        case "LOAD_CHATS_SUCCESS":
            return action.chats
        case "ADD_CHAT_SUCCESS":
            return [action.chat].concat(state)
        case "SET_CHAT_NAME_SUCCESS":
            index = state.findIndex(chat => chat.id == action.chatId);
            // state[index].name = action.name
            return update(state, {
                [index]: {
                    name: {
                        $set: action.name,
                    },
                },
            })
        case "RECEIVE_MESSAGE_SUCCESS":
            index = state.findIndex(chat => chat.id == action.chatId);
            newState = update(state, {
                [index]: {
                    messages: {
                        $push: [action.message],
                    },
                    updatedAt: {
                        $set: action.timestamp,
                    },
                    isTyping: {
                        $set: false,
                    },
                    wasTyping: {
                        $set: false,
                    },
                    unreadMessages: {
                        $set: state[index].unreadMessages + (action.markAsRead ? 0 : 1),
                    }
                },
            })
            return newState.sort((a, b) => (
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            ));
        case "MARK_MESSAGES_READ":
            index = state.findIndex(chat => chat.id == action.chatId);
            return update(state, {
                [index]: {
                    unreadMessages: {
                        $set: 0,
                    }
                },
            })
        case "SEND_MESSAGE_LOADING":
            index = state.findIndex(chat => chat.id == action.chatId);
            return update(state, {
                [index]: {
                    messages: {
                        $push: [{
                            author: currentUser,
                            content: action.content,
                            isLoading: true,
                            _id: action.messageId,
                        }],
                    },
                    wasTyping: {
                        $set: false,
                    },
                },
            })
        case "SEND_MESSAGE_SUCCESS":
            index = state.findIndex(chat => chat.id == action.chatId);
            const index2 = state[index].messages.findIndex(msg => msg.isLoading);
            newState = update(state, {
                [index]: {
                    messages: {
                        [index2]: {
                            isLoading: {
                                $set: false,
                            },
                            content: {
                                $set: action.content,
                            },
                        },
                    },
                    updatedAt: {
                        $set: action.timestamp,
                    },
                },
            })
            return newState.sort((a, b) => (
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            ));
        case "LOAD_MESSAGES_SUCCESS":
            index = state.findIndex(chat => chat.id == action.chatId);
            return update(state, {
                [index]: {
                    messages: {
                        $unshift: action.messages,
                    },
                },
            })
        case "ALL_MESSAGES_LOADED":
            index = state.findIndex(chat => chat.id == action.chatId);
            return update(state, {
                [index]: {
                    areAllMessagesLoaded: {
                        $set: true,
                    },
                },
            })
        case "SET_IS_TYPING":
            index = state.findIndex(chat => chat.id == action.chatId);
            if (index === -1) {
                // avoid throwing errors if chats have not loaded yet
                return state;
            }
            return update(state, {
                [index]: {
                    isTyping: {
                        $set: action.isTyping,
                    },
                    wasTyping: {
                        $set: state[index].isTyping,
                    },
                },
            })
        case "SET_CURRENT_CHAT_ID":
            index = state.findIndex(chat => chat.id == action.chatId);
            newState = update(state, {
                [index]: {
                    unreadMessages: {
                        $set: 0,
                    }
                }
            });
            // unload messages in chats other than the current chat, since
            // loading a lot of messages, switching chats, then switching
            // back can be very slow otherwise
            return newState.map(chat => update(chat, {
                messages: {
                    $apply: (messages) => messages.slice(-20),
                },
            }))
        default:
            return state
    }
}

const initialCurrentChatId = null;

function currentChatId(state = initialCurrentChatId, action) {
    switch (action.type) {
        case "LOAD_CHATS_SUCCESS":
            if (action.chatId) {
                return action.chatId
            } else if (!state && action.chats.length > 0) {
                return action.chats[0].id
            } else {
                return null
            }
        case "ADD_CHAT_SUCCESS":
            if (!state) {
                return action.chat.id
            }
            return state
        case "SET_CURRENT_CHAT_ID":
            return action.chatId
        default:
            return state
    }
}

const initialChatSize = {
    heightDiff: 0,
};

function inputSize(state = initialChatSize, action) {
    switch (action.type) {
        case "SET_INPUT_SIZE":
            return {
                heightDiff: action.heightDiff,
            }
        default:
            return state
    }
}

export default {
    chats,
    currentChatId,
    inputSize,
}
