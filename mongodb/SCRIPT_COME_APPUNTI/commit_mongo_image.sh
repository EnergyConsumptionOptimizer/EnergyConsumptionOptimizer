docker stop mongodb
docker commit -m "saved mongo" -a "autore" mongodb mymongo.1
docker rm mongodb
docker rmi mymongo
docker tag mymongo.1 mymongo
docker rmi mongodb.1

