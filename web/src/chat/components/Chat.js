import React from "react";
import Radium from "radium";

import Root, { pageInit } from "~/shared/components/Root";
import Navbar from "~/shared/components/navbar/Navbar";
import Leftbar from "~/chat/components/leftbar/Leftbar";
import Middle from "~/chat/components/middle/Middle";
import { currentUser } from "~/util";
import { windowFocused } from "~/chat/actions";

import { makeStore, soundsMiddleware } from "~/util/redux";
import reducers from "~/chat/reducers";
import sharedReducers from "~/shared/reducers";
const store = makeStore({
    ...reducers,
    ...sharedReducers,
}, soundsMiddleware());
import { initialActions } from "~/chat/actions";
initialActions(store.dispatch);
import { initSIO } from "~/util/sio";
import { initListeners } from "~/chat/sio";
initSIO(socket => initListeners(socket, store.dispatch));
import { initListeners as initSharedListeners } from "~/shared/sio";
initSIO(socket => initSharedListeners(socket, store.dispatch));

$(window).focus(() => {
    window.__isFocused = true; // should probably be in redux but whatever
    store.dispatch(windowFocused());
}).blur(() => {
    window.__isFocused = false;
});

@Radium
export default class Chat extends React.Component {

    render() {
        return (
            <Root pageName="chat" store={store}>
                <Navbar />
                <Leftbar />
                <Middle />
            </Root>
        )
    }

}

pageInit(Chat);

// show the number of unread messages in the page title
store.subscribe(() => {
    let chats = store.getState().chats;
    let numUnread = chats.map(chat =>
        chat.unreadMessages.find(({ user }) => user == currentUser._id).number
    ).reduce((a, b) => a + b, 0);
    let mainTitle = "MorChat - Chat";
    if (numUnread == 0) {
        document.title = mainTitle;
    } else {
        document.title = "(" + numUnread + ") " + mainTitle;
    }
});
