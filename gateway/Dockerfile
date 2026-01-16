FROM nginx:1.25-alpine

RUN apk add --no-cache openssl

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY snippets /etc/nginx/snippets

COPY render-template.sh /docker-entrypoint.d/99-render-template.sh
RUN chmod +x /docker-entrypoint.d/99-render-template.sh

COPY docker-entrypoint-ssl.sh /docker-entrypoint-ssl.sh
RUN chmod +x /docker-entrypoint-ssl.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint-ssl.sh"]
CMD ["nginx", "-g", "daemon off;"]
