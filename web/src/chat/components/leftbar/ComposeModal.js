import React from "react";
import Radium from "radium";

import StandardModal from "~/shared/components/StandardModal";
import UsersSelect from "~/shared/components/UsersSelect";
import { ModalButton, ModalTextBox } from "~/shared/components/modal";
import { makeChangeHandlerFactory, otherUser, currentUser } from "~/util";
import { modalPropTypes, modalPropsForward } from "~/util/modal";
import { request } from "~/util/ajax";
import { connect } from "react-redux";
import { addChat } from "~/chat/actions";

@Radium
class ComposeModal extends React.Component {

    static propTypes = {
        ...modalPropTypes,
    }

    initialState = {
        users: [],
        name: "",
        isEditingName: false,
        checked: true,
    }
    state = this.initialState;

    getChangeHandler = makeChangeHandlerFactory(this);

    handleSubmit = async () => {
        let users = this.state.users
            .map(u => u._id)
            .filter(userId => userId != currentUser._id);
        if (users.length === 1) {
            this.props.dispatch(addChat({
                isTwoPeople: true,
                otherUserId: users[0],
            }));
            this.setState(this.initialState);
            this.props.onRequestClose();
        } else if (this.state.isEditingName) {
            this.props.dispatch(addChat({
                isTwoPeople: false,
                users: users,
                name: this.state.name,
            }));
            this.setState(this.initialState);
            this.props.onRequestClose();
        } else {
            this.setState({
                isEditingName: true,
            });
        }
    }

    render() {
        return (
            <StandardModal
                title="Compose"
                { ...modalPropsForward(this) }
            >
                {(() => {
                    if (!this.state.isEditingName) {
                        return (
                            <UsersSelect
                                selected={this.state.users}
                                onChange={users => this.setState({ users })}
                            />
                        )
                    } else {
                        return (
                            <ModalTextBox
                                placeholder="Choose Name For Group Chat"
                                value={this.state.name}
                                onChange={this.getChangeHandler("name")}
                            />
                        )
                    }
                })()}
                <ModalButton
                    text="Done"
                    onClick={this.handleSubmit}
                />
            </StandardModal>
        )
    }

}

const mapStateToProps = (state) => {
    return {
        currentTab: state.currentTab,
    }
}

export default connect(mapStateToProps)(ComposeModal);
