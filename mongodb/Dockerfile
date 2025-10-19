# era FROM mongo:8.0.1-noble  da cui ho tolto i volumi /data/db e /data/configdb
FROM mongonovolume

# Dovrebbe gia' esistere l'utente mongodb 
# ensure that if running as custom user that "mongosh" has a valid "HOME"
# https://github.com/docker-library/mongo/issues/524
# ENV HOME /data/db

ADD mydbinit.js /docker-entrypoint-initdb.d/

# Nota: i flag di set fanno questo: 
# -e termina  la bash se un comando fallisce.
# -x fa vedere in output i comandi eseguiti. 
# -u genera errore se un comando cerca di espandere una variabile che non esiste.
RUN set -eux; \
	chown mongodb /docker-entrypoint-initdb.d/mydbinit.js; \
	chgrp mongodb /docker-entrypoint-initdb.d/mydbinit.js; \
	chmod 755 /docker-entrypoint-initdb.d/mydbinit.js

# questo script serve a inizializzare l'ambiente per il DB
# se non gli passiamo argomenti lui usa come argomento il CMD 
# cioe' esegue come servizio mongod.
# Questo script poi va nella directory /docker-entrypoint-initdb.d/
# ed esegue gli script che trova li' dentro.
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 27017 27018 27019
CMD ["mongod"]

