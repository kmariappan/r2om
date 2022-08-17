import { Redis } from "@upstash/redis";
import { ConstructorArgs, DefaultProps, Model, Result, ValidationError } from "../types/base";
import cuid from 'cuid'
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


    findAll(): FilterBuilder<T, R> {
        return new FilterBuilder<T, R>(this.args, 'all')
    }

    findOne(id: string): FilterBuilder<T, R> {
        return new FilterBuilder<T, R>(this.args, 'one', id)
    }

    findMany(ids: string[]) {
        return new FilterBuilder<T, R>(this.args, 'many', ids)
    }

    async create(value: Omit<T, keyof DefaultProps>): Promise<Result<T>> {
        return new Promise<Result<T>>((resolve) => {
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

            const entity = { id, createdAt: time, updatedAt: time, ...value }

            this.redis.hset(this.name, { [id]: { ...entity } }).then(res => {
                resolve({
                    success: true,
                    data: entity as unknown as T
                })
            })
        })
    }

    async update(id: string, value: Partial<T>): Promise<Result> {
        const data = await this.redis.hget(this.name, id) as T 
        const updatedAt = Date.now().toString()      

        return new Promise<Result>((resolve) => {
            this.redis.hset(this.name, { [id]: {...data, ...value, updatedAt } }).then(res => {
                resolve({
                    success: true,
                    data: null
                })
            })
        })
    }

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

    async delete(id: string): Promise<Result> {
        return new Promise<Result>((resolve) => {
            this.redis.hdel(this.name, id).then(() => {
                resolve({ success: true, data: null })
            }).catch(err => {
                if (err) {
                    resolve({ success: false, data: null })
                }
            })
        })
    }

    async deleteMany(ids: string[]): Promise<Result> {
        return new Promise<Result>((resolve) => {
            const promises: Array<any> = []
            ids.forEach((id) => {
                promises.push(this.redis.hdel(this.name, id))
            })
            Promise.all(promises).then(res => {
                resolve({
                    success: true,
                    data: null
                })
            }).catch(err => {
                if (err) {
                    resolve({ success: false, data: null })
                }
            })
        })
    }

    async deleteAll(): Promise<Result> {
        const keys = await this._getAllKeys()
        return await this.deleteMany(keys)
    }

    async attach(thisId: string, relationKey: keyof R, relationEntityId: string): Promise<Result> {
        return new Promise<Result>(async (resolve) => {
            const key = relationKey as string
            if (this.schema.attributes[key].relation !== 'manyToMany') {
                resolve(
                    {
                        success: false,
                        data: null
                    }
                )
            } else {
                const { relateThrough } = this.schema.attributes[key]
                if (relateThrough) {
                    let id = cuid()
                    const sourceKey = `${this.name}Id`
                    let destinationKey = ''

                    const data: any = {
                        [sourceKey]: thisId
                    }
                    relateThrough.split('_').forEach((d) => {
                        if (this.name !== d) {
                            destinationKey = `${d}Id`
                            data[destinationKey] = relationEntityId
                        }
                    })

                    const values = await this.redis.hvals(relateThrough)

                    const filteredData = values.filter((value: any) => value[sourceKey] === data[sourceKey] && value[destinationKey] === data[destinationKey])

                    if (filteredData && filteredData.length > 0) {
                        resolve({
                            success: false,
                            data: null,
                            errors: {
                                type: 'other',
                                message: 'Object Attached Already'
                            }
                        })
                    } else {
                        this.redis.hset(relateThrough, {
                            [id]: { id, ...data }
                        }).then(res => {
                            if (res) {
                                resolve(
                                    {
                                        success: true,
                                        data: null
                                    }
                                )
                            } else {
                                resolve({ success: false, data: null, errors: { type: 'other', message: 'unknown' } })
                            }
                        })
                    }
                }
            }
        })
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