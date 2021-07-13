import React from "react";
import Radium from "radium";

import Glyphicon from "react-bootstrap/lib/Glyphicon";
import ProfilePicture from "~/shared/components/ProfilePicture";
import ConfirmModal from "~/shared/components/ConfirmModal";
import styles from "~/home/styles/announcements";
import { modalProps } from "~/util/modal";
import { fullName, currentUser } from "~/util";
import { parseDateAndTime } from "~/util/date";
import { connect } from "react-redux";
import { deleteAnnouncement } from "~/home/actions";
import { sanitize } from "dompurify";
import { link } from "autolinker";

const RadiumGlyphicon = Radium(Glyphicon);

@Radium
class AnnouncementsListItem extends React.Component {

    state = {
        isModalOpen: false,
    }

    static propTypes = {
        announcement: React.PropTypes.object,
    }

    renderDeleteButton = () => {
        if (currentUser.id == this.props.announcement.author.id) {
            return (
                <div>
                    <RadiumGlyphicon
                        glyph="remove"
                        style={styles.deleteIcon}
                        onClick={() => this.setState({ isModalOpen: true })}
                    />
                    <ConfirmModal
                        { ...modalProps(this, "isModalOpen") }
                        action={() => this.props.dispatch(
                            deleteAnnouncement(this.props.announcement.id)
                        )}
                        text="Are you sure you would like to delete this announcement?"
                    />
                </div>
            )
        }
    }

    render() {
        const announcement = this.props.announcement;
        return (
            <div style={styles.announcement}>
                <div style={styles.announcementTop}>
                    <div
                        style={{ display: "inline-block" }}
                        onClick={() => {
                            window.location.assign(
                                `/profiles/id/${announcement.author.id}`
                            );
                        }}
                    >
                        <ProfilePicture
                            user={announcement.author}
                            frameSize={40}
                            style={{ cursor: "pointer" }}
                        />
                        <span
                            style={styles.author}
                        >
                            {fullName(announcement.author)}
                        </span>
                    </div>
                    <span style={styles.time}>
                        {" - " + parseDateAndTime(announcement.createdAt)}
                    </span>
                    {this.renderDeleteButton()}
                </div>
                <span dangerouslySetInnerHTML={{ __html: sanitize(link(announcement.content)) }} />
            </div>
        )
    }

}

export default connect()(AnnouncementsListItem);
