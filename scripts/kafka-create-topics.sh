#!/bin/bash

# List of topics to create
topics=(
    "match-requests-easy-arrays"
    "match-requests-medium-arrays"
    "match-requests-hard-arrays"
    "match-requests-easy-trees"
    "match-requests-medium-trees"
    "match-requests-hard-trees"
)

# Function to create a topic
create_topic() {
    kafka-topics --create --if-not-exists --topic $1 --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1
}

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
cub kafka-ready -b localhost:9092 1 20

# Create topics
for topic in "${topics[@]}"
do
    echo "Creating topic: $topic"
    create_topic $topic
done

echo "All topics created."