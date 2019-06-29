import React from "react";
import Radium from "radium";

import StandardModal from "~/shared/components/StandardModal";
import { ModalTextBox, ModalButton } from "~/shared/components/modal";
import ProfilePicture from "~/shared/components/ProfilePicture";
import Button from "~/shared/components/forms/Button";
import ErrorMsg from "~/shared/components/forms/ErrorMsg";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import { makeChangeHandlerFactory, fullName, currentUser } from "~/util";
import { modalPropTypes, modalPropsForward } from "~/util/modal";
import { connect } from "react-redux";
import styles from "~/shared/styles/optionsModal";

const RadiumGlyphicon = Radium(Glyphicon);

const UserListItem = Radium(props => {
    return (
        <li style={styles.li}>
            <ProfilePicture
                user={props.user}
                picSize="small"
                frameSize={30}
                hasIndicator
            />
            <span
                style={[styles.span, styles.memberSpan]}
                onClick={() => window.location.assign("/profiles/id/" + props.user._id)}
            >
                {fullName(props.user)}
            </span>
        </li>
    )
})

@Radium
class OptionsModal extends React.Component {

    static propTypes = {
        ...modalPropTypes,
        chat: React.PropTypes.object,
        hasUserList: React.PropTypes.bool,
        hasNameEdit: React.PropTypes.bool,
        onNameChange: React.PropTypes.func,
    }

    getChangeHandler = makeChangeHandlerFactory(this);

    initialState = {
        name: this.props.chat.name,
        errorMsg: "",
    }

    state = {
        ...this.initialState,
    }

    handleSubmit = () => {
        if (this.state.name == this.props.chat.name) {
            this.props.onRequestClose();
            return;
        }

        if (this.state.name.length < 20) {
            this.setState({
                errorMsg: this.initialState.errorMsg,
            });
            this.props.onNameChange(this.state.name);
            this.props.onRequestClose();
        } else {
            this.setState({
                errorMsg: "Name has to be 19 characters or fewer",
            });
        }
    }

    handleNameEditRender = () => {
        if (this.props.hasNameEdit) {
            return (
                <div>
                    <ModalTextBox
                        value={this.state.name}
                        onChange={this.getChangeHandler("name") }
                    />
                    <ErrorMsg message={this.state.errorMsg} />
                </div>
            )
        }
    }

    handleAudienceRender = () => {
        if (this.props.hasUserList) {
            return (
                <ul style={styles.ul}>
                    {this.props.chat.users.map(user => (
                        <UserListItem
                            user={user}
                            key={user._id}
                        />
                    ))}
                </ul>
            )
        }
    }

    handleDoneRender = () => {
        if (this.props.hasNameEdit) {
            return (
                <ModalButton
                    text="Done"
                    onClick={this.handleSubmit}
                />
            )
        }
    }

    render() {
        return (
            <StandardModal
                title="Options"
                { ...modalPropsForward(this) }
                onRequestClose={() => {
                    this.setState(this.initialState);
                    this.props.onRequestClose();
                }}
            >
                {this.handleNameEditRender()}
                {this.handleAudienceRender()}
                {this.handleDoneRender()}
            </StandardModal>
        )
    }
}

export default connect()(OptionsModal);
