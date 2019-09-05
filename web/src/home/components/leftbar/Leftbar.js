import React from "react";
import Radium from "radium";

import LeftbarButton from "./LeftbarButton";
import Link from "~/shared/components/Link";
import ajax from "~/util/ajax";
import { currentUser } from "~/util";
import styles from "~/home/styles/leftbar";

const year = new Date().getFullYear();

@Radium
class Leftbar extends React.Component {

    state = {
        isModalOpen: false,
    }

    render() {
        return (
            <div style={styles.leftbar.div}>

                <LeftbarButton
                    text="View Profile"
                    onClick={() => window.location.assign("/profiles/id/" + currentUser._id)}
                />
                <LeftbarButton
                    text="Log Out"
                    onClick={async() => (
                        await ajax.request("post", "/logout"),
                        window.location.assign("/login")
                    )}
                />
                <LeftbarButton
                    text="All Users"
                    onClick={() => window.location.assign("/allUsers")}
                />
                <hr />

                <span style={styles.leftbar.span}>
                    <Link
                        location="/terms.html"
                        target="_blank"
                        text="Privacy and Terms"
                        style={styles.leftbar.link}
                    />
                </span>

                <br />

                <span style={styles.leftbar.span}>
                    <Link
                        location="https://github.com/afuous/morchat"
                        target="_blank"
                        text="Source code"
                        style={styles.leftbar.link}
                    />
                </span>

            </div>
        )
    }
}

export default Leftbar;
