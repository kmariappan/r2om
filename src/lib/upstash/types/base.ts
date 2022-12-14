import { Redis } from "@upstash/redis"
export type Schema<T extends string> = Record<T, Model<T>>;

type FieldType =
    | 'string'
    | 'email'
    | 'boolean'
    | 'number'
    | 'relation'


export type RelationType = 'oneToOne' | 'belongsTo' | 'oneToMany' | 'manyToMany';

export type Field<T> = {
    type: FieldType;
    relation?: RelationType;
    releatedTo?: T
    relateThrough?: string
    required?: boolean;
    unique?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    scalarIdentifier?: string
    isScalarField?: boolean
    requiredValidationMessage?: string
    validationMessage?: string
};

export type Attribute<T> = {
    [key: string]: Field<T>;
};

export type Model<T> = {
    label?: string;
    isOneToOneModel?: boolean;
    modelObjectName?: string;
    attributes: Attribute<T>;
};

export type GenerateOptions = {
    path?: string;
};

export type ConstructorArgs = {
    name: string
    redis: Redis
    schema: string
    validationSchema: () => any
}

type ErrorType = 'validation' | 'uniquefield' | 'other'

export type ValidationError = {
    path: string
    message: string
}


type Error = {
    type: ErrorType
    message?: string
    validataionError?: ValidationError[]
}

export type Result<T = void> = {
    success: boolean
    data: null | T
    errors?: Error
}

export type DefaultProps = {
    id: string
    createdAt: string
    updatedAt: string
}

