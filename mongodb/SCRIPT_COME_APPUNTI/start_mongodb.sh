
# la variabile d'ambiente -e MONGO_INITDB_DATABASE=dbsa e' gia' stata definita nel Dockerfile
# docker run -d --name mongodb -p 27017-27019:27017-27019 -e MONGO_INITDB_DATABASE=dbsa mymongo

docker run -d --name mongodb -p 27017-27019:27017-27019 mymongo

