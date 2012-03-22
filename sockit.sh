#!/bin/sh
while inotifywait -e modify -r src; do
  smoosh ./config.json
done
