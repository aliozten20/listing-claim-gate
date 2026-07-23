FROM grafana/grafana:11.2.0

USER root
COPY provisioning /etc/grafana/provisioning
COPY dashboards /var/lib/grafana/dashboards
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
 && chown -R grafana:root /etc/grafana/provisioning /var/lib/grafana/dashboards

ENV GF_SECURITY_ADMIN_USER=admin \
    GF_SECURITY_ADMIN_PASSWORD=listing \
    GF_AUTH_ANONYMOUS_ENABLED=true \
    GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer \
    GF_USERS_DEFAULT_THEME=light \
    GF_PATHS_PROVISIONING=/etc/grafana/provisioning \
    PROMETHEUS_URL=http://prometheus:9090

# entrypoint rewrites datasource URL then hands off to Grafana's /run.sh
ENTRYPOINT ["/entrypoint.sh"]
