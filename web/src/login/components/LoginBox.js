import React from "react";
import Radium from "radium";

import ajax from "~/util/ajax";
import { makeChangeHandlerFactory, REDIR_TIME } from "~/util";
import TextBox from "~/shared/components/forms/TextBox";
import SubmitButton from "~/shared/components/forms/SubmitButton";
import Button from "~/shared/components/forms/Button";
import Link from "~/shared/components/Link";
import Form from "~/shared/components/forms/Form";
import ErrorMsg from "~/shared/components/forms/ErrorMsg";
import styles from "~/login/styles/loginBox";

@Radium
export default class LoginBox extends React.Component {

    state = {
        emailOrUsername: "",
        password: "",
        errorMsg: "",
    }

    getChangeHandler = makeChangeHandlerFactory(this);

    onSubmit = async() => {
        try {
            let { data: user } = await ajax.request("post", "/login", {
                emailOrUsername: this.state.emailOrUsername,
                password: this.state.password,
            });
            this.setState({
                errorMsg: "Success"
            });
            setTimeout(() => window.location.assign("/"), REDIR_TIME);
        } catch ({ response: { data } }) {
            this.setState({
                errorMsg: data,
            });
        }
    }

    render() {
        return (
            <div style={styles.wrapper}>

                <Form onSubmit={this.onSubmit}>

                    <TextBox
                        autoFocus
                        value={this.state.emailOrUsername}
                        onChange={this.getChangeHandler("emailOrUsername")}
                        style={styles.textBox}
                        placeholder="Username/Email"
                    />
                    <br />
                    <TextBox
                        value={this.state.password}
                        onChange={this.getChangeHandler("password")}
                        style={styles.textBox}
                        placeholder="Password"
                        type="password"
                    />
                    <br />

                    <SubmitButton
                        style={styles.loginButton}
                        text="Login"
                    />
                    <br />

                    {this.state.errorMsg && (
                        <ErrorMsg
                            message={this.state.errorMsg}
                            style={styles.errorMsg}
                        />
                    )}

                </Form>

                <Button
                    style={styles.signupButton}
                    text="Sign Up"
                    onClick={() => window.location.assign("/signup")}
                />

                <br />
                <br />

                <Link style={styles.fpLink} location="/fp" text="Forgot password?" />
            </div>
        )
    }
}
