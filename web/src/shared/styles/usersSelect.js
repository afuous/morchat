import { standardBoxShadow } from "~/shared/styles/boxShadows";
import { selectedColor } from "~/shared/styles/colors";

export default {
    div: {
        height: "130px",
        overflowY: "auto",
    },
    textBox: {
        width: "100%",
        marginTop: "5px",
        marginBottom: "10px",
        padding: "8px 4px",
        fontSize: "15px",
        boxShadow: standardBoxShadow,
        borderRadius: "1px",
        ":focus": {
            outline: "none",
        },
    },
    userItem: {
        button: {
            margin: "2px 4px 2px 4px",
            display: "inline-block",
            padding: "2px 3px 2px 3px",
            boxShadow: standardBoxShadow,
            borderRadius: "1px",
            cursor: "pointer",
        },
        selected: {
            backgroundColor: "#53CF29",
        },
        notSelected: {
            backgroundColor: "#ffd16e",
            ":hover": {
                backgroundColor: selectedColor,
            }
        },

    },
}
