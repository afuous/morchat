#!/bin/bash

set -e # exit on error

exists="$(psql -U postgres -tAc "select 1 from pg_database where datname = 'morchat'")"
if [[ "$exists" = '1' ]]; then
	>&2 echo 'MorChat database already exists. To drop the database, run:'
	>&2 echo
	>&2 echo '	psql -U postgres -c "DROP DATABASE morchat;"'
	>&2 echo
	exit 1
fi

# psql -U postgres -c "DROP DATABASE IF EXISTS morchat;"
psql -U postgres -c "DROP USER IF EXISTS morchat;"
psql -U postgres -c "CREATE USER morchat WITH PASSWORD 'morchat';"
psql -U postgres -c "CREATE DATABASE morchat OWNER morchat;"

# has to be done with postgres user idk
psql morchat postgres -c "CREATE EXTENSION IF NOT EXISTS citext;"

# TODO: updated_at


psql morchat morchat < "$(dirname $0)/node_modules/connect-pg-simple/table.sql"

psql morchat morchat -c "
CREATE TABLE users (
	id serial primary key not null,
	username citext not null unique,
	firstname text not null,
	lastname text not null,
	email citext not null unique,
	phone text,
	prof_pic_url text,
	created_at timestamptz not null
);
"

psql morchat morchat -c "
CREATE TABLE chats (
	id serial primary key not null,
	creator_id int references users(id),
	is_two_people boolean not null,
	name text,
	created_at timestamptz not null,
	updated_at timestamptz not null
);
"

psql morchat morchat -c "
CREATE TABLE chat_users (
	chat_id int references chats(id) not null,
	user_id int references users(id) not null,
	unread_messages int not null,
	unique(chat_id, user_id)
);
"

psql morchat morchat -c "
CREATE TABLE chat_messages (
	chat_id int references chats(id) not null,
	author_id int references users(id) not null,
	content text not null,
	created_at timestamptz not null
);
"

psql morchat morchat -c "
CREATE TABLE mobile_device_tokens (
	user_id int references users(id) not null,
	token text not null,
	unique(user_id, token)
);
"

psql morchat morchat -c "
CREATE TABLE password_entries (
	user_id int references users(id) not null unique,
	password_hash text not null
);
"

psql morchat morchat -c "
CREATE TABLE announcements (
	id serial primary key not null,
	author_id int references users(id) not null,
	content text not null,
	created_at timestamptz not null
);
"

# unclear to what extent this is necessary, but it seems important
psql morchat morchat -c "
create index message_search_index on chat_messages (chat_id, created_at);
"
