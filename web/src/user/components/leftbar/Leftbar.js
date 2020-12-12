import React from "react";
import Radium from "radium";

import ajax from "~/util/ajax";
import styles from "~/user/styles/leftbar";
import Button from "~/shared/components/forms/Button";
import EditProfile from "./EditProfile";
import ChangePassword from "./ChangePassword";
import ProfilePicture from "~/shared/components/ProfilePicture";
import { withCss } from "~/util/component";
import { fullName, currentUser, pageOptions } from "~/util";
import { modalProps } from "~/util/modal";

const Item = withCss("div", styles.item);
const ButtonItem = (props) => (
    <Item>
        {React.createElement(Button, {
            style: styles.button,
            ...props,
        })}
    </Item>
)

@Radium
export default class Leftbar extends React.Component {

    state = {
        user: {},
        loaded: false,
        isEditProfileOpen: false,
        isChangePasswordOpen: false,
        isAssignTaskOpen: false,
    }

    componentDidMount = async() => {
//        try {
            const { data } = await ajax.request("GET",
                "/users/id/" + pageOptions.userId
            );
            this.setState({
                loaded: true,
                user: data,
            })
//        } catch (err) {
//            // TODO: deal with the case where the user does not exist
//            console.log(err);
//        }
    }

    renderConditionalButtons = () => {
        if (currentUser.id == this.state.user.id) {
            return (
                <div>
                    <ButtonItem
                        text="Edit Profile"
                        onClick={() => this.setState({ isEditProfileOpen: true })}
                    />
                    <ButtonItem
                        text="Change Password"
                        onClick={() => this.setState({ isChangePasswordOpen: true })}
                    />
                </div>
            )
        }
    }

    renderProfilePic = () => {
        let isCurrentUser = currentUser.id === this.state.user.id;
        return (
            <ProfilePicture
                user={this.state.user}
                frameSize={150}
                hasIndicator = {!isCurrentUser}
                style={ isCurrentUser ? styles.img : { margin: styles.img.margin } }
            />
        )
    }

    render() {
        if (!this.state.loaded) {
            return null;
        }
        return (
            <div style={styles.container}>
                {this.renderProfilePic()}
                <div style={styles.name}>
                    {fullName(this.state.user)}
                </div>
                <Item>
                    <span style={styles.emailPhone}>
                        {this.state.user.email}
                    </span>
                </Item>
                <Item>
                    <span style={styles.emailPhone}>
                        {this.state.user.phone}
                    </span>
                </Item>
                {this.renderConditionalButtons()}

                <EditProfile
                    { ...modalProps(this, "isEditProfileOpen") }
                />
                <ChangePassword
                    { ...modalProps(this, "isChangePasswordOpen") }
                />
            </div>
        )
    }
}
