k6 run rtb-load-test.js \
  -e BASE_URL=http://rtb.us.adstork.com \
  -e SSP_API_KEY=2fec0ab1bfbed9ba01d97037a791989f \
  -e TARGET_QPS=5000 \
  -e PRE_ALLOCATED_VUS=500 \
  -e MAX_VUS=4000 \
  -e DURATION=120s


  k6 run ortb_tester.js \
  -e BASE_URL=http://localhost:8080 \
  -e SSP_API_KEY=d2c05360ea0b15303d902b158099268c \
  -e TARGET_QPS=10 \
  -e PRE_ALLOCATED_VUS=50 \
  -e MAX_VUS=100 \
  -e DURATION=120s