import { defaultColor } from "~/shared/styles/colors";

export const nameFontSize = 17;

export default {
    center: {
        textAlign: "center",
    },
    memberList: {
        marginTop: "20px",
    },
    userDisplay: {
        span: {
            padding: "20px",
            textAlign: "left",
            display: "inline-block",
            marginBottom: "15px",
            backgroundColor: "#c9c9c9",
            border: "1px solid #ababab",
            width: "90%",
            cursor: "pointer",
            ":hover": {
                backgroundColor: defaultColor,
            },
        },
        name: {
            fontSize: nameFontSize + "px",
            margin: "8px",
            verticalAlign: "middle",
        },
        glyph: {
            float: "right",
            marginTop: "10px",
            marginRight: "-10px",
            opacity: ".5",
            ":hover": {
                opacity: "1",
            },
        },
    },
}
