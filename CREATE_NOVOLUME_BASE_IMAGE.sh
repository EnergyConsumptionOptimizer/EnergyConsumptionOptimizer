
MONGOOriginalImage="mongo:8.0.1-noble"
MONGOContainerName="mongodb"
NoVolumeMONGOImageName="mongonovolume"

# se l'immagine e' gia' nel registry non la ricreo ed esco subito

FOUND=`docker image ls -q ${NoVolumeMONGOImageName}`
if [[ -n ${FOUND} ]] ; then echo "image ${NoVolumeMONGOImageName} esiste gia\'"; exit 0; fi

echo running container ${MONGOContainerName}
docker run -itd --name ${MONGOContainerName} ${MONGOOriginalImage}

echo wait until container is up
NUMATTEMPTS=0
while OUT=`docker ps --no-trunc --filter "name=^/${MONGOContainerName}" --filter "status=running" --format "{{.ID}}"`; [[ -z ${OUT} ]] ; do ((${NUMATTEMPTS}++)); echo ${NUMATTEMPTS} sleep 1; done
echo find anonymous volumes
VOLUMIseparatidavirgole=`docker ps --no-trunc --filter "name=^/${MONGOContainerName}" --filter "status=running" --format "{{.Mounts}}"`
echo stopping container ${MONGOContainerName}
docker stop ${MONGOContainerName}

echo export stopped container
docker export ${MONGOContainerName} > ${MONGOContainerName}_export.tar
echo import image in local docker registry
echo docker import ${MONGOContainerName}_export.tar ${NoVolumeMONGOImageName}
docker import ${MONGOContainerName}_export.tar ${NoVolumeMONGOImageName}
rm ${MONGOContainerName}_export.tar

echo remove stopped container
docker rm ${MONGOContainerName}
echo remove anonymous volumes
if [[ -n ${VOLUMIseparatidavirgole}  ]] ; then
  VOLUMIseparatidaspazi=${VOLUMIseparatidavirgole//,/ }
  docker volume rm -f ${VOLUMIseparatidaspazi}
fi
echo lists mongo images
docker images ${NoVolumeMONGOImage}

