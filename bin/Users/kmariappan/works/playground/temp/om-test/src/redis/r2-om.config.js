
const { createSchema, generateModels } = require('r2-om')

const schema = createSchema({
    'user': {
        label: 'User',
        attributes: {
            firstname: {
                type: 'string',
                required: true
            },
            lastname: {
                type: 'string'
            },
            email: {
                type: 'string',
                required: true,
                unique: true
            },
            status: {
                type: 'string',
            },
            age: {
                type: 'number'
            },
            addresses: {
                type: 'relation',
                relation: 'oneToMany',
                releatedTo: 'address'

            }
        }
    },
    'address': {
        label: 'Address',
        attributes: {
            city: {
                type: 'string',
                required: true
            },
            postalCode: {
                type: 'number',
                required: true,
                unique: true
            }
        }
    }
})

generateModels(schema)
