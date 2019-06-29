import React from "react";
import Radium from "radium";

import Glyphicon from "react-bootstrap/lib/Glyphicon";

import styles from "~/home/styles/leftbar";


@Radium
export default class LeftbarButton extends React.Component {

    static propTypes = {
        text: React.PropTypes.string,
        onClick: React.PropTypes.func,
    }

    render() {
        return (
            <p
                style={styles.leftbarButton.button}
                onClick={this.props.onClick}
            >
                {this.props.text}
            </p>
        )
    }
}
