#!/usr/bin/env bash

for i in {1..100} ; do
    echo =============================
    echo publishing data
    mosquitto_pub -t home/bedroom/humidity  -m ${RANDOM:0:1},${RANDOM:0:1}
    mosquitto_pub -t home/livingroom/humidity  -m ${RANDOM:0:1},${RANDOM:0:1}
    mosquitto_pub -t home/bathroom/humidity  -m ${RANDOM:0:1},${RANDOM:0:1}
    mosquitto_pub -t home/bedroom/temperature  -m ${RANDOM:0:1},${RANDOM:0:1}
    mosquitto_pub -t home/livingroom/temperature  -m ${RANDOM:0:1},${RANDOM:0:1}
    mosquitto_pub -t home/bathroom/temperature  -m ${RANDOM:0:1},${RANDOM:0:1}
    ##echo "Number $i: $(date +%Y-%m-%d-%H:%M:%S)"
    ( time ( echo $i ; sleep 10 ) ) 2>&1 | sed 's/^/   /'
done | tee timing.log

#mosquitto_pub -t home/dollar  -m ${RANDOM:0:1},${RANDOM:0:1}