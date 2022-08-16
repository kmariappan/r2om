import { ConstructorArgs, DefaultProps, Model } from "../types/base"
import { Redis } from "@upstash/redis";
import cuid from "./external/cuid"

export class Entity<T, R>{

    private name: string
    private redis: Redis
    private schema: Model<T>
    private newObject: Omit<T, keyof DefaultProps> | undefined
    private existingObject: T | undefined

    constructor(value: any, args: ConstructorArgs, private existingEntity?: boolean) {
        this.name = args.name
        this.redis = args.redis
        this.schema = JSON.parse(args.schema) as Model<T>
        if (this.existingEntity) {
            this.find(value)
        } else {
            this.init(value)
        }
    }

    private init(value: Omit<T, keyof DefaultProps>) {
        this.newObject = value
        return this
    }

    private find(obj: any) {
        const { id } = obj
        console.log(id);
        return this
    }


    async save(): Promise<T> {
        let id = cuid()

        if (this.schema.isOneToOneModel) {
            const { scalarId } = this.newObject as unknown as any
            id = scalarId
        }

        const time = Date.now().toString()

        const newEntitiy = { id, createdAt: time, updatedAt: time, ... this.newObject }
        await this.redis.hset(this.name, { [id]: { ...newEntitiy } })
        return newEntitiy as unknown as T
    }

    private validate() { }

}