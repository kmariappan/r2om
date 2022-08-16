import { Redis } from "@upstash/redis";
import { ConstructorArgs, DefaultProps, Model, Result, ValidationError } from "../types/base";
import cuid from './external/cuid'
import { FilterBuilder } from "./filter-builder";


export class EntityModel<T, R = any> {
    private name: string
    private redis: Redis
    private schema: Model<T>
    private args: ConstructorArgs
    private validationSchema: any

    constructor(args: ConstructorArgs) {
        this.name = args.name
        this.redis = args.redis
        this.validationSchema = args.validationSchema
        this.schema = JSON.parse(args.schema) as Model<T>
        this.args = args
    }

    /*    new(value: Omit<T, keyof DefaultProps>): Entity<T, R> {
           return new Entity<T, R>(value, this.args)
       }
    */
    /*     manage(value: Partial<T>): Entity<T, R> {
            return new Entity<T, R>(value, this.args, true)
        } */

    findAll(): FilterBuilder<T, R> {
        return new FilterBuilder<T, R>(this.args, 'all')
    }

    findOne(id: string): FilterBuilder<T, R> {
        return new FilterBuilder<T, R>(this.args, 'one', id)
    }


    findMany(ids: string[]) {
        return new FilterBuilder<T, R>(this.args, 'many', ids)
    }

    async create(value: Omit<T, keyof DefaultProps>): Promise<Result> {
        return new Promise<Result>((resolve) => {
            this.validationSchema.safeParseAsync(value).then((res: any) => {
                if (!res.success) {
                    const validataionError: ValidationError[] = []
                    res.error.issues.forEach((issue: any) => {
                        validataionError.push({ path: issue.path[0], message: issue.message })
                    });
                    resolve({
                        success: false,
                        data: null,
                        errors: {
                            type: 'validation',
                            validataionError
                        }
                    })
                }
            })

            let id = cuid()

            if (this.schema.isOneToOneModel) {
                const { scalarId } = value as unknown as any
                id = scalarId
            }

            const time = Date.now().toString()
            this.redis.hset(this.name, { [id]: { id, createdAt: time, updatedAt: time, ...value } }).then(res => {
                resolve({
                    success: true,
                    data: null
                })
            })
        })
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

    async attach(thisId: string, relationKey: keyof R, relationEntityId: string): Promise<Result> {
        const key = relationKey as string
        if (this.schema.attributes[key].relation !== 'manyToMany') {
            return {
                success: false,
                data: null
            }
        } else {
            const { relateThrough } = this.schema.attributes[key]

            if (relateThrough) {
                let id = cuid()
                const data: any = {
                    [`${this.name}Id`]: thisId
                }
                relateThrough.split('_').forEach((d) => {
                    if (this.name !== d) {
                        data[`${d}Id`] = relationEntityId

                    }
                })

                await this.redis.hset(relateThrough, {
                    [id]: { id, ...data }
                })
            }
            return {
                success: true,
                data: null
            }
        }

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