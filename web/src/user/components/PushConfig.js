import React from "react";
import Radium from "radium";

import Button from "~/shared/components/forms/Button";
import { hasWebPush, loadWorker, getSubscription, subscribe, unsubscribe } from "~/util/webpush";

@Radium
export default class PushConfig extends React.Component {

    state = {
        status: "",
        showButton: false,
        isPushEnabled: false,
    }

    componentDidMount = async () => {
        if (!hasWebPush) {
            this.setState({
                status: "Your browser does not support push notifications",
                showButton: false,
            });
            return;
        }

        await loadWorker();

        if (await getSubscription()) {
            this.setState({
                status: "Push notifications enabled",
                showButton: true,
                isPushEnabled: true,
            });
        } else {
            this.setState({
                status: "Push notifications are disabled",
                showButton: true,
                isPushEnabled: false,
            });
        }
    }

    onButtonClick = async () => {
        if (!this.state.isPushEnabled) {
            await subscribe();
            this.setState({
                status: "Success! Push notifications are now enabled",
                showButton: true,
                isPushEnabled: true,
            });
        } else {
            await unsubscribe();
            this.setState({
                status: "Success! Push notifications are now disabled",
                showButton: true,
                isPushEnabled: false,
            });
        }
    }

    render() {
        return (
            <div style={{margin:"300px"}}>
                {this.state.status}
                <br />
                {this.state.showButton && (
                    <Button
                        text={this.state.isPushEnabled ? "Disable" : "Enable"}
                        onClick={this.onButtonClick}
                    />
                )}
            </div>
        )
    }

}
