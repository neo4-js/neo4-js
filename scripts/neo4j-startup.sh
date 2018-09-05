# REST PORT: 10005
# BOLT PORT: 10006
echo "docker run -p 10005:7474 -p 10006:7687 --rm --env=NEO4J_AUTH=none neo4j"
docker run -p 10005:7474 -p 10006:7687 --rm --env=NEO4J_AUTH=none neo4j
