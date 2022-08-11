import { Redis } from "@upstash/redis";
import { ConstructorArgs, DefaultProps, Model } from "../types/base";
import cuid from './external/cuid'
import { FilterBuilder } from "./filter-builder";


export class EntityModel<T, R = any> {
    private name: string
    private redis: Redis
    private schema: Model<T>
    private args: ConstructorArgs

    constructor(args: ConstructorArgs) {
        this.name = args.name
        this.redis = args.redis
        this.schema = JSON.parse(args.schema) as Model<T>
        this.args = args
    }

    findAll(): FilterBuilder<T, R> {
        return new FilterBuilder<T, R>(this.args, 'all')
    }

    findOne(id: string): FilterBuilder<T, R> {
        return new FilterBuilder<T, R>(this.args, 'one', id)
    }


    findMany(ids: string[]) {
        return new FilterBuilder<T, R>(this.args, 'many', ids)
    }

    async create(value: Omit<T, keyof DefaultProps>): Promise<any> {
        let id = cuid()

        if (this.schema.isOneToOneModel) {
            const { scalarId } = value as unknown as any
            id = scalarId
        }
        
        const time = Date.now().toString()
        return await this.redis.hset(this.name, { [id]: { id, createdAt: time, updatedAt: time, ...value } })
    }

    /*     async createMany(values: OmitId<T>[]): Promise<"OK"> {
            const id = Date.now().toString()
            const data = {}
            console.log(values)
            values.forEach(v => {
                Object.defineProperty(data, id, { value: { id, ...v }, enumerable: true })
            })
            return this.redis.hmset<T>(this.name, { ...data })
        } */

    /*     async update(id: string, value: Partial<T>): Promise<Partial<T>> {
            const key = this._getnerateKeyById(id)
            const data = await this.redis.get<T>(key)
            const updatedDate = { ...data, ...value }
            return this.redis.set<Partial<T>>(key, { ...updatedDate })
        }
     */



    async getSchema(): Promise<Model<T>> {
        return this.schema
    }

    async count(): Promise<number> {
        return new Promise<number>((resolve) => {
            this.redis.hlen(`${this.name}`).then(res => {
                resolve(res)
            })
        })
    }

    async delete(id: string): Promise<number> {
        return await this.redis.hdel(this.name, id)
    }

    async deleteMany(ids: string[]): Promise<any> {
        const promises: Array<any> = []
        ids.forEach((id) => {
            promises.push(this.redis.hdel(this.name, id))
        })
        return Promise.all(promises)
    }

    async deleteAll(): Promise<number> {
        const keys = await this._getAllKeys()
        return await this.deleteMany(keys)
    }

    async isExists(field: keyof T, value: string): Promise<boolean> {
        const data = await this.redis.hvals(this.name) as T[]
        return new Promise<boolean>((resolve) => {
            if (data.length > 0) {
                data.forEach(d => {
                    const fieldValue = d[field] as unknown as string | number | boolean
                    if (fieldValue === value) {
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
            } else {
                resolve(false)
            }
        })
    }

    private async _getAllKeys(): Promise<string[]> {
        return await this.redis.hkeys(`${this.name}`)
    }
}