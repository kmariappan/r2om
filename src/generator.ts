import { Schema } from "./types/content";

export class ModelGenerator {

}

export const generateModels = <T extends string>(schema: Schema<T>) => {
    const entries = Object.entries(schema)

    console.log(entries)
}