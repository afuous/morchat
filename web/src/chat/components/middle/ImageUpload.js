import React from "react";
import Radium from "radium";

import FileUpload from "~/shared/components/forms/FileUpload";
import TextArea from "~/shared/components/forms/TextArea";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import styles from "~/chat/styles/middle";

import { uploadImage } from "~/chat/actions";
import { connect } from "react-redux";

const RadiumGlyphicon = Radium(Glyphicon);

@Radium
class ImageUpload extends React.Component {

    render() {
        return (
            <div>
                <RadiumGlyphicon
                    glyph="camera"
                    style={styles.camera}
                />
                <FileUpload
                    style={{ display: "none" }}
                    id="fileUpload"
                    accept="image/*"
                    onChange={(event) => this.props.dispatch(uploadImage(event.target.files[0]))}
                />
            </div>
        )
    }
}

export default connect()(ImageUpload);
