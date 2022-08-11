import { Attribute, Field, Model, Schema, GenerateOptions } from "./lib/upstash/types/base";
import { capitalize } from "./utils/helpers";
import { promisify } from 'util';
import fs from 'fs';

export class ModelGenerator<T extends string> {

    constructor(private schema: Schema<T>, private options: GenerateOptions) { }

    generate() {
        const entries = Object.entries<Model<T>>(this.schema)

        const ModelKeys: string[] = []

        let typeString = `
export type DefaultProps = {
id: string
createdAt: string
updatedAt: string
}\n`

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
        return `export type ${capitalize(name)} = DefaultProps & {
${data.isOneToOneModel ? `scalarId: string`:'' }    
${this._getLines(data.attributes)}
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
            this._getRelationsFieldsUnionString(item) ?
                manipulatedImportStatement = `${manipulatedImportStatement}${index === 0 ? '' : '\n'}${item}: EntityModel<${capitalize(item)},Pick< ${capitalize(item)}, ${this._getRelationsFieldsUnionString(item)}>>;` :
                manipulatedImportStatement = `${manipulatedImportStatement}${index === 0 ? '' : '\n'}${item}: EntityModel<${capitalize(item)}>;`;
        });

        return manipulatedImportStatement;
    }

    private _getInstantiations(items: string[]): string {
        let manipulatedImportStatement = ``;

        items.forEach((item, index) => {
            const schemaString = JSON.stringify(this.schema[item])
            manipulatedImportStatement = `${manipulatedImportStatement}${index === 0 ? '' : '\n'}this.${item
                } = new EntityModel( {name:'${item}', redis: this.redis,schema:'${schemaString}'});`;
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

    private _getRelationsFieldsUnionString(model: string): string {
        let fieldsUnionString = ''

        const relatedFields: string[] = []

        const entries = Object.entries<Model<T>>(this.schema)
        entries.forEach(entry => {
            if (entry[0] === model) {
                const { attributes } = entry[1]
                const fields = Object.keys(attributes)
                fields.forEach((field) => {
                    if (attributes[field].type === 'relation' && !attributes[field].isScalarField) {
                        relatedFields.push(field)
                    }
                })
            }
        })

        if (relatedFields.length > 0) {
            relatedFields.forEach((f, index) => {
                fieldsUnionString = relatedFields.length - 1 !== index ? `${fieldsUnionString}'${f}' | ` : `${fieldsUnionString}'${f}'`
            })
        }

        return fieldsUnionString
    }

    private _manipulateFieldType = (field: Field<T>): string => {
        switch (field.type) {
            case 'relation': {
                let prefix = '';
                let suffix = '';

                if (field.relation === 'oneToMany' || field.relation === 'manyToMany') {
                    suffix = `[]`;
                }

                if (field.releatedTo && !field.isScalarField) {
                    prefix = capitalize(field.releatedTo)
                }

                if (field.isScalarField) {
                    prefix = 'string'
                }

                return `${prefix}${suffix}`;
            }
            default:
                return field.type;
        }
    };
}

