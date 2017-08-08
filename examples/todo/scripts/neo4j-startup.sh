# REST PORT: 10000
# BOLT PORT: 10001
echo "docker run -p 10000:7474 -p 10001:7687 --rm --env=NEO4J_AUTH=none neo4j"
docker run -p 10000:7474 -p 10001:7687 --rm --env=NEO4J_AUTH=none neo4j