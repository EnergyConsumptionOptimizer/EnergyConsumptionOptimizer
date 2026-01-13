
# docker build -t mymongo .  && \
# docker run -d --name mongodb --rm -p 27017-27019:27017-27019 -e MONGO_INITDB_DATABASE=dbsa mymongo

docker run -d --name mongodb --rm -p 27017-27019:27017-27019 mymongo

