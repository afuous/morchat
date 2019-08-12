import { defaultColor, selectedColor } from "~/shared/styles/colors";

const button = {
    border: "0",
    borderRadius: "1px",
    fontSize: "18px",
    position: "relative",
    width: "210px",
    height: "32px",
    padding: "5px",
}

export default {
    wrapper: {
        backgroundColor: defaultColor,
        width: "260px",
        height: "auto",
        position: "absolute",
        right: "10px",
        textAlign: "center",
        paddingTop: "50px",
        paddingBottom: "50px",
        top: "230px",
        fontFamily: "'helvetica neue', sans-serif",
    },
    fpLink: {
        fontSize: "14px",
        textDecoration: "underline",
        color: "-webkit-link",
    },
    errorMsg: {
        display: "inline-block",
        marginTop: "10px",
    },
    textBox: {
        fontSize: "18px",
        width: "210px",
        height: "28px",
        padding: "3px",
        marginBottom: "15px",
        boxSizing: "unset",
    },
    signupButton: [button, {
        backgroundColor: "#00A2FF",
        ":hover": {
            backgroundColor: "#008BDB",
        }
    }],
    loginButton: [button, {
        backgroundColor: selectedColor,
        ":hover": {
            backgroundColor: "darkorange",
        },
    }],
}
