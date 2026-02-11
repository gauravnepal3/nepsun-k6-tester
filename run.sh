k6 run rtb-load-test.js \
  -e BASE_URL=http://rtb.us.adstork.com \
  -e SSP_API_KEY=67d6ee061a877879e1ea0bc15f46e215 \
  -e TARGET_QPS=500 \
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

  k6 run fake_request.js   -e MODE=constant   -e TARGET_QPS=3800   -e DURATION=120s   -e PRE_ALLOCATED_VUS=12000   -e MAX_VUS=30000   -e TIMEOUT=5s   -e BASE_URL=http://rtb.us.adstork.com   -e SSP_API_KEY=3c8ac91e4b745f0a31f914332437be24