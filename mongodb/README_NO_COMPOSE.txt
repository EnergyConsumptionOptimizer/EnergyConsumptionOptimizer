
Questa versione aswl4 crea l'immagine di mongo
in modo che questa NON CREI PIU' i volumi anonimi
MA SENZA MODIFICARE il file docker-entrypoint.sh
dell'immagine originale.
Per fare questo viene eseguito il container e 
poi ne viene esportato lo stato in una nuova immagine
e nella nuova immagine non c'e' NE' i 2 volumi anonimi
/data/db  /data/configdb e NEPPURE l'ordine 
nel Dockerfile di creare i due volumi.

Lo svantaggio e' che non riesco a mettere questa prima fase
dentro il docker-compose.yml file.

DEVO SEMPRE ESEGUIRE PER PRIMO LO SCRIPT

POI POSSO DECIDERE SE usare gli script oppure usare docker-compose

Se uso gli script .sh 
- costruisco l'immagine mymongo a partire da mongo:5.0.16-focal
- eseguo il container di nome mongodb che parte dall'immagine mymongo.
- stoppo il container di nome mongodb
- rimuovo il container di nome mongodb
- rimuovo l'immagine mymongo

SE INVECE USO docker-compose
- creo delle immagini di container con dei nomi diversi
- metto in esecuzione dei container con dei nomi diversi

