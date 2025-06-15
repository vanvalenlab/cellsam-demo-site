# Getting Started

To start this app in your local environment, first install Docker on your local machine. Follow directions on how to set that up on your machine [here](https://www.docker.com/get-started/).

Once installed, run the following command to build a docker image:

```bash
docker build -t cellsam-demo-site:local .
```

Then run the next command to start the server:

```bash
docker run --rm -d -p 8080:80 --name test-cellsam cellsam-demo-site:local
```