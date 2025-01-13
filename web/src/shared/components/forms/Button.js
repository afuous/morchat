import React from "react";
import Radium from "radium";

const Button = (props) => {
    let { text, style, refFunc, ...rest } = props;
    return React.createElement("input", {
        type: "button",
        value: text,
        style: [style || {}, {
            outline: "none",
            border: "none",
        }],
        ...(refFunc == null ? {} : { ref: refFunc }),
        ...rest,
    })
}

export default Radium(Button);
