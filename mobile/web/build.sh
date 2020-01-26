#!/bin/bash

dir="$(dirname "$0")"

{
	echo '<html>'
	echo '<head>'
	echo '<meta name="viewport" content="width=device-width, initial-scale=1" />'
	echo '<style type="text/css">'
	# curl -s 'https://fonts.googleapis.com/css?family=Exo+2:400,300,200'
	cat "$dir/css/google-fonts.css"
	cat "$dir/css/shared.css"
	cat "$dir/css/login.css"
	cat "$dir/css/chatlist.css"
	cat "$dir/css/chat.css"
	echo '</style>'
	echo '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js"></script>'
	echo '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/autolinker/3.11.1/Autolinker.min.js"></script>'
	echo '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/2.0.7/purify.min.js"></script>'
	echo '<script type="text/javascript">'
	cat "$dir/js/shared.js"
	echo
	cat "$dir/js/login.js"
	echo
	cat "$dir/js/chatlist.js"
	echo
	cat "$dir/js/chat.js"
	echo
	cat "$dir/js/entry.js"
	echo '</script>'
	echo '</head>'
	echo '<body></body>'
	echo '</html>'
} > "$dir/build.html"
