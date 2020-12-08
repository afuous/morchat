import React from "react";
import Radium from "radium";

import Root, { pageInit } from "~/shared/components/Root";
import Navbar from "~/shared/components/navbar/Navbar";
import Leftbar from "./leftbar/Leftbar";
import PushConfig from "./PushConfig";
import { currentUser, pageOptions } from "~/util";
import config from "~/config.json";

import { makeStore, soundsMiddleware } from "~/util/redux";
import sharedReducers from "~/shared/reducers";
import reducers from "~/user/reducers";
const store = makeStore({
    ...reducers,
    ...sharedReducers,
}, soundsMiddleware());
import { initialActions } from "~/user/actions";
initialActions(store.dispatch);
import { initSIO } from "~/util/sio";
import {
    initAlertCreator,
    initListeners as initSharedListeners,
} from "~/shared/sio";
initSIO(socket => initSharedListeners(socket, store.dispatch));
initSIO(socket => initAlertCreator(socket, store.dispatch));

@Radium
export default class User extends React.Component {

    render() {
        return (
            <Root pageName="user" store={store}>
                <Navbar />
                <Leftbar />
                {currentUser._id == pageOptions.userId && config.webPushPublicKey && <PushConfig />}
            </Root>
        )
    }
}

pageInit(User);
