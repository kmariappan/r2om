import { Schema } from './types/content'

export const createSchema = <T extends string>(data: Schema<T>): Schema<T> => data

createSchema<'student' | 'address'>({
    'student': {
        attributes: {
            'firstname': {
                type: 'string',
            }
        }
    },
    'address': {
        attributes: {
            'city': {
                type: 'string'
            },
            'postalcode': {
                type: 'number',
                required: true
            }

        }
    }
})


const main = async () => {
    console.log('huhu')
}

main()