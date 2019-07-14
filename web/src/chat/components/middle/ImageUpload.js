import React from "react";
import Radium from "radium";

import FileUpload from "~/shared/components/forms/FileUpload";
import TextArea from "~/shared/components/forms/TextArea";
import Glyphicon from "react-bootstrap/lib/Glyphicon";

import { uploadImage } from "~/chat/actions";
import { connect } from "react-redux";

const RadiumGlyphicon = Radium(Glyphicon);

@Radium
class ImageUpload extends React.Component {

    render() {
        return (
            <div>
                <RadiumGlyphicon
                    onClick={() => $("#fileUpload").trigger("click")}
                    glyph="camera"
                />
                <div style={{ display: "none" }}>
                    <FileUpload
                        id="fileUpload"
                        accept="image/*"
                        onChange={(event) => this.props.dispatch(uploadImage(event.target.files[0]))}
                    />
                    <TextArea id="link" value={this.props.link} />
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        link: state.imgurLink,
    }
}

export default connect(mapStateToProps)(ImageUpload);
