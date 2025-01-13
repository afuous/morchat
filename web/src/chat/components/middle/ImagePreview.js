import React from "react";
import Radium from "radium";

import axios from "axios"
import StandardModal from "~/shared/components/StandardModal";
import DimModal from "~/shared/components/DimModal";
import { modalPropTypes, modalPropsForward } from "~/util/modal";
import { ModalButton } from "~/shared/components/modal";
import { request } from "~/util/ajax";
import { imagePreview as styles } from "~/chat/styles/middle";

@Radium
class ImagePreview extends React.Component {

    static propTypes = {
        ...modalPropTypes,
        file: React.PropTypes.object,
        onSubmit: React.PropTypes.func.isRequired,
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (!prevProps.file && this.props.file) {
            // needs delay to wait for the ref to be obtained
            setTimeout(()=>{
                if (this.sendButtonElement) {
                    this.sendButtonElement.focus();
                }
            }, 10);
        }
    }

    handleSend = async () => {
        const formData = new FormData();
        formData.append("file", this.props.file);
        const { data: { baseUrl, uploadUrl } } = await request("POST", "/generateMorimgUploadUrl");
        const { data: { path } } = await axios.post(uploadUrl, formData);
        const url = baseUrl + path;
        this.props.onSubmit(url);
        this.props.onRequestClose();
    }

    handleCancel = () => {
        this.props.onRequestClose();
    }

    render() {
        return (
            <DimModal { ...modalPropsForward(this) }>
                <div style={styles.container}>
                    <div style={styles.imageContainer}>
                        {this.props.file != null && (
                            <img
                                src={URL.createObjectURL(this.props.file)}
                                style={styles.image}
                            />
                        )}
                    </div>
                    <div>
                        <div style={styles.buttonContainer}>
                            <ModalButton
                                text="Send"
                                onClick={this.handleSend}
                                style={styles.button}
                                refFunc={element => this.sendButtonElement = element}
                            />
                            <ModalButton
                                text="Cancel"
                                onClick={this.handleCancel}
                                style={styles.button}
                            />
                        </div>
                    </div>
                </div>
            </DimModal>
        )
    }
}

export default ImagePreview;
