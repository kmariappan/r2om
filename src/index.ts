import { ModelGenerator } from './model-generator'
import { Schema, GenerateOptions } from './lib/upstash/types/base'

export const createSchema = <T extends string>(data: Schema<T>): Schema<T> => data

export const generateModels = <T extends string>(schema: Schema<T>, options?: GenerateOptions) => {
    const builder = new ModelGenerator(schema, options ?? {})
    builder.generate()
}

export type { Schema }