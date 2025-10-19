docker stop aswl4-mongodb-1
docker commit -m "saved mongo" -a "autore" aswl4-mongodb-1 mymongo.1
docker rm aswl4-mongodb-1
docker rmi mymongo
docker tag mymongo.1 mymongo
docker rmi mongodb.1

