import React from "react";
import Radium from "radium";

import Navbar from "~/shared/components/navbar/Navbar";
import Middle from "~/allUsers/components/Middle";
import Root, { pageInit } from "~/shared/components/Root";
import styles from "~/allUsers/styles";
import { currentUser } from "~/util";

import { makeStore, soundsMiddleware } from "~/util/redux";
import reducers from "~/allUsers/reducers";
import sharedReducers from "~/shared/reducers";
const store = makeStore({
    ...reducers,
    ...sharedReducers,
}, soundsMiddleware());
import { initialActions } from "~/allUsers/actions";
initialActions(store.dispatch);
import { initSIO } from "~/util/sio";
import {
    initAlertCreator,
    initListeners as initSharedListeners,
} from "~/shared/sio";
initSIO(socket => initSharedListeners(socket, store.dispatch));
initSIO(socket => initAlertCreator(socket, store.dispatch));

@Radium
export default class AllUsers extends React.Component {

    render() {
        return (
            <Root pageName="allUsers" store={store}>
                <Navbar />
                <div style={styles.middle}>
                    <Middle />
                </div>
            </Root>
        )
    }
}

pageInit(AllUsers);
