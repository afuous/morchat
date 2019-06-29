import React from "react";
import Radium from "radium";

import SearchBox from "./SearchBox";
import GlyphLink from "./GlyphLink";
import RightLinks from "./RightLinks";
import Link from "~/shared/components/Link";
import styles from "~/shared/styles/navbar";
import { connect } from "react-redux";

const DropdownItem = Radium(({path, text}) => {
    return (
        <Link
            location={path}
            style={styles.link}
        >
            <p style={styles.navbarDropdown.item}>
                {text}
            </p>
        </Link>
    )
})

@Radium
class Navbar extends React.Component {

    render() {
        return (
            <div>
                <div style={styles.container}>
                    <ul style={styles.ul}>
                        <Link
                            style={[styles.link, styles.title]}
                            text="MorChat"
                            location="/"
                        />
                        <SearchBox />
                        <GlyphLink path="/chat" glyph="comment" name="chat"/>
                        <RightLinks />
                    </ul>
                </div>
                <div style={this.props.isDropdownOpen ? styles.navbarDropdown.div : {display: "none"}}>
                    <DropdownItem path="/" text="Home" />
                    <DropdownItem path="/chat" text="Chat" />
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        isDropdownOpen: state.isDropdownOpen,
    }
}

export default connect(mapStateToProps)(Navbar);

