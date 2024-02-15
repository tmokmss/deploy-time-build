FROM nginx:latest
# create dummy file to change the size of a image
ARG DUMMY_FILE_SIZE_MB="10"
# RUN fallocate -l ${DUMMY_FILE_SIZE_MB} dummy.img
RUN dd if=/dev/zero of=dummy.img bs=1M count=${DUMMY_FILE_SIZE_MB}
