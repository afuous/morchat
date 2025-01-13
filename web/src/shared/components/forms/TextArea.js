import React from "react";
import Radium from "radium";

export default Radium((props) => {
    let { style, refFunc, ...rest } = props;
    return React.createElement("textarea", {
        style: [style || {}, {
            outline: "none",
            border: "none",
        }],
        ...(refFunc == null ? {} : { ref: refFunc }),
        ...rest,
    });
});
