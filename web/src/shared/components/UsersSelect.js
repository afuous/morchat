import React from "react";
import Radium from "radium";

import ajax from "~/util/ajax";
import update from "react/lib/update";
import TextBox from "~/shared/components/forms/TextBox";
import { fullName, userSearch } from "~/util";
import styles from "~/shared/styles/usersSelect";

const UserItem = Radium((props) => {
    return (
        <p
            style={[
                styles.userItem.button,
                props.isSelected ? styles.userItem.selected : styles.userItem.notSelected,
            ]}
            onClick={props.onClick}
        >
            {fullName(props.user)}
        </p>
    )
})

@Radium
export default class UsersSelect extends React.Component {

    static propTypes = {
        selected: React.PropTypes.array,
        onChange: React.PropTypes.func,
    }

    constructor(props) {
        super(props);

        this.state = {
            allUsers: [],
            query: "",
        }
    }

    componentDidMount = async () => {
        try {
            let { data: users } = await ajax.request("get", "/users");
            this.setState({
                allUsers: users,
            });
        } catch (err) {
            console.log(err);
        }
    }

    isUserSelected = (user) => {
        return this.props.selected.some(u => u._id == user._id);
    }

    onUserClick = (user) => {
        let newUsers;
        if (this.isUserSelected(user)) {
            newUsers = update(this.props.selected, {
                $splice: [
                    [this.props.selected.indexOf(user), 1],
                ],
            });
        } else {
            newUsers = this.props.selected.concat([user]);
        }
        this.props.onChange(newUsers);
    }

    getShownUsers = () => {
        return this.state.allUsers.filter(userSearch(this.state.query));
    }

    render() {
        return (
            <div>
                <TextBox
                    placeholder="Search Names..."
                    onChange={event => this.setState({ query: event.target.value })}
                    value={this.state.query}
                    style={styles.textBox}
                />
                <br />
                <div style={styles.div}>
                        {this.getShownUsers().map(user => (
                            <UserItem
                                key={user._id}
                                user={user}
                                onClick={() => this.onUserClick(user)}
                                isSelected={this.isUserSelected(user)}
                            />
                        ))}
                </div>
            </div>
        )
    }
}
