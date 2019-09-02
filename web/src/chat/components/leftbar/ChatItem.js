import React from "react";
import Radium from "radium";

import { LeftbarButton } from "~/shared/components/leftbar";
import { connect } from "react-redux";
import { setCurrentChatId, setChatName, deleteChat, addAudienceToChat, deleteAudienceFromChat } from "~/chat/actions";
import { otherUser, currentUser } from "~/util";
import { modalProps } from "~/util/modal";
import ProfilePicture from "~/shared/components/ProfilePicture";
import Button from "~/shared/components/forms/Button"
import Link from "~/shared/components/Link";
import OptionsModal from "./OptionsModal";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import styles from "~/chat/styles/leftbar";

const RadiumGlyphicon = Radium(Glyphicon);

@Radium
class ChatItem extends React.Component {

    static propTypes = {
        chat: React.PropTypes.object,
        title: React.PropTypes.string,
        hasUnreadMessages: React.PropTypes.bool,
    }

    state = {
        isOptionsModalOpen: false,
    }

    chatImage = () => {
        if (this.props.chat.isTwoPeople) {
            const other = otherUser(this.props.chat.users, currentUser._id)
            return (
                <ProfilePicture
                    user={other}
                    frameSize={30}
                    hasIndicator
                    style={{ marginRight: "10px" }}
                />
            )
        } else {
            return (
                <img style={styles.img} src="/images/group.png" />
            )
        }
    }

    handleOpenOptions = (event) => {
        event.stopPropagation();
        this.setState({
            isOptionsModalOpen: true,
        });
    }

    render() {
        return (
            <LeftbarButton
                isSelected={this.props.chat._id == this.props.currentChatId}
                onClick={() => this.props.dispatch(setCurrentChatId(this.props.chat._id))}
            >
                {this.chatImage()}

                <Link
                    location="javascript:void(0);"
                    text={this.props.title}
                    style={[ styles.chatTitle, this.props.hasUnreadMessages ?
                        { fontWeight: "400" } : {}
                    ]}
                />

                {this.props.hasUnreadMessages && (
                    <RadiumGlyphicon
                        glyph="stop"
                        style={styles.unreadIndicator}
                    />
                )}

                <RadiumGlyphicon
                    glyph="cog"
                    style={styles.cog}
                    onClick={this.handleOpenOptions}
                />

                <OptionsModal
                    chat={this.props.chat}
                    hasUserList={!this.props.chat.isTwoPeople}
                    hasNameEdit={!this.props.chat.isTwoPeople}
                    onNameChange={(name) => this.props.dispatch(setChatName({
                        chatId: this.props.chat._id,
                        name,
                    }))}
                    { ...modalProps(this, "isOptionsModalOpen") }
                />

            </LeftbarButton>
        )
    }

}

const mapStateToProps = (state) => {
    return {
        currentChatId: state.currentChatId,
    }
}

export default connect(mapStateToProps)(ChatItem);
