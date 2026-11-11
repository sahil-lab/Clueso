FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
COPY infra/docker/nginx-main.conf /etc/nginx/nginx.conf
COPY infra/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/web/dist/ /usr/share/nginx/html/
EXPOSE 8080
