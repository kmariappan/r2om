import { Redis } from "@upstash/redis";
import { RepositoryCollection } from "./lib/generated-repository";

const getRepositories= (redis: Redis) => {
    return new RepositoryCollection(redis)
}

export default getRepositories

