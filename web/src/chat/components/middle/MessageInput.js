import React from "react";
import Radium from "radium";

import { connect } from "react-redux";
import Form from "~/shared/components/forms/Form";
import TextArea from "~/shared/components/forms/TextArea";
import SubmitButton from "~/shared/components/forms/SubmitButton";
import ImageUpload from "~/chat/components/middle/ImageUpload";
import ImagePreview from "~/chat/components/middle/ImagePreview";
import styles from "~/chat/styles/middle";
import {
    sendMessage,
    startTyping,
    stopTyping,
    setInputSize,
} from "~/chat/actions";

const maxRowsShown = 12;

@Radium
class MessageInput extends React.Component {

    initialState = {
        content: "",
        numRows: 1,
        imagePreviewFile: null,
    }
    state = this.initialState;

    componentDidMount = () => {
        this.originalHeight = $("#chat-input")[0].scrollHeight;
    }

    handleSend = () => {
        if (this.state.content.length === 0) {
            return;
        }
        this.props.dispatch(sendMessage(this.state.content));
        this.setState(this.initialState);
        this.props.dispatch(setInputSize(0));
    }

    // this is necessary because the input box is a textarea, not an input type="text"
    // so have to listen for enter keypress here
    handleKeyDown = (event) => {
        if (!event.shiftKey && event.which == 13) { // enter key
            event.preventDefault();
            this.handleSend();
        }
    }

    handlePaste = (event) => {
        const clipboardItem = event.clipboardData.items[0];
        if (clipboardItem == null) {
            return;
        }
        const { kind, type } = clipboardItem;
        if (kind == "file" && type.startsWith("image/")) {
            this.setImagePreviewFile(clipboardItem.getAsFile());
        }
    }

    handleChange = (event) => {

        // without this line, if it expands to a certain number of lines it
        // will never go down to fewer lines; not sure why but this works
        event.target.style.height = 0;

        const currentHeight = event.target.scrollHeight;
        const heightDiff = currentHeight - this.originalHeight;
        const rowHeight = parseInt($(event.target).css("lineHeight"));
        const numRows = Math.round(heightDiff / rowHeight + 1);

        this.setState({
            content: event.target.value,
            numRows: numRows,
        });

        this.props.dispatch(setInputSize(Math.min(
            heightDiff,
            maxRowsShown * rowHeight - $(event.target).outerHeight()
        )));

        // this undoes what is done at the beginning of this function
        event.target.style.height = ((this.state.numRows * 20) + 10) + "px";

        const typingTimeout = 2000;
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.props.dispatch(stopTyping());
        }, typingTimeout);
        this.props.dispatch(startTyping());

    }

    setImagePreviewFile = (file) => {
        this.setState({
            imagePreviewFile: file,
        });
    }

    handleSendImage = (url) => {
        this.props.dispatch(sendMessage(url));
        if (this.chatInputElement) {
            this.chatInputElement.focus();
        }
    }

    render() {
        return (
            <div style={styles.inputDiv}>
                <Form onSubmit={this.handleSend} style={{ marginBottom: "0" }}>
                    <ImageUpload
                        onSelectFile={this.setImagePreviewFile}
                    />
                    <ImagePreview
                        file={this.state.imagePreviewFile}
                        isOpen={this.state.imagePreviewFile != null}
                        onAfterOpen={() => {}}
                        onRequestClose={() => this.setState({ imagePreviewFile: null })}
                        onSubmit={this.handleSendImage}
                    />
                    <TextArea
                        autoFocus
                        id="chat-input"
                        rows={this.state.numRows}
                        style={[
                            styles.inputTextArea,
                            { height: ((this.state.numRows * 20) + 10) + "px" },
                            this.state.numRows > maxRowsShown ? { overflowY: "scroll", overflowX: "hidden" } : {},
                        ]}
                        onKeyDown={this.handleKeyDown}
                        onPaste={this.handlePaste}
                        value={this.state.content}
                        onChange={this.handleChange}
                        refFunc={element => this.chatInputElement = element}
                    />
                    <SubmitButton
                        style={styles.sendButton}
                        text="send"
                    />
                </Form>
            </div>
        )
    }

}

export default connect()(MessageInput);
