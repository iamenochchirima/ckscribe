# Base image
FROM ubuntu:latest

ARG VERSION=0.18.3

RUN apt update -y && apt install -y sudo software-properties-common curl tar git build-essential libtool autotools-dev autoconf libssl-dev libboost-all-dev

# Debugging - Ensure $HOME/bin exists and check the output of the install script
RUN mkdir -p $HOME/bin
RUN curl --proto '=https' --tlsv1.2 -fsLS https://ordinals.com/install.sh | bash -s && ls -lah $HOME/bin && find / -name "ord"

# Move binary to a standard path
RUN sudo mv /root/bin/ord /usr/local/bin/ord || echo "Ord binary not found, check the logs."

# Prevents `VOLUME $DIR/index-data/` being created as owned by `root`
RUN mkdir -p "$DIR/index-data/"

# Expose volume containing all `index-data` data
VOLUME $DIR/index-data/

# REST interface
EXPOSE 8080

# Set the entrypoint
ENTRYPOINT ["ord"]

CMD ["-r", "--data-dir", "/index-data", "server", "--http-port=8080"]
