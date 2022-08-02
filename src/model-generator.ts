import { Attribute, Field, Model, Schema, GenerateOptions } from "./types/base";
import { capitalize } from "./utils/helpers";
import { promisify } from 'util';
import fs from 'fs';

export class ModelGenerator<T extends string> {

    constructor(private schema: Schema<T>, private options: GenerateOptions) { }

    generate() {
        const entries = Object.entries<Model<T>>(this.schema)

        const ModelKeys: string[] = []

        let typeString = ''

        entries.forEach(entry => {
            ModelKeys.push(entry[0])
            typeString = `${typeString}${this._generateType(entry[0], entry[1])} \n`
        })

        try {
            this._createFile(
                this.options?.path ? `${this.options?.path}/generated-types.ts` : `./generated-types.ts`,
                typeString)
            this._createFile(
                this.options?.path ? `${this.options?.path}/generated-repository.ts` : `./generated-repository.ts`,
                this._createRepositoryClass(ModelKeys)
            )

        } catch (error) {
            console.log(error)
        }

    }

    private _createFile = async (filename: string, data: string) => {
        const writeFile = promisify(fs.writeFile);
        await writeFile(filename, data);
        // eslint-disable-next-line no-console
        console.log(`${filename} Created ✨`);
    };


    private _generateType = (name: string, data: Model<T>) => {
        return `\n
export type ${capitalize(name)} = {
id: string | number
${this._getLines(data.attributes)}
createdAt: string
updatedAt: string
} `;
    };

    private _getLines = (data: Attribute<T>) => {
        const keys = Object.keys(data);

        let types = ``;
        keys.forEach((key, index) => {
            types = `${types}${this._generateLine(key, data[key])}${keys.length === index ? '' : '\n'}`;
        });
        return types;
    };

    private _generateLine = (key: string, field: Field<T>) => {
        const line = `${key}${field.required ? ':' : '?:'} ${this._manipulateFieldType(field)}`;
        return line;
    };


    private _getDeclerations(items: string[]): string {
        let manipulatedImportStatement = ``;

        items.forEach((item, index) => {
            manipulatedImportStatement = `${manipulatedImportStatement}${index === 0 ? '' : '\n'}${item}: EntityModel<${capitalize(item)}>;`;
        });

        return manipulatedImportStatement;
    }

    private _getInstantiations(items: string[]): string {
        let manipulatedImportStatement = ``;

        items.forEach((item, index) => {
            manipulatedImportStatement = `${manipulatedImportStatement}${index === 0 ? '' : '\n'}this.${item
                } = new EntityModel('${capitalize(item)}', this.redis);`;
        });

        return manipulatedImportStatement;
    }

    private _getImports(items: string[]): string {
        let manipulatedImportStatement = ``;

        items.forEach((item, index) => {
            manipulatedImportStatement = `${manipulatedImportStatement}${index === 0 ? '' : '\n'}import { ${capitalize(item)
                } } from './generated-types'; `;
        });

        return manipulatedImportStatement;
    }


    private _createRepositoryClass(input: string[]): string {
        return `import { Redis } from "@upstash/redis";
        import { EntityModel } from "./entity-model";
        ${this._getImports(input)}
        
        export class RepositoryCollection {
          ${this._getDeclerations(input)}
          constructor(private redis: Redis) {
            ${this._getInstantiations(input)}
          }
        }
        `;
    }


    private _manipulateFieldType = (field: Field<T>): string => {
        switch (field.type) {
            case 'relation': {
                let prefix = '';
                let suffix = '';

                if (field.relation === 'oneToMany') {
                    suffix = `[]`;
                }

                if (field.releatedTo) {
                    prefix = capitalize(field.releatedTo)
                }

                return `${prefix}${suffix}`;
            }

            default:
                return field.type;
        }
    };




}

