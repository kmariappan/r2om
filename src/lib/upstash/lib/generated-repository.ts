// Placeholder File
import { Redis } from "@upstash/redis";
import { EntityModel } from "./entity-model";
import { Address, User } from "./generated-types";

export class RepositoryCollection {
    public user: EntityModel<User>
    public address: EntityModel<Address>

    constructor(private redis: Redis) {
        this.user = new EntityModel<User>('user', this.redis, '')
        this.address = new EntityModel<Address>('address', this.redis, '')
    }
}