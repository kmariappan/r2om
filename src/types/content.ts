export type Schema<T extends string> = Record<T, Model<T>>;


type FieldType =
    | 'string'
    | 'boolean'
    | 'number'
    | 'relation'

type RelationType = 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';

export type Field<T> = {
    type: FieldType;
    required?: boolean;
    unique?: boolean;
    relation?: RelationType;
    releatedTo?: T
    minLength?: number;
    min?: number;
    max?: number;
};

export type Attribute<T> = {
    [key: string]: Field<T>;
};


export type Model<T> = {
    modelObjectName?: string;
    attributes: Attribute<T>;
};
