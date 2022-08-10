import { ConstructorArgs, RelationType, Result } from "../types/base"

type FindType = 'all' | 'one' | 'many'

type SortType = 'asc' | 'desc'

type QueryType<T, R> = {
    populateWith?: Array<keyof R>
    sortByField?: keyof T
    sortOrder: SortType
}

export class FilterBuilder<T, R> {

    private query: QueryType<T, R> = {
        sortOrder: 'asc'
    }

    private result: Result<T[]> = {
        success: true,
        data: []
    }

    constructor(private args: ConstructorArgs, private findType: FindType, private findBy?: string | string[]) { }

    async get(): Promise<Result<T[]>> {
        const { name, redis } = this.args

        if (this.findType === 'all') {
            const data = await redis.hvals(name) as unknown as T[]
            this.result.data = data
        }

        if (this.findType === 'one') {
            if (this.findBy && typeof this.findBy === 'string') {
                const data = await redis.hget(name, this.findBy) as T
                this.result.data?.push(data)
            }
        }

        if (this.findType = 'many') {
            if (this.findBy && typeof this.findBy !== 'string') {
                const res = await redis.hmget<Record<string, T>>(name, ...this.findBy)
                const manipulatedData = Object.entries(res ?? {}).map(([key, value]) => ({
                    id: key,
                    ...value,
                }));
                this.result.data?.push(...manipulatedData)
            }
        }

        if (this.query && this.query.sortByField !== undefined) {
            this.result.data = this.result.data !== null ? this.result.data.sort(this.dynamicSort(this.query.sortByField, this.query.sortOrder)) : null
        }

        if (this.query.populateWith && this.query.populateWith.length > 0) {
            await this.populateData()
        }

        return new Promise<Result<T[]>>((resolve) => {
            resolve({ ...this.result })
        })
    }

    populateWith(fields: Array<keyof R>) {
        this.query.populateWith = fields
        return this
    }

    sortBy(field: keyof Omit<T, keyof R>, order?: SortType) {
        this.query.sortByField = field
        this.query.sortOrder = order ? order : 'asc';
        return this
    }

    private dynamicSort(property: any, sortOrder: SortType) {
        return function (a: any, b: any) {
            var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return sortOrder === 'asc' ? result * 1 : result * -1
        }
    }

    private async populateData(): Promise<boolean> {
        let count = 0
        return new Promise<boolean>((resolve) => {
            this.query.populateWith?.forEach(async (key) => {
                const response = await this.populateField(key)
                if (response === true) {
                    count = count + 1
                }
                if (this.query.populateWith?.length === count) {
                    resolve(true)
                }
            })
        })
    }

    private async populateField(key: keyof R): Promise<boolean> {
        return new Promise<boolean>(async (resolve) => {
            const k = key as unknown as string
            const { relation, releatedTo, scalarIdentifier } = this.getModelKeyFromRelationProperty(k)
            const relatedData = await this.args.redis.hvals(releatedTo)
            this.result.data?.forEach((p: any) => {
                const filteredData = relatedData.filter((d: any) => d[scalarIdentifier] === p.id)
                if (relation === 'oneToOne') {
                    p[key] = filteredData[0]

                } else {
                    p[key] = filteredData
                }
            })
            resolve(true)
        })
    }

    private getModelKeyFromRelationProperty(relationProperty: string): {
        relation: RelationType,
        releatedTo: string,
        scalarIdentifier: string
    } {
        const schema = JSON.parse(this.args.schema)
        const releatedTo = schema.attributes[relationProperty].releatedTo as string
        const relation = schema.attributes[relationProperty].relation as RelationType
        const scalarIdentifier = schema.attributes[relationProperty].scalarIdentifier as string
        return { releatedTo, relation, scalarIdentifier }
    }
}