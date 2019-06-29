import React from "react";
import Radium from "radium";

import StandardModal from "~/shared/components/StandardModal";
import { makeChangeHandlerFactory, REDIR_TIME, currentUser } from "~/util";
import styles from "~/user/styles/modal";
import Form from "~/shared/components/forms/Form";
import {
    ModalTextBox,
    ModalButton,
    ModalSubmitButton,
    ModalErrorMsg,
} from "~/shared/components/modal";
import ajax from "~/util/ajax";
import { modalPropTypes, modalPropsForward } from "~/util/modal";

@Radium
export default class EditProfile extends React.Component {

    static propTypes = {
        ...modalPropTypes,
    }

    constructor(props) {
        super(props);

        this.getChangeHandler = makeChangeHandlerFactory(this);

        this.state = {
            firstname: currentUser.firstname,
            lastname: currentUser.lastname,
            email: currentUser.email,
            phone: currentUser.phone,
            parentEmail: currentUser.parentEmail || "",
            errorMsg: "",
        }
    }

    onSubmit = async() => {
        try {
            let obj = {
                firstname: this.state.firstname,
                lastname: this.state.lastname,
                email: this.state.email,
                phone: this.state.phone,
                parentEmail: this.state.parentEmail,
            }
            let { data } = await ajax.request("PUT", "/profile", obj);
            this.setState({
                errorMsg: "Success",
            })
            setTimeout(() => window.location.reload(), REDIR_TIME);
            // TODO: use redux to not have to reload here
        } catch ({ data }) {
            this.setState({
                errorMsg: data,
            })
        }
    }

    render() {
        return (
            <StandardModal
                title="Edit Profile"
                { ...modalPropsForward(this) }
            >
                <Form onSubmit={this.onSubmit}>
                    <ModalTextBox
                        placeholder="First Name"
                        value={this.state.firstname}
                        onChange={this.getChangeHandler("firstname")}
                    />
                    <ModalTextBox
                        placeholder="Last name"
                        value={this.state.lastname}
                        onChange={this.getChangeHandler("lastname")}
                    />
                    <ModalTextBox
                        placeholder="Email"
                        value={this.state.email}
                        onChange={this.getChangeHandler("email")}
                    />
                    <ModalTextBox
                        placeholder="Phone Number"
                        value={this.state.phone}
                        onChange={this.getChangeHandler("phone")}
                    />
                    <ModalSubmitButton text="Save" />
                    {this.state.errorMsg && (
                        <ModalErrorMsg
                            message={this.state.errorMsg}
                        />
                    )}
                </Form>
            </StandardModal>
        )
    }

}
