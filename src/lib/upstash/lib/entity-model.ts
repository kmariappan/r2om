import { Redis } from "@upstash/redis";
import { Model } from "../types/base";

type OmitId<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>
export class EntityModel<T> {

    constructor(private name: string, private redis: Redis, private schema: string) { }

    async create(value: OmitId<T>): Promise<any> {
        const id = Date.now().toString()
        return await this.redis.hset(this.name, { [id]: { id, createdAt: id, updatedAt: id, ...value } })
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
    async getAll(): Promise<T[]> {
        const data = await this.redis.hvals(this.name) as T[]
        return data
    }

    async getSchema(): Promise<Model<T>> {        
        return JSON.parse(this.schema) as Model<T>
    }

    async findMany(ids: string[]) {
        //const ids = args.map(a => this._getnerateKeyById(a))
        const res = await this.redis.hmget<Record<string, T>>(this.name, ...ids)
        return Object.entries(res ?? {}).map(([key, value]) => ({
            id: key,
            ...value,
        }));
    }

    async findOne(id: string): Promise<T | null> {
        return await this.redis.hget<T>(this.name, id)
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