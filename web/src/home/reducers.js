import update from "react/lib/update";

const announcements = (state = [], action) => {
    switch (action.type) {
        case "ADD_ANNOUNCEMENT_SUCCESS":
            return [action.announcement].concat(state)
        case "LOAD_ANNOUNCEMENTS_SUCCESS":
            return state.concat(action.announcements)
        case "DELETE_ANNOUNCEMENT_SUCCESS":
            return state.filter(announcement => (
                announcement._id != action.announcementId
            ))
        default:
            return state
    }
}

const announcementsLoading = (state = false, action) => {
    switch (action.type) {
        case "LOAD_ANNOUNCEMENTS_START":
            return true
        case "LOAD_ANNOUNCEMENTS_SUCCESS":
            return false
        default:
            return state
    }
}

export default {
    announcements,
    announcementsLoading,
}
