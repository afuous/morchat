import React from "react";
import Radium from "radium";

import FileUpload from "~/shared/components/forms/FileUpload";
import TextArea from "~/shared/components/forms/TextArea";
import Glyphicon from "react-bootstrap/lib/Glyphicon";
import styles from "~/chat/styles/middle";

import { connect } from "react-redux";

const RadiumGlyphicon = Radium(Glyphicon);

@Radium
class ImageUpload extends React.Component {

    static propTypes = {
        onSelectFile: React.PropTypes.func.isRequired,
    }

    render() {
        return (
            <div>
                <RadiumGlyphicon
                    onClick={() => $("#fileUpload").trigger("click")}
                    glyph="camera"
                    style={styles.camera}
                />
                <FileUpload
                    style={{ display: "none" }}
                    id="fileUpload"
                    accept="image/*"
                    onChange={(event) => this.props.onSelectFile(event.target.files[0])}
                />
            </div>
        )
    }
}

export default connect()(ImageUpload);
