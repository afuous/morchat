function onlineClients(state = [], action) {
    switch (action.type) {
        case "SET_ONLINE_CLIENTS":
            return action.userIds;
        case "JOIN_ONLINE_CLIENT":
            return state.concat(action.userId);
        case "LEAVE_ONLINE_CLIENT":
            return state.filter(userId => userId !== action.userId);
        default:
            return state;
    }
}

function isLeftbarOpen(state = true, action) {
    switch (action.type) {
        case "TOGGLE_LEFTBAR":
            return !state;
        case "OPEN_LEFTBAR":
            return true;
        case "CLOSE_LEFTBAR":
            return false;
        default:
            return state;
    }
}

function isDropdownOpen(state = false, action) {
    switch (action.type) {
        case "TOGGLE_DROPDOWN":
            return !state;
        default:
            return state;
    }
}

const initialTab = "intra";

function currentTab(state = initialTab, action) {
    switch (action.type) {
        case "SET_TAB":
            return action.tab
        default:
            return state
    }
}

export default {
    onlineClients,
    isLeftbarOpen,
    isDropdownOpen,
    currentTab,
}
