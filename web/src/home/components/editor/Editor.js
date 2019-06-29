import React from "react";
import Radium from "radium";

import ajax from "~/util/ajax";
import RTEditor from "./RTEditor";
import Button from "~/shared/components/forms/Button";
import { connect } from "react-redux";
import { addAnnouncement } from "~/home/actions";
import styles from "~/home/styles/editor";

@Radium
class Editor extends React.Component {

    // not state because it does not affect the view
    // it is this way because RTEditor is uncontrolled
    // should be changed eventually
    content = "";

    post = async() => {
        await this.props.dispatch(addAnnouncement({
            content: this.content,
        }));
        this.clear();
    }

    render() {
        return (
            <div style={styles.container}>
                <RTEditor
                    onChange={html => this.content = html}
                    registerClear={clear => this.clear = clear}
                />
                <Button
                    style={styles.button}
                    text="Post"
                    onClick={this.post}
                />
            </div>
        )
    }

}

export default connect()(Editor);
