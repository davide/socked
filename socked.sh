#!/bin/sh
while inotifywait -e modify -r src/client; do
  smoosh ./config.json
done
