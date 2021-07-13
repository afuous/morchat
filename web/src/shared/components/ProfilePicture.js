import React from "react";
import Radium from "radium";

import { connect } from "react-redux";
import styles from "~/shared/styles/profilePicture";

const defaultProfPic = "/images/user.jpg";

@Radium
class ProfilePicture extends React.Component {

    static propTypes = {
        user: React.PropTypes.object.isRequired,
        frameSize: React.PropTypes.number,
        hasIndicator: React.PropTypes.bool,
        style: React.PropTypes.object,
    }

    state = {
        src: this.props.user.profPicUrl || defaultProfPic,
    }

    getIndicator = () => {
        if (this.props.hasIndicator) {
            if (this.props.onlineClients.indexOf(this.props.user.id) === -1) {
                return styles.offline;
            }
            return styles.online;
        }
        return styles.default;
    }

    render() {
        return (
            <img
                src={this.state.src}
                onError={() => this.setState({ src: defaultProfPic })}
                style={[ this.getIndicator(), {
                    height: this.props.frameSize + "px",
                    width: this.props.frameSize + "px",
                }, this.props.style || {} ]}
                onMouseOut={this.props.onMouseOut}
                onMouseOver={this.props.onMouseOver}
                onClick={this.props.onClick}
            />
        )
    }

}

const mapStateToProps = (state) => {
    return {
        onlineClients: state.onlineClients,
    }
}

export default connect(mapStateToProps)(ProfilePicture);
