import React from "react";

class FileUpload extends React.Component {

    render() {
        return (
            <input
                type="file"
                { ...this.props }
            />
        )
    }

}

export default FileUpload;
