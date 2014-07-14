#!/bin/bash

ssh -f root@162.243.123.65 -L 8080:localhost:8080 -N
ssh -f root@162.243.123.65 -L 28015:localhost:28015 -N
ssh -f root@162.243.123.65 -L 27017:localhost:27017 -N
ssh -f root@162.243.123.65 -L 3306:localhost:3306 -N
ssh -f root@162.243.123.65 -L 9200:localhost:9200 -N
ssh -f root@162.243.123.65 -L 9300:localhost:9300 -N