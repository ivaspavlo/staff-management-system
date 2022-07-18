FROM node:10.4.1

RUN git config --system core.logallrefupdates false

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6 \
    && echo "deb http://repo.mongodb.org/apt/debian jessie/mongodb-org/3.4 main" | tee /etc/apt/sources.list.d/mongodb-org-3.4.list

RUN apt-get update && apt-get install -y redis-server mongodb-org
