FROM nginx:1.25-alpine

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY snippets /etc/nginx/snippets

COPY render-template.sh /docker-entrypoint.d/99-render-template.sh
RUN chmod +x /docker-entrypoint.d/99-render-template.sh

EXPOSE 80
