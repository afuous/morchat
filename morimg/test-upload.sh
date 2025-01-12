#!/bin/bash

set -e

if [[ "$#" -lt 2 ]]; then
	>&2 echo 'Usage: ./test-upload.sh <base url> <file path>'
fi

here="$(dirname "$0")"

base_url="$1"
input_file_path="$2"

auth_token="$(cat "$here/config.json" | jq -r '.authTokens[0]')"
url_result_json="$(curl -sS -X POST "$base_url/generateUploadUrlEnding" -H "Authorization: Bearer $auth_token")"

echo "$url_result_json"
echo

upload_url="$base_url$(echo "$url_result_json" | jq -r '.urlEnding')"
upload_result_json="$(curl -sS -F "file=@$input_file_path" "$upload_url")"

echo "$upload_result_json"
echo

uploaded_path="$(echo "$upload_result_json" | jq -r '.path')"

echo 'Original hash:'
cat "$input_file_path" | sha1sum
echo
echo 'Uploaded hash:'
curl -sS "$base_url$uploaded_path" | sha1sum
