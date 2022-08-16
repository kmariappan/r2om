import { Redis } from "@upstash/redis";
import { RepositoryCollection } from "./lib/generated-repository";

const getRepositories = (redis: Redis, z: any) => {
    return new RepositoryCollection(redis, z)
}

export default getRepositories

