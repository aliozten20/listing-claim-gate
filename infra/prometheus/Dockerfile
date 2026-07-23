FROM prom/prometheus:v2.54.1
COPY prometheus.prod.yml /etc/prometheus/prometheus.yml
COPY entrypoint.sh /entrypoint.sh
# image runs as nobody; keep script executable
USER root
RUN chmod +x /entrypoint.sh
USER nobody
ENTRYPOINT ["/entrypoint.sh"]
